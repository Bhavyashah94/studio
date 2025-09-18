'use client';

import { useAccount, useReadContract } from 'wagmi';
import { contractConfig } from '@/lib/web3';
import { Badge } from '@/components/ui/badge';

export function UserRoleBadge() {
  const { address, isConnected } = useAccount();

  const { data: owner, isLoading: isLoadingOwner } = useReadContract({
    ...contractConfig,
    functionName: 'owner',
  });

  const { data: isIssuerRole, isLoading: isLoadingIssuer } = useReadContract({
    ...contractConfig,
    functionName: 'isIssuer',
    args: [address!],
    query: {
      enabled: isConnected,
    },
  });

  if (!isConnected || isLoadingOwner || isLoadingIssuer) {
    return null;
  }

  const isOwner = isConnected && owner === address;
  const isIssuer = isIssuerRole || isOwner;

  let role = 'Holder';
  if (isOwner) role = 'Owner';
  else if (isIssuer) role = 'Issuer';

  return <Badge variant="outline">{role}</Badge>;
}
