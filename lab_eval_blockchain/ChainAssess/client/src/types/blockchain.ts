export interface IPFSUploadResult {
  hash: string;
  url: string;
  size: number;
}

export interface ContractTransaction {
  hash: string;
  blockNumber?: number;
  gasUsed?: string;
  status: number;
}

export interface RewardTransaction {
  recipient: string;
  amount: number;
  reason: string;
  transactionHash: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface DeadlineInfo {
  assignmentId: string;
  deadline: number;
  isActive: boolean;
  rewardsEnabled: boolean;
}

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  totalCost: string;
}
