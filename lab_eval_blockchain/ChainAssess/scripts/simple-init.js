const { ethers } = require('ethers');
const fs = require('fs');

// Contract addresses
const CONTRACT_ADDRESSES = {
  accessControl: "0x6fC21092DA55B392b045eD78F4732bff3C580e2c",
  batchManagement: "0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66",
  assignmentSubmission: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  tokenReward: "0xBf447be6a0E79c061dbF9f6169d372a85a1Db16E"
};

// ABIs
const ACCESS_CONTROL_ABI = [
  "function grantTeacherRole(address _teacher) external",
  "function grantStudentRole(address _student) external",
  "function isTeacher(address _address) external view returns (bool)",
  "function isStudent(address _address) external view returns (bool)"
];

const BATCH_MANAGEMENT_ABI = [
  "function createBatch(string memory _name) external returns (uint256)",
  "function addStudentToBatch(uint256 _batchId, address _student) external",
  "function getBatch(uint256 _batchId) external view returns (tuple(uint256 id, string name, address teacher, address[] students, bool isActive, uint256 createdAt, uint256 updatedAt))",
  "function getTeacherBatches(address _teacher) external view returns (uint256[] memory)",
  "function getStudentBatches(address _student) external view returns (uint256[] memory)",
  "function getTotalBatches() external view returns (uint256)"
];

const ASSIGNMENT_SUBMISSION_ABI = [
  "function createAssignment(string memory _title, string memory _description, string memory _ipfsHash, uint256 _deadline, uint256 _tokenReward, uint256 _batchId) external returns (uint256)"
];

async function main() {
  console.log("🚀 Direct Blockchain Data Initialization...\n");
  
  // Check if INFURA_API_KEY and PRIVATE_KEY exist
  const infuraKey = process.env.INFURA_API_KEY;
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!infuraKey) {
    console.error("❌ INFURA_API_KEY not found in environment variables");
    console.log("Please set INFURA_API_KEY in your secrets");
    return;
  }
  
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in environment variables");
    console.log("Please set PRIVATE_KEY in your secrets");
    console.log("Use teacher private key: for 0xc39d22dc2d0a3ca341ce8f69efa563d113607688");
    return;
  }

  try {
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${infuraKey}`);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log("Connected with account:", wallet.address);
    
    // Get balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    if (Number(ethers.formatEther(balance)) < 0.001) {
      console.error("❌ Insufficient balance. Need at least 0.001 ETH for gas fees");
      console.log("Get Sepolia ETH from: https://sepoliafaucet.com/");
      return;
    }
    
    // Connect to contracts
    const accessControl = new ethers.Contract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI, wallet);
    const batchManagement = new ethers.Contract(CONTRACT_ADDRESSES.batchManagement, BATCH_MANAGEMENT_ABI, wallet);
    const assignmentSubmission = new ethers.Contract(CONTRACT_ADDRESSES.assignmentSubmission, ASSIGNMENT_SUBMISSION_ABI, wallet);
    
    // Test users
    const teacherAddress = "0xc39d22dc2d0a3ca341ce8f69efa563d113607688";
    const studentAddress = "0x31d05d7a6130f3e8b149008ec70090022f9c9330";
    
    console.log("\n📝 Step 1: Registering Users...");
    
    // Check if teacher is already registered
    try {
      const isTeacher = await accessControl.isTeacher(teacherAddress);
      if (!isTeacher) {
        console.log("Registering teacher...");
        const tx1 = await accessControl.grantTeacherRole(teacherAddress);
        await tx1.wait();
        console.log("✅ Teacher registered:", teacherAddress);
      } else {
        console.log("✅ Teacher already registered:", teacherAddress);
      }
    } catch (error) {
      console.log("⚠️ Could not register teacher:", error.message);
    }
    
    // Check if student is already registered  
    try {
      const isStudent = await accessControl.isStudent(studentAddress);
      if (!isStudent) {
        console.log("Registering student...");
        const tx2 = await accessControl.grantStudentRole(studentAddress);
        await tx2.wait();
        console.log("✅ Student registered:", studentAddress);
      } else {
        console.log("✅ Student already registered:", studentAddress);
      }
    } catch (error) {
      console.log("⚠️ Could not register student:", error.message);
    }
    
    console.log("\n📚 Step 2: Creating Batches...");
    
    // Check existing batches
    try {
      const totalBatches = await batchManagement.getTotalBatches();
      console.log("Current total batches:", totalBatches.toString());
      
      if (Number(totalBatches) === 0) {
        console.log("No batches found, creating new ones...");
        
        // Create first batch
        console.log("Creating Batch 1: Blockchain Development Course");
        const tx3 = await batchManagement.createBatch("Blockchain Development Course");
        const receipt3 = await tx3.wait();
        console.log("✅ Batch 1 created, transaction:", tx3.hash);
        
        // Create second batch
        console.log("Creating Batch 2: Smart Contract Security");
        const tx4 = await batchManagement.createBatch("Smart Contract Security");
        const receipt4 = await tx4.wait();
        console.log("✅ Batch 2 created, transaction:", tx4.hash);
        
        // Add student to batches
        console.log("\n👥 Step 3: Adding Student to Batches...");
        
        const tx5 = await batchManagement.addStudentToBatch(1, studentAddress);
        await tx5.wait();
        console.log("✅ Student added to Batch 1");
        
        const tx6 = await batchManagement.addStudentToBatch(2, studentAddress);
        await tx6.wait();
        console.log("✅ Student added to Batch 2");
        
      } else {
        console.log("Batches already exist, skipping creation");
        
        // Still add student to batches if not already added
        try {
          const studentBatches = await batchManagement.getStudentBatches(studentAddress);
          if (studentBatches.length === 0) {
            console.log("Adding student to existing batches...");
            const tx5 = await batchManagement.addStudentToBatch(1, studentAddress);
            await tx5.wait();
            console.log("✅ Student added to Batch 1");
            
            const tx6 = await batchManagement.addStudentToBatch(2, studentAddress);
            await tx6.wait();
            console.log("✅ Student added to Batch 2");
          } else {
            console.log("✅ Student already enrolled in", studentBatches.length, "batches");
          }
        } catch (e) {
          console.log("⚠️ Could not check/add student to batches:", e.message);
        }
      }
      
    } catch (error) {
      console.log("⚠️ Could not check/create batches:", error.message);
    }
    
    console.log("\n🔍 Step 4: Verification...");
    
    try {
      const studentBatches = await batchManagement.getStudentBatches(studentAddress);
      console.log("Student enrolled in", studentBatches.length, "batches:", studentBatches.map(id => id.toString()));
      
      const teacherBatches = await batchManagement.getTeacherBatches(teacherAddress);
      console.log("Teacher has", teacherBatches.length, "batches:", teacherBatches.map(id => id.toString()));
      
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
    }
    
    console.log("\n🎉 Blockchain initialization complete!");
    console.log("✅ Now refresh your app - batches should appear!");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });