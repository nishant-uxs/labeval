const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying EduChain Smart Contracts to Sepolia...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance));

  // 1. Deploy AccessControl
  console.log("\n📝 Deploying AccessControl...");
  const AccessControl = await hre.ethers.getContractFactory("AccessControl");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("✅ AccessControl deployed to:", accessControlAddress);

  // 2. Deploy TokenReward
  console.log("\n🪙 Deploying TokenReward...");
  const TokenReward = await hre.ethers.getContractFactory("TokenReward");
  const tokenReward = await TokenReward.deploy(accessControlAddress);
  await tokenReward.waitForDeployment();
  const tokenRewardAddress = await tokenReward.getAddress();
  console.log("✅ TokenReward deployed to:", tokenRewardAddress);

  // 3. Deploy NFTReward
  console.log("\n🎨 Deploying NFTReward...");
  const NFTReward = await hre.ethers.getContractFactory("NFTReward");
  const nftReward = await NFTReward.deploy(accessControlAddress);
  await nftReward.waitForDeployment();
  const nftRewardAddress = await nftReward.getAddress();
  console.log("✅ NFTReward deployed to:", nftRewardAddress);

  // 4. Deploy BatchManagement
  console.log("\n📚 Deploying BatchManagement...");
  const BatchManagement = await hre.ethers.getContractFactory("BatchManagement");
  const batchManagement = await BatchManagement.deploy(accessControlAddress);
  await batchManagement.waitForDeployment();
  const batchManagementAddress = await batchManagement.getAddress();
  console.log("✅ BatchManagement deployed to:", batchManagementAddress);

  // 5. Deploy AssignmentSubmission
  console.log("\n📝 Deploying AssignmentSubmission...");
  const AssignmentSubmission = await hre.ethers.getContractFactory("AssignmentSubmission");
  const assignmentSubmission = await AssignmentSubmission.deploy(
    accessControlAddress,
    tokenRewardAddress,
    nftRewardAddress,
    batchManagementAddress
  );
  await assignmentSubmission.waitForDeployment();
  const assignmentSubmissionAddress = await assignmentSubmission.getAddress();
  console.log("✅ AssignmentSubmission deployed to:", assignmentSubmissionAddress);

  // 6. Grant necessary roles
  console.log("\n🔐 Setting up roles...");
  
  // Grant MINTER_ROLE to AssignmentSubmission contract
  await tokenReward.grantRole(await tokenReward.MINTER_ROLE(), assignmentSubmissionAddress);
  console.log("✅ Granted MINTER_ROLE to AssignmentSubmission");
  
  await nftReward.grantRole(await nftReward.MINTER_ROLE(), assignmentSubmissionAddress);
  console.log("✅ Granted NFT MINTER_ROLE to AssignmentSubmission");

  // Initialize with sample data
  console.log("\n📊 Initializing with sample data...");
  
  // Register deployer as admin
  await accessControl.grantAdminRole(deployer.address);
  console.log("✅ Registered deployer as admin");
  
  // Register test teacher
  const teacherAddress = "0xc39d22dc2d0a3ca341ce8f69efa563d113607688";
  await accessControl.grantTeacherRole(teacherAddress);
  console.log("✅ Registered test teacher:", teacherAddress);
  
  // Register test student
  const studentAddress = "0x31d05d7a6130f3e8b149008ec70090022f9c9330";
  await accessControl.grantStudentRole(studentAddress);
  console.log("✅ Registered test student:", studentAddress);

  console.log("\n🎉 Deployment Complete!");
  console.log("================================");
  console.log("Contract Addresses:");
  console.log("AccessControl:", accessControlAddress);
  console.log("TokenReward:", tokenRewardAddress);
  console.log("NFTReward:", nftRewardAddress);
  console.log("BatchManagement:", batchManagementAddress);
  console.log("AssignmentSubmission:", assignmentSubmissionAddress);
  console.log("================================");
  
  console.log("\n⚠️  IMPORTANT: Update these addresses in:");
  console.log("1. client/src/lib/contracts.ts");
  console.log("2. server/blockchain-service.ts");
  
  // Verify contracts on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    await hre.run("verify:verify", {
      address: accessControlAddress,
      constructorArguments: [],
    });
    
    await hre.run("verify:verify", {
      address: tokenRewardAddress,
      constructorArguments: [accessControlAddress],
    });
    
    await hre.run("verify:verify", {
      address: batchManagementAddress,
      constructorArguments: [accessControlAddress],
    });
    
    console.log("✅ Contracts verified on Etherscan");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });