const { ethers } = require('ethers');

// Real deployed contract addresses
const CONTRACT_ADDRESSES = {
  batchManagement: "0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66"
};

// Correct ABI for student operations
const BATCH_MANAGEMENT_ABI = [
  "function addStudentToBatch(uint256 _batchId, address _student) external",
  "function removeStudentFromBatch(uint256 _batchId, address _student) external",
  "function batches(uint256 id) external view returns (uint256 id, string name, address teacher, bool isActive, uint256 createdAt, uint256 updatedAt)",
  "function studentInBatch(address student, uint256 batchId) external view returns (bool)",
  "function nextBatchId() external view returns (uint256)"
];

// Real teacher and student addresses
const teacherPrivateKey = "6381bdfbab3f7a8ab6d6186eecb8b09635b2f49c1b3663adcff5c4dbe25e8d09";
const teacherAddress = "0xc39d22dC2d0A3Ca341CE8F69EFA563D113607688";
const studentAddress = "0x31d05d7a6130f3e8b149008ec70090022f9c9330";

async function fixStudentBatchData() {
  console.log("🔧 FIXING Student-Batch Data on Real Blockchain...\n");
  
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
    
    console.log("📋 Fixing Student-Batch Relationships...");
    
    // Get next batch ID to scan existing batches
    let nextBatchId = 13; // From previous logs
    try {
      nextBatchId = await batchManagement.nextBatchId();
      console.log("Next batch ID:", nextBatchId.toString());
    } catch (error) {
      console.log("⚠️ Using hardcoded nextBatchId:", nextBatchId);
    }
    
    // Check and add student to each active batch
    for (let batchId = 9; batchId <= Math.min(12, nextBatchId - 1); batchId++) {
      try {
        console.log(`\n📚 Processing Batch ${batchId}...`);
        
        // Check if batch exists
        const batch = await batchManagement.batches(batchId);
        if (!batch || !batch[1] || batch[1] === '') {
          console.log(`Batch ${batchId} does not exist or inactive`);
          continue;
        }
        
        console.log(`Batch ${batchId}: "${batch[1]}" by ${batch[2]}`);
        
        // Check if student is already in this batch
        let isInBatch = false;
        try {
          isInBatch = await batchManagement.studentInBatch(studentAddress, batchId);
          console.log(`Student in batch ${batchId}:`, isInBatch);
        } catch (error) {
          console.log(`⚠️ Could not check if student is in batch ${batchId}:`, error.message);
        }
        
        // Add student to batch if not already added
        if (!isInBatch) {
          console.log(`Adding student to batch ${batchId}...`);
          try {
            const tx = await batchManagement.addStudentToBatch(batchId, studentAddress, {
              gasLimit: 200000,
              gasPrice: ethers.parseUnits("25", "gwei")
            });
            console.log("Transaction sent:", tx.hash);
            const receipt = await tx.wait();
            console.log(`✅ Student added to batch ${batchId}, gas used:`, receipt.gasUsed.toString());
            
            // Wait between transactions
            await new Promise(resolve => setTimeout(resolve, 10000));
          } catch (error) {
            console.error(`❌ Failed to add student to batch ${batchId}:`, error.message);
            if (error.message.includes('already in batch')) {
              console.log(`✅ Student already in batch ${batchId} (contract says so)`);
            }
          }
        } else {
          console.log(`✅ Student already in batch ${batchId}`);
        }
      } catch (error) {
        console.error(`❌ Error processing batch ${batchId}:`, error.message);
      }
    }
    
    // Final verification
    console.log("\n🔍 Final Verification of Student-Batch Relationships...");
    
    for (let batchId = 9; batchId <= Math.min(12, nextBatchId - 1); batchId++) {
      try {
        const batch = await batchManagement.batches(batchId);
        if (batch && batch[1] && batch[1] !== '') {
          const isInBatch = await batchManagement.studentInBatch(studentAddress, batchId);
          console.log(`Batch ${batchId} ("${batch[1]}"): Student enrolled = ${isInBatch}`);
        }
      } catch (error) {
        console.log(`Batch ${batchId}: Could not verify (${error.message})`);
      }
    }
    
    console.log("\n🎉 Student-Batch data fix completed!");
    console.log("💡 Student should now see batches in their dashboard");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

fixStudentBatchData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });