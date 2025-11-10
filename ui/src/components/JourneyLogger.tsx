import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Lock, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useTravelCounter } from "@/hooks/useTravelCounter";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const JourneyLogger = () => {
  const { toast } = useToast();
  const { isConnected, address } = useAccount();
  const [countryCount, setCountryCount] = useState("");
  const { addCountries, isLoading, message } = useTravelCounter(CONTRACT_ADDRESS);

  const handleAddCountries = async () => {
    console.log("[JourneyLogger] handleAddCountries called", {
      isConnected,
      countryCount,
      contractAddress: CONTRACT_ADDRESS,
    });

    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to add countries.",
        variant: "destructive",
      });
      return;
    }

    if (!CONTRACT_ADDRESS) {
      toast({
        title: "Contract Not Configured",
        description: "Please set VITE_CONTRACT_ADDRESS in your .env.local file.",
        variant: "destructive",
      });
      console.error("[JourneyLogger] Contract address not configured");
      return;
    }

    const count = parseInt(countryCount);
    if (!countryCount.trim() || isNaN(count) || count < 1) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of countries (at least 1).",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[JourneyLogger] Calling addCountries with count:", count);
      await addCountries(count);
      console.log("[JourneyLogger] addCountries completed successfully");
      toast({
        title: "Countries Added Successfully! 🎉",
        description: `${count} countr${count > 1 ? 'ies' : 'y'} has been encrypted and added to your travel counter.`,
      });
      setCountryCount("");
    } catch (error: any) {
      console.error("[JourneyLogger] Error in addCountries:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add countries.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-primary bg-clip-text text-transparent">
              Add Countries to Travel Counter
            </CardTitle>
            <CardDescription className="text-base">
              Securely encrypt and add the number of countries you've visited to your private travel counter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!CONTRACT_ADDRESS && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ Contract address not configured. Please set VITE_CONTRACT_ADDRESS in your .env.local file.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                Number of Countries
              </label>
              <Input
                type="number"
                min="1"
                placeholder="Enter number of countries to add..."
                value={countryCount}
                onChange={(e) => setCountryCount(e.target.value)}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Only the count is stored. No location details are recorded.
              </p>
            </div>

            {isConnected && address && (
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
                <p>Wallet: {address.substring(0, 6)}...{address.substring(address.length - 4)}</p>
                {CONTRACT_ADDRESS && <p>Contract: {CONTRACT_ADDRESS.substring(0, 6)}...{CONTRACT_ADDRESS.substring(CONTRACT_ADDRESS.length - 4)}</p>}
              </div>
            )}

            {message && (
              <div className={`rounded-lg p-4 ${
                message.includes("Error") || message.includes("Missing") || message.includes("not")
                  ? "bg-destructive/10 border border-destructive/20"
                  : "bg-muted/50"
              }`}>
                <p className={`text-sm ${
                  message.includes("Error") || message.includes("Missing") || message.includes("not")
                    ? "text-destructive"
                    : "text-foreground"
                }`}>{message}</p>
              </div>
            )}

            <Button
              onClick={handleAddCountries}
              disabled={isLoading || !isConnected}
              className="w-full gap-2 bg-gradient-primary hover:opacity-90 text-primary-foreground"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Encrypting & Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {isConnected ? "Add Countries" : "Connect Wallet First"}
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
