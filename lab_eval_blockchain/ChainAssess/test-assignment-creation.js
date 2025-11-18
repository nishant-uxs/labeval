import { ethers } from 'ethers';

const ASSIGNMENT_ABI = [
  "function createAssignment(string _title, string _description, string _ipfsHash, uint256 _deadline, uint256 _tokenReward, uint256 _batchId) external returns (uint256)",
  "function getAssignment(uint256 _assignmentId) external view returns (tuple(uint256 id, string title, string description, string ipfsHash, uint256 deadline, uint256 tokenReward, uint256 batchId, address creator, bool isActive, uint256 createdAt))"
];

const BATCH_ABI = [
  "function getBatch(uint256 _batchId) external view returns (tuple(uint256 id, string name, address teacher, bool isActive, uint256 createdAt, uint256 updatedAt))"
];

const ACCESS_CONTROL_ABI = [
  "function isTeacher(address account) external view returns (bool)"
];

const RPC_URL = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
const ASSIGNMENT_ADDRESS = "0xbbe560e255f469B2D5FD52e003e79166eb1aDe10";
const BATCH_ADDRESS = "0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66";
const ACCESS_CONTROL_ADDRESS = "0xFB7c09E0d25577401cB98C9b29B0465243A97E5F";

async function testAssignmentCreation() {
  console.log("🚀 Testing Assignment Creation for Wallet: 0x93C21c9AFF5Ecb26650D3E0435194B225fF78B20\n");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("📍 Wallet Address:", wallet.address);
  console.log("💰 Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "ETH\n");

  const assignmentContract = new ethers.Contract(ASSIGNMENT_ADDRESS, ASSIGNMENT_ABI, wallet);
  const batchContract = new ethers.Contract(BATCH_ADDRESS, BATCH_ABI, provider);
  const accessControl = new ethers.Contract(ACCESS_CONTROL_ADDRESS, ACCESS_CONTROL_ABI, provider);

  const isTeacher = await accessControl.isTeacher(wallet.address);
  console.log("👨‍🏫 Is Teacher:", isTeacher);

  const batchId = 22;
  console.log("\n📚 Checking Batch", batchId);
  
  try {
    const batch = await batchContract.getBatch(batchId);
    console.log("   Batch Name:", batch.name);
    console.log("   Teacher:", batch.teacher);
    console.log("   Your Address:", wallet.address);
    console.log("   Match:", batch.teacher.toLowerCase() === wallet.address.toLowerCase());
    console.log("   Is Active:", batch.isActive);
  } catch (error) {
    console.error("   ❌ Failed to get batch:", error.message);
    return;
  }

  console.log("\n🎯 Creating Assignment...");
  
  const title = "Test Assignment " + Date.now();
  const description = "This is a test assignment created via script";
  const ipfsHash = "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn";
  const deadline = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 1 week from now
  const tokenReward = 100;

  console.log("   Title:", title);
  console.log("   Batch ID:", batchId);
  console.log("   Deadline:", new Date(deadline * 1000).toLocaleString());
  console.log("   Reward:", tokenReward, "tokens\n");

  try {
    const tx = await assignmentContract.createAssignment(
      title,
      description,
      ipfsHash,
      deadline,
      tokenReward,
      batchId
    );
    
    console.log("⏳ Transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    console.log("\n✅ SUCCESS! Assignment Created!");
    console.log("   Transaction:", receipt.hash);
    console.log("   Block:", receipt.blockNumber);
    console.log("   Gas Used:", receipt.gasUsed.toString());
    
  } catch (error) {
    console.error("\n❌ FAILED to create assignment:");
    console.error("   Error:", error.message);
    
    if (error.data) {
      console.error("   Data:", error.data);
    }
    
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
    
    // Try to get more details
    try {
      const gas = await assignmentContract.createAssignment.estimateGas(
        title,
        description,
        ipfsHash,
        deadline,
        tokenReward,
        batchId
      );
      console.error("   Estimated Gas:", gas.toString());
    } catch (gasError) {
      console.error("   Gas Estimation Failed:", gasError.shortMessage || gasError.message);
    }
  }
}

testAssignmentCreation().catch(console.error);
