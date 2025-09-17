import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockIssuers } from '@/lib/placeholder-data';
import { PlusCircle } from 'lucide-react';

export default function ManageIssuersPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Issuer Management</CardTitle>
                <CardDescription>
                View, add, and manage certificate issuers on the platform.
                </CardDescription>
            </div>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Issuer
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Logo</span>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">
                Date Added
              </TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockIssuers.map((issuer) => (
              <TableRow key={issuer.id}>
                <TableCell className="hidden sm:table-cell">
                  <Image
                    alt={`${issuer.name} logo`}
                    className="aspect-square rounded-full object-cover"
                    height="40"
                    src={issuer.logoUrl}
                    width="40"
                    data-ai-hint="logo"
                  />
                </TableCell>
                <TableCell className="font-medium">{issuer.name}</TableCell>
                <TableCell>
                  <Badge variant={issuer.status === 'Active' ? 'default' : 'secondary'}>
                    {issuer.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {issuer.email}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(issuer.dateAdded).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>
                        {issuer.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
