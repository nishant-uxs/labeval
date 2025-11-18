# EduChain - Local Setup Guide

## Quick Start (5 minutes)

### 1. Prerequisites
- **Node.js 18+** installed
- **MetaMask** browser extension installed
- **Sepolia testnet ETH** in your wallet ([Get free testnet ETH](https://sepoliafaucet.com/))

### 2. Clone & Install
```bash
git clone <your-repo-url>
cd ChainAssess
npm install
```

### 3. Environment Setup

**Copy the example environment file:**
```bash
cp .env.example .env
```

**Edit `.env` and add your API keys:**

#### Required API Keys:

1. **Alchemy API Key** (Free):
   - Go to https://www.alchemy.com/
   - Sign up and create a new app on **Sepolia** network
   - Copy your API key
   - Paste in `.env`: `ALCHEMY_API_KEY=your_key_here`

2. **Pinata API Keys** (Free):
   - Go to https://www.pinata.cloud/
   - Sign up and get your API keys
   - Paste in `.env`:
     - `PINATA_API_KEY=your_key_here`
     - `PINATA_SECRET_KEY=your_secret_here`
     - `VITE_PINATA_API_KEY=your_key_here`
     - `VITE_PINATA_SECRET_KEY=your_secret_here`

**Note:** Contract addresses are already configured! No need to deploy new contracts.

### 4. Run the Application
```bash
npm run dev
```

The app will open at `http://localhost:5000`

### 5. Connect MetaMask
- Click "Connect Wallet" button
- Make sure you're on **Sepolia Testnet**
- Approve the connection

## Smart Contracts (Already Deployed!)

The application uses these deployed contracts on Sepolia:

| Contract | Address |
|----------|---------|
| AccessControl | `0xFB7c09E0d25577401cB98C9b29B0465243A97E5F` |
| BatchManagement | `0xddD637Fd04a8b14470Bcf3b78c683c1a87C99aB8` |
| AssignmentSubmission | `0xf39A62a69222ad7F51217AFedd46178e7926039d` |
| TokenReward | `0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592` |

**You don't need to deploy contracts!** Just use the app.

## Getting Teacher Role

To test teacher features, your wallet needs the TEACHER_ROLE:

**Option 1:** Contact the contract admin to grant you teacher role
**Option 2:** Use the teacher wallet address specified in the project documentation

## Project Structure

```
ChainAssess/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities & contract configs
├── server/              # Express backend
│   ├── index.ts         # Server entry
│   └── blockchain-service.ts  # Blockchain integration
├── contracts/           # Solidity smart contracts
├── scripts/             # Deployment scripts
└── .env                 # Your API keys (DON'T commit!)
```

## Common Issues

### 1. "Missing API Key" Error
- Check your `.env` file has all required keys
- Make sure `.env` is in the root `ChainAssess/` folder
- Restart the dev server after editing `.env`

### 2. MetaMask Not Connecting
- Make sure you're on Sepolia testnet
- Try refreshing the page
- Check if MetaMask is unlocked

### 3. IPFS Upload Fails
- Verify your Pinata API keys are correct
- Check file size (max 10MB)
- Check internet connection

## Security Warning ⚠️

**NEVER commit your `.env` file to Git/GitHub!**

Your `.env` contains sensitive API keys. The `.gitignore` file is configured to exclude it, but always double-check before pushing to Git.

## Need Help?

- Check contract transactions on [Sepolia Etherscan](https://sepolia.etherscan.io/)
- View detailed deployment info in `DEPLOYMENT_SUMMARY.md`
- Read the architecture in `replit.md`

## Testing Flow

1. **As Teacher:**
   - Create a batch
   - Add student wallet addresses (no registration needed!)
   - Create an assignment for the batch
   - Grade submissions

2. **As Student:**
   - View your batches
   - Submit assignments via IPFS upload
   - Check your grades and token rewards

Enjoy building on blockchain! 🚀
