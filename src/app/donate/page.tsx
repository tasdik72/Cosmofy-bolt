"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Heart } from "lucide-react";

export default function DonatePage() {
  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-center">
        <Card className="w-full shadow-xl animate-fade-in border border-border bg-card">
          <CardContent className="text-center space-y-6 py-8">
            <div className="space-y-4 text-muted-foreground leading-relaxed text-base">
              <p><strong>Cosmofy: Exploring the Universe Together</strong></p>
              <p>
                Cosmofy is a free passion project built by space enthusiasts.
                To keep it running and growing, we need your support.
              </p>
              <ul className="list-disc list-inside text-left mx-auto" style={{ maxWidth: 'fit-content' }}>
                <li>Your donation helps cover:</li>
                <li className="ml-4">Data service costs (APIs, etc.)</li>
                <li className="ml-4">Server hosting and maintenance</li>
                <li className="ml-4">Ongoing development & new features</li>
              </ul>
          </div>

            <div className="space-y-4 pt-4 border-t border-border">
          <p className="text-foreground/90 text-base leading-relaxed">
                If you find Cosmofy valuable, please consider a donation.
                Every contribution makes a big difference!
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 w-full max-w-xs mx-auto"
          >
            <a
              href="https://buymeacoffee.com/cosmofy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <Heart className="h-5 w-5" />
              Donate via Buy Me a Coffee
            </a>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
                Thank you for supporting our mission!
          </p>
            </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
