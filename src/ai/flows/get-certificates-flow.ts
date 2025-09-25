'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { viemClient } from '@/lib/viem-client';
import { contractConfig } from '@/lib/web3';
import { parseAbiItem, keccak256 } from 'viem';

const GetCertificatesInputSchema = z.object({
  holderAddress: z.string(),
});
export type GetCertificatesInput = z.infer<typeof GetCertificatesInputSchema>;

const CertificateDetailsSchema = z.object({
  issuerAddress: z.string(),
  holderAddress: z.string(),
  metadataURI: z.string(),
  issuedAt: z.string(),
  revoked: z.boolean(),
  title: z.string(),
  description: z.string(),
  transactionHash: z.string(),
  pdfLink: z.string(),
});
export type CertificateDetails = z.infer<typeof CertificateDetailsSchema>;

// Fetch JSON metadata from IPFS
async function fetchFromIpfs(ipfsUri: string) {
  if (!ipfsUri?.startsWith('ipfs://')) return null;
  const cid = ipfsUri.slice('ipfs://'.length);
  const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (err) {
    console.error(`[IPFS] Error fetching CID ${cid}:`, err);
    return null;
  }
}

export async function getCertificates(input: GetCertificatesInput): Promise<CertificateDetails[]> {
  return getCertificatesFlow(input);
}

const getCertificatesFlow = ai.defineFlow(
  {
    name: 'getCertificatesFlow',
    inputSchema: GetCertificatesInputSchema,
    outputSchema: z.array(CertificateDetailsSchema),
  },
  async ({ holderAddress }) => {
    try {
      console.log(`[CertificateFlow] Fetching certificates for holder: ${holderAddress}`);

      const holderHash = keccak256(new TextEncoder().encode(holderAddress));

      // 1. Fetch all certificate IDs issued by contract owner (or issuer)
      const issuerAddress = await viemClient.readContract({
        ...contractConfig,
        functionName: 'owner',
      });

      const certIds: string[] = await viemClient.readContract({
        ...contractConfig,
        functionName: 'getCertificatesByIssuer',
        args: [issuerAddress],
      });

      console.log(`[CertificateFlow] Total cert IDs found for issuer: ${certIds.length}`);

      const certificates: CertificateDetails[] = [];

      for (const certId of certIds) {
        try {
          // 2. Verify certificate for this holder
          const { cert, isActive } = await viemClient.readContract({
            ...contractConfig,
            functionName: 'verifyCertificate',
            args: [certId, holderAddress, certId], // TODO: replace certId with correct pdfHash if needed
          });

          if (!isActive) continue; // skip revoked or mismatched certs

          const metadata = await fetchFromIpfs(cert.metadataURI);

          certificates.push({
            issuerAddress: cert.issuer,
            holderAddress,
            metadataURI: cert.metadataURI,
            issuedAt: new Date(Number(cert.issuedAt) * 1000).toISOString(),
            revoked: !isActive,
            title: metadata?.achievement?.title || 'Untitled Certificate',
            description: metadata?.description || 'No description provided.',
            transactionHash: certId,
            pdfLink: `https://gateway.pinata.cloud/ipfs/${cert.metadataURI.replace('ipfs://', '')}`,
          });
        } catch (err) {
          console.warn(`[CertificateFlow] Skipping certId ${certId}:`, err);
        }
      }

      console.log(`[CertificateFlow] Total certificates for holder: ${certificates.length}`);
      return certificates.sort(
        (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
      );
    } catch (err) {
      console.error('[CertificateFlow] Error fetching certificates:', err);
      if (err instanceof Error) throw new Error(`Failed to fetch certificates: ${err.message}`);
      throw new Error('Unknown error fetching certificates.');
    }
  }
);
