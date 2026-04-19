// ============================================================
// SINGLE SOURCE OF TRUTH — Contract Addresses, ABIs & Config
// Shared between server and client. Do NOT duplicate elsewhere.
// ============================================================

// --------------- Network Config ---------------

export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  chainIdHex: '0xaa36a7',
  name: 'Sepolia',
  currency: 'SepoliaETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2',
} as const;

// --------------- Contract Addresses ---------------
// Deployed on Sepolia — updated 2025-11-18

export const CONTRACT_ADDRESSES = {
  accessControl: '0xFB7c09E0d25577401cB98C9b29B0465243A97E5F',
  batchManagement: '0xddD637Fd04a8b14470Bcf3b78c683c1a87C99aB8',
  assignmentSubmission: '0xf39A62a69222ad7F51217AFedd46178e7926039d',
  tokenReward: '0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592',
} as const;

// --------------- Role Hashes ---------------

export const ROLE_HASHES = {
  ADMIN: '0x0000000000000000000000000000000000000000000000000000000000000000',
  // keccak256("TEACHER_ROLE")
  TEACHER: '0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1',
  // keccak256("STUDENT_ROLE")
  STUDENT: '0x4ac154c59aeccf1cda6066b8c82b3c636e46c8b0e25754efa9b15f8d0b100668',
} as const;

// --------------- ABIs ---------------

export const ACCESS_CONTROL_ABI = [
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function grantRole(bytes32 role, address account) external',
  'function revokeRole(bytes32 role, address account) external',
  'function registerTeacher(address teacher) external',
  'function registerStudent(address student) external',
  'function revokeTeacher(address teacher) external',
  'function revokeStudent(address student) external',
  'function isTeacher(address account) external view returns (bool)',
  'function isStudent(address account) external view returns (bool)',
  'function isAdmin(address account) external view returns (bool)',
  'function getUserRole(address account) external view returns (string memory)',
  'function getAllTeachers() external view returns (address[] memory)',
  'function getAllStudents() external view returns (address[] memory)',
  'function getRegistrationTime(address account) external view returns (uint256)',
  'event TeacherRegistered(address indexed teacher, address indexed admin)',
  'event StudentRegistered(address indexed student, address indexed admin)',
  'event RoleRevoked(bytes32 indexed role, address indexed account, address indexed admin)',
] as const;

export const BATCH_MANAGEMENT_ABI = [
  'function createBatch(string memory _name) external returns (uint256)',
  'function addStudentToBatch(uint256 _batchId, address _student) external',
  'function addMultipleStudentsToBatch(uint256 _batchId, address[] memory _students) external',
  'function removeStudentFromBatch(uint256 _batchId, address _student) external',
  'function renameBatch(uint256 _batchId, string memory _newName) external',
  'function deactivateBatch(uint256 _batchId) external',
  'function isStudentInBatch(address _student, uint256 _batchId) external view returns (bool)',
  'function getBatch(uint256 _batchId) external view returns (tuple(uint256 id, string name, address teacher, address[] students, bool isActive, uint256 createdAt, uint256 updatedAt))',
  'function getBatchStudents(uint256 _batchId) external view returns (address[] memory)',
  'function getTeacherBatches(address _teacher) external view returns (uint256[] memory)',
  'function getStudentBatches(address _student) external view returns (uint256[] memory)',
  'function getActiveTeacherBatches(address _teacher) external view returns (uint256[] memory)',
  'function getBatchStats(uint256 _batchId) external view returns (string memory name, address teacher, uint256 studentCount, uint256 createdAt, uint256 updatedAt)',
  'function getTotalBatches() external view returns (uint256)',
  'function verifyTeacherStudentBatch(address _teacher, address _student, uint256 _batchId) external view returns (bool)',
  'function batches(uint256) external view returns (uint256 id, string name, address teacher, bool isActive, uint256 createdAt, uint256 updatedAt)',
  'function nextBatchId() external view returns (uint256)',
  'event BatchCreated(uint256 indexed batchId, address indexed teacher, string name, uint256 timestamp)',
  'event StudentAddedToBatch(uint256 indexed batchId, address indexed student, address indexed teacher, uint256 timestamp)',
  'event StudentRemovedFromBatch(uint256 indexed batchId, address indexed student, address indexed teacher, uint256 timestamp)',
  'event BatchDeactivated(uint256 indexed batchId, address indexed teacher, uint256 timestamp)',
  'event BatchRenamed(uint256 indexed batchId, string oldName, string newName, address indexed teacher, uint256 timestamp)',
] as const;

export const ASSIGNMENT_SUBMISSION_ABI = [
  // Assignment CRUD
  'function createAssignment(string memory _title, string memory _description, string memory _ipfsHash, uint256 _deadline, uint256 _tokenReward, uint256 _batchId) external returns (uint256)',
  'function getAssignment(uint256 _assignmentId) external view returns (tuple(uint256 id, string title, string description, string ipfsHash, uint256 deadline, uint256 tokenReward, address teacher, uint256 batchId, bool isActive, uint256 createdAt))',
  'function getTeacherAssignments(address _teacher) external view returns (uint256[] memory)',
  'function getStudentAvailableAssignments(address _student) external view returns (uint256[] memory)',
  'function getBatchAssignments(uint256 _batchId) external view returns (uint256[] memory)',
  'function deactivateAssignment(uint256 _assignmentId) external',
  'function getTotalAssignments() external view returns (uint256)',
  // Submission
  'function submitAssignment(uint256 _assignmentId, string memory _fileName, string memory _ipfsHash) external returns (uint256)',
  'function getSubmission(uint256 _submissionId) external view returns (tuple(uint256 id, uint256 assignmentId, address student, string fileName, string ipfsHash, uint256 submittedAt, bool isGraded, string grade, uint256 tokensAwarded, address gradedBy, uint256 gradedAt))',
  'function getStudentSubmissions(address _student) external view returns (uint256[] memory)',
  'function getAssignmentSubmissions(uint256 _assignmentId) external view returns (uint256[] memory)',
  'function hasStudentSubmitted(uint256 _assignmentId, address _student) external view returns (bool)',
  'function getTotalSubmissions() external view returns (uint256)',
  // Grading
  'function gradeSubmission(uint256 _submissionId, string memory _grade) external',
  // Events
  'event AssignmentCreated(uint256 indexed assignmentId, address indexed teacher, string title, uint256 deadline, uint256 tokenReward)',
  'event AssignmentSubmitted(uint256 indexed submissionId, uint256 indexed assignmentId, address indexed student, string fileName, string ipfsHash)',
  'event SubmissionGraded(uint256 indexed submissionId, address indexed teacher, string grade, uint256 tokensAwarded)',
  'event AssignmentDeactivated(uint256 indexed assignmentId, address indexed teacher)',
] as const;

export const TOKEN_REWARD_ABI = [
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)',
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function awardTokens(address _student, uint256 _assignmentId, uint256 _batchId, uint256 _baseAmount, string memory _grade) external',
  'function awardBonusTokens(address _student, uint256 _amount, string memory _reason) external',
  'function burnTokens(address _student, uint256 _amount, string memory _reason) external',
  'function getAssignmentEarnings(address _student, uint256 _assignmentId) external view returns (uint256)',
  'function getStudentAssignments(address _student) external view returns (uint256[] memory)',
  'function getTotalEarnings(address _student) external view returns (uint256)',
  'function getStudentTransactions(address _student) external view returns (uint256[] memory)',
  'function getTransaction(uint256 _transactionId) external view returns (tuple(address student, uint256 assignmentId, uint256 amount, string grade, address awardedBy, uint256 timestamp, string transactionType))',
  'function getTotalTransactions() external view returns (uint256)',
  'function getGradeMultiplier(string memory _grade) external view returns (uint256)',
  'function updateGradeMultiplier(string memory _grade, uint256 _multiplier) external',
  'function areTransfersEnabled() external view returns (bool)',
  'function setTransfersEnabled(bool _enabled) external',
  'event TokensAwarded(address indexed student, uint256 indexed assignmentId, uint256 amount, string grade, address indexed awardedBy)',
  'event TokensBurned(address indexed student, uint256 amount, string reason)',
  'event GradeMultiplierUpdated(string grade, uint256 multiplier)',
] as const;

// --------------- TypeScript Types ---------------

export interface BatchData {
  id: number;
  name: string;
  teacher: string;
  students: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentData {
  id: number;
  title: string;
  description: string;
  ipfsHash: string;
  deadline: Date;
  tokenReward: number;
  teacher: string;
  batchId: number;
  isActive: boolean;
  createdAt: Date;
}

export interface SubmissionData {
  id: number;
  assignmentId: number;
  student: string;
  fileName: string;
  ipfsHash: string;
  submittedAt: Date;
  isGraded: boolean;
  grade: string;
  tokensAwarded: number;
  gradedBy: string;
  gradedAt: Date | null;
}

export interface TokenTransactionData {
  student: string;
  assignmentId: number;
  amount: number;
  grade: string;
  awardedBy: string;
  timestamp: Date;
  transactionType: string;
}

// --------------- Helpers ---------------

export function getContractAddress(name: keyof typeof CONTRACT_ADDRESSES): string {
  return CONTRACT_ADDRESSES[name];
}

export function isValidEthAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}
