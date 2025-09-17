import Link from 'next/link';
import { Award } from 'lucide-react';
import { ConnectWallet } from './connect-wallet';

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b">
      <Link className="flex items-center justify-center" href="/">
        <Award className="h-6 w-6 text-accent" />
        <span className="ml-2 font-semibold font-headline">VeriCred</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <ConnectWallet />
      </nav>
    </header>
  );
}
