
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useWriteContract } from 'wagmi';
import { contractConfig } from '@/lib/web3';
import { isAddress } from 'viem';

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
import { pinCertificateData } from '@/ai/flows/pin-to-ipfs-flow';
import { useState } from 'react';

const formSchema = z.object({
  recipientName: z.string().min(2, {
    message: 'Recipient name must be at least 2 characters.',
  }),
  recipientAddress: z.string().refine((val) => isAddress(val), {
    message: 'Please enter a valid Ethereum wallet address.',
  }),
  recipientEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  certificateTitle: z.string().min(5, {
    message: 'Certificate title must be at least 5 characters.',
  }),
  certificateDescription: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
});

export default function IssueCertificatePage() {
  const { toast } = useToast();
  const { writeContract, isPending: isContractPending } = useWriteContract();
  const [isPinning, setIsPinning] = useState(false);

  const isPending = isContractPending || isPinning;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientName: '',
      recipientAddress: '',
      recipientEmail: '',
      certificateTitle: '',
      certificateDescription: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPinning(true);
    try {
      // 1. Pin data to IPFS via our server flow
      const pinataResponse = await pinCertificateData({
        recipientName: values.recipientName,
        recipientEmail: values.recipientEmail,
        certificateTitle: values.certificateTitle,
        certificateDescription: values.certificateDescription,
      });

      if (!pinataResponse.ipfsHash) {
        throw new Error('Failed to pin data to IPFS');
      }

      const metadataURI = `ipfs://${pinataResponse.ipfsHash}`;
      toast({
        title: 'Metadata Uploaded!',
        description: `Successfully pinned to IPFS.`,
      });

      // 2. Issue certificate on the blockchain
      const holderId = values.recipientAddress;
      
      writeContract({
        ...contractConfig,
        functionName: 'issueCertificate',
        args: [holderId, metadataURI],
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

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: errorMessage,
      });
    } finally {
      setIsPinning(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue a New Certificate</CardTitle>
        <CardDescription>
          Fill in the details below. The metadata will be uploaded to IPFS via Pinata,
          and the certificate will be issued on the Sepolia testnet.
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
                    <FormLabel>Recipient Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Alice Johnson" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipientAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Wallet Address (Holder ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
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
              name="certificateDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Completed a 12-week intensive course covering smart contract security, decentralized application architecture, and advanced cryptographic principles."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of the achievement. This will be stored on IPFS.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPinning ? 'Uploading to IPFS...' : isContractPending ? 'Issuing on-chain...' : 'Issue Certificate'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
