'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWriteContract } from 'wagmi';
import { contractConfig } from '@/lib/web3';
import { keccak256 } from 'viem';
import { pinCertificateData } from '@/ai/flows/pin-to-ipfs-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';


import { Loader2 } from 'lucide-react';

export default function IssueCertificatePDF() {
  const { toast } = useToast();
  const { writeContract, isPending: isContractPending } = useWriteContract();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [holderAddress, setHolderAddress] = useState('');
  const [isPinning, setIsPinning] = useState(false);

  const isPending = isContractPending || isPinning;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setPdfFile(e.target.files[0]);
  };

  const onSubmit = async () => {
    if (!pdfFile) {
      toast({ variant: 'destructive', title: 'PDF Required', description: 'Please select a PDF file.' });
      return;
    }
    if (!holderAddress) {
      toast({ variant: 'destructive', title: 'Wallet Required', description: 'Please enter the recipient wallet address.' });
      return;
    }

    try {
      setIsPinning(true);

      // --- 1. Compute PDF hash ---
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfHash = keccak256(new Uint8Array(arrayBuffer));

      // --- 2. Pin metadata to IPFS ---
      const pinResponse = await pinCertificateData({
        pdfName: pdfFile.name,
        holderAddress,
        timestamp: new Date().toISOString(),
      });

      if (!pinResponse.ipfsHash) throw new Error('Failed to pin metadata to IPFS');
      const metadataURI = `ipfs://${pinResponse.ipfsHash}`;

      toast({
        title: 'Metadata Ready',
        description: 'Metadata pinned to IPFS successfully.',
      });

      // --- 3. Issue certificate on-chain ---
      writeContract({
        ...contractConfig,
        functionName: 'issueCertificate',
        args: [holderAddress, metadataURI, pdfHash],
      }, {
        onSuccess: () => {
          toast({
            title: 'Transaction Submitted',
            description: 'Certificate issuance is in progress on the blockchain.',
          });
          setPdfFile(null);
          setHolderAddress('');
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Transaction Failed',
            description: error.shortMessage || error.message || 'Unknown error',
          });
        }
      });

    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Certificate (PDF)</CardTitle>
        <CardDescription>
          Upload a PDF and enter the recipient wallet address to issue a certificate on-chain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Recipient Wallet Address</Label>
          <Input
            placeholder="0x..."
            value={holderAddress}
            onChange={(e) => setHolderAddress(e.target.value)}
          />
        </div>

        <div>
          <Label>Certificate PDF</Label>
          <Input type="file" accept="application/pdf" onChange={handleFileChange} />
          {pdfFile && <p className="mt-1 text-sm text-muted-foreground">{pdfFile.name}</p>}
        </div>

        <Button onClick={onSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPinning ? 'Uploading to IPFS...' : isContractPending ? 'Issuing on-chain...' : 'Issue Certificate'}
        </Button>
      </CardContent>
    </Card>
  );
}
