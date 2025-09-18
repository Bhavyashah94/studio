
'use client';

import { useAccount } from 'wagmi';
import { CertificateCard } from '@/components/dashboard/certificate-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Wallet, Loader2 } from 'lucide-react';
import { getAllCertificates } from '@/ai/flows/get-all-certificates-flow';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { AllCertificateDetails } from '@/ai/flows/get-all-certificates-flow';
import type { CertificateDetails } from '@/ai/flows/get-certificates-flow';

export default function WalletPage() {
  const { address, isConnected } = useAccount();

  const {
    data: allCertificates,
    isLoading,
    error,
  } = useQuery<AllCertificateDetails[], Error>({
    queryKey: ['allCertificates'],
    queryFn: () => getAllCertificates(),
    enabled: isConnected,
  });

  const userCertificates = allCertificates?.filter(
    (cert) => cert.holderAddress.toLowerCase() === address?.toLowerCase()
  ) || [];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          <h2 className="mt-6 text-xl font-semibold">
            Fetching your certificates...
          </h2>
          <p className="mt-2 max-w-sm text-muted-foreground">
            This may take a moment.
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-8">
            <Alert variant="destructive">
                <AlertTitle>Error Fetching Certificates</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        </div>
      )
    }

    if (userCertificates.length === 0) {
      return (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-4">
            <Wallet className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Your wallet is empty</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">
            You haven&apos;t received any certificates yet. Once you do, they
            will appear here.
          </p>
        </div>
      );
    }

    return (
       <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userCertificates.map((cert, index) => (
            <CertificateCard key={`${cert.metadataURI}-${index}`} certificate={cert as CertificateDetails} />
          ))}
        </div>
    )
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">
          My Certificate Wallet
        </h1>
      </div>
      <p className="text-muted-foreground mt-1">
        Here are all the verifiable credentials you have received.
      </p>

      {renderContent()}
    </div>
  );
}
