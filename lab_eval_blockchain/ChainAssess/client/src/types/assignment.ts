export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentAddress: string;
  studentName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  ipfsHash: string;
  ipfsUrl: string;
  submittedAt: Date;
  deadline: Date;
  status: 'submitted' | 'approved' | 'rejected' | 'expired';
  teacherReview?: {
    reviewedBy: string;
    reviewedAt: Date;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    feedback: string;
    approved: boolean;
  };
  tokenReward?: {
    amount: number;
    transactionHash: string;
    mintedAt: Date;
  };
  blockchainData: {
    transactionHash: string;
    blockNumber: number;
    gasUsed: string;
  };
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  maxTokenReward: number;
  acceptedFileTypes: string[];
  maxFileSize: number;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface StudentToken {
  studentAddress: string;
  totalTokens: number;
  tokensThisSemester: number;
  lastUpdated: Date;
  isTransferLocked: boolean;
  transactionHistory: TokenTransaction[];
}

export interface TokenTransaction {
  id: string;
  studentAddress: string;
  amount: number;
  type: 'earned' | 'penalty';
  assignmentId?: string;
  transactionHash: string;
  timestamp: Date;
  description: string;
}

export interface IPFSUploadResult {
  hash: string;
  url: string;
  size: number;
  gateway: string;
}

export interface FileValidation {
  isValid: boolean;
  error?: string;
  fileType?: string;
  size?: number;
}