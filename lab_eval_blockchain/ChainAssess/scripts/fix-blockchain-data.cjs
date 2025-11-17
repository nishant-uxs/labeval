const { ethers } = require('ethers');

// Real deployed contract addresses
const CONTRACT_ADDRESSES = {
  accessControl: "0x6fC21092DA55B392b045eD78F4732bff3C580e2c",
  batchManagement: "0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66",
  assignmentSubmission: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  tokenReward: "0xBf447be6a0E79c061dbF9f6169d372a85a1Db16E"
};

// Correct ABIs from contract source
const ACCESS_CONTROL_ABI = [
  "function grantRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function TEACHER_ROLE() external view returns (bytes32)",
  "function STUDENT_ROLE() external view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)"
];

const BATCH_MANAGEMENT_ABI = [
  "function createBatch(string memory _name) external returns (uint256)",
  "function addStudentToBatch(uint256 _batchId, address _student) external",
  "function removeStudentFromBatch(uint256 _batchId, address _student) external",
  "function getBatch(uint256 _batchId) external view returns (tuple(uint256 id, string name, address teacher, address[] students, bool isActive, uint256 createdAt, uint256 updatedAt))",
  "function batches(uint256 id) external view returns (uint256 id, string name, address teacher, bool isActive, uint256 createdAt, uint256 updatedAt)",
  "function teacherBatches(address teacher, uint256 index) external view returns (uint256)",
  "function studentInBatch(address student, uint256 batchId) external view returns (bool)",
  "function nextBatchId() external view returns (uint256)"
];

// Teacher credentials for real data creation
const teacherPrivateKey = "6381bdfbab3f7a8ab6d6186eecb8b09635b2f49c1b3663adcff5c4dbe25e8d09";
const teacherAddress = "0xc39d22dC2d0A3Ca341CE8F69EFA563D113607688";
const studentAddress = "0x31d05d7a6130f3e8b149008ec70090022f9c9330";

async function fixBlockchainData() {
  console.log("🔧 FIXING Blockchain Data with Correct ABIs...\n");
  
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
    
    // Connect to contracts with correct ABIs
    const accessControl = new ethers.Contract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI, wallet);
    const batchManagement = new ethers.Contract(CONTRACT_ADDRESSES.batchManagement, BATCH_MANAGEMENT_ABI, wallet);
    
    console.log("📋 Using Correct Contract ABIs...");
    
    // Get role constants
    let teacherRole, studentRole, adminRole;
    try {
      teacherRole = await accessControl.TEACHER_ROLE();
      studentRole = await accessControl.STUDENT_ROLE();
      adminRole = await accessControl.DEFAULT_ADMIN_ROLE();
      console.log("✅ Role constants fetched");
      console.log("Teacher Role:", teacherRole);
      console.log("Student Role:", studentRole);
      console.log("Admin Role:", adminRole);
    } catch (error) {
      console.log("⚠️ Using hardcoded role constants");
      teacherRole = ethers.keccak256(ethers.toUtf8Bytes("TEACHER_ROLE"));
      studentRole = ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE"));
      adminRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
    }
    
    // Check current roles
    console.log("\n🔍 Checking current role assignments...");
    
    let isTeacher = false;
    let isStudent = false;
    try {
      isTeacher = await accessControl.hasRole(teacherRole, teacherAddress);
      console.log("Teacher has teacher role:", isTeacher);
    } catch (error) {
      console.log("⚠️ Could not check teacher role:", error.message);
    }
    
    try {
      isStudent = await accessControl.hasRole(studentRole, studentAddress);
      console.log("Student has student role:", isStudent);
    } catch (error) {
      console.log("⚠️ Could not check student role:", error.message);
    }
    
    // Grant roles if needed
    if (!isTeacher) {
      console.log("\n📝 Granting teacher role...");
      try {
        const tx1 = await accessControl.grantRole(teacherRole, teacherAddress, {
          gasLimit: 100000,
          gasPrice: ethers.parseUnits("20", "gwei")
        });
        console.log("Transaction sent:", tx1.hash);
        await tx1.wait();
        console.log("✅ Teacher role granted");
      } catch (error) {
        console.error("❌ Failed to grant teacher role:", error.message);
      }
    }
    
    if (!isStudent) {
      console.log("\n📝 Granting student role...");
      try {
        const tx2 = await accessControl.grantRole(studentRole, studentAddress, {
          gasLimit: 100000,
          gasPrice: ethers.parseUnits("20", "gwei")
        });
        console.log("Transaction sent:", tx2.hash);
        await tx2.wait();
        console.log("✅ Student role granted");
      } catch (error) {
        console.error("❌ Failed to grant student role:", error.message);
      }
    }
    
    // Check existing batches by scanning
    console.log("\n📚 Scanning for existing batches...");
    let existingBatches = [];
    let nextBatchId = 1;
    
    try {
      nextBatchId = await batchManagement.nextBatchId();
      console.log("Next batch ID:", nextBatchId.toString());
      
      // Scan existing batches
      for (let i = 1; i < nextBatchId; i++) {
        try {
          const batchExists = await batchManagement.batches(i);
          if (batchExists && batchExists[1]) { // Check if name exists
            existingBatches.push({
              id: Number(batchExists[0]),
              name: batchExists[1],
              teacher: batchExists[2],
              isActive: batchExists[3]
            });
            console.log(`Found batch ${i}:`, batchExists[1]);
          }
        } catch (e) {
          console.log(`Batch ${i} not found or inactive`);
        }
      }
    } catch (error) {
      console.log("⚠️ Could not fetch nextBatchId:", error.message);
    }
    
    console.log(`Found ${existingBatches.length} existing batches`);
    
    // Create batches if none exist
    if (existingBatches.length === 0) {
      console.log("\n🎯 Creating new batches with correct calls...");
      
      try {
        console.log("Creating Batch 1: Blockchain Development Course");
        const tx3 = await batchManagement.createBatch("Blockchain Development Course", {
          gasLimit: 300000,
          gasPrice: ethers.parseUnits("25", "gwei")
        });
        console.log("Transaction sent:", tx3.hash);
        const receipt3 = await tx3.wait();
        console.log("✅ Batch 1 created, gas used:", receipt3.gasUsed.toString());
        
        // Wait between transactions
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log("Creating Batch 2: Smart Contract Security");
        const tx4 = await batchManagement.createBatch("Smart Contract Security", {
          gasLimit: 300000,
          gasPrice: ethers.parseUnits("25", "gwei")
        });
        console.log("Transaction sent:", tx4.hash);
        const receipt4 = await tx4.wait();
        console.log("✅ Batch 2 created, gas used:", receipt4.gasUsed.toString());
        
        // Wait before adding students
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Add student to batches
        console.log("\n👥 Adding student to batches...");
        
        const tx5 = await batchManagement.addStudentToBatch(1, studentAddress, {
          gasLimit: 200000,
          gasPrice: ethers.parseUnits("25", "gwei")
        });
        console.log("Transaction sent:", tx5.hash);
        await tx5.wait();
        console.log("✅ Student added to Batch 1");
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const tx6 = await batchManagement.addStudentToBatch(2, studentAddress, {
          gasLimit: 200000,
          gasPrice: ethers.parseUnits("25", "gwei")
        });
        console.log("Transaction sent:", tx6.hash);
        await tx6.wait();
        console.log("✅ Student added to Batch 2");
        
      } catch (error) {
        console.error("❌ Failed to create/manage batches:", error.message);
        console.log("Reason might be:", error.reason || "Unknown");
      }
    } else {
      console.log("✅ Batches already exist on blockchain");
      
      // Try to add student to existing batches if not already added
      for (const batch of existingBatches) {
        try {
          const isInBatch = await batchManagement.studentInBatch(studentAddress, batch.id);
          if (!isInBatch) {
            console.log(`Adding student to existing batch ${batch.id}...`);
            const tx = await batchManagement.addStudentToBatch(batch.id, studentAddress, {
              gasLimit: 200000,
              gasPrice: ethers.parseUnits("25", "gwei")
            });
            await tx.wait();
            console.log(`✅ Student added to batch ${batch.id}`);
          } else {
            console.log(`✅ Student already in batch ${batch.id}`);
          }
        } catch (error) {
          console.log(`⚠️ Could not check/add student to batch ${batch.id}:`, error.message);
        }
      }
    }
    
    // Final verification with correct methods
    console.log("\n🔍 Final Verification with Direct Contract Calls...");
    
    try {
      // Check next batch ID
      const finalNextId = await batchManagement.nextBatchId();
      console.log("Final next batch ID:", finalNextId.toString());
      
      // Check each batch directly
      for (let i = 1; i < finalNextId; i++) {
        try {
          const batch = await batchManagement.batches(i);
          if (batch && batch[1]) {
            console.log(`Batch ${i}:`, {
              name: batch[1],
              teacher: batch[2],
              active: batch[3]
            });
            
            // Check if student is in this batch
            const studentInBatch = await batchManagement.studentInBatch(studentAddress, i);
            console.log(`  Student in batch ${i}:`, studentInBatch);
          }
        } catch (e) {
          console.log(`Batch ${i} verification failed:`, e.message);
        }
      }
      
    } catch (error) {
      console.log("⚠️ Final verification failed:", error.message);
    }
    
    console.log("\n🎉 Blockchain data fix attempt complete!");
    console.log("💡 If issues persist, contracts may need redeployment with verified source code");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

fixBlockchainData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });