# 🎓 EduChain - Blockchain-based Academic Assessment Platform

A decentralized application (dApp) for academic lab assignment assessment built on Ethereum blockchain with complete IPFS integration.

## ✨ Features

- 🔐 **Wallet-based Authentication** - MetaMask integration for secure login
- 📚 **Batch Management** - Teachers create and manage student groups
- 📝 **Assignment Lifecycle** - Create, submit, and grade assignments on-chain
- 📁 **IPFS Storage** - Decentralized file storage via Pinata
- 🤖 **AI-Powered Grading** - Google Gemini AI provides intelligent grading suggestions for submissions
- 📄 **Multi-Format Support** - Supports PDF, DOCX, and text file uploads with automatic text extraction
- 🪙 **Token Rewards** - Non-transferable ERC20 tokens for graded work
- 🔍 **Full Transparency** - All transactions verifiable on Sepolia Etherscan
- ⚡ **No Student Registration Required** - Teachers can directly add any wallet to batches!

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MetaMask browser extension
- Sepolia testnet ETH ([Get free testnet ETH](https://sepoliafaucet.com/))

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env and add your API keys (see SETUP.md for details)

# 3. Run the application
npm run dev
```

The app will be available at `http://localhost:5000`

📖 **For detailed setup instructions, see [SETUP.md](./SETUP.md)**

## 🏗️ Architecture

### Smart Contracts (Sepolia Testnet)

All contracts are already deployed and ready to use:

| Contract | Address | Purpose |
|----------|---------|---------|
| AccessControl | `0xFB7c09E0d25577401cB98C9b29B0465243A97E5F` | Role management (Admin, Teacher, Student) |
| BatchManagement | `0xddD637Fd04a8b14470Bcf3b78c683c1a87C99aB8` | Student batch organization |
| AssignmentSubmission | `0xf39A62a69222ad7F51217AFedd46178e7926039d` | Assignment lifecycle management |
| TokenReward | `0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592` | Non-transferable token rewards |

### Technology Stack

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- TailwindCSS + shadcn/ui
- MetaMask SDK
- ethers.js v6

**Backend:**
- Express.js + TypeScript
- Blockchain service layer
- IPFS integration (Pinata)
- Google Gemini AI for grading assistance
- Document parsing (PDF, DOCX)

**Blockchain:**
- Ethereum Sepolia Testnet
- Solidity smart contracts
- OpenZeppelin libraries
- Hardhat development environment

## 📋 Usage

### For Teachers

1. **Connect Wallet** - Connect your MetaMask wallet (must have TEACHER_ROLE)
2. **Create Batch** - Create a new batch for your class
3. **Add Students** - Add student wallet addresses directly (no registration needed!)
4. **Create Assignment** - Upload assignment file to IPFS and create on-chain
5. **Review Submissions** - View student submissions with AI-powered grading suggestions
6. **Grade & Award Tokens** - Accept AI suggestions or provide custom grades and award tokens

### For Students

1. **Connect Wallet** - Connect your MetaMask wallet
2. **View Batches** - See batches you're enrolled in
3. **Submit Assignment** - Upload your work via IPFS
4. **Check Grades** - View grades and earned tokens

## 📁 Project Structure

```
ChainAssess/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── hooks/             # Custom hooks (useWeb3, useContracts)
│   │   ├── lib/               # Contract configs and utilities
│   │   └── pages/             # Application pages
├── server/                    # Express backend
│   ├── index.ts               # Server entry point
│   ├── blockchain-service.ts  # Blockchain integration
│   └── ipfs-service.ts        # IPFS file handling
├── contracts/                 # Solidity smart contracts
│   ├── AccessControl.sol
│   ├── BatchManagement.sol
│   ├── AssignmentSubmission.sol
│   └── TokenReward.sol
├── scripts/                   # Hardhat deployment scripts
├── .env.example               # Environment template
├── SETUP.md                   # Detailed setup guide
└── DEPLOYMENT_SUMMARY.md      # Contract deployment info
```

## 🔐 Security

- ✅ All API keys stored in `.env` (not committed to Git)
- ✅ Role-based access control enforced on-chain
- ✅ MetaMask transaction signing for all writes
- ✅ Input validation and sanitization
- ✅ Non-transferable tokens prevent gaming

**⚠️ NEVER commit your `.env` file or private keys to Git!**

## 🚀 Deployment

### Environment Variables Required

Create a `.env` file with the following:

```env
# Blockchain
ALCHEMY_API_KEY=your_alchemy_api_key
PRIVATE_KEY=your_wallet_private_key

# IPFS Storage
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# AI Grading (Optional)
GEMINI_API_KEY=your_google_gemini_api_key
```

### Deploy to Render

1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Set environment variables in Render dashboard
4. Deploy! The app will automatically build and start

**Build Command:** `npm install --production=false && npm run build`
**Start Command:** `npm run start`

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy contracts (if needed)
npx hardhat run scripts/deploy.js --network sepolia
```

## 📚 Documentation

See **[README.md](./README.md)** for architecture overview and setup instructions.

## 🌐 Block Explorer

View all transactions and contracts on Sepolia Etherscan:
- [AccessControl Contract](https://sepolia.etherscan.io/address/0xFB7c09E0d25577401cB98C9b29B0465243A97E5F)
- [BatchManagement Contract](https://sepolia.etherscan.io/address/0xddD637Fd04a8b14470Bcf3b78c683c1a87C99aB8)
- [AssignmentSubmission Contract](https://sepolia.etherscan.io/address/0xf39A62a69222ad7F51217AFedd46178e7926039d)
- [TokenReward Contract](https://sepolia.etherscan.io/address/0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592)

## 🆘 Troubleshooting

### Common Issues

1. **"Missing API Key" Error**
   - Check your `.env` file contains all required keys
   - Restart the dev server after editing `.env`

2. **MetaMask Connection Issues**
   - Ensure you're on Sepolia testnet
   - Refresh the page and try reconnecting

3. **Transaction Failures**
   - Check you have enough Sepolia ETH for gas
   - Verify your wallet has the correct role (teacher/student)

4. **IPFS Upload Fails**
   - Verify Pinata API keys are correct
   - Check file size (max 10MB recommended)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Ethereum, React, and IPFS
