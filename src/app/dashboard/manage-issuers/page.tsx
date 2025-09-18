import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IssuerManager } from '@/components/dashboard/issuer-manager';


export default function ManageIssuersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Issuer Management</CardTitle>
        <CardDescription>
        View, add, and manage certificate issuers on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <IssuerManager />
      </CardContent>
    </Card>
  );
}
