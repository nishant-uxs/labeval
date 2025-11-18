
import { ethers } from 'ethers';

// Contract addresses from deployment - REAL deployed contracts (UPDATED 2025-11-18)
const CONTRACT_ADDRESSES = {
  accessControl: process.env.ACCESS_CONTROL_CONTRACT || "0xFB7c09E0d25577401cB98C9b29B0465243A97E5F",
  batchManagement: process.env.BATCH_MANAGEMENT_CONTRACT || "0x1fc70217069C652626367185506915094E93CB2e",
  assignmentSubmission: process.env.ASSIGNMENT_SUBMISSION_CONTRACT || "0x0Cb073963Cee7F4e660C5c31E25Cb59BBdEE3c7f",
  tokenReward: process.env.TOKEN_REWARD_CONTRACT || "0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592"
};

// Contract ABIs (corrected for real deployed contracts)
const ACCESS_CONTROL_ABI = [
  "function grantRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function TEACHER_ROLE() external view returns (bytes32)",
  "function STUDENT_ROLE() external view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)"
];

const BATCH_MANAGEMENT_ABI = [
  "function createBatch(string memory _name) external returns (uint256)",
  "function addStudentToBatch(uint256 _batchId, address _student) external",
  "function addMultipleStudentsToBatch(uint256 _batchId, address[] memory _students) external",
  "function removeStudentFromBatch(uint256 _batchId, address _student) external",
  "function renameBatch(uint256 _batchId, string memory _newName) external",
  "function deactivateBatch(uint256 _batchId) external",
  "function isStudentInBatch(address _student, uint256 _batchId) external view returns (bool)",
  "function getBatch(uint256 _batchId) external view returns (tuple(uint256 id, string name, address teacher, address[] students, bool isActive, uint256 createdAt, uint256 updatedAt))",
  "function getBatchStudents(uint256 _batchId) external view returns (address[] memory)",
  "function getTeacherBatches(address _teacher) external view returns (uint256[] memory)",
  "function getStudentBatches(address _student) external view returns (uint256[] memory)",
  "function getActiveTeacherBatches(address _teacher) external view returns (uint256[] memory)",
  "function batches(uint256) external view returns (uint256 id, string name, address teacher, bool isActive, uint256 createdAt, uint256 updatedAt)",
  "function nextBatchId() external view returns (uint256)"
];

const ASSIGNMENT_SUBMISSION_ABI = [
  "function createAssignment(string memory _title, string memory _description, string memory _ipfsHash, uint256 _deadline, uint256 _tokenReward, uint256 _batchId) external returns (uint256)",
  "function getAssignment(uint256 _assignmentId) external view returns (tuple(uint256 id, string title, string description, string ipfsHash, uint256 deadline, uint256 tokenReward, address teacher, uint256 batchId, bool isActive, uint256 createdAt))",
  "function getTeacherAssignments(address _teacher) external view returns (uint256[] memory)",
  "function getStudentAvailableAssignments(address _student) external view returns (uint256[] memory)",
  "function getBatchAssignments(uint256 _batchId) external view returns (uint256[] memory)",
  "function submitAssignment(uint256 _assignmentId, string memory _fileName, string memory _ipfsHash) external returns (uint256)",
  "function getSubmission(uint256 _submissionId) external view returns (tuple(uint256 id, uint256 assignmentId, address student, string fileName, string ipfsHash, uint256 submittedAt, bool isGraded, string grade, uint256 tokensAwarded, address gradedBy, uint256 gradedAt))",
  "function getStudentSubmissions(address _student) external view returns (uint256[] memory)",
  "function getAssignmentSubmissions(uint256 _assignmentId) external view returns (uint256[] memory)",
  "function gradeSubmission(uint256 _submissionId, string memory _grade) external"
];

const TOKEN_REWARD_ABI = [
  "function balanceOf(address _owner) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)"
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;
  private accessControl: ethers.Contract | null = null;
  private batchManagement: ethers.Contract | null = null;
  private assignmentSubmission: ethers.Contract | null = null;
  private tokenReward: ethers.Contract | null = null;
  private alchemyApiKey: string;

  constructor() {
    this.alchemyApiKey = process.env.ALCHEMY_API_KEY!;
    if (!this.alchemyApiKey) {
      throw new Error('ALCHEMY_API_KEY environment variable is required');
    }
    
    const rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${this.alchemyApiKey}`;
    console.log('🔗 Initializing blockchain service with RPC:', rpcUrl.replace(this.alchemyApiKey, '***'));
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Initialize contracts with provider for read operations
    this.accessControl = new ethers.Contract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI, this.provider);
    this.batchManagement = new ethers.Contract(CONTRACT_ADDRESSES.batchManagement, BATCH_MANAGEMENT_ABI, this.provider);
    this.assignmentSubmission = new ethers.Contract(CONTRACT_ADDRESSES.assignmentSubmission, ASSIGNMENT_SUBMISSION_ABI, this.provider);
    this.tokenReward = new ethers.Contract(CONTRACT_ADDRESSES.tokenReward, TOKEN_REWARD_ABI, this.provider);
    
    console.log('✅ Blockchain service initialized with contracts:', {
      assignment: CONTRACT_ADDRESSES.assignmentSubmission,
      batch: CONTRACT_ADDRESSES.batchManagement,
      token: CONTRACT_ADDRESSES.tokenReward
    });
    
    console.log('⛓️  Using Blockchain Storage for complete decentralization');
    console.log('🎯 All data stored on smart contracts with IPFS integration');
  }

  // Initialize with wallet for write operations
  async initializeWithWallet(privateKey: string) {
    this.signer = new ethers.Wallet(privateKey, this.provider);
    
    // Reconnect contracts with signer for write operations
    this.accessControl = new ethers.Contract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI, this.signer);
    this.batchManagement = new ethers.Contract(CONTRACT_ADDRESSES.batchManagement, BATCH_MANAGEMENT_ABI, this.signer);
    this.assignmentSubmission = new ethers.Contract(CONTRACT_ADDRESSES.assignmentSubmission, ASSIGNMENT_SUBMISSION_ABI, this.signer);
    this.tokenReward = new ethers.Contract(CONTRACT_ADDRESSES.tokenReward, TOKEN_REWARD_ABI, this.signer);
    
    console.log('💼 Wallet initialized:', this.signer.address);
  }

  // User role management
  async getUserRole(address: string): Promise<'admin' | 'teacher' | 'student' | 'none'> {
    try {
      const isTeacher = await this.isTeacher(address);
      if (isTeacher) return 'teacher';
      
      const isStudent = await this.isStudent(address);
      if (isStudent) return 'student';
      
      const isAdmin = await this.isAdmin(address);
      if (isAdmin) return 'admin';
      
      return 'none';
    } catch (error) {
      console.error('Failed to get user role from blockchain:', error);
      return 'none';
    }
  }

  async isAdmin(address: string): Promise<boolean> {
    try {
      const adminRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const result = await this.accessControl!.hasRole(adminRole, address);
      return result;
    } catch (error) {
      console.error('Failed to verify admin role on blockchain:', error);
      // Fallback verification
      console.log('🔍 Fallback admin verification for', address, ':', false);
      return false;
    }
  }

  async isTeacher(address: string): Promise<boolean> {
    try {
      const teacherRole = ethers.keccak256(ethers.toUtf8Bytes("TEACHER_ROLE"));
      const result = await this.accessControl!.hasRole(teacherRole, address);
      return result;
    } catch (error) {
      console.error('Failed to verify teacher role on blockchain:', error);
      // Fallback verification - teacher address is hardcoded for now
      const isHardcodedTeacher = address.toLowerCase() === "0xc39d22dc2d0a3ca341ce8f69efa563d113607688";
      console.log('🔍 Fallback teacher verification for', address, ':', isHardcodedTeacher);
      return isHardcodedTeacher;
    }
  }

  async isStudent(address: string): Promise<boolean> {
    try {
      const studentRole = ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE"));
      const result = await this.accessControl!.hasRole(studentRole, address);
      return result;
    } catch (error) {
      console.error('Failed to verify student role on blockchain:', error);
      // Fallback verification - student address is hardcoded for now
      const isHardcodedStudent = address.toLowerCase() === "0x31d05d7a6130f3e8b149008ec70090022f9c9330";
      console.log('🔍 Fallback student verification for', address, ':', isHardcodedStudent);
      return isHardcodedStudent;
    }
  }

  // Batch management
  async getTeacherBatches(teacherAddress: string): Promise<any[]> {
    console.log('🔗 Fetching teacher batches from blockchain for:', teacherAddress);
    
    // Direct scanning method using batches mapping
    return await this.scanBatchesForTeacher(teacherAddress);
  }

  async getStudentBatches(studentAddress: string): Promise<any[]> {
    console.log('🔗 Fetching student batches from blockchain for:', studentAddress);
    
    // Direct scanning method using studentInBatch mapping
    return await this.scanBatchesForStudent(studentAddress);
  }

  async getBatch(batchId: number): Promise<any | null> {
    try {
      // Use batches mapping for basic info (more reliable)
      const result = await this.batchManagement!.batches(batchId);
      console.log('🔍 Raw batch data for batch', batchId, ':', result);
      
      // Handle array format from batches mapping
      if (Array.isArray(result) && result.length >= 6) {
        const [id, name, teacher, isActive, createdAt, updatedAt] = result;
        
        // Skip empty or inactive batches
        if (!name || name === '') {
          return null;
        }
        
        // Fetch students separately using getBatchStudents
        let students: string[] = [];
        try {
          students = await this.batchManagement!.getBatchStudents(batchId);
          console.log(`📚 Batch ${batchId} has ${students.length} students`);
        } catch (err) {
          console.log(`⚠️ Could not fetch students for batch ${batchId}, using empty array`);
        }
        
        const batch = {
          id: Number(id),
          name: name,
          teacher: teacher,
          students: students,
          isActive: isActive,
          createdAt: new Date(Number(createdAt) * 1000),
          updatedAt: new Date(Number(updatedAt) * 1000)
        };
        
        console.log('✅ Successfully decoded batch with', batch.students.length, 'students:', batch);
        return batch;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Failed to get batch ${batchId}:`, error);
      return null;
    }
  }

  async scanBatchesForTeacher(teacherAddress: string): Promise<any[]> {
    const batches = [];
    try {
      // Get total batches count using nextBatchId
      let totalBatches = 0;
      try {
        const nextId = await this.batchManagement!.nextBatchId();
        totalBatches = Number(nextId) - 1;
        console.log(`📊 Scanning ${totalBatches} batches for teacher...`);
      } catch {
        console.log('⚠️ Cannot determine total batches, scanning first 50');
        totalBatches = 50;
      }
      
      for (let i = 1; i <= totalBatches; i++) {
        try {
          const batch = await this.getBatch(i);
          if (batch && batch.teacher.toLowerCase() === teacherAddress.toLowerCase()) {
            batches.push(batch);
          }
        } catch (err) {
          // Batch might not exist or be inactive
        }
      }
      
      console.log(`📊 Found ${batches.length} batches for teacher via scanning`);
    } catch (error) {
      console.error('❌ Batch scanning failed:', error);
    }
    
    return batches;
  }

  async scanBatchesForStudent(studentAddress: string): Promise<any[]> {
    const batches = [];
    let totalBatches = 0;
    try {
      // Get total batches count using nextBatchId
      try {
        const nextId = await this.batchManagement!.nextBatchId();
        totalBatches = Number(nextId) - 1;
        console.log(`📊 Scanning ${totalBatches} batches for student...`);
      } catch {
        console.log('⚠️ getTotalBatches failed, using manual scanning with fixed range');
        totalBatches = 50;
      }
      
      // NOTE: studentInBatch function is not working due to ABI mismatch
      // For now, we'll check if any batches exist and return them for the known student
      
      console.log(`📊 Found 0 batches for student via scanning (ABI issues)`);
    } catch (error) {
      console.error('❌ Batch scanning failed:', error);
    }
    
    // Scan all batches and check if student is actually in them
    try {
      for (let i = 1; i <= Number(totalBatches); i++) {
        try {
          const batch = await this.getBatch(i);
          if (batch && batch.isActive && batch.students) {
            // Check if student is actually in this batch
            const isInBatch = batch.students.some((student: string) => 
              student.toLowerCase() === studentAddress.toLowerCase()
            );
            
            if (isInBatch) {
              batches.push(batch);
            }
          }
        } catch (err) {
          // Batch might not exist
        }
      }
    } catch (error) {
      console.error('Failed to scan batches for student:', error);
    }
    
    return batches;
  }

  async createBatch(name: string, teacherAddress: string): Promise<{ id: number; transactionHash: string }> {
    console.log('🎯 Creating batch on blockchain:', name, 'for teacher:', teacherAddress);
    
    if (!this.signer) {
      throw new Error('Wallet not initialized. Call initializeWithWallet first.');
    }
    
    try {
      const tx = await this.batchManagement!.createBatch(name);
      console.log('📝 Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);
      
      // Extract batch ID from events
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.batchManagement!.interface.parseLog(log);
          return parsed?.name === 'BatchCreated';
        } catch {
          return false;
        }
      });
      
      let batchId = 0;
      if (event) {
        const parsed = this.batchManagement!.interface.parseLog(event);
        batchId = Number(parsed?.args.batchId);
        console.log('🎉 Batch created with ID:', batchId);
      }
      
      return {
        id: batchId,
        transactionHash: receipt.hash
      };
    } catch (error: any) {
      console.error('❌ Failed to create batch on blockchain:', error);
      throw error;
    }
  }

  async addStudentToBatch(batchId: number, studentAddress: string): Promise<string> {
    console.log('👥 Adding student to batch on blockchain:', batchId, studentAddress);
    
    if (!this.signer) {
      throw new Error('Wallet not initialized. Call initializeWithWallet first.');
    }
    
    try {
      const tx = await this.batchManagement!.addStudentToBatch(batchId, studentAddress);
      console.log('📝 Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Student added to batch on blockchain');
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to add student to batch:', error);
      throw error;
    }
  }

  async removeStudentFromBatch(batchId: number, studentAddress: string): Promise<string> {
    console.log('🗑️ Removing student from batch on blockchain:', batchId, studentAddress);
    
    if (!this.signer) {
      throw new Error('Wallet not initialized. Call initializeWithWallet first.');
    }
    
    try {
      const tx = await this.batchManagement!.removeStudentFromBatch(batchId, studentAddress);
      console.log('📝 Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Student removed from batch on blockchain');
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to remove student from batch:', error);
      throw error;
    }
  }

  async deactivateBatch(batchId: number): Promise<string> {
    console.log('🔒 Deactivating batch on blockchain:', batchId);
    
    if (!this.signer) {
      throw new Error('Wallet not initialized. Call initializeWithWallet first.');
    }
    
    try {
      const tx = await this.batchManagement!.deactivateBatch(batchId);
      console.log('📝 Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Batch deactivated on blockchain');
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to deactivate batch:', error);
      throw error;
    }
  }

  async renameBatch(batchId: number, newName: string): Promise<string> {
    console.log('✏️ Renaming batch on blockchain:', batchId, 'to:', newName);
    
    if (!this.signer) {
      throw new Error('Wallet not initialized. Call initializeWithWallet first.');
    }
    
    try {
      const tx = await this.batchManagement!.renameBatch(batchId, newName);
      console.log('📝 Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Batch renamed on blockchain');
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to rename batch:', error);
      throw error;
    }
  }

  // Assignment management
  async getStudentAssignments(studentAddress: string, batchId?: number): Promise<any[]> {
    console.log('📚 Getting assignments from blockchain for student:', studentAddress);
    
    try {
      const assignmentIds = await this.assignmentSubmission!.getStudentAvailableAssignments(studentAddress);
      const assignments = [];
      
      for (const id of assignmentIds) {
        try {
          const assignment = await this.assignmentSubmission!.getAssignment(id);
          if (!batchId || assignment.batchId === batchId) {
            assignments.push(assignment);
          }
        } catch (err) {
          console.error(`Failed to fetch assignment ${id}:`, err);
        }
      }
      
      return assignments;
    } catch (error) {
      console.error('Failed to get student assignments:', error);
      return [];
    }
  }

  async getTeacherAssignments(teacherAddress: string): Promise<any[]> {
    console.log('📚 Getting assignments from blockchain for teacher:', teacherAddress);
    
    try {
      const assignmentIds = await this.assignmentSubmission!.getTeacherAssignments(teacherAddress);
      const assignments = [];
      
      for (const id of assignmentIds) {
        try {
          const assignment = await this.assignmentSubmission!.getAssignment(id);
          assignments.push(assignment);
        } catch (err) {
          console.error(`Failed to fetch assignment ${id}:`, err);
        }
      }
      
      return assignments;
    } catch (error) {
      console.error('Failed to get teacher assignments:', error);
      return [];
    }
  }

  async getBatchAssignments(batchId: string): Promise<any[]> {
    console.log('📚 Getting batch assignments from blockchain for batch:', batchId);
    
    try {
      const assignmentIds = await this.assignmentSubmission!.getBatchAssignments(parseInt(batchId));
      const assignments = [];
      
      for (const id of assignmentIds) {
        try {
          const assignment = await this.assignmentSubmission!.getAssignment(id);
          assignments.push({
            id: Number(assignment.id),
            title: assignment.title,
            description: assignment.description,
            ipfsHash: assignment.ipfsHash,
            deadline: new Date(Number(assignment.deadline) * 1000),
            tokenReward: Number(assignment.tokenReward),
            teacher: assignment.teacher,
            batchId: Number(assignment.batchId),
            isActive: assignment.isActive,
            createdAt: new Date(Number(assignment.createdAt) * 1000)
          });
        } catch (err) {
          console.error(`Failed to fetch assignment ${id}:`, err);
        }
      }
      
      console.log(`✅ Found ${assignments.length} assignments for batch ${batchId}`);
      return assignments;
    } catch (error) {
      console.error('Failed to get batch assignments:', error);
      return [];
    }
  }

  async getActiveAssignments(): Promise<any[]> {
    console.log('📚 Getting all active assignments from blockchain');
    
    try {
      // For now, return empty array as we need to implement proper active assignment fetching
      return [];
    } catch (error) {
      console.error('Failed to get active assignments:', error);
      return [];
    }
  }

  async getStudentSubmissions(studentAddress: string): Promise<any[]> {
    console.log('📝 Getting student submissions from blockchain for:', studentAddress);
    
    try {
      const submissionIds = await this.assignmentSubmission!.getStudentSubmissions(studentAddress);
      const submissions = [];
      
      for (const id of submissionIds) {
        try {
          const submission = await this.assignmentSubmission!.getSubmission(id);
          submissions.push({
            id: Number(submission.id),
            assignmentId: Number(submission.assignmentId),
            student: submission.student,
            fileName: submission.fileName,
            ipfsHash: submission.ipfsHash,
            submittedAt: new Date(Number(submission.submittedAt) * 1000),
            isGraded: submission.isGraded,
            grade: submission.grade,
            tokensAwarded: Number(submission.tokensAwarded),
            gradedBy: submission.gradedBy,
            gradedAt: submission.gradedAt ? new Date(Number(submission.gradedAt) * 1000) : null
          });
        } catch (err) {
          console.error(`Failed to fetch submission ${id}:`, err);
        }
      }
      
      return submissions;
    } catch (error) {
      console.error('Failed to get student submissions:', error);
      return [];
    }
  }

  async getTokenTransactions(userAddress: string): Promise<any[]> {
    console.log('💰 Getting token transactions from blockchain for:', userAddress);
    
    try {
      // Implementation for token transaction history
      return [];
    } catch (error) {
      console.error('Failed to get token transactions:', error);
      return [];
    }
  }

  async getNftRewards(userAddress: string): Promise<any[]> {
    console.log('🏆 Getting NFT rewards from blockchain for:', userAddress);
    
    try {
      // Implementation for NFT reward history
      return [];
    } catch (error) {
      console.error('Failed to get NFT rewards:', error);
      return [];
    }
  }

  async submitAssignment(
    assignmentId: number,
    ipfsHash: string,
    fileName: string,
    studentAddress: string
  ): Promise<{
    submissionId: number;
    transactionHash: string;
    blockNumber?: number;
    gasUsed?: string;
  }> {
    console.log('🔗 Submitting assignment to blockchain:', {
      assignmentId,
      ipfsHash,
      fileName,
      studentAddress
    });

    if (!this.signer) {
      throw new Error('Wallet not initialized. Call initializeWithWallet first.');
    }

    try {
      // Submit assignment to blockchain
      const tx = await this.assignmentSubmission!.submitAssignment(assignmentId, ipfsHash, fileName);
      console.log('📝 Submission transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Assignment submitted to blockchain');
      
      // Extract submission ID from events
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.assignmentSubmission!.interface.parseLog(log);
          return parsed?.name === 'AssignmentSubmitted';
        } catch {
          return false;
        }
      });
      
      let submissionId = 0;
      if (event) {
        const parsed = this.assignmentSubmission!.interface.parseLog(event);
        submissionId = Number(parsed?.args.submissionId || parsed?.args[0]);
        console.log('🎉 Submission created with ID:', submissionId);
      }

      return {
        submissionId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString()
      };
    } catch (error) {
      console.error('Failed to submit assignment to blockchain:', error);
      throw error;
    }
  }

  async getAssignmentsByIds(assignmentIds: number[]): Promise<any[]> {
    console.log('📚 Fetching assignments by IDs:', assignmentIds);
    const assignments = [];
    
    for (const id of assignmentIds) {
      try {
        const assignment = await this.assignmentSubmission!.getAssignment(id);
        assignments.push({
          id: Number(assignment.id),
          title: assignment.title,
          description: assignment.description,
          ipfsHash: assignment.ipfsHash,
          deadline: new Date(Number(assignment.deadline) * 1000),
          tokenReward: Number(assignment.tokenReward),
          teacher: assignment.teacher,
          batchId: Number(assignment.batchId),
          isActive: assignment.isActive,
          createdAt: new Date(Number(assignment.createdAt) * 1000)
        });
      } catch (err) {
        console.error(`Failed to fetch assignment ${id}:`, err);
      }
    }
    
    return assignments;
  }

  async getAssignmentSubmissions(assignmentId: number): Promise<any[]> {
    console.log('📝 Getting submissions for assignment:', assignmentId);
    
    try {
      const submissionIds = await this.assignmentSubmission!.getAssignmentSubmissions(assignmentId);
      const submissions = [];
      
      for (const id of submissionIds) {
        try {
          const submission = await this.assignmentSubmission!.getSubmission(id);
          submissions.push({
            id: Number(submission.id),
            assignmentId: Number(submission.assignmentId),
            student: submission.student,
            fileName: submission.fileName,
            ipfsHash: submission.ipfsHash,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${submission.ipfsHash}`,
            submittedAt: new Date(Number(submission.submittedAt) * 1000),
            isGraded: submission.isGraded,
            grade: submission.grade,
            tokensAwarded: Number(submission.tokensAwarded),
            gradedBy: submission.gradedBy,
            gradedAt: submission.gradedAt ? new Date(Number(submission.gradedAt) * 1000) : null
          });
        } catch (err) {
          console.error(`Failed to fetch submission ${id}:`, err);
        }
      }
      
      return submissions;
    } catch (error) {
      console.error('Failed to get assignment submissions:', error);
      return [];
    }
  }

  async createAssignment(
    title: string,
    description: string,
    ipfsHash: string,
    deadline: number,
    tokenReward: number,
    batchId: number,
    teacherAddress: string
  ): Promise<{ assignmentId: number; transactionHash: string }> {
    console.log('📝 Creating assignment on blockchain:', { title, batchId, teacherAddress });
    
    if (!this.signer) {
      throw new Error('Wallet not initialized. Call initializeWithWallet first.');
    }
    
    try {
      const tx = await this.assignmentSubmission!.createAssignment(
        title,
        description,
        ipfsHash,
        deadline,
        tokenReward,
        batchId
      );
      console.log('📝 Assignment creation transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Assignment created on blockchain');
      
      // Extract assignment ID from events
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.assignmentSubmission!.interface.parseLog(log);
          return parsed?.name === 'AssignmentCreated';
        } catch {
          return false;
        }
      });
      
      let assignmentId = 0;
      if (event) {
        const parsed = this.assignmentSubmission!.interface.parseLog(event);
        assignmentId = Number(parsed?.args.assignmentId || parsed?.args[0]);
        console.log('🎉 Assignment created with ID:', assignmentId);
      }
      
      return {
        assignmentId,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to create assignment on blockchain:', error);
      throw error;
    }
  }

  async gradeSubmission(submissionId: number, grade: string, teacherAddress: string): Promise<{ transactionHash: string }> {
    console.log('🎓 Grading submission:', { submissionId, grade, teacherAddress });
    
    if (!this.signer) {
      throw new Error('Wallet not initialized. Call initializeWithWallet first.');
    }
    
    try {
      const tx = await this.assignmentSubmission!.gradeSubmission(submissionId, grade);
      console.log('📝 Grading transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Grading confirmed:', receipt);
      
      return {
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to grade submission:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
