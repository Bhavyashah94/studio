'use server';
/**
 * @fileOverview A flow for fetching issuer data from the blockchain in correct chronological order.
 *
 * - getIssuers - Fetches and processes IssuerAdded and IssuerRemoved events.
 *   Applies logs in block order to ensure the latest status is always correct.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { viemClient } from '@/lib/viem-client';
import { contractConfig } from '@/lib/web3';
import { parseAbiItem } from 'viem';
import type { Issuer } from '@/components/dashboard/issuer-manager';

const GetIssuersOutputSchema = z.array(
  z.object({
    address: z.string(),
    isActive: z.boolean(),
  })
);

export async function getIssuers(): Promise<Issuer[]> {
  // Cast the address property to the correct type
  const result = await getIssuersFlow();
  return result.map((issuer) => ({
    ...issuer,
    address: issuer.address as `0x${string}`,
  }));
}

const getIssuersFlow = ai.defineFlow(
  {
    name: 'getIssuersFlow',
    outputSchema: GetIssuersOutputSchema,
  },
  async () => {
    try {
      const latestBlock = await viemClient.getBlockNumber();

      // Limit scan to recent 10k blocks to avoid RPC timeout
      const fromBlock = latestBlock > BigInt(10000) ? latestBlock - BigInt(9999) : BigInt(0);

      // Fetch IssuerAdded logs
      const addedLogs = await viemClient.getLogs({
        address: contractConfig.address,
        event: parseAbiItem('event IssuerAdded(address indexed issuer)'),
        fromBlock,
        toBlock: latestBlock,
      });

      // Fetch IssuerRemoved logs
      const removedLogs = await viemClient.getLogs({
        address: contractConfig.address,
        event: parseAbiItem('event IssuerRemoved(address indexed issuer)'),
        fromBlock,
        toBlock: latestBlock,
      });

      // Merge all logs
      const allLogs = [
        ...addedLogs.map((log) => ({ ...log, type: 'added' as const })),
        ...removedLogs.map((log) => ({ ...log, type: 'removed' as const })),
      ];

      // Sort by blockNumber and logIndex to apply chronologically
      allLogs.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) return Number(a.blockNumber - b.blockNumber);
        return Number(a.logIndex - b.logIndex);
      });

      // Apply logs sequentially
      const issuerMap = new Map<`0x${string}`, boolean>();
      allLogs.forEach((log) => {
        const address = log.args.issuer;
        if (address) {
          issuerMap.set(address, log.type === 'added');
        }
      });

      // Convert map to array
      const issuerList = Array.from(issuerMap.entries()).map(([address, isActive]) => ({
        address: address as `0x${string}`,
        isActive,
      }));

      return issuerList;
    } catch (error) {
      console.error('Error fetching issuer logs:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch issuer logs from blockchain: ${error.message}`);
      }
      throw new Error('An unknown error occurred while fetching issuer logs.');
    }
  }
);
