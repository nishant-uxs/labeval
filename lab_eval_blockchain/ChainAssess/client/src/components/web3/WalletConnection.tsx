import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWeb3 } from '@/hooks/useWeb3';

export function WalletConnection() {
  const { connect, isConnecting, walletState, isCorrectNetwork } = useWeb3();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      await connect();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      
      // Handle specific MetaMask errors more gracefully
      if (errorMessage.includes('already pending')) {
        setError('Connection request already in progress. Please check MetaMask and wait a moment.');
      } else if (errorMessage.includes('User rejected')) {
        setError('Connection was cancelled. Please try again.');
      } else if (errorMessage.includes('Chain not added')) {
        setError('Please add Sepolia testnet to MetaMask and try again.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
  };

  if (!isMetaMaskInstalled()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fab fa-ethereum text-primary text-2xl"></i>
            </div>
            <CardTitle>MetaMask Required</CardTitle>
            <CardDescription>
              Please install MetaMask to use this application
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full">
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-install-metamask"
              >
                <i className="fas fa-download mr-2"></i>
                Install MetaMask
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (walletState.isConnected && !isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-warning text-2xl"></i>
            </div>
            <CardTitle>Wrong Network</CardTitle>
            <CardDescription>
              Please switch to Sepolia testnet to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                This application only works on Sepolia testnet. Please switch your network in MetaMask.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!walletState.isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-wallet text-primary text-2xl"></i>
            </div>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect with MetaMask to access the EduChain dApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription data-testid="error-message">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
              data-testid="button-connect-wallet"
            >
              {isConnecting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Connecting...
                </>
              ) : (
                <>
                  <i className="fab fa-ethereum mr-2"></i>
                  Connect MetaMask
                </>
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              <p>Make sure you're on Sepolia testnet</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
