import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying ONLY BatchManagement contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Existing AccessControl address (keep same)
  const ACCESS_CONTROL_ADDRESS = "0xFB7c09E0d25577401cB98C9b29B0465243A97E5F";
  
  // Deploy new BatchManagement
  console.log("📚 Deploying updated BatchManagement contract (no student registration check)...");
  const BatchManagement = await hre.ethers.getContractFactory("BatchManagement");
  const batchManagement = await BatchManagement.deploy(ACCESS_CONTROL_ADDRESS);
  await batchManagement.waitForDeployment();
  const batchManagementAddress = await batchManagement.getAddress();
  console.log("✅ BatchManagement deployed to:", batchManagementAddress);

  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📋 NEW CONTRACT ADDRESS:");
  console.log("   BatchManagement: ", batchManagementAddress);
  
  console.log("\n⚠️  NEXT STEPS:");
  console.log("1. Update BATCH_MANAGEMENT_CONTRACT in .env");
  console.log("2. Update batchManagement address in client/src/lib/contracts.ts");
  console.log("3. Restart workflow");
  console.log("\n✨ Teachers can now add students directly without registration! ✨\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
