const { ethers } = require('ethers');

// Contract details
const CONTRACT_ADDRESS = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6';
const RPC_URL = `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ABI = [
  "function createAssignment(string memory _title, string memory _description, string memory _ipfsHash, uint256 _deadline, uint256 _tokenReward, uint256 _batchId) external returns (uint256)",
  "function getTotalAssignments() external view returns (uint256)",
  "function nextAssignmentId() external view returns (uint256)",
  "function getBatchAssignments(uint256 _batchId) external view returns (uint256[] memory)",
  "function getAssignment(uint256 _assignmentId) external view returns (tuple(uint256 id, string title, string description, string ipfsHash, uint256 deadline, uint256 tokenReward, address teacher, uint256 batchId, bool isActive, uint256 createdAt))"
];

async function createTestAssignment() {
  try {
    console.log('🔗 Creating test assignment...');
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
    
    // Check current state
    console.log('📊 Current state check:');
    const totalBefore = await contract.getTotalAssignments();
    const nextIdBefore = await contract.nextAssignmentId();
    console.log('Total assignments before:', totalBefore.toString());
    console.log('Next ID before:', nextIdBefore.toString());
    
    // Create assignment for batch 9 (Blockchain Development Course)
    const title = "Smart Contract Development Assignment";
    const description = "Create a simple token contract with basic ERC20 functionality";
    const ipfsHash = "QmTestHashForAssignment123456789";
    const deadline = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now
    const tokenReward = 100;
    const batchId = 9; // Blockchain Development Course
    
    console.log('🚀 Creating assignment with data:');
    console.log('Title:', title);
    console.log('Batch ID:', batchId);
    console.log('Deadline:', new Date(deadline * 1000).toLocaleString());
    console.log('Token Reward:', tokenReward);
    
    const tx = await contract.createAssignment(
      title,
      description,
      ipfsHash,
      deadline,
      tokenReward,
      batchId
    );
    
    console.log('📝 Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');
    
    // Check new state
    console.log('📊 State after creation:');
    const totalAfter = await contract.getTotalAssignments();
    const nextIdAfter = await contract.nextAssignmentId();
    console.log('Total assignments after:', totalAfter.toString());
    console.log('Next ID after:', nextIdAfter.toString());
    
    // Check batch assignments
    const batchAssignments = await contract.getBatchAssignments(batchId);
    console.log('📋 Assignments in batch 9:', batchAssignments.map(id => id.toString()));
    
    if (batchAssignments.length > 0) {
      const assignment = await contract.getAssignment(batchAssignments[0]);
      console.log('📄 Created assignment details:');
      console.log('ID:', assignment.id.toString());
      console.log('Title:', assignment.title);
      console.log('Teacher:', assignment.teacher);
      console.log('Batch ID:', assignment.batchId.toString());
      console.log('Active:', assignment.isActive);
    }
    
    console.log('🎉 Test assignment created successfully!');
    console.log('🔄 Now switch to student mode to see the assignment in dropdown');
    
  } catch (error) {
    console.error('❌ Error creating test assignment:', error);
  }
}

createTestAssignment();