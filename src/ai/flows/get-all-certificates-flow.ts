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
      const issuedLogs = await viemClient.getLogs({
        address: contractConfig.address,
        event: parseAbiItem('event CertificateIssued(address indexed issuer, string indexed holderId, string metadataURI)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      });
      
      const revokedLogs = await viemClient.getLogs({
        address: contractConfig.address,
        event: parseAbiItem('event CertificateRevoked(address indexed issuer, string indexed holderId, string metadataURI)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      const revokedSet = new Set(revokedLogs.map(log => `${log.args.holderId}-${log.args.metadataURI}`));
      const certsByHolder = new Map<string, AllCertificateDetails[]>();

      const certificatePromises = issuedLogs.map(async (log) => {
        const { issuer, holderId, metadataURI } = log.args;
        if (!issuer || !holderId || !metadataURI) return null;

        const metadata = await fetchFromIpfs(metadataURI);
        const isRevoked = revokedSet.has(`${holderId}-${metadataURI}`);

        const holderCerts = certsByHolder.get(holderId) || [];
        const onChainIndex = holderCerts.length;
        
        const certDetails: AllCertificateDetails = {
          issuerAddress: issuer,
          holderAddress: holderId,
          metadataURI: metadataURI,
          issuedAt: new Date().toISOString(), // This is not available in the event log, placeholder
          revoked: isRevoked,
          title: metadata?.achievement?.title || 'Untitled Certificate',
          description: metadata?.description || 'No description provided.',
          issuerName: metadata?.name?.split(' - ')[0] || 'Unknown Issuer',
          recipientName: metadata?.recipient?.name || 'Unknown Recipient',
          transactionHash: log.transactionHash,
          onChainIndex: onChainIndex.toString(),
        };

        certsByHolder.set(holderId, [...holderCerts, certDetails]);
        return certDetails;
      });

      const settledCertificates = (await Promise.all(certificatePromises)).filter(Boolean);

      // Sort by issuance (approximated by log order, as timestamp isn't in event)
      return settledCertificates.reverse();

    } catch (error) {
      console.error("Error fetching certificate logs:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch certificate logs from blockchain: ${error.message}`);
      }
      throw new Error('An unknown error occurred while fetching certificate logs.');
    }
  }
);
