'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useWriteContract } from 'wagmi';
import { contractConfig } from '@/lib/web3';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  recipientName: z.string().min(2, {
    message: 'Recipient name must be at least 2 characters.',
  }),
  recipientEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  certificateTitle: z.string().min(5, {
    message: 'Certificate title must be at least 5 characters.',
  }),
  metadataURI: z.string().url({
    message: 'Please enter a valid URL for the metadata.',
  }),
});

export default function IssueCertificatePage() {
  const { toast } = useToast();
  const { writeContract, isPending } = useWriteContract();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientName: '',
      recipientEmail: '',
      certificateTitle: '',
      metadataURI: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // For the smart contract, we'll use recipientName as the holderId for now.
    // In a real app, this might be a more unique identifier.
    const holderId = values.recipientName;
    
    writeContract({
      ...contractConfig,
      functionName: 'issueCertificate',
      args: [holderId, values.metadataURI],
    }, {
      onSuccess: () => {
        toast({
          title: 'Transaction Submitted!',
          description: 'The certificate issuance is being processed on the blockchain.',
        });
        form.reset();
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Transaction Failed',
          description: error.shortMessage || 'There was an error submitting the transaction.',
        });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue a New Certificate</CardTitle>
        <CardDescription>
          Fill in the details below to issue a new verifiable credential on the
          Sepolia testnet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name (Holder ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Alice Johnson" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. alice.j@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="certificateTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Advanced Blockchain Development"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This is the main title that will appear on the certificate.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadataURI"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metadata URI</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ipfs://bafkreihdwdcefgh4"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The URI pointing to the certificate's metadata (e.g., an IPFS link).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Issuing...' : 'Issue Certificate'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
