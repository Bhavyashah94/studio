
'use server';
/**
 * @fileOverview A flow for fetching and processing certificate data for a given holder.
 *
 * - getCertificates - Fetches certificates from the blockchain and their metadata from IPFS.
 * - GetCertificatesInput - The input type for the getCertificates function.
 * - CertificateDetails - The combined on-chain and off-chain data for a certificate.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { viemClient } from '@/lib/viem-client';
import { contractConfig } from '@/lib/web3';
import { parseAbiItem } from 'viem';
import type { AllCertificateDetails } from './get-all-certificates-flow';


const GetCertificatesInputSchema = z.object({
  holderAddress: z.string().describe('The Ethereum address of the certificate holder.'),
});
export type GetCertificatesInput = z.infer<typeof GetCertificatesInputSchema>;

// Represents the full details of a certificate after fetching metadata
const CertificateDetailsSchema = z.object({
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
});
export type CertificateDetails = z.infer<typeof CertificateDetailsSchema>;

const GetCertificatesOutputSchema = z.array(CertificateDetailsSchema);

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


export async function getCertificates(
  input: GetCertificatesInput
): Promise<CertificateDetails[]> {
  return getCertificatesFlow(input);
}

const getCertificatesFlow = ai.defineFlow(
  {
    name: 'getCertificatesFlow',
    inputSchema: GetCertificatesInputSchema,
    outputSchema: GetCertificatesOutputSchema,
  },
  async ({ holderAddress }) => {
    try {
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

      const revokedSet = new Set(revokedLogs.map(log => `${log.args.holderId}-${log.args.metadataURI}`));
      
      const allCertificatesPromises = issuedLogs.map(async (log) => {
        const { issuer, holderId, metadataURI } = log.args;
        if (!issuer || !holderId || !metadataURI) return null;

        const metadataPromise = fetchFromIpfs(metadataURI);
        const blockPromise = viemClient.getBlock({ blockHash: log.blockHash });

        const [metadata, block] = await Promise.all([metadataPromise, blockPromise]);

        const isRevoked = revokedSet.has(`${holderId}-${metadataURI}`);

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
        };
      });

      const allCertificates = (await Promise.all(allCertificatesPromises)).filter((c): c is AllCertificateDetails => !!c);


      // Filter the certificates for the specific holder, comparing addresses case-insensitively
      const userCertificates = allCertificates.filter(
        (cert) => cert.holderAddress.toLowerCase() === holderAddress.toLowerCase()
      );
      
      // Sort by issuance date
      return userCertificates.sort((a,b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    } catch (error) {
      console.error('Error fetching and filtering certificate data:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to process certificates: ${error.message}`);
      }
      throw new Error('An unknown error occurred while processing certificates.');
    }
  }
);
