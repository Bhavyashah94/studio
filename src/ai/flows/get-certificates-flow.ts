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
      const onChainData = await viemClient.readContract({
        ...contractConfig,
        functionName: 'getCertificates',
        args: [holderAddress],
      });

      // If the holder has no certificates, the contract may return undefined or null.
      // Handle this gracefully by returning an empty array.
      if (!onChainData) {
        return [];
      }

      const certificatePromises = onChainData.map(async (cert) => {
        const metadata = await fetchFromIpfs(cert.metadataURI);
        
        if (!metadata) {
          // If metadata fails to load, create a placeholder object
          return {
            issuerAddress: cert.issuer,
            holderAddress: cert.holderId,
            metadataURI: cert.metadataURI,
            issuedAt: new Date(Number(cert.issuedAt) * 1000).toISOString(),
            revoked: cert.revoked,
            title: 'Metadata Not Found',
            description: `Could not load metadata from ${cert.metadataURI}`,
            issuerName: 'Unknown Issuer',
            recipientName: 'Unknown Recipient',
          };
        }
        
        return {
          issuerAddress: cert.issuer,
          holderAddress: cert.holderId,
          metadataURI: cert.metadataURI,
          issuedAt: new Date(Number(cert.issuedAt) * 1000).toISOString(),
          revoked: cert.revoked,
          title: metadata.achievement?.title || 'Untitled Certificate',
          description: metadata.description || 'No description provided.',
          issuerName: metadata.name?.split(' - ')[0] || 'Unknown Issuer',
          recipientName: metadata.recipient?.name || 'Unknown Recipient',
        };
      });

      const settledCertificates = await Promise.all(certificatePromises);

      // Filter out any completely failed fetches if needed, though we return placeholders
      const validCertificates = settledCertificates.filter(Boolean) as CertificateDetails[];
      
      return validCertificates.sort((a,b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    } catch (error) {
      console.error('Error fetching on-chain certificate data:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch certificates from blockchain: ${error.message}`);
      }
      throw new Error('An unknown error occurred while fetching certificates.');
    }
  }
);
