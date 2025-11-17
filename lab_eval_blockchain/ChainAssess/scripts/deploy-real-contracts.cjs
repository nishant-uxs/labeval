const { ethers } = require('ethers');
const fs = require('fs');

// Contract ABIs and Bytecodes
const CONTRACT_BYTECODES = require('../artifacts/contracts/AccessControl.sol/EduChainAccessControl.json');
const BATCH_BYTECODE = require('../artifacts/contracts/BatchManagement.sol/BatchManagement.json');
const TOKEN_BYTECODE = require('../artifacts/contracts/TokenReward.sol/EduChainToken.json');
const ASSIGNMENT_BYTECODE = require('../artifacts/contracts/AssignmentSubmission.sol/AssignmentSubmission.json');

// Teacher credentials
const teacherPrivateKey = "6381bdfbab3f7a8ab6d6186eecb8b09635b2f49c1b3663adcff5c4dbe25e8d09";
const teacherAddress = "0xc39d22dC2d0A3Ca341CE8F69EFA563D113607688";
const studentAddress = "0x31d05d7a6130f3e8b149008ec70090022f9c9330";

async function deployAndInitialize() {
  console.log("🚀 REAL Blockchain Deployment Starting...\n");
  
  const infuraKey = process.env.INFURA_API_KEY;
  if (!infuraKey) {
    console.error("❌ INFURA_API_KEY not found");
    return;
  }
  
  try {
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${infuraKey}`);
    const wallet = new ethers.Wallet(teacherPrivateKey, provider);
    
    console.log("Deploying from account:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    if (Number(ethers.formatEther(balance)) < 0.01) {
      console.error("❌ Insufficient balance. Need at least 0.01 ETH");
      return;
    }
    
    console.log("\n📝 Step 1: Deploy AccessControl Contract...");
    const AccessControlFactory = new ethers.ContractFactory(
      CONTRACT_BYTECODES.abi,
      CONTRACT_BYTECODES.bytecode,
      wallet
    );
    const accessControl = await AccessControlFactory.deploy(wallet.address);
    await accessControl.waitForDeployment();
    const accessControlAddress = await accessControl.getAddress();
    console.log("✅ AccessControl deployed:", accessControlAddress);
    
    console.log("\n📚 Step 2: Deploy BatchManagement Contract...");
    const BatchFactory = new ethers.ContractFactory(
      BATCH_BYTECODE.abi,
      BATCH_BYTECODE.bytecode,
      wallet
    );
    const batchManagement = await BatchFactory.deploy(accessControlAddress);
    await batchManagement.waitForDeployment();
    const batchAddress = await batchManagement.getAddress();
    console.log("✅ BatchManagement deployed:", batchAddress);
    
    console.log("\n🪙 Step 3: Deploy TokenReward Contract...");
    const TokenFactory = new ethers.ContractFactory(
      TOKEN_BYTECODE.abi,
      TOKEN_BYTECODE.bytecode,
      wallet
    );
    const tokenReward = await TokenFactory.deploy(accessControlAddress, wallet.address);
    await tokenReward.waitForDeployment();
    const tokenAddress = await tokenReward.getAddress();
    console.log("✅ TokenReward deployed:", tokenAddress);
    
    console.log("\n📝 Step 4: Deploy AssignmentSubmission Contract...");
    const AssignmentFactory = new ethers.ContractFactory(
      ASSIGNMENT_BYTECODE.abi,
      ASSIGNMENT_BYTECODE.bytecode,
      wallet
    );
    const assignmentSubmission = await AssignmentFactory.deploy(accessControlAddress);
    await assignmentSubmission.waitForDeployment();
    const assignmentAddress = await assignmentSubmission.getAddress();
    console.log("✅ AssignmentSubmission deployed:", assignmentAddress);
    
    console.log("\n🔧 Step 5: Initialize Roles...");
    
    // Register teacher
    console.log("Registering teacher...");
    const tx1 = await accessControl.registerTeacher(teacherAddress);
    await tx1.wait();
    console.log("✅ Teacher registered");
    
    // Register student
    console.log("Registering student...");
    const tx2 = await accessControl.registerStudent(studentAddress);
    await tx2.wait();
    console.log("✅ Student registered");
    
    console.log("\n📦 Step 6: Create Initial Batches...");
    
    // Create batch 1
    console.log("Creating Batch 1...");
    const tx3 = await batchManagement.createBatch("Blockchain Development Course");
    const receipt3 = await tx3.wait();
    console.log("✅ Batch 1 created");
    
    // Create batch 2
    console.log("Creating Batch 2...");
    const tx4 = await batchManagement.createBatch("Smart Contract Security");
    const receipt4 = await tx4.wait();
    console.log("✅ Batch 2 created");
    
    // Add student to batches
    console.log("\nAdding student to batches...");
    const tx5 = await batchManagement.addStudentToBatch(1, studentAddress);
    await tx5.wait();
    console.log("✅ Student added to Batch 1");
    
    const tx6 = await batchManagement.addStudentToBatch(2, studentAddress);
    await tx6.wait();
    console.log("✅ Student added to Batch 2");
    
    // Save contract addresses
    const contractAddresses = {
      accessControl: accessControlAddress,
      batchManagement: batchAddress,
      assignmentSubmission: assignmentAddress,
      tokenReward: tokenAddress,
      nftReward: "0x0000000000000000000000000000000000000000", // Not deployed yet
      deployedAt: new Date().toISOString(),
      network: "sepolia",
      deployer: wallet.address
    };
    
    fs.writeFileSync(
      'deployed-addresses.json',
      JSON.stringify(contractAddresses, null, 2)
    );
    
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("\n📋 Contract Addresses:");
    console.log(JSON.stringify(contractAddresses, null, 2));
    
    console.log("\n✅ Next Steps:");
    console.log("1. Update client/src/lib/constants.ts with new addresses");
    console.log("2. Update server/blockchain-service.ts with new addresses");
    console.log("3. Restart the application");
    
    return contractAddresses;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Need more ETH. Get from: https://sepoliafaucet.com/");
    }
  }
}

deployAndInitialize()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });