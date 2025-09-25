'use server';
/**
 * @fileOverview Pin certificate PDF metadata to IPFS using Pinata (PDF-only workflow).
 *
 * Input:
 *  - pdfName: string
 *  - holderAddress: string
 *  - timestamp: string
 *
 * Output:
 *  - ipfsHash: string
 *  - pinSize: number
 *  - timestamp: string
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// --- Input Schema ---
const PinCertificateInputSchema = z.object({
  pdfName: z.string(),
  holderAddress: z.string(),
  timestamp: z.string(),
});
export type PinCertificateInput = z.infer<typeof PinCertificateInputSchema>;

// --- Output Schema ---
const PinCertificateOutputSchema = z.object({
  ipfsHash: z.string(),
  pinSize: z.number(),
  timestamp: z.string(),
});
export type PinCertificateOutput = z.infer<typeof PinCertificateOutputSchema>;

// --- Exported function ---
export async function pinCertificateData(
  input: PinCertificateInput
): Promise<PinCertificateOutput> {
  return pinToIpfsFlow(input);
}

// --- Genkit Flow ---
const pinToIpfsFlow = ai.defineFlow(
  {
    name: 'pinToIpfsFlow',
    inputSchema: PinCertificateInputSchema,
    outputSchema: PinCertificateOutputSchema,
  },
  async (input) => {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
      throw new Error('Pinata API keys are not configured in environment variables.');
    }

    // --- Metadata JSON ---
    const metadata = {
      pdfName: input.pdfName,
      holderAddress: input.holderAddress,
      issuedOn: input.timestamp,
    };

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
      body: JSON.stringify({
        pinataMetadata: {
          name: input.pdfName.replace(/\s/g, '_'), // e.g., "Team32.pdf"
        },
        pinataContent: metadata,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to pin JSON to IPFS: ${response.statusText} - ${errorBody}`);
    }

    const responseData = await response.json();

    return {
      ipfsHash: responseData.IpfsHash,
      pinSize: responseData.PinSize,
      timestamp: responseData.Timestamp,
    };
  }
);
