import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSDK } from '@metamask/sdk-react';
import { 
  CONTRACT_ADDRESSES, 
  SEPOLIA_CONFIG, 
  ASSIGNMENT_SUBMISSION_ABI, 
  TOKEN_REWARD_ABI, 
  NFT_REWARD_ABI,
  BATCH_MANAGEMENT_ABI 
} from '@/lib/contracts';

export function useContracts() {
  const { provider, connected, account } = useSDK();
  const [contracts, setContracts] = useState<{
    assignmentSubmission: ethers.Contract | null;
    tokenReward: ethers.Contract | null;
    nftReward: ethers.Contract | null;
    batchManagement: ethers.Contract | null;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
  }>({
    assignmentSubmission: null,
    tokenReward: null,
    nftReward: null,
    batchManagement: null,
    provider: null,
    signer: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeContracts() {
      if (!connected || !account || !provider) {
        setContracts({
          assignmentSubmission: null,
          tokenReward: null,
          nftReward: null,
          batchManagement: null,
          provider: null,
          signer: null
        });
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Create provider and signer
        const ethersProvider = new ethers.BrowserProvider(provider as any);
        const signer = await ethersProvider.getSigner();

        // Check if we're on Sepolia
        const network = await ethersProvider.getNetwork();
        if (Number(network.chainId) !== SEPOLIA_CONFIG.chainId) {
          throw new Error(`Please switch to Sepolia testnet (Chain ID: ${SEPOLIA_CONFIG.chainId})`);
        }

        // Initialize contracts
        const assignmentSubmission = new ethers.Contract(
          CONTRACT_ADDRESSES.assignmentSubmission,
          ASSIGNMENT_SUBMISSION_ABI,
          signer
        );

        const tokenReward = new ethers.Contract(
          CONTRACT_ADDRESSES.tokenReward,
          TOKEN_REWARD_ABI,
          signer
        );

        const nftReward = new ethers.Contract(
          CONTRACT_ADDRESSES.nftReward,
          NFT_REWARD_ABI,
          signer
        );

        const batchManagement = new ethers.Contract(
          CONTRACT_ADDRESSES.batchManagement,
          BATCH_MANAGEMENT_ABI,
          signer
        );

        setContracts({
          assignmentSubmission,
          tokenReward,
          nftReward,
          batchManagement,
          provider: ethersProvider,
          signer
        });

      } catch (err) {
        console.error('Failed to initialize contracts:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize contracts');
      } finally {
        setIsLoading(false);
      }
    }

    initializeContracts();
  }, [connected, account, provider]);

  // Helper functions for contract interactions
  const submitAssignment = async (ipfsHash: string, title: string, description: string) => {
    if (!contracts.assignmentSubmission) throw new Error('Contract not initialized');
    
    const tx = await contracts.assignmentSubmission.submitAssignment(ipfsHash, title, description);
    return await tx.wait();
  };

  const reviewSubmission = async (submissionId: number, grade: number, issueToken: boolean, issueNFT: boolean) => {
    if (!contracts.assignmentSubmission) throw new Error('Contract not initialized');
    
    const tx = await contracts.assignmentSubmission.reviewSubmission(submissionId, grade, issueToken, issueNFT);
    return await tx.wait();
  };

  const getTokenBalance = async (address: string) => {
    if (!contracts.tokenReward) throw new Error('Contract not initialized');
    
    const balance = await contracts.tokenReward.balanceOf(address);
    return ethers.formatUnits(balance, 18);
  };

  const getNFTBalance = async (address: string) => {
    if (!contracts.nftReward) throw new Error('Contract not initialized');
    
    const balance = await contracts.nftReward.balanceOf(address);
    return Number(balance);
  };

  // Batch Management Functions
  const createBatch = async (name: string) => {
    if (!contracts.batchManagement) throw new Error('BatchManagement contract not initialized');
    
    console.log('🚀 Creating batch with name:', name);
    console.log('📍 Contract address:', CONTRACT_ADDRESSES.batchManagement);
    
    // Direct contract call - no fallbacks, real blockchain only
    const tx = await contracts.batchManagement.createBatch(name);
    console.log('📝 Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed:', receipt);
    
    // Extract batch ID from events
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contracts.batchManagement!.interface.parseLog(log);
        return parsed?.name === 'BatchCreated';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = contracts.batchManagement.interface.parseLog(event);
      console.log('🎉 Batch created with ID:', parsed?.args.batchId);
      return { receipt, batchId: Number(parsed?.args.batchId) };
    } else {
      console.warn('⚠️ No BatchCreated event found in receipt');
    }
    
    return { receipt, batchId: null };
  };

  const addStudentToBatch = async (batchId: number, studentAddress: string) => {
    if (!contracts.batchManagement) throw new Error('BatchManagement contract not initialized');
    
    const tx = await contracts.batchManagement.addStudentToBatch(batchId, studentAddress);
    return await tx.wait();
  };

  const removeStudentFromBatch = async (batchId: number, studentAddress: string) => {
    if (!contracts.batchManagement) throw new Error('BatchManagement contract not initialized');
    
    const tx = await contracts.batchManagement.removeStudentFromBatch(batchId, studentAddress);
    return await tx.wait();
  };

  const deactivateBatch = async (batchId: number) => {
    if (!contracts.batchManagement) throw new Error('BatchManagement contract not initialized');
    
    console.log('🗑️ Deactivating batch with ID:', batchId);
    const tx = await contracts.batchManagement.deactivateBatch(batchId);
    console.log('📝 Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Batch deactivated successfully:', receipt);
    return receipt;
  };

  const getBatch = async (batchId: number) => {
    if (!contracts.batchManagement) throw new Error('BatchManagement contract not initialized');
    
    try {
      const result = await contracts.batchManagement.getBatch(batchId);
      console.log('🔍 Raw batch data for batch', batchId, ':', result);
      
      // Handle array format (Solidity returns array for multiple return values)
      if (Array.isArray(result)) {
        const [id, name, teacher, students, isActive, createdAt, updatedAt] = result;
        const batch = {
          id: Number(id),
          name: name,
          teacher: teacher,
          students: students || [],
          isActive: isActive,
          createdAt: new Date(Number(createdAt) * 1000),
          updatedAt: new Date(Number(updatedAt) * 1000)
        };
        console.log('✅ Successfully decoded batch:', batch);
        return batch;
      } else {
        // Object format fallback
        return {
          id: Number(result.id),
          name: result.name,
          teacher: result.teacher,
          students: result.students || [],
          isActive: result.isActive,
          createdAt: new Date(Number(result.createdAt) * 1000),
          updatedAt: new Date(Number(result.updatedAt) * 1000)
        };
      }
    } catch (error) {
      console.error('❌ Failed to decode batch data for batch', batchId, ':', error);
      throw error;
    }
  };

  const getTeacherBatches = async (teacherAddress: string) => {
    if (!contracts.batchManagement) throw new Error('BatchManagement contract not initialized');
    
    try {
      console.log('🔍 Fetching teacher batches for:', teacherAddress);
      
      // Direct blockchain call - no fallbacks for real integration
      console.log('🔍 Using contract address:', CONTRACT_ADDRESSES.batchManagement);
      const batchIds = await contracts.batchManagement.getActiveTeacherBatches(teacherAddress);
      console.log('📊 Found batch IDs from blockchain:', batchIds);
      
      const batches = [];
      for (const batchId of batchIds) {
        try {
          const batch = await getBatch(Number(batchId));
          batches.push(batch);
        } catch (error) {
          console.error(`❌ Failed to fetch batch ${batchId}:`, error);
        }
      }
      
      return batches;
    } catch (error) {
      console.error('❌ Failed to fetch teacher batches:', error);
      return [];
    }
  };

  const getStudentBatches = async (studentAddress: string) => {
    if (!contracts.batchManagement) throw new Error('BatchManagement contract not initialized');
    
    const batchIds = await contracts.batchManagement.getStudentBatches(studentAddress);
    const batches = [];
    
    for (const batchId of batchIds) {
      try {
        const batch = await getBatch(Number(batchId));
        batches.push(batch);
      } catch (error) {
        console.error(`Failed to fetch batch ${batchId}:`, error);
      }
    }
    
    return batches;
  };

  const isStudentInBatch = async (studentAddress: string, batchId: number) => {
    if (!contracts.batchManagement) throw new Error('BatchManagement contract not initialized');
    
    return await contracts.batchManagement.isStudentInBatch(studentAddress, batchId);
  };

  const getBatchStudents = async (batchId: number) => {
    if (!contracts.batchManagement) throw new Error('BatchManagement contract not initialized');
    
    return await contracts.batchManagement.getBatchStudents(batchId);
  };

  // Assignment Management Functions
  const createAssignment = async (title: string, description: string, ipfsHash: string, deadline: Date, tokenReward: number, batchId: number) => {
    if (!contracts.assignmentSubmission) throw new Error('AssignmentSubmission contract not initialized');
    
    console.log('🚀 Creating assignment:', { title, description, deadline, tokenReward, batchId });
    const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);
    
    try {
      // Call the real smart contract createAssignment function
      const tx = await contracts.assignmentSubmission.createAssignment(
        title,
        description,
        ipfsHash || "QmDefault", // Default IPFS hash
        deadlineTimestamp,
        tokenReward,
        batchId
      );
      
      console.log('📝 Assignment creation transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Assignment created successfully. Receipt:', receipt);
      
      // Extract assignment ID from events
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contracts.assignmentSubmission!.interface.parseLog(log);
          return parsed?.name === 'AssignmentCreated';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contracts.assignmentSubmission.interface.parseLog(event);
        console.log('🎉 Assignment created with ID:', parsed?.args.assignmentId);
        return { receipt, assignmentId: Number(parsed?.args.assignmentId) };
      } else {
        console.warn('⚠️ No AssignmentCreated event found in receipt');
        return { receipt, assignmentId: null };
      }
    } catch (error) {
      console.error('❌ Failed to create assignment on blockchain:', error);
      throw error;
    }
  };

  const getAssignment = async (assignmentId: number) => {
    if (!contracts.assignmentSubmission) throw new Error('AssignmentSubmission contract not initialized');
    
    const result = await contracts.assignmentSubmission.getAssignment(assignmentId);
    return {
      id: Number(result.id),
      title: result.title,
      description: result.description,
      ipfsHash: result.ipfsHash,
      deadline: new Date(Number(result.deadline) * 1000),
      tokenReward: Number(result.tokenReward),
      teacher: result.teacher,
      batchId: Number(result.batchId),
      isActive: result.isActive,
      createdAt: new Date(Number(result.createdAt) * 1000)
    };
  };

  const getTeacherAssignments = async (teacherAddress: string) => {
    if (!contracts.assignmentSubmission) throw new Error('AssignmentSubmission contract not initialized');
    
    const assignmentIds = await contracts.assignmentSubmission.getTeacherAssignments(teacherAddress);
    const assignments = [];
    
    for (const assignmentId of assignmentIds) {
      try {
        const assignment = await getAssignment(Number(assignmentId));
        assignments.push(assignment);
      } catch (error) {
        console.error(`Failed to fetch assignment ${assignmentId}:`, error);
      }
    }
    
    return assignments;
  };

  const getStudentAvailableAssignments = async (studentAddress: string) => {
    if (!contracts.assignmentSubmission) throw new Error('AssignmentSubmission contract not initialized');
    
    const assignmentIds = await contracts.assignmentSubmission.getStudentAvailableAssignments(studentAddress);
    const assignments = [];
    
    for (const assignmentId of assignmentIds) {
      try {
        const assignment = await getAssignment(Number(assignmentId));
        assignments.push(assignment);
      } catch (error) {
        console.error(`Failed to fetch assignment ${assignmentId}:`, error);
      }
    }
    
    return assignments;
  };

  const getBatchAssignments = async (batchId: number) => {
    if (!contracts.assignmentSubmission) throw new Error('AssignmentSubmission contract not initialized');
    
    const assignmentIds = await contracts.assignmentSubmission.getBatchAssignments(batchId);
    const assignments = [];
    
    for (const assignmentId of assignmentIds) {
      try {
        const assignment = await getAssignment(Number(assignmentId));
        assignments.push(assignment);
      } catch (error) {
        console.error(`Failed to fetch assignment ${assignmentId}:`, error);
      }
    }
    
    return assignments;
  };

  const submitAssignmentToBlockchain = async (assignmentId: number, fileName: string, ipfsHash: string) => {
    if (!contracts.assignmentSubmission) throw new Error('AssignmentSubmission contract not initialized');
    
    console.log('🚀 Submitting assignment to blockchain:', { assignmentId, fileName, ipfsHash });
    
    const tx = await contracts.assignmentSubmission.submitAssignment(assignmentId, fileName, ipfsHash);
    console.log('📝 Submission transaction:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Assignment submitted successfully:', receipt);
    
    return receipt;
  };

  const getStudentSubmissions = async (studentAddress: string) => {
    if (!contracts.assignmentSubmission) throw new Error('AssignmentSubmission contract not initialized');
    
    const submissionIds = await contracts.assignmentSubmission.getStudentSubmissions(studentAddress);
    const submissions = [];
    
    for (const submissionId of submissionIds) {
      try {
        const result = await contracts.assignmentSubmission.getSubmission(Number(submissionId));
        submissions.push({
          id: Number(result.id),
          assignmentId: Number(result.assignmentId),
          student: result.student,
          fileName: result.fileName,
          ipfsHash: result.ipfsHash,
          submissionTime: new Date(Number(result.submissionTime) * 1000),
          isReviewed: result.isReviewed,
          grade: result.grade,
          feedback: result.feedback,
          reviewedBy: result.reviewedBy,
          reviewedAt: result.reviewedAt ? new Date(Number(result.reviewedAt) * 1000) : null,
          tokensAwarded: Number(result.tokensAwarded)
        });
      } catch (error) {
        console.error(`Failed to fetch submission ${submissionId}:`, error);
      }
    }
    
    return submissions;
  };

  const reviewSubmissionOnBlockchain = async (submissionId: number, grade: string, feedback: string, tokensAwarded: number) => {
    if (!contracts.assignmentSubmission) throw new Error('AssignmentSubmission contract not initialized');
    
    console.log('🚀 Reviewing submission on blockchain:', { submissionId, grade, feedback, tokensAwarded });
    
    const tx = await contracts.assignmentSubmission.reviewSubmission(submissionId, grade, feedback, tokensAwarded);
    console.log('📝 Review transaction:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Submission reviewed successfully:', receipt);
    
    return receipt;
  };

  const switchToSepolia = async () => {
    if (!provider) throw new Error('MetaMask not available');

    try {
      await (provider as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CONFIG.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        await (provider as any).request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${SEPOLIA_CONFIG.chainId.toString(16)}`,
            chainName: SEPOLIA_CONFIG.name,
            nativeCurrency: {
              name: SEPOLIA_CONFIG.currency,
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: [SEPOLIA_CONFIG.rpcUrl],
            blockExplorerUrls: [SEPOLIA_CONFIG.explorerUrl],
          }],
        });
      } else {
        throw switchError;
      }
    }
  };

  return {
    ...contracts,
    isLoading,
    error,
    connected,
    account,
    submitAssignment,
    reviewSubmission,
    getTokenBalance,
    getNFTBalance,
    switchToSepolia,
    // Batch Management Functions
    createBatch,
    addStudentToBatch,
    removeStudentFromBatch,
    deactivateBatch,
    getBatch,
    getTeacherBatches,
    getStudentBatches,
    isStudentInBatch,
    getBatchStudents,
    createAssignment,
    getAssignment,
    getTeacherAssignments,
    getStudentAvailableAssignments,
    getBatchAssignments,
    submitAssignmentToBlockchain,
    getStudentSubmissions,
    reviewSubmissionOnBlockchain,
    isContractsReady: !!contracts.assignmentSubmission && !!contracts.tokenReward && !!contracts.nftReward && !!contracts.batchManagement
  };
}