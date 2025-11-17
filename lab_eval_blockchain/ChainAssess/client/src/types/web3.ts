export interface WalletState {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  balance: string | null;
  provider: any;
}

export interface ContractAddresses {
  assignmentSubmission: string;
  tokenReward: string;
  nftReward: string;
  deadlineManager: string;
  accessControl: string;
  batchManagement: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: number;
  tokenReward: number;
  isActive: boolean;
  submissionCount: number;
}

export interface Submission {
  id: string;
  studentAddress: string;
  assignmentId: string;
  ipfsHash: string;
  timestamp: number;
  fileName: string;
  isOnTime: boolean;
  reviewed: boolean;
  rewardIssued: boolean;
}

export interface Token {
  balance: number;
  symbol: string;
  name: string;
}

export interface NFT {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  tokenUri: string;
}

export interface TransactionStatus {
  hash: string | null;
  status: 'idle' | 'pending' | 'success' | 'error';
  error: string | null;
}

export type UserRole = 'student' | 'teacher' | 'admin';
