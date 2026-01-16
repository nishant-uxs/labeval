# EduChain - Blockchain-based Academic Assessment Platform

## Overview
EduChain is a decentralized application (dApp) built on the Ethereum blockchain for academic lab assignment assessment. It provides an immutable, transparent, and tamper-proof system for assignment submission, grading, and reward distribution within educational institutions. The platform utilizes IPFS for storing student submissions, while the blockchain manages all academic transactions, role-based access control, batch management, and a non-transferable token reward system. The primary goal is to enhance the integrity and transparency of academic assessment processes. It also includes an AI-powered grading feature using Google Gemini AI to assist teachers with grading suggestions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 19, TypeScript, Vite, Wouter for routing, and TailwindCSS with shadcn/ui for UI components. Web3 integration is handled via MetaMask SDK React and ethers.js v6, abstracted through custom hooks (useWeb3, useContracts, useIPFS). It employs a component-based design, centralized web3 state management, real-time blockchain data fetching with TanStack Query, and responsive design principles. The UI also features a "Get AI Suggestion" button for AI-powered grading.

### Backend Architecture
The backend uses Express.js 5 with TypeScript and Node.js. It provides RESTful API endpoints for batch management, assignments, and secure IPFS file uploads via Pinata. A blockchain service layer abstracts smart contract interactions. An AI grading service integrates with Google Gemini AI for grading suggestions. The system relies entirely on blockchain smart contracts for persistent data storage, eschewing a traditional database.

### Key Architectural Decisions
*   **Blockchain-First Storage**: All core application data (batches, assignments, submissions, grades) are stored on Ethereum smart contracts, providing an immutable audit trail and serving as the single source of truth.
*   **IPFS File Storage**: Assignment files are uploaded to IPFS via Pinata. Only IPFS content hashes are stored on the blockchain to minimize gas costs. A server-side proxy handles Pinata integration securely.
*   **Role-Based Access Control**: Smart contracts enforce roles (Admin, Teacher, Student) with permissions verified against the blockchain state in real-time. Automatic student registration and admin teacher registration are handled programmatically.
*   **Smart Contract System**: Consists of several modules: AccessControl, BatchManagement, AssignmentSubmission, and TokenReward.
*   **Gas Optimization**: Achieved by storing only IPFS hashes on-chain, using batch operations, and relying on gas-free view functions for data retrieval.
*   **AI-Powered Grading**: Integration of Google Gemini 1.5 Flash for providing grading suggestions, feedback, and confidence scores.

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
*   **OpenZeppelin Contracts**: Reusable smart contract libraries.
*   **Hardhat**: Ethereum development environment for contract management.

### Third-Party Services
*   **Etherscan**: Block explorer for monitoring blockchain transactions.
*   **Google Gemini AI**: For AI-powered grading suggestions.

### Development Tools
*   **Vite**: Build tool for frontend development.
*   **TypeScript**: For type-safe development.
*   **shadcn/ui**: Component library for consistent UI.
*   **TanStack Query**: For asynchronous state management and data fetching.