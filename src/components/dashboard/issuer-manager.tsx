'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contractConfig } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';
import { viemClient } from '@/lib/viem-client';
import { parseAbiItem } from 'viem';

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
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddIssuerDialog } from './add-issuer-dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type Issuer = {
  address: `0x${string}`;
  isActive: boolean;
};

export function IssuerManager() {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actioningAddress, setActioningAddress] = useState<string | null>(null);

  const isPending = isWritePending || isConfirming;

  const { data: owner } = useReadContract({
    ...contractConfig,
    functionName: 'owner',
    query: { enabled: isConnected },
  });

  const isOwner = isConnected && address === owner;

  const fetchIssuers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const addedLogs = await viemClient.getLogs({
        address: contractConfig.address,
        event: parseAbiItem('event IssuerAdded(address indexed issuer)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      const removedLogs = await viemClient.getLogs({
        address: contractConfig.address,
        event: parseAbiItem('event IssuerRemoved(address indexed issuer)'),
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      const issuerMap = new Map<`0x${string}`, boolean>();
      
      addedLogs.forEach(log => {
        if (log.args.issuer) {
            issuerMap.set(log.args.issuer, true);
        }
      });
      
      removedLogs.forEach(log => {
        if (log.args.issuer) {
            issuerMap.set(log.args.issuer, false);
        }
      });
      
      const issuerList = Array.from(issuerMap.entries()).map(([address, isActive]) => ({
        address,
        isActive,
      }));

      setIssuers(issuerList);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch issuer data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuers();
  }, []);

  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: "Success!",
        description: "The transaction has been confirmed.",
      });
      fetchIssuers(); // Refresh the list
      setActioningAddress(null);
    }
  }, [isConfirmed]);

  const handleAddIssuer = (newIssuerAddress: `0x${string}`) => {
    setActioningAddress(newIssuerAddress);
    writeContract({
      ...contractConfig,
      functionName: 'addIssuer',
      args: [newIssuerAddress],
    }, {
      onSuccess: () => {
        toast({
          title: "Transaction Submitted",
          description: "Adding new issuer...",
        });
        setIsDialogOpen(false);
      },
      onError: (err) => {
        toast({
          variant: 'destructive',
          title: "Transaction Failed",
          description: err.shortMessage || "There was an error.",
        });
        setActioningAddress(null);
      }
    });
  };

  const handleRemoveIssuer = (issuerAddress: `0x${string}`) => {
    setActioningAddress(issuerAddress);
     writeContract({
      ...contractConfig,
      functionName: 'removeIssuer',
      args: [issuerAddress],
    }, {
      onSuccess: () => {
        toast({
          title: "Transaction Submitted",
          description: "Removing issuer...",
        });
      },
      onError: (err) => {
        toast({
          variant: 'destructive',
          title: "Transaction Failed",
          description: err.shortMessage || "There was an error.",
        });
        setActioningAddress(null);
      }
    });
  }

  const memoizedTableBody = useMemo(() => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={3}>
            <Skeleton className="h-8 w-full" />
          </TableCell>
        </TableRow>
      );
    }
    if (error) {
       return (
        <TableRow>
          <TableCell colSpan={3}>
             <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          </TableCell>
        </TableRow>
      );
    }

    if (issuers.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={3} className="text-center">No issuers found.</TableCell>
        </TableRow>
      );
    }
    
    return issuers.map((issuer) => (
      <TableRow key={issuer.address}>
        <TableCell className="font-mono">{issuer.address}</TableCell>
        <TableCell>
          <Badge variant={issuer.isActive ? 'default' : 'secondary'}>
            {issuer.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </TableCell>
        <TableCell>
            {(isPending && actioningAddress === issuer.address) ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!isOwner}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleRemoveIssuer(issuer.address)}
                disabled={!isOwner}
              >
                Remove Issuer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            )}
        </TableCell>
      </TableRow>
    ));
  }, [isLoading, error, issuers, isOwner, isPending, actioningAddress]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {isOwner && (
          <>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Issuer
            </Button>
            <AddIssuerDialog 
                isOpen={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)} 
                onAddIssuer={handleAddIssuer}
                isPending={isPending && actioningAddress !== null && !issuers.some(i => i.address === actioningAddress)}
            />
          </>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
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
