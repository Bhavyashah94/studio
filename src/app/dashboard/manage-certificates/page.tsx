import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CertificateManager } from '@/components/dashboard/certificate-manager';

export default function ManageCertificatesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificate Management</CardTitle>
        <CardDescription>
          View and manage all certificates issued on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CertificateManager />
      </CardContent>
    </Card>
  );
}
