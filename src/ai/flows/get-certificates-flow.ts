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
import { getAllCertificates } from './get-all-certificates-flow';

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
      // Fetch all certificates from the reliable event log flow
      const allCertificates = await getAllCertificates();

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
