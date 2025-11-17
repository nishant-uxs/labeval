// Contract addresses - using proper format from web3.ts
export const CONTRACT_ADDRESSES = {
  assignmentSubmission: import.meta.env.VITE_ASSIGNMENT_SUBMISSION_CONTRACT || '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  tokenReward: import.meta.env.VITE_TOKEN_REWARD_CONTRACT || '0xBf447be6a0E79c061dbF9f6169d372a85a1Db16E',
  nftReward: import.meta.env.VITE_NFT_REWARD_CONTRACT || '0x2345678901234567890123456789012345678901',
  deadlineManager: import.meta.env.VITE_DEADLINE_MANAGER_CONTRACT || '0x3456789012345678901234567890123456789012',
  accessControl: import.meta.env.VITE_ACCESS_CONTROL_CONTRACT || '0x6fC21092DA55B392b045eD78F4732bff3C580e2c',
  batchManagement: import.meta.env.VITE_BATCH_MANAGEMENT_CONTRACT || '0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66'
};

// Sepolia testnet configuration
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  name: "Sepolia",
  currency: "SepoliaETH",
  explorerUrl: "https://sepolia.etherscan.io",
  rpcUrl: `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`
};

// Contract ABIs - REAL ASSIGNMENT SUBMISSION FUNCTIONS
export const ASSIGNMENT_SUBMISSION_ABI = [
  // Assignment Creation (Teacher)
  "function createAssignment(string memory _title, string memory _description, string memory _ipfsHash, uint256 _deadline, uint256 _tokenReward, uint256 _batchId) external returns (uint256)",
  "function getAssignment(uint256 _assignmentId) external view returns (tuple(uint256 id, string title, string description, string ipfsHash, uint256 deadline, uint256 tokenReward, address teacher, uint256 batchId, bool isActive, uint256 createdAt))",
  "function getTeacherAssignments(address _teacher) external view returns (uint256[] memory)",
  "function getStudentAvailableAssignments(address _student) external view returns (uint256[] memory)",
  "function getBatchAssignments(uint256 _batchId) external view returns (uint256[] memory)",
  
  // Assignment Submission (Student)
  "function submitAssignment(uint256 _assignmentId, string memory _fileName, string memory _ipfsHash) external returns (uint256)",
  "function getSubmission(uint256 _submissionId) external view returns (tuple(uint256 id, uint256 assignmentId, address student, string fileName, string ipfsHash, uint256 submittedAt, bool isGraded, string grade, uint256 tokensAwarded, address gradedBy, uint256 gradedAt))",
  "function getStudentSubmissions(address _student) external view returns (uint256[] memory)",
  "function getAssignmentSubmissions(uint256 _assignmentId) external view returns (uint256[] memory)",
  "function hasStudentSubmitted(uint256 _assignmentId, address _student) external view returns (bool)",
  
  // Assignment Review (Teacher)
  "function gradeSubmission(uint256 _submissionId, string memory _grade) external",
  "function updateAssignment(uint256 _assignmentId, string memory _title, string memory _description, uint256 _deadline, uint256 _tokenReward) external",
  "function deactivateAssignment(uint256 _assignmentId) external",
  
  // Events
  "event AssignmentCreated(uint256 indexed assignmentId, address indexed teacher, string title, uint256 deadline, uint256 tokenReward)",
  "event AssignmentSubmitted(uint256 indexed submissionId, uint256 indexed assignmentId, address indexed student, string fileName, string ipfsHash)",
  "event SubmissionGraded(uint256 indexed submissionId, address indexed teacher, string grade, uint256 tokensAwarded)"
];

export const TOKEN_REWARD_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function issueTokens(address student, uint256 amount, string memory reason) external",
  "function getTokenHistory(address student) external view returns (tuple(uint256 amount, string reason, uint256 timestamp, address issuer)[] memory)",
  "function totalSupply() external view returns (uint256)",
  "event TokensIssued(address indexed student, uint256 amount, string reason, address indexed issuer)"
];

export const NFT_REWARD_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function issueNFT(address student, string memory metadataURI, string memory achievement) external returns (uint256)",
  "function getNFTHistory(address student) external view returns (tuple(uint256 tokenId, string achievement, uint256 timestamp, address issuer)[] memory)",
  "event NFTIssued(address indexed student, uint256 indexed tokenId, string achievement, address indexed issuer)"
];

export const BATCH_MANAGEMENT_ABI = [
  "function createBatch(string memory _name) external returns (uint256)",
  "function addStudentToBatch(uint256 _batchId, address _student) external",
  "function removeStudentFromBatch(uint256 _batchId, address _student) external",
  "function deactivateBatch(uint256 _batchId) external", 
  "function getActiveTeacherBatches(address _teacher) external view returns (uint256[] memory)",
  "function getBatch(uint256 _batchId) external view returns (uint256 id, string memory name, address teacher, address[] memory students, bool isActive, uint256 createdAt, uint256 updatedAt)",
  "function getBatchStudents(uint256 _batchId) external view returns (address[] memory)",
  "function isStudentInBatchView(address _student, uint256 _batchId) external view returns (bool)",
  "function nextBatchId() external view returns (uint256)",
  "function batches(uint256) external view returns (uint256 id, string memory name, address teacher, bool isActive, uint256 createdAt, uint256 updatedAt)",
  "function teacherBatches(address, uint256) external view returns (uint256)",
  "function isStudentInBatch(uint256, address) external view returns (bool)",
  
  // Events  
  "event BatchCreated(uint256 indexed batchId, address indexed teacher, string name, uint256 timestamp)",
  "event StudentAddedToBatch(uint256 indexed batchId, address indexed student, uint256 timestamp)",
  "event StudentRemovedFromBatch(uint256 indexed batchId, address indexed student, uint256 timestamp)"
];

// Role definitions
export const ROLES = {
  DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000",
  TEACHER_ROLE: "0x89b2932ad0acbb3a85d8c3a1fbc9c71cbf8d01a7b0b2b73dd5b05acdf9eee4f6", // keccak256("TEACHER_ROLE")
  STUDENT_ROLE: "0x88a6833f1eaab81cfb5b8e16fe69a58fbb39e0c94e9b64b91a53d07d1b84598b"  // keccak256("STUDENT_ROLE")
};

// Contract service for blockchain interactions
export const contractService = {
  // Mock implementations for development - these will be replaced with actual contract calls
  async getUserRole(address: string): Promise<'student' | 'teacher' | 'admin'> {
    // For development, return 'student' as default
    return 'student';
  },

  async getTokenBalance(address: string): Promise<number> {
    // Mock token balance
    return 0;
  },

  async getNFTCount(address: string): Promise<number> {
    // Mock NFT count
    return 0;
  },

  async submitAssignment(ipfsHash: string, title: string, description: string): Promise<string> {
    // Mock transaction hash
    return '0x1234567890abcdef';
  },

  async reviewSubmission(submissionId: number, grade: number, issueToken: boolean, issueNFT: boolean): Promise<string> {
    // Mock transaction hash
    return '0x1234567890abcdef';
  },

  async issueTokens(studentAddress: string, amount: number, reason: string): Promise<string> {
    // Mock transaction hash
    return '0x1234567890abcdef';
  },

  async issueNFT(studentAddress: string, metadataURI: string, achievement: string): Promise<string> {
    // Mock transaction hash
    return '0x1234567890abcdef';
  },

  async grantTeacherRole(address: string): Promise<string> {
    // Mock transaction hash
    return '0x1234567890abcdef';
  },

  async revokeTeacherRole(address: string): Promise<string> {
    // Mock transaction hash
    return '0x1234567890abcdef';
  },

  async getSubmissions(studentAddress?: string): Promise<any[]> {
    // Mock submissions data
    return [];
  },

  async getTokenHistory(address: string): Promise<any[]> {
    // Mock token history
    return [];
  },

  async getNFTHistory(address: string): Promise<any[]> {
    // Mock NFT history
    return [];
  }
};