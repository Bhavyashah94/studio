
'use server';
/**
 * @fileOverview A flow for fetching issuer data from the blockchain.
 *
 * - getIssuers - Fetches and processes IssuerAdded and IssuerRemoved events.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { viemClient } from '@/lib/viem-client';
import { contractConfig } from '@/lib/web3';
import { parseAbiItem } from 'viem';
import type { Issuer } from '@/components/dashboard/issuer-manager';

const GetIssuersOutputSchema = z.array(z.object({
  address: z.string(),
  isActive: z.boolean(),
}));

export async function getIssuers(): Promise<Issuer[]> {
    return getIssuersFlow();
}

const getIssuersFlow = ai.defineFlow(
  {
    name: 'getIssuersFlow',
    outputSchema: GetIssuersOutputSchema,
  },
  async () => {
    try {
      const latestBlock = await viemClient.getBlockNumber();
      const fromBlock = latestBlock > 100000n ? latestBlock - 100000n : 0n;

      const addedLogsPromise = viemClient.getLogs({
        address: contractConfig.address,
        event: parseAbiItem('event IssuerAdded(address indexed issuer)'),
        fromBlock: fromBlock,
        toBlock: 'latest',
      });

      const removedLogsPromise = viemClient.getLogs({
        address: contractConfig.address,
        event: parseAbiItem('event IssuerRemoved(address indexed issuer)'),
        fromBlock: fromBlock,
        toBlock: 'latest',
      });

      const [addedLogs, removedLogs] = await Promise.all([addedLogsPromise, removedLogsPromise]);

      const issuerMap = new Map<`0x${string}`, boolean>();
      
      addedLogs.forEach(log => {
        if (log.args.issuer) {
            issuerMap.set(log.args.issuer, true);
        }
      });
      
      removedLogs.forEach(log => {
        if (log.args.issuer) {
            issuerMap.set(log.args.issuer, false);
        }
      });
      
      const issuerList = Array.from(issuerMap.entries()).map(([address, isActive]) => ({
        address,
        isActive,
      }));

      return issuerList;
    } catch (error) {
      console.error("Error fetching issuer logs:", error);
      // Re-throw the error to be handled by the client
      if (error instanceof Error) {
        throw new Error(`Failed to fetch issuer logs from blockchain: ${error.message}`);
      }
      throw new Error('An unknown error occurred while fetching issuer logs.');
    }
  }
);
