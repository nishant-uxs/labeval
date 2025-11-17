import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWeb3 } from '@/hooks/useWeb3';
import { contractService } from '@/lib/contracts';
import { Token, NFT } from '@/types/web3';

export function RewardDisplay() {
  const { walletState } = useWeb3();
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  // No mock transactions - real data only
  const recentTransactions: any[] = [];

  useEffect(() => {
    const fetchRewards = async () => {
      if (!walletState.account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Set token balance to 0 (no mock data)
        setTokenBalance(0);
        
        // Mock NFTs for development
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
    <div className="grid grid-cols-1 gap-8">
      {/* NFT Collection Only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Achievement NFTs</CardTitle>
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