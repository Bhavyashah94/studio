'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Award, Wallet, PlusCircle, Users } from 'lucide-react';

const links = [
  { href: '/dashboard/wallet', label: 'My Wallet', icon: Wallet },
  { href: '/dashboard/issue', label: 'Issue Certificate', icon: PlusCircle },
  {
    href: '/dashboard/manage-issuers',
    label: 'Manage Issuers',
    icon: Users,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <div className="flex w-full flex-col gap-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-2 text-lg font-semibold"
      >
        <Award className="h-6 w-6 text-accent" />
        <span className="duration-200 group-data-[collapsible=icon]:hidden">
          CertChain
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
