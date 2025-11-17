const { ethers } = require('ethers');

// Contract addresses (currently deployed on Sepolia)
const CONTRACT_ADDRESSES = {
  accessControl: "0x6fC21092DA55B392b045eD78F4732bff3C580e2c",
  batchManagement: "0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66",
  assignmentSubmission: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  tokenReward: "0xBf447be6a0E79c061dbF9f6169d372a85a1Db16E"
};

// ABIs for the contracts
const ACCESS_CONTROL_ABI = [
  "function registerTeacher(address _teacher) external",
  "function registerStudent(address _student) external", 
  "function isTeacher(address _address) external view returns (bool)",
  "function isStudent(address _address) external view returns (bool)"
];

const BATCH_MANAGEMENT_ABI = [
  "function createBatch(string memory _name) external returns (uint256)",
  "function addStudentToBatch(uint256 _batchId, address _student) external",
  "function getBatch(uint256 _batchId) external view returns (tuple(uint256 id, string name, address teacher, address[] students, bool isActive, uint256 createdAt, uint256 updatedAt))",
  "function getTeacherBatches(address _teacher) external view returns (uint256[] memory)",
  "function getStudentBatches(address _student) external view returns (uint256[] memory)"
];

// Teacher credentials
const teacherPrivateKey = "6381bdfbab3f7a8ab6d6186eecb8b09635b2f49c1b3663adcff5c4dbe25e8d09";
const teacherAddress = "0xc39d22dC2d0A3Ca341CE8F69EFA563D113607688";
const studentAddress = "0x31d05d7a6130f3e8b149008ec70090022f9c9330";

async function initializeBlockchainData() {
  console.log("🚀 REAL Blockchain Data Initialization on Sepolia...\n");
  
  const infuraKey = process.env.INFURA_API_KEY;
  if (!infuraKey) {
    console.error("❌ INFURA_API_KEY not found");
    return;
  }
  
  try {
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${infuraKey}`);
    const wallet = new ethers.Wallet(teacherPrivateKey, provider);
    
    console.log("Connected with teacher account:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH\n");
    
    if (Number(ethers.formatEther(balance)) < 0.01) {
      console.error("❌ Insufficient balance. Need at least 0.01 ETH");
      console.log("Get Sepolia ETH from: https://sepoliafaucet.com/");
      return;
    }
    
    // Connect to contracts
    const accessControl = new ethers.Contract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI, wallet);
    const batchManagement = new ethers.Contract(CONTRACT_ADDRESSES.batchManagement, BATCH_MANAGEMENT_ABI, wallet);
    
    console.log("📋 Testing Contract Connection...");
    
    // Test if contracts are working
    try {
      // Test simple read call
      const code = await provider.getCode(CONTRACT_ADDRESSES.batchManagement);
      if (code === "0x") {
        console.error("❌ BatchManagement contract not deployed at:", CONTRACT_ADDRESSES.batchManagement);
        console.log("🔧 Need to deploy fresh contracts!");
        return;
      }
      console.log("✅ BatchManagement contract found");
      
      // Try to check if teacher is registered
      console.log("\n🔍 Checking current registration status...");
      let isTeacherRegistered = false;
      let isStudentRegistered = false;
      
      try {
        isTeacherRegistered = await accessControl.isTeacher(teacherAddress);
        console.log("Teacher registered:", isTeacherRegistered);
      } catch (error) {
        console.log("⚠️ Could not check teacher status:", error.message);
      }
      
      try {
        isStudentRegistered = await accessControl.isStudent(studentAddress);
        console.log("Student registered:", isStudentRegistered);
      } catch (error) {
        console.log("⚠️ Could not check student status:", error.message);
      }
      
      // Register users if needed
      if (!isTeacherRegistered) {
        console.log("\n📝 Registering teacher...");
        try {
          const tx1 = await accessControl.registerTeacher(teacherAddress, {
            gasLimit: 200000,
            gasPrice: ethers.parseUnits("20", "gwei")
          });
          console.log("Transaction sent:", tx1.hash);
          await tx1.wait();
          console.log("✅ Teacher registered successfully");
        } catch (error) {
          console.error("❌ Failed to register teacher:", error.message);
          // Continue anyway
        }
      }
      
      if (!isStudentRegistered) {
        console.log("\n📝 Registering student...");
        try {
          const tx2 = await accessControl.registerStudent(studentAddress, {
            gasLimit: 200000,
            gasPrice: ethers.parseUnits("20", "gwei")
          });
          console.log("Transaction sent:", tx2.hash);
          await tx2.wait();
          console.log("✅ Student registered successfully");
        } catch (error) {
          console.error("❌ Failed to register student:", error.message);
          // Continue anyway
        }
      }
      
      // Check existing batches
      console.log("\n📚 Checking existing batches...");
      let existingBatches = [];
      try {
        existingBatches = await batchManagement.getTeacherBatches(teacherAddress);
        console.log("Teacher has", existingBatches.length, "batches:", existingBatches.map(id => id.toString()));
      } catch (error) {
        console.log("⚠️ Could not fetch teacher batches:", error.message);
      }
      
      // Create batches if none exist
      if (existingBatches.length === 0) {
        console.log("\n🎯 Creating new batches...");
        
        try {
          console.log("Creating Batch 1: Blockchain Development Course");
          const tx3 = await batchManagement.createBatch("Blockchain Development Course", {
            gasLimit: 300000,
            gasPrice: ethers.parseUnits("20", "gwei")
          });
          console.log("Transaction sent:", tx3.hash);
          const receipt3 = await tx3.wait();
          console.log("✅ Batch 1 created, gas used:", receipt3.gasUsed.toString());
          
          // Wait a bit to avoid nonce issues
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          console.log("Creating Batch 2: Smart Contract Security");
          const tx4 = await batchManagement.createBatch("Smart Contract Security", {
            gasLimit: 300000,
            gasPrice: ethers.parseUnits("20", "gwei")
          });
          console.log("Transaction sent:", tx4.hash);
          const receipt4 = await tx4.wait();
          console.log("✅ Batch 2 created, gas used:", receipt4.gasUsed.toString());
          
          // Wait a bit
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Add student to batches
          console.log("\n👥 Adding student to batches...");
          
          const tx5 = await batchManagement.addStudentToBatch(1, studentAddress, {
            gasLimit: 200000,
            gasPrice: ethers.parseUnits("20", "gwei")
          });
          console.log("Transaction sent:", tx5.hash);
          await tx5.wait();
          console.log("✅ Student added to Batch 1");
          
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const tx6 = await batchManagement.addStudentToBatch(2, studentAddress, {
            gasLimit: 200000,
            gasPrice: ethers.parseUnits("20", "gwei")
          });
          console.log("Transaction sent:", tx6.hash);
          await tx6.wait();
          console.log("✅ Student added to Batch 2");
          
        } catch (error) {
          console.error("❌ Failed to create batches:", error.message);
        }
      } else {
        console.log("✅ Batches already exist on blockchain");
      }
      
      // Final verification
      console.log("\n🔍 Final Verification...");
      
      try {
        const teacherBatches = await batchManagement.getTeacherBatches(teacherAddress);
        console.log("✅ Teacher has", teacherBatches.length, "batches on blockchain");
        
        const studentBatches = await batchManagement.getStudentBatches(studentAddress);
        console.log("✅ Student enrolled in", studentBatches.length, "batches on blockchain");
        
        // Get batch details
        for (let i = 1; i <= 2; i++) {
          try {
            const batch = await batchManagement.getBatch(i);
            console.log(`\nBatch ${i}:`, {
              name: batch[1],
              teacher: batch[2],
              students: batch[3].length,
              active: batch[4]
            });
          } catch (e) {
            console.log(`Batch ${i} not found`);
          }
        }
        
      } catch (error) {
        console.log("⚠️ Verification failed:", error.message);
      }
      
    } catch (error) {
      console.error("❌ Contract interaction failed:", error.message);
      console.log("\n🔴 CONTRACTS APPEAR TO BE CORRUPTED!");
      console.log("Need to deploy fresh contracts with correct implementation");
    }
    
    console.log("\n🎉 Blockchain initialization complete!");
    console.log("✅ Refresh your app to see the blockchain data!");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Need more ETH. Get from: https://sepoliafaucet.com/");
    }
    if (error.message.includes("Too Many Requests")) {
      console.log("💡 Infura rate limit. Wait 5 minutes and try again.");
    }
  }
}

initializeBlockchainData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });