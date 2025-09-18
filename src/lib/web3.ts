'use client';

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { cookieStorage, createStorage } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import CertificatePlatformAbi from './contracts/CertificatePlatform.json';

// Your WalletConnect Cloud project ID
export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WC_PROJECT_ID is not set');
}

if (!contractAddress) {
  throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is not set');
}


const metadata = {
  name: 'VeriCred',
  description: 'Secure, verifiable digital certificates on the blockchain.',
  url: 'https://web3modal.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const chains = [mainnet, sepolia] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

// It's important to invoke this function on the client side.
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true, // Optional - false as default
});

export const contractConfig = {
  address: contractAddress,
  abi: CertificatePlatformAbi.abi,
} as const;


export function Web3Modal({ children }: { children: React.ReactNode }) {
  return children;
}
