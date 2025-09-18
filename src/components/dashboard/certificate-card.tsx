import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Eye, ShieldX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CertificateDetails } from '@/ai/flows/get-certificates-flow';

type CertificateCardProps = {
  certificate: CertificateDetails;
};

export function CertificateCard({ certificate }: CertificateCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4">
        {/* We will add a placeholder for issuer logo later */}
        <div className="grid gap-1">
          <CardTitle className="text-base">{certificate.title}</CardTitle>
          <CardDescription>Issued by {certificate.issuerName}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground">
          Issued on: {new Date(certificate.issuedAt).toLocaleDateString()}
        </div>
         {certificate.revoked && (
            <Badge variant="destructive" className="mt-2">
              <ShieldX className="mr-2 h-4 w-4" />
              Revoked
            </Badge>
          )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
        <Button asChild size="sm">
          {/* Update Link when public view page is ready */}
          <Link href="#">
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
