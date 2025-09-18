'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contractConfig } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';
import { getAllCertificates } from '@/ai/flows/get-all-certificates-flow';
import type { AllCertificateDetails } from '@/ai/flows/get-all-certificates-flow';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function CertificateManager() {
  const { toast } = useToast();
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const { data: hash, writeContract, isPending: isWritePending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const [actioningCert, setActioningCert] = useState<AllCertificateDetails | null>(null);

  const isPending = isWritePending || isConfirming;

  const { data: certificates, isLoading, error } = useQuery<AllCertificateDetails[], Error>({
    queryKey: ['allCertificates'],
    queryFn: getAllCertificates,
  });

  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: 'Transaction Confirmed!',
        description: 'The certificate has been revoked.',
      });
      queryClient.invalidateQueries({ queryKey: ['allCertificates'] });
      setActioningCert(null);
    }
  }, [isConfirmed, toast, queryClient]);

  const handleRevoke = (cert: AllCertificateDetails) => {
    setActioningCert(cert);
    writeContract({
      ...contractConfig,
      functionName: 'revokeCertificate',
      args: [cert.holderAddress, BigInt(cert.onChainIndex)],
    }, {
      onSuccess: () => {
        toast({
          title: 'Transaction Submitted',
          description: 'Revoking certificate...',
        });
      },
      onError: (err) => {
        toast({
          variant: 'destructive',
          title: 'Transaction Failed',
          description: err.shortMessage || 'There was an error.',
        });
        setActioningCert(null);
      }
    });
  };

  const memoizedTableBody = useMemo(() => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={5}>
            <Skeleton className="h-8 w-full" />
          </TableCell>
        </TableRow>
      ));
    }

    if (error) {
       return (
        <TableRow>
          <TableCell colSpan={5}>
             <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          </TableCell>
        </TableRow>
      );
    }

    if (!certificates || certificates.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center">No certificates found.</TableCell>
        </TableRow>
      );
    }
    
    return certificates.map((cert) => (
      <TableRow key={cert.transactionHash}>
        <TableCell>{cert.recipientName}</TableCell>
        <TableCell className="font-medium">{cert.title}</TableCell>
        <TableCell className="font-mono text-xs">{cert.issuerAddress}</TableCell>
        <TableCell>
          <Badge variant={cert.revoked ? 'destructive' : 'default'}>
            {cert.revoked ? 'Revoked' : 'Active'}
          </Badge>
        </TableCell>
        <TableCell>
          {(isPending && actioningCert?.transactionHash === cert.transactionHash) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={cert.revoked}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleRevoke(cert)}
                  disabled={cert.revoked || address !== cert.issuerAddress}
                >
                  Revoke
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      </TableRow>
    ));
  }, [isLoading, error, certificates, isPending, actioningCert, address]);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Issuer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memoizedTableBody}
        </TableBody>
      </Table>
    </div>
  );
}
