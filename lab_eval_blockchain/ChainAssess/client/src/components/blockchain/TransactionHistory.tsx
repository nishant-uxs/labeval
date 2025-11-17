import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContracts } from '@/hooks/useContracts';
import { TransactionStats } from './TransactionStats';
import { TransactionVerifier } from './TransactionVerifier';

interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: 'success' | 'failed';
  type: 'assignment' | 'token' | 'nft' | 'role' | 'other';
  description: string;
  contractAddress?: string;
}

interface ContractEvent {
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  eventName: string;
  args: Record<string, any>;
  contractAddress: string;
  type: 'AssignmentSubmitted' | 'TokensIssued' | 'NFTIssued' | 'RoleGranted' | 'SubmissionReviewed';
}

export function TransactionHistory() {
  const { walletState } = useWeb3();
  const { provider, isContractsReady } = useContracts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchHash, setSearchHash] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // No mock transactions - real data only
  const mockTransactions: Transaction[] = [];

  const mockEvents: ContractEvent[] = [];

  useEffect(() => {
    fetchTransactionHistory();
  }, [walletState.account, isContractsReady]);

  const fetchTransactionHistory = async () => {
    if (!walletState.account) return;
    
    setLoading(true);
    try {
      // Real data only - no mock transactions
      setTransactions([]);
      setEvents([]);
      setTotalPages(0);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.type === filter;
    const matchesSearch = !searchHash || tx.hash.toLowerCase().includes(searchHash.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatValue = (value: string, type: string) => {
    if (type === 'token') {
      const ethValue = parseFloat(value) / 1e18;
      return `${ethValue} EDU`;
    }
    return `${parseFloat(value)} ETH`;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors = {
      assignment: 'bg-blue-100 text-blue-800',
      token: 'bg-green-100 text-green-800',
      nft: 'bg-purple-100 text-purple-800',
      role: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getStatusColor = (status: string) => {
    return status === 'success' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const openEtherscan = (hash: string) => {
    window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Blockchain Transaction Explorer</h2>
        <Badge variant="secondary">
          {filteredTransactions.length} Transactions
        </Badge>
      </div>

      {/* Transaction Stats */}
      <TransactionStats />

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by transaction hash..."
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            data-testid="input-search-hash"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'assignment', 'token', 'nft', 'role'].map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
              data-testid={`filter-${type}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions" data-testid="tab-transactions">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">
            Contract Events
          </TabsTrigger>
          <TabsTrigger value="verify" data-testid="tab-verify">
            Verify Hash
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {paginatedTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-receipt text-gray-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-500">No transactions found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Your blockchain transactions will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedTransactions.map((tx) => (
                    <div key={tx.hash} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-exchange-alt text-blue-600 text-sm"></i>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{tx.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getTransactionTypeColor(tx.type)}>
                                {tx.type}
                              </Badge>
                              <Badge className={getStatusColor(tx.status)}>
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEtherscan(tx.hash)}
                          data-testid={`view-tx-${tx.hash.slice(0, 8)}`}
                        >
                          <i className="fas fa-external-link-alt mr-2"></i>
                          View on Etherscan
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Transaction Hash</p>
                          <p className="font-mono">{formatAddress(tx.hash)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Block</p>
                          <p className="font-mono">{tx.blockNumber.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">From → To</p>
                          <p className="font-mono">
                            {formatAddress(tx.from)} → {formatAddress(tx.to)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Timestamp</p>
                          <p>{formatTimestamp(tx.timestamp)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-500">Gas Used</p>
                          <p>{parseInt(tx.gasUsed).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Gas Price</p>
                          <p>{(parseInt(tx.gasPrice) / 1e9).toFixed(2)} Gwei</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Value</p>
                          <p>{formatValue(tx.value, tx.type)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Contract Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-code text-gray-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-500">No contract events found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Smart contract events will be displayed here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-code text-purple-600 text-sm"></i>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{event.eventName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Block: {event.blockNumber.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEtherscan(event.transactionHash)}
                          data-testid={`view-event-${index}`}
                        >
                          <i className="fas fa-external-link-alt mr-2"></i>
                          View Transaction
                        </Button>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3 mt-3">
                        <p className="text-sm font-medium mb-2">Event Arguments:</p>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(event.args, null, 2)}
                        </pre>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-500">Contract Address</p>
                          <p className="font-mono">{formatAddress(event.contractAddress)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Timestamp</p>
                          <p>{formatTimestamp(event.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify">
          <TransactionVerifier />
        </TabsContent>
      </Tabs>
    </div>
  );
}