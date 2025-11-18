# EduChain - Blockchain-based Academic Assessment Platform

## Overview

EduChain is a decentralized application (dApp) built on the Ethereum blockchain for academic lab assignment assessment. It provides an immutable, transparent, and tamper-proof system for assignment submission, grading, and reward distribution within educational institutions. The platform utilizes IPFS for storing student submissions, while the blockchain manages all academic transactions, role-based access control, batch management, and a non-transferable token reward system. The primary goal is to enhance the integrity and transparency of academic assessment processes.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### 2025-11-18: Critical Fix - Teacher Grading Now Uses Real Blockchain Transactions ✅
**Problem:** When teacher graded submissions, NO actual blockchain transaction was happening. Frontend was showing fake "mock" transaction hashes like `0x19a95ff42cftokenfeffe6b6`. Tokens were never minted, so student balance stayed at 0.

**Root Cause Analysis:**
1. **Frontend Mock Code:** `AssignmentReviewSystem.tsx` had "Simulate blockchain transaction" code with fake delays and mock transaction hashes
2. **No Backend Call:** Grading function never called the backend `/api/submissions/:id/grade` endpoint
3. **Token Balance Issue:** Even though `getTokenTransactions()` was fixed to fetch from blockchain, there were no tokens to fetch because grading never minted them

**Solution:**
- **Replaced Mock Code with Real API Call:** Removed all simulation code and implemented proper backend API integration
- **Blockchain Transaction:** Now calls `/api/submissions/:id/grade` which triggers real smart contract `gradeSubmission()` function
- **Token Minting:** Backend mints tokens on blockchain via `AssignmentSubmission` smart contract

**Files Modified:**
- `client/src/components/teacher/AssignmentReviewSystem.tsx` - Replaced mock code with real API integration
- `server/blockchain-service.ts` - Fixed `getTokenTransactions()` to fetch balance via `balanceOf()`

**Complete Flow (Now Working):**
1. Teacher grades submission → Frontend calls `/api/submissions/:id/grade`
2. Backend calls `AssignmentSubmission.gradeSubmission()` on blockchain
3. Smart contract mints tokens to student via `TokenReward` contract
4. Student refreshes → `balanceOf()` fetches actual token balance
5. Tokens display correctly on student dashboard ✅

**Result:** Complete end-to-end blockchain grading flow now working. Teacher grading creates real Ethereum transactions with actual token minting. Student balance updates immediately. ✅

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