import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { useContracts } from '@/hooks/useContracts';
import { useWeb3 } from '@/hooks/useWeb3';
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

export function ContractDebugPanel() {
  const { walletState } = useWeb3();
  const contracts = useContracts();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isPlaceholderAddress = (address: string) => {
    // Our real Sepolia addresses start with different patterns
    const realAddresses = [
      '0x6fC21092DA55B392b045eD78F4732bff3C580e2c', // AccessControl
      '0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66', // BatchManagement - New Complete Contract
      '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6', // AssignmentSubmission
      '0xBf447be6a0E79c061dbF9f6169d372a85a1Db16E'  // TokenReward
    ];
    
    if (realAddresses.includes(address)) {
      return false; // These are real addresses
    }
    
    // Check for obvious placeholder patterns
    return address.startsWith('0x1234') || address.startsWith('0x2345') || 
           address.startsWith('0x3456') || address.startsWith('0x4567') || 
           address.startsWith('0x5678');
  };

  const handleTestBatch = async () => {
    if (!contracts.createBatch) {
      alert('Contracts not ready. Please connect wallet and wait for initialization.');
      return;
    }

    try {
      alert('About to create test batch. Please APPROVE the transaction in MetaMask!');
      const result = await contracts.createBatch('Test Batch - ' + Date.now());
      alert(`✅ Test batch created successfully!\n\nBatch ID: ${result.batchId}\nTransaction: ${result.receipt.hash}`);
    } catch (error: any) {
      console.error('Test batch creation failed:', error);
      if (error.code === 'ACTION_REJECTED') {
        alert('❌ Transaction was rejected. Please try again and APPROVE in MetaMask.');
      } else {
        alert(`❌ Test batch creation failed: ${error.message}`);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
          ✅ Real Sepolia Contract Addresses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Contract Status */}
        <div>
          <h3 className="font-medium mb-2">Contract Initialization Status</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              {contracts.isContractsReady ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
              )}
              Contracts Ready: {contracts.isContractsReady ? 'Yes' : 'No'}
            </div>
            <div className="flex items-center">
              {walletState.isConnected ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
              )}
              Wallet Connected: {walletState.isConnected ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        {/* Contract Addresses */}
        <div>
          <h3 className="font-medium mb-2">Contract Addresses</h3>
          <div className="space-y-2">
            {Object.entries(CONTRACT_ADDRESSES).map(([name, address]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{name}:</span>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={isPlaceholderAddress(address) ? "destructive" : "default"}
                    className="text-xs"
                  >
                    {formatAddress(address)}
                  </Badge>
                  {isPlaceholderAddress(address) && (
                    <span className="text-red-600 text-xs">Placeholder</span>
                  )}
                  <a
                    href={`https://sepolia.etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Contracts Status */}
        {!Object.values(CONTRACT_ADDRESSES).some(isPlaceholderAddress) ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>✅ Real Integration Active!</strong> All contract addresses are real deployed contracts on Sepolia testnet. 
              Your transactions will be permanently stored on the blockchain.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Some contract addresses are placeholders. 
              These contracts may not exist on Sepolia testnet. Transactions may fail.
            </AlertDescription>
          </Alert>
        )}

        {/* Test Button */}
        <div className="pt-4 border-t">
          <Button 
            onClick={handleTestBatch}
            disabled={!contracts.isContractsReady || !walletState.isConnected}
            className="w-full"
            data-testid="button-test-batch"
          >
            🧪 Test Batch Creation
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            This will create a test batch to verify blockchain integration works
          </p>
        </div>

        {/* Instructions */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>To fix batch creation:</strong>
            <br />
            1. Make sure wallet is connected
            <br />
            2. When creating batch, APPROVE the transaction in MetaMask
            <br />
            3. Wait for transaction confirmation
            <br />
            4. Don't reject the transaction - this prevents blockchain storage
          </AlertDescription>
        </Alert>

      </CardContent>
    </Card>
  );
}