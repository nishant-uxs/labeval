# 🎓 ChainAssess - Blockchain-based Academic Assessment Platform

A decentralized application (dApp) for academic lab assignment assessment built on Ethereum blockchain with AI-powered grading and IPFS storage.

[![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=flat-square)](https://render.com)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=flat-square&logo=ethereum)](https://sepolia.etherscan.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## 📖 Overview

ChainAssess is a comprehensive blockchain-based platform that revolutionizes academic assessment by combining:
- **Decentralized Storage** via IPFS (Pinata)
- **Smart Contract** automation on Ethereum
- **AI-Powered Grading** using Google Gemini
- **Token-based Rewards** for student achievements

## ✨ Key Features

### 🔐 Secure & Transparent
- Wallet-based authentication via MetaMask
- All transactions recorded on Ethereum Sepolia testnet
- Role-based access control (Admin, Teacher, Student)
- Immutable grade records on blockchain

### 🤖 AI-Powered Intelligence
- Automatic grading suggestions using Google Gemini AI
- Multi-format document support (PDF, DOCX, TXT)
- Intelligent text extraction and analysis
- Customizable grading criteria

### 📚 Complete Assignment Management
- Batch/class management system
- Assignment creation and distribution
- Student submission tracking
- IPFS-based file storage
- Non-transferable token rewards

### ⚡ User-Friendly
- No student registration required
- Teachers can add students directly by wallet address
- Clean, modern UI built with React and TailwindCSS
- Real-time blockchain transaction updates

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **MetaMask** browser extension
- **Sepolia ETH** for gas fees ([Get free testnet ETH](https://sepoliafaucet.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/nishant-uxs/labeval.git
cd labeval/lab_eval_blockchain/ChainAssess

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and add your API keys

# Run the application
npm run dev
```

The app will be available at `http://localhost:5000`

### Environment Variables

Create a `.env` file in the `ChainAssess` directory:

```env
# Blockchain Configuration
ALCHEMY_API_KEY=your_alchemy_api_key_here
PRIVATE_KEY=your_wallet_private_key_here

# IPFS Storage (Pinata)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# AI Grading (Optional but recommended)
GEMINI_API_KEY=your_google_gemini_api_key_here
```

**Getting API Keys:**
- **Alchemy:** [Sign up at Alchemy](https://www.alchemy.com/) and create a Sepolia app
- **Pinata:** [Get API keys from Pinata](https://www.pinata.cloud/)
- **Gemini:** [Get API key from Google AI Studio](https://makersuite.google.com/app/apikey)

## 🏗️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast builds
- **TailwindCSS** + **shadcn/ui** for styling
- **MetaMask SDK** for wallet integration
- **ethers.js v6** for blockchain interaction

### Backend
- **Express.js** with TypeScript
- **Google Gemini AI** for grading
- **Pinata SDK** for IPFS storage
- **PDF/DOCX parsers** for document processing

### Blockchain
- **Ethereum Sepolia Testnet**
- **Solidity** smart contracts
- **OpenZeppelin** libraries
- **Hardhat** development environment

### Smart Contracts (Already Deployed)

| Contract | Address | Purpose |
|----------|---------|---------|
| AccessControl | `0xFB7c09E0d25577401cB98C9b29B0465243A97E5F` | Role management |
| BatchManagement | `0xddD637Fd04a8b14470Bcf3b78c683c1a87C99aB8` | Student batches |
| AssignmentSubmission | `0xf39A62a69222ad7F51217AFedd46178e7926039d` | Assignment lifecycle |
| TokenReward | `0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592` | Token rewards |

## 📋 How It Works

### For Teachers

1. **Connect Wallet** → Connect MetaMask (must have TEACHER_ROLE)
2. **Create Batch** → Set up a new class/batch
3. **Add Students** → Add student wallet addresses (no registration needed!)
4. **Create Assignment** → Upload assignment files to IPFS
5. **Review Submissions** → View submissions with AI grading suggestions
6. **Award Grades** → Accept AI suggestions or provide custom grades
7. **Distribute Tokens** → Automatically award non-transferable tokens

### For Students

1. **Connect Wallet** → Connect MetaMask wallet
2. **View Assignments** → See assignments from enrolled batches
3. **Submit Work** → Upload submission files to IPFS
4. **Track Progress** → View grades and earned tokens
5. **Check Rewards** → See total tokens earned

## 🌐 Deployment

### Deploy to Render

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create Render Web Service**
   - Connect your GitHub repository
   - Root Directory: `lab_eval_blockchain/ChainAssess`
   - Build Command: `npm install --production=false && npm run build`
   - Start Command: `npm run start`

3. **Set Environment Variables** in Render dashboard:
   - `ALCHEMY_API_KEY`
   - `PRIVATE_KEY`
   - `PINATA_API_KEY`
   - `PINATA_SECRET_KEY`
   - `GEMINI_API_KEY` (optional)

4. **Deploy!** Render will automatically build and deploy your app

## 📁 Project Structure

```
labeval/
└── lab_eval_blockchain/
    └── ChainAssess/
        ├── client/              # React frontend
        │   ├── src/
        │   │   ├── components/  # UI components
        │   │   ├── hooks/       # Custom React hooks
        │   │   ├── lib/         # Contract configs
        │   │   └── pages/       # Application pages
        ├── server/              # Express backend
        │   ├── index.ts         # Server entry
        │   ├── blockchain-service.ts
        │   ├── ipfs-service.ts
        │   └── ai-grading-service.ts
        ├── contracts/           # Solidity contracts
        │   ├── AccessControl.sol
        │   ├── BatchManagement.sol
        │   ├── AssignmentSubmission.sol
        │   └── TokenReward.sol
        ├── scripts/             # Deployment scripts
        ├── package.json
        └── README.md            # Detailed documentation
```

## 🔐 Security Features

- ✅ **Environment Variables** - All sensitive data in `.env`
- ✅ **Role-Based Access** - Smart contract enforced permissions
- ✅ **MetaMask Signing** - All transactions require user approval
- ✅ **Input Validation** - Server-side and client-side validation
- ✅ **Non-Transferable Tokens** - Prevents token trading/gaming
- ✅ **IPFS Immutability** - Files cannot be modified after upload


## 📚 Documentation

- **[ChainAssess README](./lab_eval_blockchain/ChainAssess/README.md)** - Detailed project documentation
- **[SETUP.md](./lab_eval_blockchain/ChainAssess/SETUP.md)** - Complete setup guide
- **[DEPLOYMENT_SUMMARY.md](./lab_eval_blockchain/ChainAssess/DEPLOYMENT_SUMMARY.md)** - Contract deployment details

## 🌐 Live Demo & Resources

- **Sepolia Etherscan:** [View Contracts](https://sepolia.etherscan.io)
- **Sepolia Faucet:** [Get Test ETH](https://sepoliafaucet.com/)
- **Alchemy Dashboard:** [Manage API](https://dashboard.alchemy.com/)
- **Pinata Dashboard:** [Manage IPFS](https://app.pinata.cloud/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 👨‍💻 Author

**Nishant**
- GitHub: [@nishant-uxs](https://github.com/nishant-uxs)

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Ethereum Foundation for blockchain infrastructure
- Google for Gemini AI API
- Pinata for IPFS infrastructure
- Alchemy for blockchain node services

---

**Built with ❤️ using Ethereum, React, AI, and IPFS**

*Making academic assessment transparent, secure, and intelligent.*
