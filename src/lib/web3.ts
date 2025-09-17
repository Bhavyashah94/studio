'use client';

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { cookieStorage, createStorage } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

// Your WalletConnect Cloud project ID
export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'YOUR_PROJECT_ID';

if (!projectId || projectId === 'YOUR_PROJECT_ID') {
  console.warn(
    'Warning: NEXT_PUBLIC_WC_PROJECT_ID is not set. Please set it in your .env.local file.'
  );
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

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true, // Optional - false as default
});
