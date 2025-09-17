'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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
  credentialDetails: z.string().optional(),
});

export default function IssueCertificatePage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientName: '',
      recipientEmail: '',
      certificateTitle: '',
      credentialDetails: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: 'Certificate Issued!',
      description: `Successfully issued "${values.certificateTitle}" to ${values.recipientName}.`,
    });
    form.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue a New Certificate</CardTitle>
        <CardDescription>Fill in the details below to issue a new verifiable credential.</CardDescription>
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
              name="credentialDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credential Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional details or attributes about this credential..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    You can include JSON-LD or other structured data here.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Issue Certificate</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
