import { ethers } from 'ethers';
import { AssignmentSubmission, TokenTransaction } from '@/types/assignment';

// Smart Contract ABIs - CORRECT ABIs matching deployed contracts
const ASSIGNMENT_CONTRACT_ABI = [
  "function createAssignment(string memory _title, string memory _description, string memory _ipfsHash, uint256 _deadline, uint256 _tokenReward, uint256 _batchId) external returns (uint256)",
  "function submitAssignment(uint256 _assignmentId, string memory _fileName, string memory _ipfsHash) external returns (uint256)",
  "function getSubmission(uint256 _submissionId) external view returns (tuple(uint256 id, uint256 assignmentId, address student, string fileName, string ipfsHash, uint256 submittedAt, bool isGraded, string grade, uint256 tokensAwarded, address gradedBy, uint256 gradedAt))",
  "function getStudentSubmissions(address _student) external view returns (uint256[] memory)",
  "function getAssignmentSubmissions(uint256 _assignmentId) external view returns (uint256[] memory)",
  "function reviewSubmission(uint256 _submissionId, string memory _grade, string memory _feedback, uint256 _tokensAwarded) external",
  "event AssignmentSubmitted(uint256 indexed submissionId, uint256 indexed assignmentId, address indexed student, string ipfsHash)",
  "event SubmissionReviewed(uint256 indexed submissionId, address indexed teacher, string grade, uint256 tokensAwarded)"
];

const TOKEN_CONTRACT_ABI = [
  "function balanceOf(address _owner) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function awardTokens(address _student, uint256 _assignmentId, uint256 _batchId, uint256 _baseAmount, string memory _grade) external"
];

const ACCESS_CONTROL_ABI = [
  "function isStudent(address account) external view returns (bool)",
  "function isTeacher(address account) external view returns (bool)",
  "function registerStudent(address student) external",
  "function registerTeacher(address teacher) external",
  "event StudentRegistered(address indexed student, address indexed admin)",
  "event TeacherRegistered(address indexed teacher, address indexed admin)"
];

class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private assignmentContract: ethers.Contract | null = null;
  private tokenContract: ethers.Contract | null = null;
  private accessControlContract: ethers.Contract | null = null;

  // Contract addresses - REAL deployed contracts on Sepolia
  private readonly ASSIGNMENT_CONTRACT_ADDRESS = import.meta.env.VITE_ASSIGNMENT_SUBMISSION_CONTRACT || '0xf39A62a69222ad7F51217AFedd46178e7926039d';
  private readonly TOKEN_CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_REWARD_CONTRACT || '0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592';
  private readonly ACCESS_CONTROL_ADDRESS = import.meta.env.VITE_ACCESS_CONTROL_CONTRACT || '0x6fC21092DA55B392b045eD78F4732bff3C580e2c';

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
      
      this.accessControlContract = new ethers.Contract(
        this.ACCESS_CONTROL_ADDRESS,
        ACCESS_CONTROL_ABI,
        this.signer
      );
    }
  }

  // Submit assignment to blockchain - CORRECT SIGNATURE
  async submitAssignment(
    assignmentId: string,
    ipfsHash: string,
    fileName: string,
    deadline?: Date
  ): Promise<{ transactionHash: string; blockNumber: number; gasUsed: string }> {
    if (!this.assignmentContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      console.log('📝 Submitting to blockchain:', { assignmentId, ipfsHash, fileName });
      
      // Correct function signature: submitAssignment(uint256 _assignmentId, string _fileName, string _ipfsHash)
      const tx = await this.assignmentContract.submitAssignment(
        parseInt(assignmentId),
        fileName,
        ipfsHash
      );

      console.log('⏳ Waiting for transaction confirmation...', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed!', receipt);
      
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

  // Review submission and mint tokens (automatic student registration if needed)
  async gradeSubmission(
    submissionId: number,
    grade: string,
    feedback: string,
    tokensAwarded: number,
    studentAddress: string,
    assignmentId: number,
    batchId: number
  ): Promise<{ transactionHash: string }> {
    if (!this.assignmentContract || !this.tokenContract || !this.accessControlContract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Step 0: Check if student is registered, if not, register them
      // Note: Teacher registration must be done by admin beforehand
      console.log('🔍 Checking if student is registered:', studentAddress);
      const isStudentRegistered = await this.accessControlContract.isStudent(studentAddress);
      
      if (!isStudentRegistered) {
        console.log('📝 Student not registered, registering now...');
        const registerStudentTx = await this.accessControlContract.registerStudent(studentAddress);
        console.log('⏳ Waiting for student registration confirmation...', registerStudentTx.hash);
        await registerStudentTx.wait();
        console.log('✅ Student registered successfully!');
      } else {
        console.log('✅ Student already registered!');
      }
      
      console.log('🎓 Step 1: Reviewing submission on blockchain:', { submissionId, grade, feedback, tokensAwarded });
      
      // Step 1: Call reviewSubmission on smart contract
      const reviewTx = await this.assignmentContract.reviewSubmission(submissionId, grade, feedback, tokensAwarded);
      
      console.log('⏳ Waiting for review transaction confirmation...', reviewTx.hash);
      const reviewReceipt = await reviewTx.wait();
      console.log('✅ Review transaction confirmed!', reviewReceipt);
      
      // Step 2: Fetch assignment from blockchain to get CORRECT batchId
      console.log('📚 Fetching assignment from blockchain to get correct batchId...');
      const assignment = await this.assignmentContract.getAssignment(assignmentId);
      const onChainBatchId = Number(assignment.batchId);
      console.log('✅ Got assignment batchId from blockchain:', { 
        uiBatchId: batchId, 
        onChainBatchId,
        match: batchId === onChainBatchId 
      });
      
      // Step 3: Award tokens to student using BLOCKCHAIN batchId
      console.log('💰 Step 3: Minting tokens to student:', { 
        studentAddress, 
        assignmentId, 
        batchId: onChainBatchId, 
        tokensAwarded, 
        grade 
      });
      const awardTx = await this.tokenContract.awardTokens(studentAddress, assignmentId, onChainBatchId, tokensAwarded, grade);
      
      console.log('⏳ Waiting for token minting confirmation...', awardTx.hash);
      const awardReceipt = await awardTx.wait();
      console.log('✅ Tokens minted successfully!', awardReceipt);
      
      return {
        transactionHash: awardReceipt.hash
      };
    } catch (error) {
      console.error('Blockchain grading/minting failed:', error);
      throw new Error(`Failed to grade and mint tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
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