'use server';
/**
 * @fileOverview A flow for pinning certificate data to IPFS using Pinata.
 *
 * - pinCertificateData - A function that handles the IPFS pinning process.
 * - PinCertificateInput - The input type for the pinCertificateData function.
 * - PinCertificateOutput - The return type for the pinCertificateData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PinCertificateInputSchema = z.object({
  recipientName: z.string(),
  recipientEmail: z.string(),
  certificateTitle: z.string(),
  certificateDescription: z.string(),
});
export type PinCertificateInput = z.infer<typeof PinCertificateInputSchema>;

const PinCertificateOutputSchema = z.object({
  ipfsHash: z.string(),
  pinSize: z.number(),
  timestamp: z.string(),
});
export type PinCertificateOutput = z.infer<typeof PinCertificateOutputSchema>;

export async function pinCertificateData(
  input: PinCertificateInput
): Promise<PinCertificateOutput> {
  return pinToIpfsFlow(input);
}

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
      throw new Error(
        'Pinata API keys are not configured in environment variables.'
      );
    }

    const metadata = {
      name: `${input.certificateTitle} - ${input.recipientName}`,
      description: input.certificateDescription,
      recipient: {
        name: input.recipientName,
        email: input.recipientEmail,
      },
      achievement: {
        title: input.certificateTitle,
        description: input.certificateDescription,
      },
      issuedOn: new Date().toISOString(),
    };

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey,
      },
      body: JSON.stringify({
        pinataMetadata: {
          name: `${input.certificateTitle.replace(/\s/g, '_')}.json`,
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
