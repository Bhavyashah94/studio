'use client';

import { useWeb3Modal, useWeb3ModalState } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export function ConnectWallet() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { selectedNetworkId } = useWeb3ModalState();

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  if (!isConnected) {
    return <Button onClick={() => open()}>Connect Wallet</Button>;
  }

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
                {/* Placeholder for user avatar - could be an ENS avatar */}
               <AvatarFallback>{address?.slice(2, 4).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{shortAddress}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => disconnect()}>
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
       <Button asChild>
          <Link href="/dashboard">Go to App</Link>
        </Button>
    </div>
  );
}
