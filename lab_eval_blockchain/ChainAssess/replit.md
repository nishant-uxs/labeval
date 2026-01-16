# EduChain dApp - Blockchain-based Lab Assignment Assessment System

## Overview

EduChain is a comprehensive blockchain-based decentralized application (dApp) for academic lab assignment assessment featuring complete IPFS file storage integration. The system provides immutable assignment submission tracking through smart contracts, teacher-controlled grading with automatic token rewards, and full blockchain transparency. Students upload assignment files (PDF, DOCX, images) to IPFS with blockchain recording, while teachers review submissions and award non-transferable tokens based on grades. The platform enforces strict deadline management, maintains academic integrity through locked tokens, and provides complete transaction verification with Etherscan integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 16, 2026 - Assignment File Upload & Enhanced AI Grading
- **🎯 NEW FEATURE: Assignment File Upload**: Teachers can now upload assignment files (PDF, DOC, DOCX, TXT up to 10MB) when creating assignments
- **Student File Access**: Students can view and download uploaded assignment files via "View Assignment File" button
- **Enhanced AI Grading**: AI grading now uses assignment file content along with submission for more accurate, contextual grading suggestions
- **IPFS Storage**: Assignment files are stored on IPFS via Pinata, with hash stored on blockchain
- **AI Model Update**: Using Gemini 2.5 Flash model for improved grading accuracy

### November 18, 2025 - Direct Student Addition Feature
- **🎯 NEW FEATURE: Direct Student Addition**: Teachers can now add ANY wallet address as student to batches WITHOUT requiring prior student registration
- **Removed Registration Barrier**: Eliminated `accessControl.isStudent()` validation from `addStudentToBatch()` and `addMultipleStudentsToBatch()` functions
- **Streamlined Workflow**: Teachers control batch membership completely - no waiting for students to self-register
- **Contract Redeployment**: Deployed new BatchManagement contract (0xddD637Fd04a8b14470Bcf3b78c683c1a87C99aB8) with simplified validation
- **Benefits**: Faster batch setup, easier testing with test wallets, improved user experience, more flexible batch management
- **Updated Configuration**: All config files (.env, contracts.ts, blockchain-service.ts) updated with new contract address
- **Documentation Updated**: DEPLOYMENT_SUMMARY.md and replit.md reflect latest changes

### August 21, 2025
- **Complete Smart Contract Architecture**: Implemented full smart contract system with AccessControl, AssignmentSubmission, TokenReward, and BatchManagement contracts
- **Batch Management System**: Teachers can create batches, add/remove students, and manage course enrollment with blockchain enforcement
- **Batch-Based Access Control**: Only batch creators can manage their batches; students must belong to batches for assignment submission and token awards
- **Assignment-Batch Integration**: All assignments are created for specific batches; only enrolled students can submit and receive grades
- **Blockchain-Based Teacher Verification**: Added real-time smart contract role verification preventing unauthorized access to teacher functions
- **Role-Based Access Control**: Complete on-chain role management system with admin-controlled teacher assignments
- **Smart Contract ABIs**: Created comprehensive contract interfaces for all blockchain interactions including batch operations
- **Teacher Management Panel**: Admin interface for granting/revoking teacher roles with blockchain transaction tracking
- **Access Denied Protection**: Security system that blocks non-verified teachers from accessing grading functions
- **Role Verification Banner**: Real-time blockchain verification status display with re-verification capabilities
- **Fallback Development System**: Test addresses for development while maintaining production security standards

### August 19, 2025
- **Complete IPFS Integration**: Implemented comprehensive file upload system with PDF, DOCX, image support and IPFS storage validation
- **Teacher-Controlled Token System**: Built complete teacher review and grading system where tokens are only awarded after teacher approval
- **Blockchain Assignment Submission**: Students upload files to IPFS with blockchain transaction recording and deadline enforcement
- **Non-Transferable Token System**: Implemented locked token system preventing student-to-student transfers for academic integrity
- **Enhanced File Validation**: Added file type, size validation and assignment-specific requirements
- **Transaction Verification**: Complete transaction hash verification with direct Etherscan integration and popup notifications
- **Immutable Submission Tracking**: All submissions permanently recorded on blockchain with IPFS hash storage
- **Comprehensive Token Dashboard**: Students can view all submissions, grades, token earnings with full transparency
- **Deadline Management**: Automatic deadline enforcement preventing late submissions and token awards
- **Full Blockchain Integration**: Real smart contract integration with MetaMask for transaction signing

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Styling**: TailwindCSS with shadcn/ui component library for consistent, accessible UI design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Server**: Express.js with TypeScript for API endpoints and middleware
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Storage Strategy**: In-memory storage for development with planned PostgreSQL migration
- **Session Management**: Planned integration with connect-pg-simple for persistent sessions

### Blockchain Integration
- **Smart Contract Platform**: Ethereum (Sepolia testnet) with deployed production contracts
- **Wallet Integration**: MetaMask SDK for seamless wallet connection and transaction signing
- **Deployed Smart Contracts** (Latest - Nov 18, 2025):
  - **AccessControl (0xFB7c09E0d25577401cB98C9b29B0465243A97E5F)**: Role-based permissions with teacher/student registration and verification
  - **BatchManagement (0xddD637Fd04a8b14470Bcf3b78c683c1a87C99aB8)** ⚡ NEW: Teacher-controlled batch creation with direct student addition (NO registration required), batch-based access control
  - **AssignmentSubmission (0xf39A62a69222ad7F51217AFedd46178e7926039d)** ⚡ NEW: Assignment creation, submissions, and grading - **NO student registration required** (removed onlyStudent modifier)
  - **TokenReward (0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592)**: Non-transferable ERC20 tokens with grade-based multipliers and batch verification (A=100%, B=80%, C=60%, D=40%, F=0%)
- **Role Verification System**: Real-time blockchain verification of teacher permissions before allowing access to grading functions
- **Security Features**: Access denied screens for unauthorized users, transaction verification, and immutable role assignments
- **Key Feature**: Teachers can directly add students to batches without requiring student self-registration - streamlined workflow for batch management

### File Storage Solution
- **Primary Storage**: IPFS (InterPlanetary File System) for decentralized file storage
- **Integration Options**: Web3.Storage and Pinata APIs for reliable IPFS pinning
- **File Handling**: Client-side upload with progress tracking and validation

### Authentication & Authorization
- **Wallet-based Authentication**: MetaMask wallet connection serves as primary authentication
- **Role Management**: On-chain role assignments stored in AccessControl smart contract
- **Permission Enforcement**: Smart contract-level role verification for sensitive operations

### Database Schema Design
- **Users Table**: Wallet addresses, usernames, roles, and creation timestamps
- **Assignments Table**: Assignment metadata, deadlines, reward amounts, and status
- **Submissions Table**: Student submissions with IPFS hashes, timing data, and review status
- **Token Transactions**: Record of all token rewards issued with transaction hashes
- **NFT Rewards**: Tracking of NFT issuance with metadata and recipient information
- **Contract Events**: Blockchain event logging for audit trails

### Development & Deployment Architecture
- **Development Server**: Vite dev server with hot module replacement
- **Production Build**: Static client build with Express server for API routes
- **Environment Management**: Environment-based configuration for contract addresses and API keys
- **Code Organization**: Monorepo structure with shared TypeScript schemas between client and server

## External Dependencies

### Blockchain Infrastructure
- **Ethereum Network**: Sepolia testnet for development, with mainnet deployment capability
- **RPC Provider**: Infura for reliable blockchain connectivity and transaction broadcasting
- **Smart Contract Development**: Solidity for contract implementation with modular architecture

### IPFS Storage Providers
- **Web3.Storage**: Primary IPFS pinning service for decentralized file storage
- **Pinata**: Alternative IPFS provider for redundancy and reliability
- **IPFS Gateway**: For file retrieval and content addressing

### Wallet & Crypto Integration
- **MetaMask SDK**: Wallet connection, transaction signing, and chain management
- **Ethers.js**: Ethereum interaction library for contract calls and transaction handling
- **Neon Database**: PostgreSQL-compatible serverless database for production deployment

### UI & Development Tools
- **Radix UI**: Headless component library for accessible, composable UI elements
- **TailwindCSS**: Utility-first CSS framework for rapid styling and responsive design
- **React Hook Form**: Form state management with Zod schema validation
- **FontAwesome**: Icon library for consistent visual elements throughout the application

### Build & Development Dependencies
- **Vite**: Fast build tool with TypeScript support and hot module replacement
- **Drizzle**: Type-safe ORM with PostgreSQL dialect for database operations
- **TSX**: TypeScript execution for server-side development
- **ESBuild**: Fast JavaScript bundler for production server builds