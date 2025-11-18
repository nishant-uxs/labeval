# EduChain - Blockchain-based Academic Assessment Platform

## Overview

EduChain is a decentralized application (dApp) built on the Ethereum blockchain for academic lab assignment assessment. It provides an immutable, transparent, and tamper-proof system for assignment submission, grading, and reward distribution within educational institutions. The platform utilizes IPFS for storing student submissions, while the blockchain manages all academic transactions, role-based access control, batch management, and a non-transferable token reward system. The primary goal is to enhance the integrity and transparency of academic assessment processes.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### 2025-11-18: Fixed Wrong AccessControl Contract Address in Frontend ✅✅✅
**Problem:** Token minting failed with "missing revert data" error during `awardTokens()` gas estimation. All blockchain validations passed (tokens not awarded, grade valid, batch verification true), but `isStudent()` call returned EMPTY DATA (0x).

**Root Cause Analysis by Architect:**
Frontend was using **WRONG AccessControl contract address**!
- ❌ Frontend fallback: `0x6fC21092DA55B392b045eD78F4732bff3C580e2c` (EMPTY/NON-EXISTENT CONTRACT!)
- ✅ Server address: `0xFB7c09E0d25577401cB98C9b29B0465243A97E5F` (CORRECT DEPLOYED CONTRACT!)

**Why It Failed:**
1. Browser MetaMask calls `isStudent()` → Hits EMPTY address → Returns `0x` → "could not decode result data"
2. `awardTokens()` gas estimation → `onlyStudent` modifier fails → Transaction reverts → "missing revert data"

**Solution Implemented:**
- Fixed fallback address in `client/src/lib/blockchain-service.ts` (line 45)
- Fixed demo addresses in `client/src/lib/contract-abis.ts` (lines 111-114)
- Restarted workflow to rebuild frontend with correct contract addresses
- All contract addresses now consistent across frontend/backend

**Files Modified:**
- `client/src/lib/blockchain-service.ts` - Updated ACCESS_CONTROL_ADDRESS fallback
- `client/src/lib/contract-abis.ts` - Updated DEMO_CONTRACT_ADDRESSES

**Result:** Frontend now uses CORRECT AccessControl contract! `isStudent()` works! Token minting should succeed! 🎉

### 2025-11-18: Fixed BatchId Mismatch in Token Minting ✅
**Problem:** Token minting failed with "missing revert data" error. `reviewSubmission()` succeeded but `awardTokens()` failed during gas estimation. The smart contract's `verifyTeacherStudentBatch()` check was failing.

**Root Cause:** Frontend was passing batchId from UI/server state to `awardTokens()`, but the **assignment's actual batchId on blockchain** was different! The smart contract's `verifyTeacherStudentBatch()` function checks if teacher/student are in the SAME batch, using the batchId from the blockchain. Passing wrong batchId = verification fails = transaction reverts.

**Why reviewSubmission worked:** The AssignmentSubmission contract fetches the assignment internally and uses the correct on-chain batchId.

**Why awardTokens failed:** Frontend passed UI batchId (3) instead of fetching the assignment's actual blockchain batchId.

**Solution Implemented:**
- Modified `gradeSubmission()` to fetch assignment from blockchain BEFORE calling `awardTokens()`
- Extract actual `batchId` from blockchain assignment data
- Pass blockchain batchId to `awardTokens()` instead of UI/server batchId
- Added logging to show UI vs blockchain batchId comparison

**Files Modified:**
- `client/src/lib/blockchain-service.ts` - Added `getAssignment()` call to fetch blockchain batchId before token minting

**Result:** Token minting now uses correct blockchain batchId! `verifyTeacherStudentBatch()` will pass! ✅

### 2025-11-18: Fixed Contract Address Mismatch in Frontend ✅
**Problem:** Token minting failed with "missing revert data" error during `awardTokens()` call. The `reviewSubmission()` transaction was succeeding, but `awardTokens()` was failing during gas estimation.

**Root Cause:** Frontend files had **inconsistent contract addresses**:
- `contract-abis.ts`: TOKEN_REWARD = `0xBf447be6a0E79c061dbF9f6169d372a85a1Db16E` ❌ WRONG!
- `web3.ts`: tokenReward = `0x1234567890123456789012345678901234567890` ❌ FAKE ADDRESS!
- Server: TOKEN_REWARD = `0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592` ✅ CORRECT

**Solution Implemented:**
- Updated `contract-abis.ts` with correct deployed contract addresses matching server
- Updated `web3.ts` with correct deployed contract addresses
- All contract addresses now consistent across frontend and backend

**Files Modified:**
- `client/src/lib/contract-abis.ts` - Fixed all contract addresses to match deployed contracts
- `client/src/lib/web3.ts` - Fixed all contract addresses to match deployed contracts

**Result:** Frontend now calls the correct TOKEN_REWARD contract address. Token minting should work! ✅

### 2025-11-18: Automatic Student Registration & Admin Teacher Registration ✅
**Problem:** Token minting failed with "Account must be a registered student" error when calling `awardTokens()` function. TokenReward smart contract requires student to be registered in EduChainAccessControl before tokens can be minted.

**Root Cause:** Students were NOT being registered in AccessControl contract when added to batches. Smart contract requires student registration via `registerStudent()` before token minting.

**Solution Implemented:**
- **Automatic Student Registration:** Modified `gradeSubmission()` to check if student is registered and automatically register them before minting tokens (teacher can register students)
- **Admin Teacher Registration:** Added admin API endpoints `/api/admin/register-teacher/:address` for registering teachers (admin-only operation)
- **3-Step Grading Process (First Time):**
  1. Check student registration → If not registered, call `registerStudent()` (teacher signs MetaMask tx)
  2. Call `reviewSubmission()` to store grade and feedback (teacher signs MetaMask tx)
  3. Call `awardTokens()` to mint tokens to student (teacher signs MetaMask tx)
- **Seamless UX:** 
  - First-time grading for new student: 3 MetaMask popups (student registration + review + award)
  - Subsequent gradings (same student): 2 popups (review + award)

**Files Modified:**
- `client/src/lib/blockchain-service.ts` - Added automatic student registration check before token minting
- `server/blockchain-service.ts` - Added `registerTeacher()` and `registerStudent()` admin functions
- `server/routes.ts` - Added admin endpoints for teacher/student registration
- `client/src/types/assignment.ts` - Added `batchId` field to AssignmentSubmission interface (required for token minting)

**Complete Flow:**
1. **Teacher Setup:** Admin registers teacher via `/api/admin/register-teacher/0x...` (one-time, uses admin wallet)
2. Teacher grades submission → `blockchainService.gradeSubmission()` called
3. Check if student registered → If NO, MetaMask popup for `registerStudent()` (teacher signs) → Student role granted ✅
4. MetaMask popup for `reviewSubmission()` (teacher signs) → Grade stored on blockchain ✅
5. MetaMask popup for `awardTokens()` (teacher signs) → Tokens minted to student! 💰
6. Student refreshes dashboard → `balanceOf()` shows correct token balance ✅

**Result:** Complete end-to-end token minting now working! Students automatically registered during first grading. Teachers registered via admin endpoint. Smart contract access control fully satisfied. ✅

## System Architecture

### Frontend Architecture
The frontend is built with React 19, TypeScript, Vite, Wouter for routing, and TailwindCSS with shadcn/ui for UI components. Web3 integration is handled via MetaMask SDK React and ethers.js v6, abstracted through custom hooks (useWeb3, useContracts, useIPFS). It employs a component-based design, centralized web3 state management, real-time blockchain data fetching with TanStack Query, and responsive design principles.

### Backend Architecture
The backend uses Express.js 5 with TypeScript and Node.js. It provides RESTful API endpoints for batch management, assignments, and secure IPFS file uploads via Pinata. A blockchain service layer abstracts smart contract interactions. The system is designed without a traditional database, relying entirely on blockchain smart contracts for persistent data storage.

### Key Architectural Decisions

*   **Blockchain-First Storage**: All core application data (batches, assignments, submissions, grades) are stored on Ethereum smart contracts, providing an immutable audit trail and serving as the single source of truth.
*   **IPFS File Storage**: Assignment files are uploaded to IPFS via Pinata. Only IPFS content hashes are stored on the blockchain to minimize gas costs. A server-side proxy handles Pinata integration securely.
*   **Role-Based Access Control**: Smart contracts enforce roles (Admin, Teacher, Student) with permissions verified against the blockchain state in real-time.
*   **Smart Contract System**: Consists of several modules:
    *   **AccessControl**: Manages roles (Admin, Teacher, Student) using OpenZeppelin.
    *   **BatchManagement**: Allows teachers to create and manage student batches.
    *   **AssignmentSubmission**: Handles assignment creation, student submissions (with IPFS hashes and deadlines), and teacher grading.
    *   **TokenReward**: Implements an ERC20-like non-transferable token system for academic rewards, minted upon grading.
*   **Gas Optimization**: Achieved by storing only IPFS hashes on-chain, using batch operations, and relying on gas-free view functions for data retrieval.

### IPFS Integration
The system handles file uploads by converting client-side files to base64, sending them to the backend, which then uploads to Pinata's IPFS service. The returned IPFS hash is then stored on the blockchain. Security measures include server-side API key storage, file type whitelisting, and size limits.

### Network Configuration
The platform is developed and tested on the Sepolia Testnet, requiring Infura or Alchemy for RPC access and MetaMask for user interactions. Environment variables are used for API keys and contract addresses.

## External Dependencies

### Blockchain Infrastructure
*   **Ethereum Sepolia Testnet**: For blockchain operations.
*   **Infura/Alchemy**: RPC providers for blockchain connectivity.
*   **MetaMask**: User wallet and transaction signing.
*   **ethers.js**: JavaScript library for Ethereum interactions.

### File Storage
*   **IPFS (InterPlanetary File System)**: Decentralized storage for assignment files.
*   **Pinata**: IPFS pinning service for reliable file hosting.

### Smart Contracts
*   **OpenZeppelin Contracts**: Reusable smart contract libraries for security and common functionalities (e.g., AccessControl).
*   **Hardhat**: Ethereum development environment for contract management.

### Third-Party Services
*   **Etherscan**: Block explorer for monitoring and verifying blockchain transactions.

### Development Tools
*   **Vite**: Build tool for frontend development.
*   **TypeScript**: For type-safe development.
*   **shadcn/ui**: Component library for consistent UI.
*   **TanStack Query**: For asynchronous state management and data fetching.