import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { mockCertificates, mockIssuers } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Download, Home } from 'lucide-react';

export default async function CertificatePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const certificate = mockCertificates.find((c) => c.id === id);
  
  if (!certificate) {
    notFound();
  }

  const issuer = mockIssuers.find((i) => i.name === certificate.issuer);
  const sealImage = PlaceHolderImages.find(i => i.id === 'cert-seal');

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-4">
            <Button asChild variant="outline" size="sm">
                <Link href="/"><Home className="mr-2 h-4 w-4"/> Back to Home</Link>
            </Button>
        </div>
        <Card className="overflow-hidden shadow-2xl">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-3">
              <div className="md:col-span-2 p-8 md:p-12">
                <div className="flex items-start gap-4">
                  {issuer && (
                    <Image
                      src={issuer.logoUrl}
                      alt={`${issuer.name} Logo`}
                      width={64}
                      height={64}
                      className="rounded-full border-2 border-border"
                      data-ai-hint="logo"
                    />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">This certifies that</p>
                    <h1 className="text-3xl font-bold font-headline text-accent">{certificate.recipient}</h1>
                    <p className="text-sm text-muted-foreground mt-2">has successfully completed</p>
                    <h2 className="text-2xl font-semibold mt-1">{certificate.title}</h2>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                    <p className="text-xs text-muted-foreground">Issued by</p>
                    <p className="font-semibold">{certificate.issuer}</p>
                    <p className="text-xs text-muted-foreground mt-2">on</p>
                    <p className="font-semibold">{new Date(certificate.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                 <div className="mt-6 text-xs text-muted-foreground break-words">
                    <p>Credential ID:</p>
                    <code>{certificate.credentialId}</code>
                 </div>
              </div>
              <div className="bg-accent/10 p-8 flex flex-col items-center justify-center text-center">
                <Badge variant="secondary" className="border-green-500/50 bg-green-100 text-green-800">
                    <ShieldCheck className="mr-2 h-4 w-4 text-green-600"/> Verified on VeriCred
                </Badge>
                {sealImage && (
                    <Image 
                        src={sealImage.imageUrl}
                        alt="Verification Seal"
                        width={100}
                        height={100}
                        className="my-8"
                        data-ai-hint={sealImage.imageHint}
                    />
                )}
                <p className="text-xs text-muted-foreground">This certificate is recorded on the blockchain and can be independently verified.</p>
                <Button variant="outline" className="mt-6 bg-background">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
