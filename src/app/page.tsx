import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, ShieldCheck, Wallet, Share2 } from 'lucide-react';
import { Header } from '@/components/shared/header';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-background to-blue-100">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    The Future of Verifiable Credentials
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    VeriCred provides a secure, decentralized platform for
                    issuing, managing, and verifying digital certificates on the
                    blockchain.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/dashboard">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#verify">Verify a Certificate</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                 <Award className="h-48 w-48 text-accent/50" strokeWidth={1} />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  A Secure &amp; Seamless Experience
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed to be intuitive for issuers, holders,
                  and verifiers, leveraging the power of blockchain for
                  unparalleled security and trust.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 pt-12">
              <div className="grid gap-1 text-center">
                 <Wallet className="h-10 w-10 mx-auto text-accent" />
                <h3 className="text-lg font-bold">Personal Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  Securely receive, store, and manage all your digital
                  certificates in one place.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <Award className="h-10 w-10 mx-auto text-accent" />
                <h3 className="text-lg font-bold">Effortless Issuance</h3>
                <p className="text-sm text-muted-foreground">
                  Authorized issuers can create and distribute verifiable
                  certificates in minutes.
                </p>
              </div>
               <div className="grid gap-1 text-center">
                <ShieldCheck className="h-10 w-10 mx-auto text-accent" />
                <h3 className="text-lg font-bold">Instant Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Third parties can instantly verify the authenticity of any
                  certificate against the blockchain.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="verify" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Verify a Certificate
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Enter a certificate ID below to instantly check its validity and
                authenticity on the blockchain.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <form className="flex space-x-2">
                <Input
                  className="max-w-lg flex-1 bg-background"
                  placeholder="Enter Certificate ID"
                  type="text"
                />
                <Button type="submit">Verify</Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; 2024 VeriCred. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
