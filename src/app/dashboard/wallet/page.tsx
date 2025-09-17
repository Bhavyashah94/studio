import { CertificateCard } from '@/components/dashboard/certificate-card';
import { mockCertificates } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WalletPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">My Certificate Wallet</h1>
      </div>
      <p className="text-muted-foreground mt-1">
        Here are all the verifiable credentials you have received.
      </p>

      {mockCertificates.length > 0 ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockCertificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}
