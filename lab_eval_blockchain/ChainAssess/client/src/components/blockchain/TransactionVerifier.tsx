import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWeb3 } from '@/hooks/useWeb3';

interface TransactionData {
  hash: string;
  status: 'success' | 'failed' | 'pending';
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  timestamp: number;
  confirmations: number;
}

export function TransactionVerifier() {
  const [txHash, setTxHash] = useState('');
  const [txData, setTxData] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { walletState } = useWeb3();

  const verifyTransaction = async () => {
    if (!txHash.trim()) {
      setError('Please enter a transaction hash');
      return;
    }

    if (!txHash.startsWith('0x') || txHash.length !== 66) {
      setError('Invalid transaction hash format');
      return;
    }

    setLoading(true);
    setError(null);
    setTxData(null);

    try {
      // In a real implementation, this would query the blockchain
      // For development, simulate the verification
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock transaction data
      const mockTxData: TransactionData = {
        hash: txHash,
        status: 'success',
        blockNumber: 18500000 + Math.floor(Math.random() * 1000),
        from: walletState.account || '0x0000000000000000000000000000000000000000',
        to: '0x1234567890123456789012345678901234567890',
        value: '0',
        gasUsed: '150000',
        gasPrice: '20000000000',
        timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        confirmations: Math.floor(Math.random() * 100) + 10
      };

      setTxData(mockTxData);
    } catch (err) {
      setError('Failed to verify transaction. Please check the hash and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openEtherscan = () => {
    if (txHash) {
      window.open(`https://sepolia.etherscan.io/tx/${txHash}`, '_blank');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-search mr-2 text-blue-600"></i>
            Transaction Verifier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="txHash">Transaction Hash</Label>
            <Input
              id="txHash"
              placeholder="0x1234567890abcdef..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              data-testid="input-transaction-hash"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={verifyTransaction}
              disabled={loading || !txHash.trim()}
              className="flex-1"
              data-testid="button-verify-transaction"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Verifying...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle mr-2"></i>
                  Verify Transaction
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={openEtherscan}
              disabled={!txHash.trim()}
              data-testid="button-view-etherscan"
            >
              <i className="fas fa-external-link-alt mr-2"></i>
              View on Etherscan
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {txData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transaction Details</span>
              <Badge className={getStatusColor(txData.status)}>
                {txData.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transaction Hash</p>
                  <p className="font-mono text-sm break-all">{txData.hash}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Block Number</p>
                  <p className="font-mono">{txData.blockNumber.toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">From Address</p>
                  <p className="font-mono">{formatAddress(txData.from)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">To Address</p>
                  <p className="font-mono">{formatAddress(txData.to)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gas Used</p>
                  <p>{parseInt(txData.gasUsed).toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Gas Price</p>
                  <p>{(parseInt(txData.gasPrice) / 1e9).toFixed(2)} Gwei</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Timestamp</p>
                  <p>{formatTimestamp(txData.timestamp)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmations</p>
                  <p className="flex items-center">
                    <span className="mr-2">{txData.confirmations}</span>
                    {txData.confirmations >= 12 && (
                      <Badge variant="secondary" className="text-xs">
                        Confirmed
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEtherscan}
                  data-testid="button-view-full-etherscan"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  View Full Details on Etherscan
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blockUrl = `https://sepolia.etherscan.io/block/${txData.blockNumber}`;
                    window.open(blockUrl, '_blank');
                  }}
                  data-testid="button-view-block"
                >
                  <i className="fas fa-cube mr-2"></i>
                  View Block
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const addressUrl = `https://sepolia.etherscan.io/address/${txData.from}`;
                    window.open(addressUrl, '_blank');
                  }}
                  data-testid="button-view-sender"
                >
                  <i className="fas fa-user mr-2"></i>
                  View Sender
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Explorers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Sepolia Testnet</h4>
              <div className="flex flex-col space-y-1">
                <a
                  href="https://sepolia.etherscan.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  <i className="fas fa-external-link-alt mr-1"></i>
                  Sepolia Etherscan
                </a>
                <a
                  href="https://sepolia.otterscan.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  <i className="fas fa-external-link-alt mr-1"></i>
                  Sepolia Otterscan
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">IPFS Gateways</h4>
              <div className="flex flex-col space-y-1">
                <a
                  href="https://ipfs.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  <i className="fas fa-external-link-alt mr-1"></i>
                  IPFS Gateway
                </a>
                <a
                  href="https://gateway.pinata.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  <i className="fas fa-external-link-alt mr-1"></i>
                  Pinata Gateway
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}