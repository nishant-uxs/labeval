# EduChain Smart Contract Deployment Summary

## Network Information
- **Network**: Ethereum Sepolia Testnet
- **Chain ID**: 11155111
- **Deployment Date**: November 17, 2025
- **Deployer Address**: 0xc39d22dC2d0A3Ca341CE8F69EFA563D113607688

## Deployed Contracts

### AccessControl Contract
- **Address**: `0xFB7c09E0d25577401cB98C9b29B0465243A97E5F`
- **Purpose**: Role-based access control (Admin, Teacher, Student roles)
- **Key Functions**:
  - `registerTeacher(address)` - Admin registers teachers
  - `registerStudent(address)` - Students can self-register
  - `hasRole(bytes32, address)` - Check role membership
  - `isTeacher(address)` / `isStudent(address)` - Role verification

### BatchManagement Contract  
- **Address**: `0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66`
- **Purpose**: Manage student batches/classes
- **Status**: Pre-existing, verified working
- **Key Functions**:
  - `createBatch(string)` - Teachers create batches
  - `addStudentToBatch(uint256, address)` - Add students to batch
  - `getBatch(uint256)` - Retrieve batch details
  - `getTeacherBatches(address)` - Get teacher's batches

### AssignmentSubmission Contract
- **Address**: `0xbbe560e255f469B2D5FD52e003e79166eb1aDe10`
- **Purpose**: Assignment lifecycle (creation, submission, grading)
- **Key Functions**:
  - `createAssignment(...)` - Teachers create assignments with IPFS hash
  - `submitAssignment(uint256, string, string)` - Students submit via IPFS
  - `gradeSubmission(uint256, string)` - Teachers grade submissions
  - `getAssignment(uint256)` - Retrieve assignment details
  - `getSubmission(uint256)` - Retrieve submission details

### TokenReward Contract
- **Address**: `0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592`
- **Purpose**: ERC20 token rewards for graded assignments
- **Key Functions**:
  - `balanceOf(address)` - Check token balance
  - `totalSupply()` - Total tokens in circulation
  - `grantGraderRole(address)` - Grant grading permissions

## Configuration Files Updated

### Frontend Configuration
- **File**: `client/src/lib/contracts.ts`
- Updated contract addresses for all 4 contracts
- Ensures MetaMask connects to correct deployed contracts

### Backend Configuration  
- **File**: `server/blockchain-service.ts`
- Updated contract addresses for backend read operations
- Initialized with Alchemy RPC provider

### Environment Variables
- **File**: `.env`
- Added all contract addresses with `VITE_` prefix for frontend
- Added contract addresses for backend server
- Configured Pinata API keys for IPFS integration

## Architecture Overview

### Write Operations (Frontend with MetaMask)
- Assignment Creation → MetaMask transaction
- Assignment Submission → MetaMask transaction  
- Assignment Grading → MetaMask transaction
- All mutations stored on blockchain

### Read Operations (Backend)
- Fetch assignments from blockchain
- Fetch batches from blockchain
- Fetch submissions from blockchain
- Query token balances

### IPFS Integration (Pinata)
- Assignment files stored on IPFS
- Submission files stored on IPFS
- Only IPFS hashes stored on blockchain
- Real file content retrieved from Pinata gateway

## Test Accounts

### Teacher Account
- **Address**: 0xc39d22dC2d0A3Ca341CE8F69EFA563D113607688
- **Role**: TEACHER_ROLE granted
- **Can**: Create assignments, grade submissions, manage batches

### Student Account
- **Address**: 0x31d05d7a6130f3e8b149008ec70090022f9c9330
- **Role**: STUDENT_ROLE
- **Can**: Submit assignments, view grades, earn tokens

## Verification

All contracts successfully deployed and initialized:
✅ AccessControl - Role system active
✅ BatchManagement - Working (pre-existing)
✅ AssignmentSubmission - Connected to other contracts
✅ TokenReward - Reward mechanism ready

## Next Steps for Testing

1. **Create Batch**: Teacher creates a batch using MetaMask
2. **Create Assignment**: Teacher creates assignment with IPFS file
3. **Submit Assignment**: Student submits solution via IPFS
4. **Grade Submission**: Teacher grades and awards tokens
5. **Verify Tokens**: Check student token balance on blockchain

## Important Notes

- NO mock data - all operations interact with real smart contracts
- NO local storage - all data stored on Sepolia blockchain
- Frontend requires MetaMask for write operations
- Backend uses read-only provider for queries
- Gas fees required for all write transactions (teacher/student pays)
- IPFS files permanently stored on Pinata

## Smart Contract Source Code

All contract source code available in:
- `contracts/AccessControl.sol`
- `contracts/BatchManagement.sol`  
- `contracts/AssignmentSubmission.sol`
- `contracts/TokenReward.sol`

## Deployment Script

Deployment automated via: `scripts/deploy-new.cjs`

## Block Explorer Links

View contracts on Sepolia Etherscan:
- AccessControl: https://sepolia.etherscan.io/address/0xFB7c09E0d25577401cB98C9b29B0465243A97E5F
- AssignmentSubmission: https://sepolia.etherscan.io/address/0xbbe560e255f469B2D5FD52e003e79166eb1aDe10
- TokenReward: https://sepolia.etherscan.io/address/0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592
- BatchManagement: https://sepolia.etherscan.io/address/0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66
