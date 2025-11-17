const { ethers } = require('ethers');

// Real deployed contract addresses
const CONTRACT_ADDRESSES = {
  batchManagement: "0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66"
};

// Correct ABI for student operations
const BATCH_MANAGEMENT_ABI = [
  "function addStudentToBatch(uint256 _batchId, address _student) external",
  "function batches(uint256 id) external view returns (uint256 id, string name, address teacher, bool isActive, uint256 createdAt, uint256 updatedAt)",
  "function studentInBatch(address student, uint256 batchId) external view returns (bool)"
];

// Real teacher and student addresses
const teacherPrivateKey = "6381bdfbab3f7a8ab6d6186eecb8b09635b2f49c1b3663adcff5c4dbe25e8d09";
const studentAddress = "0x31d05d7a6130f3e8b149008ec70090022f9c9330";

async function addStudentToBatches() {
  console.log("🚀 ADDING Student to Batches on Real Blockchain...\n");
  
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
    
    // Connect to batch management contract
    const batchManagement = new ethers.Contract(CONTRACT_ADDRESSES.batchManagement, BATCH_MANAGEMENT_ABI, wallet);
    
    // Target batch IDs to add student to
    const targetBatchIds = [9, 10];
    
    for (const batchId of targetBatchIds) {
      try {
        console.log(`\n📚 Processing Batch ${batchId}...`);
        
        // Check if batch exists
        const batch = await batchManagement.batches(batchId);
        if (!batch || !batch[1] || batch[1] === '') {
          console.log(`Batch ${batchId} does not exist or inactive`);
          continue;
        }
        
        console.log(`Batch ${batchId}: "${batch[1]}"`);
        
        // Check if student is already in this batch
        let isInBatch = false;
        try {
          isInBatch = await batchManagement.studentInBatch(studentAddress, batchId);
          console.log(`Student already in batch ${batchId}:`, isInBatch);
        } catch (error) {
          console.log(`⚠️ Could not check student status:`, error.message);
        }
        
        // Add student to batch if not already added
        if (!isInBatch) {
          console.log(`Adding student to batch ${batchId}...`);
          try {
            const tx = await batchManagement.addStudentToBatch(batchId, studentAddress, {
              gasLimit: 200000,
              gasPrice: ethers.parseUnits("30", "gwei")
            });
            console.log("Transaction sent:", tx.hash);
            const receipt = await tx.wait();
            console.log(`✅ Student added to batch ${batchId}`);
            console.log(`Gas used: ${receipt.gasUsed.toString()}`);
            
            // Wait between transactions
            await new Promise(resolve => setTimeout(resolve, 15000));
          } catch (error) {
            console.error(`❌ Failed to add student to batch ${batchId}:`, error.message);
          }
        } else {
          console.log(`✅ Student already in batch ${batchId}`);
        }
      } catch (error) {
        console.error(`❌ Error with batch ${batchId}:`, error.message);
      }
    }
    
    // Final verification
    console.log("\n🔍 Final Verification...");
    for (const batchId of targetBatchIds) {
      try {
        const isInBatch = await batchManagement.studentInBatch(studentAddress, batchId);
        console.log(`Batch ${batchId}: Student enrolled = ${isInBatch}`);
      } catch (error) {
        console.log(`Batch ${batchId}: Could not verify (${error.message})`);
      }
    }
    
    console.log("\n🎉 Student added to blockchain batches!");
    console.log("💡 Student should now see batches in dashboard");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

addStudentToBatches()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });