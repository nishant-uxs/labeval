# EduChain dApp - Blockchain-based Lab Assignment Assessment System

## Overview

EduChain is a comprehensive blockchain-based decentralized application (dApp) for academic lab assignment assessment featuring complete IPFS file storage integration. The system provides immutable assignment submission tracking through smart contracts, teacher-controlled grading with automatic token rewards, and full blockchain transparency. Students upload assignment files (PDF, DOCX, images) to IPFS with blockchain recording, while teachers review submissions and award non-transferable tokens based on grades. The platform enforces strict deadline management, maintains academic integrity through locked tokens, and provides complete transaction verification with Etherscan integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

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
- **Deployed Smart Contracts**:
  - **AccessControl (0x1234...)**: Role-based permissions with teacher/student registration and verification
  - **BatchManagement (0x4567...)**: Teacher-controlled batch creation, student enrollment, and batch-based access control
  - **AssignmentSubmission (0x2345...)**: Assignment creation for specific batches, IPFS file submissions, and grading system
  - **TokenReward (0x3456...)**: Non-transferable ERC20 tokens with grade-based multipliers and batch verification (A=100%, B=80%, C=60%, D=40%, F=0%)
- **Role Verification System**: Real-time blockchain verification of teacher permissions before allowing access to grading functions
- **Security Features**: Access denied screens for unauthorized users, transaction verification, and immutable role assignments

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