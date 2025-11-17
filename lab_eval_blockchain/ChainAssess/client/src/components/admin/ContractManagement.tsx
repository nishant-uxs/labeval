import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CONTRACT_ADDRESSES } from '@/lib/web3';

interface ContractInfo {
  name: string;
  address: string;
  deployDate: Date;
  gasUsed: number;
  transactions: number;
  status: 'active' | 'inactive';
}

export function ContractManagement() {
  const [contracts] = useState<ContractInfo[]>([
    {
      name: 'AssignmentSubmission',
      address: CONTRACT_ADDRESSES.assignmentSubmission,
      deployDate: new Date('2024-12-01'),
      gasUsed: 0.12,
      transactions: 156,
      status: 'active'
    },
    {
      name: 'TokenReward',
      address: CONTRACT_ADDRESSES.tokenReward,
      deployDate: new Date('2024-12-01'),
      gasUsed: 0.18,
      transactions: 89,
      status: 'active'
    },
    {
      name: 'NFTReward',
      address: CONTRACT_ADDRESSES.nftReward,
      deployDate: new Date('2024-12-01'),
      gasUsed: 0.25,
      transactions: 23,
      status: 'active'
    },
    {
      name: 'DeadlineManager',
      address: CONTRACT_ADDRESSES.deadlineManager,
      deployDate: new Date('2024-12-01'),
      gasUsed: 0.08,
      transactions: 45,
      status: 'active'
    },
    {
      name: 'AccessControl',
      address: CONTRACT_ADDRESSES.accessControl,
      deployDate: new Date('2024-12-01'),
      gasUsed: 0.15,
      transactions: 67,
      status: 'active'
    }
  ]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const getEtherscanUrl = (address: string) => {
    return `https://sepolia.etherscan.io/address/${address}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-cogs mr-2 text-primary"></i>
          Smart Contract Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.name}
              className="border border-gray-200 rounded-lg p-4"
              data-testid={`contract-${contract.name.toLowerCase()}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{contract.name}</h4>
                  <p className="text-sm text-gray-600 font-mono">
                    {formatAddress(contract.address)}
                  </p>
                </div>
                <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                  {contract.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center">
                  <i className="fas fa-calendar-alt mr-1"></i>
                  Deployed: {contract.deployDate.toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <i className="fas fa-gas-pump mr-1"></i>
                  Gas: {contract.gasUsed} ETH
                </span>
                <span className="flex items-center">
                  <i className="fas fa-exchange-alt mr-1"></i>
                  {contract.transactions} transactions
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={getEtherscanUrl(contract.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                  data-testid={`link-etherscan-${contract.name.toLowerCase()}`}
                >
                  <i className="fas fa-external-link-alt mr-1"></i>
                  View on Etherscan
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
            <div>
              <h4 className="text-sm font-medium text-blue-800">Contract Information</h4>
              <p className="text-sm text-blue-700 mt-1">
                All contracts are deployed on Sepolia testnet and are fully functional.
                Monitor gas usage and transaction counts for optimization opportunities.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
