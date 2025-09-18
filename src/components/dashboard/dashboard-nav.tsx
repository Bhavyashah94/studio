'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { contractConfig } from '@/lib/web3';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Award, Wallet, PlusCircle, Users, FileCode } from 'lucide-react';

const baseLinks = [
  { href: '/dashboard/wallet', label: 'My Wallet', icon: Wallet },
];

const issuerLinks = [
    ...baseLinks,
    { href: '/dashboard/issue', label: 'Issue Certificate', icon: PlusCircle },
];

const ownerLinks = [
    ...issuerLinks,
    { href: '/dashboard/manage-issuers', label: 'Manage Issuers', icon: Users },
    { href: '/dashboard/templates', label: 'Templates', icon: FileCode },
]

export function DashboardNav() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();

  const { data: owner } = useReadContract({
    ...contractConfig,
    functionName: 'owner',
  });

  const { data: isIssuer } = useReadContract({
    ...contractConfig,
    functionName: 'isIssuer',
    args: [address!],
    query: {
        enabled: isConnected,
    }
  });

  const isOwner = isConnected && owner === address;
  const links = isOwner ? ownerLinks : isIssuer ? issuerLinks : baseLinks;

  return (
    <div className="flex w-full flex-col gap-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-2 text-lg font-semibold"
      >
        <Award className="h-6 w-6 text-accent" />
        <span className="duration-200 group-data-[collapsible=icon]:hidden">
          VeriCred
        </span>
      </Link>
      <SidebarMenu>
        {links.map((link) => (
          <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === link.href}
              tooltip={link.label}
            >
              <Link href={link.href}>
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
