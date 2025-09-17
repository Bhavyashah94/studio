import Image from 'next/image';
import Link from 'next/link';
import type { Certificate } from '@/lib/placeholder-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type CertificateCardProps = {
  certificate: Certificate;
};

export function CertificateCard({ certificate }: CertificateCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4">
        <Image
          src={certificate.issuerLogoUrl}
          alt={`${certificate.issuer} logo`}
          width={40}
          height={40}
          className="rounded-full border"
          data-ai-hint="logo"
        />
        <div className="grid gap-1">
          <CardTitle className="text-base">{certificate.title}</CardTitle>
          <CardDescription>Issued by {certificate.issuer}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground">
          Issued on: {new Date(certificate.date).toLocaleDateString()}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
        <Button asChild size="sm">
          <Link href={`/certificate/${certificate.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
