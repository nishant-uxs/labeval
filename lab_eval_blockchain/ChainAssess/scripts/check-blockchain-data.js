const hre = require("hardhat");

// Contract addresses (update these after deployment)
const CONTRACT_ADDRESSES = {
  accessControl: "0x6fC21092DA55B392b045eD78F4732bff3C580e2c",
  batchManagement: "0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66",
  assignmentSubmission: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  tokenReward: "0xBf447be6a0E79c061dbF9f6169d372a85a1Db16E"
};

async function main() {
  console.log("🔍 Checking Blockchain Data on Sepolia...\n");
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Connected with account:", signer.address);

  try {
    // Connect to BatchManagement contract
    const BatchManagement = await hre.ethers.getContractFactory("BatchManagement");
    const batchManagement = BatchManagement.attach(CONTRACT_ADDRESSES.batchManagement);
    
    // Check if contract is deployed
    const code = await signer.provider.getCode(CONTRACT_ADDRESSES.batchManagement);
    if (code === "0x") {
      console.error("❌ BatchManagement contract not deployed at address:", CONTRACT_ADDRESSES.batchManagement);
      console.log("🔧 Run: npx hardhat run scripts/deploy-and-init.js --network sepolia");
      return;
    }
    console.log("✅ BatchManagement contract found at:", CONTRACT_ADDRESSES.batchManagement);
    
    // Check teacher batches
    const teacherAddress = "0xc39d22dc2d0a3ca341ce8f69efa563d113607688";
    console.log("\n📚 Checking teacher batches for:", teacherAddress);
    
    try {
      const teacherBatches = await batchManagement.getTeacherBatches(teacherAddress);
      console.log("Teacher has", teacherBatches.length, "batches:", teacherBatches.map(id => id.toString()));
      
      // Get details of each batch
      for (const batchId of teacherBatches) {
        try {
          const batch = await batchManagement.getBatch(batchId);
          console.log(`\n  Batch ${batchId}:`);
          console.log(`    Name: ${batch[1]}`);
          console.log(`    Teacher: ${batch[2]}`);
          console.log(`    Students: ${batch[3].length} students`);
          console.log(`    Active: ${batch[4]}`);
        } catch (e) {
          console.log(`  ❌ Could not fetch batch ${batchId}:`, e.message);
        }
      }
    } catch (error) {
      console.error("❌ Could not fetch teacher batches:", error.message);
      console.log("   This means no batches exist on blockchain for this teacher");
    }
    
    // Check student batches
    const studentAddress = "0x31d05d7a6130f3e8b149008ec70090022f9c9330";
    console.log("\n🎓 Checking student batches for:", studentAddress);
    
    try {
      const studentBatches = await batchManagement.getStudentBatches(studentAddress);
      console.log("Student enrolled in", studentBatches.length, "batches:", studentBatches.map(id => id.toString()));
    } catch (error) {
      console.error("❌ Could not fetch student batches:", error.message);
      console.log("   This means no batches exist on blockchain for this student");
    }
    
    // Check total batches
    console.log("\n📊 Checking total batches...");
    try {
      const totalBatches = await batchManagement.getTotalBatches();
      console.log("Total batches on blockchain:", totalBatches.toString());
      
      if (Number(totalBatches) === 0) {
        console.log("\n⚠️ NO DATA ON BLOCKCHAIN!");
        console.log("🔧 To initialize blockchain data, run:");
        console.log("   npx hardhat run scripts/init-blockchain-data.js --network sepolia");
      }
    } catch (error) {
      console.log("❌ Could not get total batches:", error.message);
    }
    
    // Check AccessControl
    const AccessControl = await hre.ethers.getContractFactory("AccessControl");
    const accessControl = AccessControl.attach(CONTRACT_ADDRESSES.accessControl);
    
    console.log("\n🔐 Checking roles...");
    const isTeacher = await accessControl.isTeacher(teacherAddress);
    const isStudent = await accessControl.isStudent(studentAddress);
    
    console.log(`Teacher ${teacherAddress}: ${isTeacher ? "✅ Registered" : "❌ Not registered"}`);
    console.log(`Student ${studentAddress}: ${isStudent ? "✅ Registered" : "❌ Not registered"}`);
    
    if (!isTeacher || !isStudent) {
      console.log("\n⚠️ Users not registered!");
      console.log("🔧 To register users, run:");
      console.log("   npx hardhat run scripts/init-blockchain-data.js --network sepolia");
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
  
  console.log("\n✅ Check complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });