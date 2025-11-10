import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Lock, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";

const JourneyLogger = () => {
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const handleLogJourney = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to log your journey.",
        variant: "destructive",
      });
      return;
    }

    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location for your journey.",
        variant: "destructive",
      });
      return;
    }

    setIsLogging(true);

    // Simulate encryption and blockchain logging
    setTimeout(() => {
      toast({
        title: "Journey Logged Successfully! 🎉",
        description: `${location} has been encrypted and recorded on the blockchain.`,
      });
      setLocation("");
      setNotes("");
      setIsLogging(false);
    }, 2000);
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-primary bg-clip-text text-transparent">
              Log New Journey
            </CardTitle>
            <CardDescription className="text-base">
              Securely encrypt and timestamp your travel location with blockchain proof
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                Location
              </label>
              <Input
                placeholder="Enter city or place name..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent" />
                Travel Notes (Encrypted)
              </label>
              <Textarea
                placeholder="Add private notes about your journey..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background/50 min-h-[100px]"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">Auto-Timestamp:</span>
                <span className="font-mono text-foreground">{new Date().toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your GPS coordinates will be encrypted before blockchain storage
              </p>
            </div>

            <Button
              onClick={handleLogJourney}
              disabled={isLogging || !isConnected}
              className="w-full gap-2 bg-gradient-primary hover:opacity-90 text-primary-foreground"
              size="lg"
            >
              {isLogging ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Encrypting & Logging...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  {isConnected ? "Log Journey" : "Connect Wallet First"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default JourneyLogger;
