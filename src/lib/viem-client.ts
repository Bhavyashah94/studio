import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

// Using Alchemy's public RPC endpoint for better reliability
const sepoliaRpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/demo';

export const viemClient = createPublicClient({
  chain: sepolia,
  transport: http(sepoliaRpcUrl)
})
