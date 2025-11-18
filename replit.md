# EduChain - Blockchain-based Academic Assessment Platform

## Overview

EduChain is a decentralized application (dApp) for academic lab assignment assessment built on Ethereum blockchain. The platform provides immutable, transparent, and tamper-proof assignment submission, grading, and reward distribution for educational institutions. Students submit assignments via IPFS storage, teachers review and grade submissions, and non-transferable tokens are awarded as academic rewards. The system features role-based access control, batch management for student grouping, and comprehensive blockchain verification for all academic transactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### 2025-11-18: Assignment Review System Data Fetching Fixed ✅
**Problem:** Review & Grade page showed "No pending submissions" despite backend confirming submissions existed. Frontend failed to display blockchain data.

**Root Cause:** Field name mismatch between blockchain API response and frontend transformation code:
- API returned `student` field → Frontend expected `studentAddress`
- API returned `submittedAt` field → Frontend expected `createdAt` 
- API returned `isGraded` field → Frontend expected `grade` for status check

**Solution:**
- **Fixed Field Mapping:** Updated AssignmentReviewSystem component to match blockchain service API response structure
- **Corrected Field Names:**
  - `apiSub.student` → `studentAddress` (was looking for `apiSub.studentAddress`)
  - `apiSub.submittedAt` → `submittedAt` (was looking for `apiSub.createdAt`)
  - `apiSub.isGraded` → status check (was checking `apiSub.grade` directly)
  - `apiSub.ipfsUrl` → used directly (was reconstructing URL unnecessarily)
- **Added Loading State:** Spinner displays while fetching batches → assignments → submissions
- **Enhanced Error Logging:** Console logs track fetch flow and show detailed error messages
- **Real Data Flow:** 
  1. Fetch teacher's batches from blockchain
  2. Fetch all assignments for each batch
  3. Fetch all submissions for each assignment  
  4. Transform API data to component format
  5. Display submissions in Pending/Approved/Rejected tabs

**Files Modified:**
- `client/src/components/teacher/AssignmentReviewSystem.tsx` - Fixed API field mapping, added real data fetching

**Result:** Review & Grade page now correctly displays all submissions from blockchain. Teachers can see pending assignments (Campus Biites[1].pdf) and grade them. ✅

### 2025-11-18: Dashboard Integration & Edge Case Handling ✅
**Problem:** StudentDashboard used old FileUpload component (IPFS-only), and TeacherDashboard had multiple edge case issues with missing/malformed data.

**Issues Fixed:**

**StudentDashboard:**
- Swapped FileUpload → EnhancedFileUpload component for complete submission flow
- Students can now submit assignments with both IPFS upload AND blockchain transaction
- MetaMask transaction signing working correctly

**TeacherDashboard:**
- **Race Condition:** Changed verification guard from `=== false` to `!== true` to wait for role verification before fetching data
- **Timestamp Handling:** Added `parseSubmissionTimestamp()` helper function
  - Validates timestamps using `isNaN()` check
  - Returns 0 for invalid/missing timestamps with warning log
  - Keeps ALL submissions in list (no data loss)
  - Sorts valid timestamps first (most recent), invalid to end
- **Rendering Fallbacks:**
  - Student name: `studentName` → `studentAddress` → "Unknown Student"
  - Filename: `fileName` → "No filename"
  - Timestamp: valid date → formatted string | "Timestamp unavailable"
  - Status: grade exists → "Graded" | "Pending Review"
- **Individual Error Handling:** Each API call has separate error handler preventing cascade failures
- **Comprehensive Logging:** Console logs for debugging data fetch process

**Files Modified:**
- `client/src/components/student/StudentDashboard.tsx` - Uses EnhancedFileUpload
- `client/src/components/teacher/TeacherDashboard.tsx` - Production-ready with all edge cases handled

**Result:** Both dashboards now display real blockchain data with robust error handling. Teachers see ALL submissions including legacy records with malformed data.

### 2025-11-18: Assignment Submission Flow Fixed ✅
**Problem:** Students could not submit assignments - backend was trying to submit blockchain transactions without wallet initialization.

**Root Cause:** Backend was attempting to submit both IPFS upload AND blockchain transaction, but lacked student's private key (security issue).

**Solution:**
- **Backend:** Now handles ONLY IPFS file uploads via Pinata - returns IPFS hash to frontend
- **Frontend:** MetaMask handles ALL blockchain transactions using student's wallet signature
- **Body Parser:** Increased limit to 50MB for large file uploads (files encoded as base64)
- **Correct Flow:** 
  1. Student selects file and assignment
  2. Frontend converts file to base64 and sends to backend `/api/assignments/:id/submit`
  3. Backend uploads file to IPFS (Pinata) and returns IPFS hash
  4. Frontend receives hash and submits blockchain transaction via MetaMask
  5. Student signs transaction with their wallet
  6. Assignment recorded on-chain with IPFS hash
  7. Teacher can now see submission and grade it

**Files Modified:**
- `server/index.ts` - Increased body parser limit to 50MB
- `server/routes.ts` - Removed backend blockchain submission, return IPFS hash only
- `client/src/components/student/EnhancedFileUpload.tsx` - Updated to use backend for IPFS, MetaMask for blockchain

**Security:** Student's private key never exposed to backend; all blockchain writes require student wallet signature.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 19 with TypeScript for type-safe component development
- Vite as build tool for fast development and optimized production builds
- Wouter for lightweight client-side routing
- TailwindCSS with shadcn/ui component library for consistent UI design
- TanStack Query for server state management and data fetching

**Web3 Integration:**
- MetaMask SDK React for wallet connection and transaction signing
- ethers.js v6 for blockchain interactions and smart contract communication
- Custom hooks (useWeb3, useContracts, useIPFS) for blockchain functionality abstraction

**Design Decisions:**
- Component-based architecture with reusable UI components from shadcn/ui
- Centralized web3 state management through custom hooks reducing prop drilling
- Real-time blockchain data fetching with automatic invalidation via TanStack Query
- Responsive design prioritizing mobile and desktop experiences equally

### Backend Architecture

**Technology Stack:**
- Express.js 5 with TypeScript for API endpoints
- Node.js runtime with ESM module support
- tsx for TypeScript execution in development

**API Design:**
- RESTful endpoints for batch management, assignments, and file uploads
- IPFS file upload proxy endpoints to handle Pinata integration securely
- Blockchain service layer abstracting smart contract interactions
- No traditional database - all persistent data stored on blockchain smart contracts

**Key Architectural Decisions:**

*Blockchain-First Storage:*
- All application data (batches, assignments, submissions, grades) stored on Ethereum smart contracts
- Eliminates need for centralized database reducing single points of failure
- Immutable audit trail for all academic transactions and grades
- Smart contracts act as source of truth for role verification and permissions

*IPFS File Storage:*
- Assignment files uploaded to IPFS (InterPlanetary File System) via Pinata
- Only IPFS content hashes stored on blockchain minimizing gas costs
- Server-side upload proxy protects API keys from client exposure
- Mock mode for development when Pinata credentials unavailable

*Role-Based Access Control:*
- Smart contract enforced roles (Admin, Teacher, Student)
- Admin grants teacher roles on-chain; students self-register
- All permissions verified against blockchain state not local storage
- Teacher verification happens real-time before sensitive operations

### Smart Contract System

**Contract Modules:**

*AccessControl Contract (0xFB7c09E0d25577401cB98C9b29B0465243A97E5F):*
- OpenZeppelin AccessControl for role management
- Roles: DEFAULT_ADMIN_ROLE, TEACHER_ROLE, STUDENT_ROLE
- Admin can grant/revoke teacher roles; students self-register
- Role verification methods used by other contracts for permissions

*BatchManagement Contract (0xddD637Fd04a8b14470Bcf3b78c683c1a87C99aB8):* **UPDATED 2025-11-18**
- Teachers create batches (classes/groups) for student organization
- Batch-student relationship tracking on-chain
- Only batch creators can manage their batches
- Students can be in multiple batches simultaneously
- **Fixed:** Added `getBatchTeacher()` and `isBatchActive()` helper functions for external contract calls

*AssignmentSubmission Contract (0xf39A62a69222ad7F51217AFedd46178e7926039d):* **UPDATED 2025-11-18**
- Teachers create assignments with IPFS hash, deadline, token reward, batch ID
- Students submit via IPFS hash with filename and timestamp
- Deadline enforcement prevents late submissions
- Teachers grade submissions triggering token rewards
- Complete submission history stored on-chain
- **Fixed:** Updated batch ownership validation to use simplified helper functions avoiding struct decoding issues

*TokenReward Contract (0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592):*
- ERC20-like non-transferable token system
- Tokens minted only when teachers grade assignments
- Transfer locks prevent student-to-student token trading
- Maintains academic integrity by preventing token markets

**Contract Interaction Flow:**
1. Admin deploys all contracts and grants initial permissions
2. Teachers register via AccessControl contract (admin approval)
3. Teachers create batches and add students
4. Teachers create assignments linked to specific batches
5. Students submit assignments with IPFS hashes before deadline
6. Teachers review and grade submissions
7. Smart contracts automatically mint tokens to students upon grading
8. All events emitted on-chain for complete audit trail

**Gas Optimization:**
- Only IPFS hashes stored on-chain not full file data
- Batch operations for adding multiple students reduce transaction count
- View functions for data retrieval consume no gas
- Indexed event parameters for efficient blockchain queries

### IPFS Integration

**File Upload Flow:**
1. Client validates file type/size before upload
2. File converted to base64 on client side
3. POST to `/api/upload/ipfs` with file data
4. Server converts base64 to buffer
5. Server uploads to Pinata IPFS service
6. IPFS hash returned to client
7. Client stores IPFS hash in smart contract transaction

**Pinata Configuration:**
- Requires PINATA_API_KEY and PINATA_SECRET_KEY environment variables
- Falls back to mock mode if credentials unavailable for development
- Gateway URLs provided for file retrieval via IPFS
- Metadata stored with uploads for organization

**Security Considerations:**
- API keys stored server-side only never exposed to client
- File type whitelist prevents malicious uploads
- File size limits prevent DoS attacks
- IPFS content addressing ensures immutability

### Network Configuration

**Sepolia Testnet:**
- Chain ID: 11155111
- RPC Provider: Infura or Alchemy
- Block explorer: sepolia.etherscan.io
- Testnet ETH required for gas fees

**Environment Variables Required:**
- INFURA_API_KEY or ALCHEMY_API_KEY for RPC access
- PRIVATE_KEY for contract deployment and admin operations
- PINATA_API_KEY and PINATA_SECRET_KEY for IPFS uploads
- Contract addresses can be overridden via VITE_ prefixed variables

## External Dependencies

### Blockchain Infrastructure
- **Ethereum Sepolia Testnet**: Test blockchain network for contract deployment and transactions
- **Infura/Alchemy**: RPC node providers for blockchain connectivity
- **MetaMask**: Browser wallet for user authentication and transaction signing
- **ethers.js**: Ethereum library for smart contract interactions

### File Storage
- **IPFS (InterPlanetary File System)**: Decentralized file storage network
- **Pinata**: IPFS pinning service API for reliable file hosting
- Gateway URLs for IPFS content retrieval

### Smart Contracts
- **OpenZeppelin Contracts**: Battle-tested contract libraries for AccessControl, ERC20 tokens, and security patterns
- **Hardhat**: Ethereum development environment for contract compilation, deployment, and testing

### Third-Party Services
- **Etherscan**: Block explorer for transaction verification and contract interaction
- Real-time blockchain event monitoring via contract event listeners

### Development Tools
- **Drizzle ORM**: Type-safe PostgreSQL ORM (configured but not actively used - blockchain is primary storage)
- **Neon Database**: Serverless PostgreSQL (provisioned but blockchain-first architecture)
- **shadcn/ui**: Radix UI-based component library with 30+ pre-built components
- **TanStack Query**: Async state management with caching and invalidation

### Build Dependencies
- **Vite**: Fast build tool with HMR for development
- **TypeScript**: Type safety across full stack
- **ESBuild**: JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind compilation