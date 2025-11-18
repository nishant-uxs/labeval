import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWeb3 } from '@/hooks/useWeb3';
import { contractService } from '@/lib/contracts';
import { Token, NFT } from '@/types/web3';

interface TokenTransaction {
  assignmentId: number;
  amount: number;
  grade: string;
  timestamp: number;
  transactionHash: string;
}

export function RewardDisplay() {
  const { walletState } = useWeb3();
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      if (!walletState.account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch real token balance from blockchain
        try {
          const balance = await contractService.getTokenBalance(walletState.account);
          setTokenBalance(balance);
        } catch (error) {
          console.error('Failed to fetch token balance:', error);
          setTokenBalance(0);
        }

        // Fetch token transactions from blockchain
        try {
          const transactions = await contractService.getTokenTransactions(walletState.account);
          setTokenTransactions(transactions || []);
        } catch (error) {
          console.error('Failed to fetch token transactions:', error);
          setTokenTransactions([]);
        }
        
        // NFTs not implemented yet
        setNfts([]);
      } catch (error) {
        console.error('Failed to fetch rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [walletState.account]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Token Earnings History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span className="flex items-center">
              <i className="fas fa-coins text-primary mr-2"></i>
              Token Earnings
            </span>
            <Badge variant="default" className="text-lg px-4 py-1">
              {tokenBalance} EDU
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tokenTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-coins text-gray-400 text-2xl"></i>
              </div>
              <p className="text-gray-500">No token earnings yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Submit assignments and earn EDU tokens based on your grades!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokenTransactions.map((tx, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="font-mono">
                        Assignment #{tx.assignmentId}
                      </Badge>
                      <Badge 
                        variant={
                          tx.grade === 'A' ? 'default' : 
                          tx.grade === 'B' ? 'secondary' : 
                          'outline'
                        }
                        className="font-bold"
                      >
                        Grade: {tx.grade}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(tx.timestamp * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      +{tx.amount}
                    </p>
                    <p className="text-xs text-gray-500">EDU</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NFT Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <i className="fas fa-trophy text-warning mr-2"></i>
            Achievement NFTs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nfts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-trophy text-gray-400 text-2xl"></i>
              </div>
              <p className="text-gray-500">No achievement NFTs yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Complete assignments with excellent grades to earn unique NFT certificates
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {nfts.map((nft) => (
                <div key={nft.tokenId} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-md mb-2 flex items-center justify-center">
                    <i className="fas fa-award text-white text-2xl"></i>
                  </div>
                  <h4 className="font-medium text-sm">{nft.name}</h4>
                  <p className="text-xs text-gray-500">{nft.description}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    #{nft.tokenId}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}