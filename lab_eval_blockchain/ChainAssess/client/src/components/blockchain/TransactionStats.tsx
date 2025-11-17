import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWeb3 } from '@/hooks/useWeb3';

interface TransactionStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalGasUsed: number;
  averageGasPrice: number;
  totalValue: number;
}

export function TransactionStats() {
  const { walletState } = useWeb3();
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    totalGasUsed: 0,
    averageGasPrice: 0,
    totalValue: 0
  });

  useEffect(() => {
    // Mock stats for development
    setStats({
      totalTransactions: 15,
      successfulTransactions: 14,
      failedTransactions: 1,
      totalGasUsed: 2150000,
      averageGasPrice: 19.5,
      totalValue: 0.0045
    });
  }, [walletState.account]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatGwei = (gwei: number) => {
    return `${gwei.toFixed(1)} Gwei`;
  };

  const formatEth = (eth: number) => {
    return `${eth.toFixed(6)} ETH`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalTransactions)}</div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
            <span className="text-green-600">{stats.successfulTransactions} success</span>
            <span>•</span>
            <span className="text-red-600">{stats.failedTransactions} failed</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Gas Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalGasUsed)}</div>
          <div className="text-sm text-gray-500 mt-1">
            Avg: {formatGwei(stats.averageGasPrice)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatEth(stats.totalValue)}</div>
          <div className="text-sm text-gray-500 mt-1">
            Transaction fees included
          </div>
        </CardContent>
      </Card>
    </div>
  );
}