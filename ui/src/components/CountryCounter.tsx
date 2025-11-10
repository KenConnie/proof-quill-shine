import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Lock, Eye, EyeOff } from "lucide-react";
import { useAccount } from "wagmi";
import { useTravelCounter } from "@/hooks/useTravelCounter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const CountryCounter = () => {
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const { encryptedCount, decryptedCount, decryptCount, isLoading, loadEncryptedCount, message } = useTravelCounter(CONTRACT_ADDRESS);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [showDecrypted, setShowDecrypted] = useState(false);

  const handleDecrypt = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to decrypt your count.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDecrypting(true);
      await decryptCount();
      setShowDecrypted(true);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to decrypt count.";
      
      // Provide more helpful error messages
      if (errorMessage.includes("not authorized") || errorMessage.includes("authorized")) {
        toast({
          title: "Decryption Not Authorized",
          description: "You need to add countries first to get decryption permission. The encrypted count may be from a previous deployment.",
          variant: "destructive",
        });
      } else if (errorMessage.includes("haven't added")) {
        toast({
          title: "No Data to Decrypt",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Decryption Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleRefresh = async () => {
    if (!isConnected) return;
    await loadEncryptedCount();
    setShowDecrypted(false);
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
              <Globe className="w-8 h-8" />
              Your Travel Counter
            </CardTitle>
            <CardDescription className="text-base">
              View and decrypt your encrypted country count
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(() => {
              if (!isConnected) {
                return (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Please connect your wallet to view your travel counter.</p>
                  </div>
                );
              }

              const isHardhatError = message && (message.includes("Cannot connect") || message.includes("Hardhat node"));
              
              if (isHardhatError) {
                return (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-2">
                      ⚠️ Hardhat Node Not Running
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                      {message}
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-4 text-xs space-y-2">
                      <p className="font-semibold">To fix this:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Open a new terminal</li>
                        <li>Navigate to the project root: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">cd proof-quill-shine</code></li>
                        <li>Start Hardhat node: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">npx hardhat node</code></li>
                        <li>Wait for the node to start, then refresh this page</li>
                      </ol>
                    </div>
                  </div>
                );
              }

              if (!encryptedCount) {
                return (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No encrypted count found. Add countries to get started.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-accent" />
                        <span className="font-medium">Encrypted Count Status:</span>
                      </div>
                      <span className="text-sm text-muted-foreground font-mono">
                        {encryptedCount.substring(0, 20)}...
                      </span>
                    </div>

                    {showDecrypted && decryptedCount !== undefined ? (
                      <div className="bg-background rounded-lg p-4 border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-green-500" />
                            <span className="font-medium">Decrypted Count:</span>
                          </div>
                          <span className="text-3xl font-bold text-primary">
                            {decryptedCount}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          You have visited <strong>{decryptedCount}</strong> countr{decryptedCount === 1 ? 'y' : 'ies'}.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-background rounded-lg p-4 border border-border">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <EyeOff className="w-5 h-5" />
                          <span>Count is encrypted. Decrypt to view.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {!showDecrypted ? (
                      <Button
                        onClick={handleDecrypt}
                        disabled={isDecrypting || isLoading}
                        className="flex-1 gap-2"
                        size="lg"
                      >
                        {isDecrypting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Decrypting...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Decrypt Count
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowDecrypted(false)}
                        variant="outline"
                        className="flex-1 gap-2"
                        size="lg"
                      >
                        <EyeOff className="w-4 h-4" />
                        Hide Count
                      </Button>
                    )}
                    <Button
                      onClick={handleRefresh}
                      disabled={isLoading}
                      variant="outline"
                      size="lg"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CountryCounter;

