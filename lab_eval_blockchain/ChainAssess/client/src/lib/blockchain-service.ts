import { ethers } from 'ethers';
import { AssignmentSubmission, TokenTransaction } from '@/types/assignment';

// Smart Contract ABIs (simplified for demo)
const ASSIGNMENT_CONTRACT_ABI = [
  "function submitAssignment(string assignmentId, string ipfsHash, string fileName, uint256 deadline) external",
  "function reviewSubmission(string submissionId, bool approved, uint256 tokenAmount) external",
  "function getSubmission(string submissionId) external view returns (string, string, address, uint256, bool, uint256)",
  "function isDeadlinePassed(uint256 deadline) external view returns (bool)",
  "function hasTeacherRole(address account) external view returns (bool)",
  "event AssignmentSubmitted(string indexed submissionId, address indexed student, string ipfsHash, uint256 timestamp)",
  "event SubmissionReviewed(string indexed submissionId, address indexed teacher, bool approved, uint256 tokenAmount)"
];

const TOKEN_CONTRACT_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function isTransferLocked(address account) external view returns (bool)",
  "function lockTransfers(address account) external",
  "event TokensMinted(address indexed to, uint256 amount, string reason)",
  "event TransferAttempt(address indexed from, address indexed to, uint256 amount, bool success)"
];

class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private assignmentContract: ethers.Contract | null = null;
  private tokenContract: ethers.Contract | null = null;

  // Contract addresses (loaded from environment or config)
  private readonly ASSIGNMENT_CONTRACT_ADDRESS = import.meta.env.VITE_ASSIGNMENT_CONTRACT_ADDRESS || '0x1234...';
  private readonly TOKEN_CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS || '0x5678...';

  async initialize() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      this.signer = await this.provider.getSigner();
      
      this.assignmentContract = new ethers.Contract(
        this.ASSIGNMENT_CONTRACT_ADDRESS,
        ASSIGNMENT_CONTRACT_ABI,
        this.signer
      );
      
      this.tokenContract = new ethers.Contract(
        this.TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        this.signer
      );
    }
  }

  // Submit assignment to blockchain
  async submitAssignment(
    assignmentId: string,
    ipfsHash: string,
    fileName: string,
    deadline: Date
  ): Promise<{ transactionHash: string; blockNumber: number; gasUsed: string }> {
    if (!this.assignmentContract) {
      throw new Error('Blockchain service not initialized');
    }

    const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);
    const submissionId = `${assignmentId}-${Date.now()}`;

    try {
      const tx = await this.assignmentContract.submitAssignment(
        submissionId,
        ipfsHash,
        fileName,
        deadlineTimestamp
      );

      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Blockchain submission failed:', error);
      throw new Error(`Failed to submit to blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Teacher reviews submission and mints tokens
  async reviewSubmission(
    submissionId: string,
    approved: boolean,
    tokenAmount: number,
    studentAddress: string
  ): Promise<{ transactionHash: string; success: boolean }> {
    if (!this.assignmentContract || !this.tokenContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // First check if deadline has passed
      const submission = await this.assignmentContract.getSubmission(submissionId);
      const deadline = parseInt(submission[3]);
      const isExpired = await this.assignmentContract.isDeadlinePassed(deadline);

      if (isExpired) {
        throw new Error('Cannot review submission: Assignment deadline has passed');
      }

      // Check teacher permissions
      const teacherAddress = await this.signer?.getAddress();
      const hasTeacherRole = await this.assignmentContract.hasTeacherRole(teacherAddress);
      
      if (!hasTeacherRole) {
        throw new Error('Access denied: Only teachers can review submissions');
      }

      // Review submission
      const reviewTx = await this.assignmentContract.reviewSubmission(
        submissionId,
        approved,
        approved ? tokenAmount : 0
      );

      await reviewTx.wait();

      // Mint tokens if approved
      if (approved && tokenAmount > 0) {
        const mintTx = await this.tokenContract.mint(studentAddress, tokenAmount);
        const mintReceipt = await mintTx.wait();
        
        return {
          transactionHash: mintReceipt.hash,
          success: true
        };
      }

      return {
        transactionHash: reviewTx.hash,
        success: true
      };
    } catch (error) {
      console.error('Review submission failed:', error);
      throw error;
    }
  }

  // Get student token balance
  async getStudentTokenBalance(studentAddress: string): Promise<number> {
    if (!this.tokenContract) {
      throw new Error('Token contract not initialized');
    }

    try {
      const balance = await this.tokenContract.balanceOf(studentAddress);
      return parseInt(balance.toString());
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return 0;
    }
  }

  // Check if transfers are locked for student
  async areTransfersLocked(studentAddress: string): Promise<boolean> {
    if (!this.tokenContract) {
      return true; // Default to locked if contract not available
    }

    try {
      return await this.tokenContract.isTransferLocked(studentAddress);
    } catch (error) {
      console.error('Failed to check transfer lock status:', error);
      return true;
    }
  }

  // Get submission details from blockchain
  async getSubmissionFromBlockchain(submissionId: string): Promise<any> {
    if (!this.assignmentContract) {
      throw new Error('Assignment contract not initialized');
    }

    try {
      const submission = await this.assignmentContract.getSubmission(submissionId);
      return {
        ipfsHash: submission[0],
        fileName: submission[1],
        studentAddress: submission[2],
        deadline: new Date(parseInt(submission[3]) * 1000),
        reviewed: submission[4],
        tokenAmount: parseInt(submission[5])
      };
    } catch (error) {
      console.error('Failed to get submission from blockchain:', error);
      throw error;
    }
  }

  // Listen for blockchain events
  setupEventListeners(onSubmission?: (event: any) => void, onReview?: (event: any) => void) {
    if (!this.assignmentContract) return;

    if (onSubmission) {
      this.assignmentContract.on('AssignmentSubmitted', (submissionId, student, ipfsHash, timestamp, event) => {
        onSubmission({
          submissionId,
          student,
          ipfsHash,
          timestamp: new Date(parseInt(timestamp.toString()) * 1000),
          transactionHash: event.transactionHash
        });
      });
    }

    if (onReview) {
      this.assignmentContract.on('SubmissionReviewed', (submissionId, teacher, approved, tokenAmount, event) => {
        onReview({
          submissionId,
          teacher,
          approved,
          tokenAmount: parseInt(tokenAmount.toString()),
          transactionHash: event.transactionHash
        });
      });
    }
  }

  // Cleanup event listeners
  removeEventListeners() {
    if (this.assignmentContract) {
      this.assignmentContract.removeAllListeners();
    }
    if (this.tokenContract) {
      this.tokenContract.removeAllListeners();
    }
  }

  // Utility: Check if address is valid
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  // Utility: Format token amount
  formatTokenAmount(amount: number): string {
    return amount.toLocaleString();
  }
}

export const blockchainService = new BlockchainService();