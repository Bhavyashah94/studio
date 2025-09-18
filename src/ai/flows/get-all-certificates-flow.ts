
'use server';
/**
 * @fileOverview A flow for fetching all certificate data from the blockchain.
 *
 * - getAllCertificates - Fetches all CertificateIssued and CertificateRevoked events.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { viemClient } from '@/lib/viem-client';
import { contractConfig } from '@/lib/web3';
import { decodeFunctionData, parseAbiItem } from 'viem';

// Represents the full details of a certificate after fetching metadata and logs
const AllCertificateDetailsSchema = z.object({
  issuerAddress: z.string(),
  holderAddress: z.string(),
  metadataURI: z.string(),
  issuedAt: z.string(),
  revoked: z.boolean(),
  // from metadata
  title: z.string(),
  description: z.string(),
  issuerName: z.string(),
  recipientName: z.string(),
  // from logs
  transactionHash: z.string(),
  onChainIndex: z.string(), // The index of the certificate in the holder's array
});
export type AllCertificateDetails = z.infer<typeof AllCertificateDetailsSchema>;

const GetAllCertificatesOutputSchema = z.array(AllCertificateDetailsSchema);

// Helper to fetch JSON from an IPFS URI
async function fetchFromIpfs(ipfsUri: string): Promise<any> {
  if (!ipfsUri || !ipfsUri.startsWith('ipfs://')) {
    console.warn(`Invalid IPFS URI provided: ${ipfsUri}`);
    return null;
  }
  const cid = ipfsUri.substring('ipfs://'.length);
  // Using a public Pinata gateway
  const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS gateway: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching metadata for CID ${cid}:`, error);
    return null; // Return null to allow processing of other certificates
  }
}

export async function getAllCertificates(): Promise<AllCertificateDetails[]> {
    return getAllCertificatesFlow();
}

const getAllCertificatesFlow = ai.defineFlow(
  {
    name: 'getAllCertificatesFlow',
    outputSchema: GetAllCertificatesOutputSchema,
  },
  async () => {
    try {
      console.log('Starting to fetch certificate logs...');
      const fetchIssuedPromise = viemClient.getLogs({
        address: contractConfig.address,
        event: parseAbiItem('event CertificateIssued(address indexed issuer, string indexed holderId, string metadataURI)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      });
      
      const fetchRevokedPromise = viemClient.getLogs({
        address: contractConfig.address,
        event: parseAbiItem('event CertificateRevoked(address indexed issuer, string indexed holderId, string metadataURI)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      });
      
      const [issuedLogs, revokedLogs] = await Promise.all([fetchIssuedPromise, fetchRevokedPromise]);
      console.log(`Fetched ${issuedLogs.length} issued logs and ${revokedLogs.length} revoked logs.`);

      const revokedSet = new Set(revokedLogs.map(log => log.transactionHash));
      
      const certificatePromises = issuedLogs.map(async (log) => {
        const { issuer, metadataURI } = log.args;
        if (!issuer || !metadataURI || !log.transactionHash) return null;

        // Fetch transaction to decode input and get the real holderAddress
        const transaction = await viemClient.getTransaction({
          hash: log.transactionHash,
        });

        if (!transaction || !transaction.input) {
            console.warn(`Could not find transaction or transaction input for hash: ${log.transactionHash}`);
            return null;
        }
        
        const { functionName, args } = decodeFunctionData({
          abi: contractConfig.abi,
          data: transaction.input,
        });

        // Ensure we are decoding the correct function call
        if (functionName !== 'issueCertificate') {
            return null;
        }
        
        const holderId = (args as string[])?.[0];
        if (!holderId) {
            console.warn(`Could not decode holderId for transaction: ${log.transactionHash}`);
            return null;
        }

        const metadataPromise = fetchFromIpfs(metadataURI);
        const blockPromise = viemClient.getBlock({ blockHash: log.blockHash });

        const [metadata, block] = await Promise.all([metadataPromise, blockPromise]);
        
        if (!metadata || !block) return null;

        const isRevoked = revokedSet.has(log.transactionHash);

        return {
          issuerAddress: issuer,
          holderAddress: holderId,
          metadataURI: metadataURI,
          issuedAt: new Date(Number(block.timestamp) * 1000).toISOString(),
          revoked: isRevoked,
          title: metadata?.achievement?.title || 'Untitled Certificate',
          description: metadata?.description || 'No description provided.',
          issuerName: metadata?.name?.split(' - ')[0] || 'Unknown Issuer',
          recipientName: metadata?.recipient?.name || 'Unknown Recipient',
          transactionHash: log.transactionHash,
          onChainIndex: '0', // Placeholder, will calculate below
        };
      });

      const allCertsUnfiltered = await Promise.all(certificatePromises);
      const allCerts = allCertsUnfiltered.filter((c): c is AllCertificateDetails => c !== null);
      
      // Correctly calculate onChainIndex by grouping certificates by holder
      const certsByHolder = new Map<string, AllCertificateDetails[]>();
      allCerts.forEach(cert => {
        const holderCerts = certsByHolder.get(cert.holderAddress) || [];
        certsByHolder.set(cert.holderAddress, [...holderCerts, cert]);
      });

      const finalCerts = allCerts.map(cert => {
        const holderCerts = certsByHolder.get(cert.holderAddress);
        const onChainIndex = holderCerts ? holderCerts.findIndex(c => c.transactionHash === cert.transactionHash) : -1;
        return { ...cert, onChainIndex: onChainIndex.toString() };
      });
      
      console.log(`Successfully processed ${finalCerts.length} certificates.`);

      // Sort by issuance date
      return finalCerts.sort((a,b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    } catch (error) {
      console.error("Error in getAllCertificatesFlow:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch certificate logs from blockchain: ${error.message}`);
      }
      throw new Error('An unknown error occurred while fetching certificate logs.');
    }
  }
);
