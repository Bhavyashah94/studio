
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
import { parseAbiItem } from 'viem';

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
        event: parseAbiItem('event CertificateIssued(address indexed issuer, string holderId, string metadataURI)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      });
      
      const fetchRevokedPromise = viemClient.getLogs({
        address: contractConfig.address,
        event: parseAbiItem('event CertificateRevoked(address indexed issuer, string holderId, string metadataURI)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      });
      
      const [issuedLogs, revokedLogs] = await Promise.all([fetchIssuedPromise, fetchRevokedPromise]);
      console.log(`Fetched ${issuedLogs.length} issued logs and ${revokedLogs.length} revoked logs.`);

      const revokedSet = new Set(revokedLogs.map(log => `${log.args.holderId}-${log.args.metadataURI}`));
      const certsByHolder = new Map<string, any[]>();

      // Group certificates by holder ID to correctly determine the on-chain index
      issuedLogs.forEach(log => {
          if(!log.args.holderId) return;
          const holderCerts = certsByHolder.get(log.args.holderId) || [];
          certsByHolder.set(log.args.holderId, [...holderCerts, log]);
      });
      
      const certificatePromises = issuedLogs.map(async (log) => {
        const { issuer, holderId, metadataURI } = log.args;
        if (!issuer || !holderId || !metadataURI) return null;

        const metadataPromise = fetchFromIpfs(metadataURI);
        const blockPromise = viemClient.getBlock({ blockHash: log.blockHash });

        const [metadata, block] = await Promise.all([metadataPromise, blockPromise]);
        
        if (!metadata || !block) return null;

        const isRevoked = revokedSet.has(`${holderId}-${metadataURI}`);
        
        // Find the specific index of this certificate in the holder's list of issued certs
        const holderCerts = certsByHolder.get(holderId);
        let onChainIndex = -1;
        if(holderCerts) {
            onChainIndex = holderCerts.findIndex(c => c.transactionHash === log.transactionHash);
        }

        const certDetails: AllCertificateDetails = {
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
          onChainIndex: onChainIndex.toString(),
        };

        return certDetails;
      });

      const settledCertificates = (await Promise.all(certificatePromises)).filter((c): c is AllCertificateDetails => !!c);
      console.log(`Successfully processed ${settledCertificates.length} certificates.`);

      // Sort by issuance date
      return settledCertificates.sort((a,b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    } catch (error) {
      console.error("Error in getAllCertificatesFlow:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch certificate logs from blockchain: ${error.message}`);
      }
      throw new Error('An unknown error occurred while fetching certificate logs.');
    }
  }
);
