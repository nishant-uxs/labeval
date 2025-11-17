# 🚀 EduChain Blockchain Setup Guide

## Complete Blockchain Data Storage Setup

This guide ensures that **ALL data is stored on the blockchain**, not in fallback/development data.

## Prerequisites

1. **MetaMask Wallet** with Sepolia ETH
2. **Infura API Key** (already set in environment)
3. **Private Key** with sufficient Sepolia ETH for deployment

## Step 1: Deploy Smart Contracts

If contracts are not already deployed or need redeployment:

```bash
# Deploy all contracts to Sepolia
npx hardhat run scripts/deploy-and-init.js --network sepolia
```

This will:
- Deploy all 5 smart contracts (AccessControl, TokenReward, NFTReward, BatchManagement, AssignmentSubmission)
- Set up proper role permissions
- Register initial admin, teacher, and student accounts
- Output new contract addresses

## Step 2: Update Contract Addresses

After deployment, update the contract addresses in:

1. **Frontend**: `client/src/lib/contracts.ts`
2. **Backend**: `server/blockchain-service.ts`

```javascript
const CONTRACT_ADDRESSES = {
  accessControl: "0x...", // New AccessControl address
  assignmentSubmission: "0x...", // New AssignmentSubmission address
  batchManagement: "0x...", // New BatchManagement address
  tokenReward: "0x...", // New TokenReward address
  nftReward: "0x..." // New NFTReward address
};
```

## Step 3: Initialize Blockchain Data

To populate the blockchain with initial data:

```bash
# Initialize batches, students, and assignments on blockchain
npx hardhat run scripts/init-blockchain-data.js --network sepolia
```

This will:
- Register teacher and student roles on blockchain
- Create sample batches directly on blockchain
- Add students to batches on blockchain
- Create assignments linked to batches

## Step 4: Verify Blockchain Data

### Check via Console

```bash
npx hardhat console --network sepolia

// In console:
const batchContract = await ethers.getContractAt("BatchManagement", "0xYourBatchAddress")
const batches = await batchContract.getTeacherBatches("0xTeacherAddress")
console.log(batches)
```

### Check via Etherscan

Visit: `https://sepolia.etherscan.io/address/[CONTRACT_ADDRESS]`
- View all transactions
- Read contract state
- Verify data storage

## Step 5: Remove Fallback Data

Once blockchain data is confirmed working:

1. **Remove development fallback** in `server/blockchain-service.ts`:
   - Remove `getDevelopmentStudentBatches()` function
   - Remove `getDevelopmentTeacherBatches()` function
   - Remove all fallback returns

2. **Ensure blockchain-only data**:
   ```javascript
   // Only use blockchain data
   const batches = await this.batchContract.getStudentBatches(studentAddress);
   // No fallback - if blockchain fails, show error to user
   ```

## Current Blockchain State

### Deployed Contracts (Sepolia)
- **AccessControl**: `0x6fC21092DA55B392b045eD78F4732bff3C580e2c`
- **BatchManagement**: `0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66`
- **AssignmentSubmission**: `0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6`
- **TokenReward**: `0xBf447be6a0E79c061dbF9f6169d372a85a1Db16E`

### Registered Users
- **Teacher**: `0xc39d22dc2d0a3ca341ce8f69efa563d113607688`
- **Student**: `0x31d05d7a6130f3e8b149008ec70090022f9c9330`

## Troubleshooting

### "Could not decode result data" Error
- Contract not deployed at that address
- Wrong ABI being used
- Contract needs initialization

### "require(false)" Error
- User not registered in AccessControl
- Batch doesn't exist
- Permission denied

### Solution
1. Redeploy contracts using the deployment script
2. Initialize with proper data
3. Verify on Etherscan that contracts have data

## Testing Blockchain Integration

1. **Connect MetaMask** to Sepolia
2. **Use registered addresses**:
   - Teacher: `0xc39d22dc2d0a3ca341ce8f69efa563d113607688`
   - Student: `0x31d05d7a6130f3e8b149008ec70090022f9c9330`
3. **Verify operations**:
   - Teacher can create batches (blockchain transaction)
   - Student can see enrolled batches (blockchain read)
   - All data persists on blockchain

## Important Notes

⚠️ **No Fallback Data**: Once properly deployed, the system should ONLY use blockchain data
⚠️ **Gas Costs**: All operations require Sepolia ETH for gas
⚠️ **Persistence**: All data is permanently stored on blockchain
✅ **Decentralized**: No centralized database - everything on-chain