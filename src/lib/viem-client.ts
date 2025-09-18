import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

// Using a more stable public RPC endpoint for better reliability
const sepoliaRpcUrl = 'https://sepolia.drpc.org';

export const viemClient = createPublicClient({
  chain: sepolia,
  transport: http(sepoliaRpcUrl)
})
