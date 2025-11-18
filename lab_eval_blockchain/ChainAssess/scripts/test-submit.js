import hre from "hardhat";

async function main() {
  const ASSIGNMENT_SUBMISSION = "0xf39A62a69222ad7F51217AFedd46178e7926039d";
  
  const AssignmentSubmission = await hre.ethers.getContractAt(
    "AssignmentSubmission",
    ASSIGNMENT_SUBMISSION
  );
  
  // Get the contract code to verify it's deployed
  const code = await hre.ethers.provider.getCode(ASSIGNMENT_SUBMISSION);
  console.log("Contract deployed:", code !== "0x");
  console.log("Code length:", code.length);
  
  // Try to read assignment 1
  try {
    const assignment = await AssignmentSubmission.getAssignment(1);
    console.log("\nAssignment 1 details:");
    console.log("Title:", assignment.title);
    console.log("BatchId:", assignment.batchId.toString());
  } catch (error) {
    console.log("Error reading assignment:", error.message);
  }
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
