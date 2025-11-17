const hre = require("hardhat");

// Contract addresses (update these after deployment)
const CONTRACT_ADDRESSES = {
  accessControl: "0x6fC21092DA55B392b045eD78F4732bff3C580e2c",
  batchManagement: "0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66",
  assignmentSubmission: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  tokenReward: "0xBf447be6a0E79c061dbF9f6169d372a85a1Db16E"
};

async function main() {
  console.log("🚀 Initializing Blockchain Data...");
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Operating with account:", signer.address);

  // Connect to deployed contracts
  const BatchManagement = await hre.ethers.getContractFactory("BatchManagement");
  const batchManagement = BatchManagement.attach(CONTRACT_ADDRESSES.batchManagement);
  
  const AccessControl = await hre.ethers.getContractFactory("AccessControl");
  const accessControl = AccessControl.attach(CONTRACT_ADDRESSES.accessControl);
  
  const AssignmentSubmission = await hre.ethers.getContractFactory("AssignmentSubmission");
  const assignmentSubmission = AssignmentSubmission.attach(CONTRACT_ADDRESSES.assignmentSubmission);

  try {
    // Step 1: Register users if not already registered
    console.log("\n📝 Registering users...");
    
    const teacherAddress = "0xc39d22dc2d0a3ca341ce8f69efa563d113607688";
    const studentAddress = "0x31d05d7a6130f3e8b149008ec70090022f9c9330";
    
    // Check and register teacher
    const isTeacher = await accessControl.isTeacher(teacherAddress);
    if (!isTeacher) {
      const tx1 = await accessControl.grantTeacherRole(teacherAddress);
      await tx1.wait();
      console.log("✅ Registered teacher:", teacherAddress);
    } else {
      console.log("ℹ️ Teacher already registered:", teacherAddress);
    }
    
    // Check and register student
    const isStudent = await accessControl.isStudent(studentAddress);
    if (!isStudent) {
      const tx2 = await accessControl.grantStudentRole(studentAddress);
      await tx2.wait();
      console.log("✅ Registered student:", studentAddress);
    } else {
      console.log("ℹ️ Student already registered:", studentAddress);
    }

    // Step 2: Create batches (as teacher)
    console.log("\n📚 Creating batches...");
    
    // Note: For this to work, the signer must be the teacher address
    // Or you need to impersonate the teacher account
    
    if (signer.address.toLowerCase() === teacherAddress.toLowerCase()) {
      // Create Batch 1
      const tx3 = await batchManagement.createBatch("Blockchain Development Course");
      const receipt3 = await tx3.wait();
      const batchId1 = receipt3.logs[0].args[0];
      console.log("✅ Created Batch 1 with ID:", batchId1.toString());
      
      // Create Batch 2
      const tx4 = await batchManagement.createBatch("Smart Contract Security");
      const receipt4 = await tx4.wait();
      const batchId2 = receipt4.logs[0].args[0];
      console.log("✅ Created Batch 2 with ID:", batchId2.toString());
      
      // Add student to both batches
      console.log("\n👥 Adding student to batches...");
      
      const tx5 = await batchManagement.addStudentToBatch(batchId1, studentAddress);
      await tx5.wait();
      console.log("✅ Added student to Batch 1");
      
      const tx6 = await batchManagement.addStudentToBatch(batchId2, studentAddress);
      await tx6.wait();
      console.log("✅ Added student to Batch 2");
      
      // Create assignments for batches
      console.log("\n📝 Creating assignments...");
      
      const deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
      
      const tx7 = await assignmentSubmission.createAssignment(
        "Smart Contract Development Lab 1",
        "Build and deploy your first smart contract",
        "QmSampleIPFSHash1",
        deadline,
        100, // 100 tokens reward
        batchId1
      );
      await tx7.wait();
      console.log("✅ Created assignment for Batch 1");
      
      const tx8 = await assignmentSubmission.createAssignment(
        "Security Audit Exercise",
        "Find vulnerabilities in the provided smart contract",
        "QmSampleIPFSHash2",
        deadline,
        150, // 150 tokens reward
        batchId2
      );
      await tx8.wait();
      console.log("✅ Created assignment for Batch 2");
      
    } else {
      console.log("⚠️ Warning: Current signer is not the teacher address.");
      console.log("   To create batches and assignments, run this script with the teacher's private key.");
      console.log("   Teacher address:", teacherAddress);
      console.log("   Current signer:", signer.address);
    }

    console.log("\n🎉 Blockchain data initialization complete!");
    
    // Verify the data
    console.log("\n🔍 Verifying data...");
    
    // Check student's batches
    const studentBatches = await batchManagement.getStudentBatches(studentAddress);
    console.log("Student batches:", studentBatches.map(id => id.toString()));
    
    // Check teacher's batches
    const teacherBatches = await batchManagement.getTeacherBatches(teacherAddress);
    console.log("Teacher batches:", teacherBatches.map(id => id.toString()));
    
  } catch (error) {
    console.error("❌ Error:", error);
    
    if (error.message?.includes("only admin")) {
      console.log("\n⚠️ You need admin privileges to register users.");
      console.log("   Make sure you're using the admin account that deployed the contracts.");
    }
    
    if (error.message?.includes("only teacher")) {
      console.log("\n⚠️ You need teacher privileges to create batches.");
      console.log("   Make sure you're using the teacher account:", teacherAddress);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });