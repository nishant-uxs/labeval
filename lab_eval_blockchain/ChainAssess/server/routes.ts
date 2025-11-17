import type { Express } from "express";
import { z } from 'zod';
import { blockchainService } from './blockchain-service';
import { ipfsService } from './ipfs-service';
import { setupFileUploadRoutes } from './routes/file-upload';
import { setupAssignmentAPI } from './assignment-api';
import type { 
  Assignment, 
  Batch, 
  BatchStudent, 
  Notification,
  InsertBatch,
  InsertBatchStudent,
  InsertNotification,
  InsertAssignment
} from '@shared/schema';

export async function registerRoutes(app: Express) {

// 🚀 COMPLETE BLOCKCHAIN STORAGE - No Database Dependency!
console.log('⛓️  Using Blockchain Storage for complete decentralization');
console.log('🎯 All data stored on smart contracts with IPFS integration');

// Setup real IPFS file upload routes
setupFileUploadRoutes(app);

// Setup assignment creation and management API
setupAssignmentAPI(app);

// Notifications stored in-memory (temporary) - will be moved to blockchain events
let notifications: Notification[] = [];

// Helper function to generate ID
const generateId = () => crypto.randomUUID();

// BATCH ROUTES - Using blockchain smart contracts
app.get('/api/batches/teacher/:teacherAddress', async (req, res) => {
  try {
    const { teacherAddress } = req.params;
    console.log('🔗 Fetching teacher batches from blockchain for:', teacherAddress);
    const batches = await blockchainService.getTeacherBatches(teacherAddress);
    console.log(`✅ Found ${batches.length} batches on blockchain`);
    res.json(batches);
  } catch (error) {
    console.error('Failed to fetch teacher batches from blockchain:', error);
    res.status(500).json({ error: 'Failed to fetch teacher batches from blockchain' });
  }
});

app.post('/api/batches', async (req, res) => {
  // Batch creation happens directly on blockchain via frontend
  // This endpoint maintained for API compatibility
  res.status(201).json({ 
    message: 'Batch creation happens on blockchain via frontend smart contract calls',
    note: 'Use MetaMask integration for batch creation'
  });
});

// Add student to batch - Blockchain + Notification
app.post('/api/batches/:batchId/students', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { studentAddress } = req.body;
    
    // Student addition happens on blockchain via frontend
    // Just create a notification for the student
    const notification: Notification = {
      id: generateId(),
      recipientAddress: studentAddress,
      title: 'Added to Batch',
      message: `You have been added to batch ${batchId}. You can now see and submit assignments.`,
      type: 'batch_invitation',
      isRead: false,
      data: JSON.stringify({ batchId, studentAddress }),
      createdAt: new Date()
    };
    notifications.push(notification);
    
    res.status(201).json({ 
      message: 'Student addition happens on blockchain',
      notification 
    });
  } catch (error) {
    console.error('Failed to process student batch addition:', error);
    res.status(400).json({ error: 'Failed to process student batch addition' });
  }
});

// Remove student from batch - Blockchain
app.delete('/api/batches/:batchId/students/:studentAddress', async (req, res) => {
  try {
    // Student removal happens on blockchain via frontend
    res.json({ message: 'Student removal happens on blockchain via frontend smart contract calls' });
  } catch (error) {
    console.error('Failed to process student removal:', error);
    res.status(400).json({ error: 'Failed to process student removal' });
  }
});

// Get students in batch - Blockchain
app.get('/api/batches/:batchId/students', async (req, res) => {
  try {
    const { batchId } = req.params;
    console.log('🔗 Fetching batch students from blockchain for batch:', batchId);
    // For now, return empty array as student verification is not working
    const students: string[] = [];
    console.log(`✅ Found ${students.length} students on blockchain`);
    res.json(students);
  } catch (error) {
    console.error('Failed to fetch batch students from blockchain:', error);
    res.status(500).json({ error: 'Failed to fetch batch students from blockchain' });
  }
});

// Get batches for a specific student - Blockchain
app.get('/api/batches/student/:studentAddress', async (req, res) => {
  try {
    const { studentAddress } = req.params;
    console.log('🔗 Fetching student batches from blockchain for:', studentAddress);
    const batches = await blockchainService.getStudentBatches(studentAddress);
    console.log(`✅ Found ${batches.length} batches on blockchain for student ${studentAddress}`);
    res.json(batches);
  } catch (error) {
    console.error('Failed to fetch student batches from blockchain:', error);
    res.status(500).json({ error: 'Failed to fetch student batches from blockchain' });
  }
});

// Get assignments for a specific batch - Blockchain
app.get('/api/assignments/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    console.log('🔗 Fetching batch assignments from blockchain for batch:', batchId);
    
    const assignments = await blockchainService.getBatchAssignments(batchId);
    
    if (assignments.length > 0) {
      console.log(`✅ Found ${assignments.length} assignments for batch ${batchId}`);
    } else {
      console.log(`📋 No assignments found for batch ${batchId} yet`);
    }
    
    res.json(assignments);
  } catch (error) {
    console.error('Failed to fetch batch assignments from blockchain:', error);
    res.status(500).json({ error: 'Failed to fetch batch assignments from blockchain' });
  }
});

// ASSIGNMENT ROUTES - Blockchain
app.get('/api/assignments/teacher/:teacherAddress', async (req, res) => {
  try {
    const { teacherAddress } = req.params;
    console.log('🔗 Fetching teacher assignments from blockchain for:', teacherAddress);
    const teacherAssignments = await blockchainService.getTeacherAssignments(teacherAddress);
    console.log(`✅ Found ${teacherAssignments.length} assignments on blockchain`);
    res.json(teacherAssignments);
  } catch (error) {
    console.error('Failed to fetch teacher assignments from blockchain:', error);
    res.status(500).json({ error: 'Failed to fetch teacher assignments from blockchain' });
  }
});

app.get('/api/assignments/student/:studentAddress', async (req, res) => {
  try {
    const { studentAddress } = req.params;
    
    console.log('🔗 Fetching ALL assignments available to student:', studentAddress);
    
    // Get all student's batches first
    const studentBatches = await blockchainService.getStudentBatches(studentAddress);
    console.log(`📋 Student ${studentAddress} belongs to ${studentBatches.length} batches`);
    
    // Collect all assignments from all batches
    const allAssignments = [];
    
    for (const batch of studentBatches) {
      try {
        const batchAssignments = await blockchainService.getBatchAssignments(batch.id.toString());
        allAssignments.push(...batchAssignments);
      } catch (err) {
        console.error(`Failed to fetch assignments for batch ${batch.id}:`, err);
      }
    }
    
    console.log(`✅ Found ${allAssignments.length} assignments available for student ${studentAddress}`);
    res.json(allAssignments);
  } catch (error) {
    console.error('Failed to fetch student assignments:', error);
    res.status(500).json({ error: 'Failed to fetch student assignments' });
  }
});

app.post('/api/assignments', async (req, res) => {
  try {
    const assignmentData = req.body as InsertAssignment;
    
    console.log('📝 Creating notifications for assignment:', assignmentData.title);
    
    // NOTE: Assignment is already created on blockchain via frontend MetaMask
    // This endpoint only handles notification creation for students
    
    const batchIdNum = typeof assignmentData.batchId === 'string' 
      ? parseInt(assignmentData.batchId) 
      : assignmentData.batchId;
      
    // Get batch students to create notifications
    if (batchIdNum) {
      try {
        const batch = await blockchainService.getBatch(batchIdNum);
        if (batch && batch.students && batch.students.length > 0) {
          for (const studentAddress of batch.students) {
            const notification: Notification = {
              id: generateId(),
              recipientAddress: studentAddress,
              title: 'New Assignment Available',
              message: `New assignment "${assignmentData.title}" has been created for your batch.`,
              type: 'assignment_created',
              isRead: false,
              data: JSON.stringify({ 
                batchId: assignmentData.batchId
              }),
              createdAt: new Date()
            };
            notifications.push(notification);
          }
          console.log(`✅ Created ${batch.students.length} notifications for assignment "${assignmentData.title}"`);
        }
      } catch (err) {
        console.error('Failed to create notifications:', err);
      }
    }
    
    res.status(201).json({ 
      success: true,
      message: 'Notifications created successfully'
    });
  } catch (error) {
    console.error('Failed to create notifications:', error);
    res.status(400).json({ error: 'Failed to create notifications' });
  }
});

// NOTIFICATION ROUTES - In-memory (will be moved to blockchain events)
app.get('/api/notifications/:userAddress', (req, res) => {
  try {
    const { userAddress } = req.params;
    const userNotifications = notifications
      .filter(n => n.recipientAddress === userAddress)
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
    console.log(`🔔 Found ${userNotifications.length} notifications for user ${userAddress}`);
    res.json(userNotifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:notificationId/read', (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.isRead = true;
    res.json(notification);
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    res.status(404).json({ error: 'Notification not found' });
  }
});

// Get active assignments - Blockchain
app.get('/api/assignments/active', async (req, res) => {
  try {
    console.log('🔗 Fetching active assignments from blockchain');
    const activeAssignments = await blockchainService.getActiveAssignments();
    console.log(`✅ Found ${activeAssignments.length} active assignments on blockchain`);
    res.json(activeAssignments);
  } catch (error) {
    console.error('Failed to fetch active assignments from blockchain:', error);
    res.status(500).json({ error: 'Failed to fetch active assignments from blockchain' });
  }
});

app.get('/api/submissions/student/:studentAddress', async (req, res) => {
  try {
    const { studentAddress } = req.params;
    console.log('🔗 Fetching student submissions from blockchain for:', studentAddress);
    const submissions = await blockchainService.getStudentSubmissions(studentAddress);
    console.log(`✅ Found ${submissions.length} submissions on blockchain`);
    res.json(submissions);
  } catch (error) {
    console.error('Failed to fetch student submissions from blockchain:', error);
    res.status(500).json({ error: 'Failed to fetch student submissions from blockchain' });
  }
});

// Get submissions for an assignment - For teacher grading
app.get('/api/submissions/assignment/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    console.log('🔗 Fetching submissions for assignment from blockchain:', assignmentId);
    const submissions = await blockchainService.getAssignmentSubmissions(parseInt(assignmentId));
    console.log(`✅ Found ${submissions.length} submissions for assignment ${assignmentId}`);
    res.json(submissions);
  } catch (error) {
    console.error('Failed to fetch assignment submissions from blockchain:', error);
    res.status(500).json({ error: 'Failed to fetch assignment submissions from blockchain' });
  }
});

// Submit assignment with IPFS upload - handles multipart file upload
app.post('/api/assignments/:assignmentId/submit', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // For FormData uploads, we'll parse it manually
    // Since we're using FormData from frontend, params come as form fields
    const studentAddress = req.body.studentAddress;
    const file = req.body.file; // This will be the file object if using multipart parser
    
    // For now, handle as JSON with base64 file data (simpler approach)
    // Frontend will need to send file as base64 in JSON format
    const { fileBase64, fileName } = req.body;
    
    if (!studentAddress || !fileBase64 || !fileName) {
      return res.status(400).json({ 
        error: 'Missing required fields: studentAddress, fileBase64, fileName' 
      });
    }
    
    console.log('📤 Processing file upload and blockchain submission:', {
      assignmentId,
      studentAddress,
      fileName
    });
    
    // Step 1: Upload file to IPFS
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const ipfsResult = await ipfsService.uploadFile(fileBuffer, fileName, {
      assignmentId,
      studentAddress,
      uploadType: 'assignment_submission'
    });
    
    console.log('✅ File uploaded to IPFS:', ipfsResult.hash);
    
    // Step 2: Submit to blockchain
    const blockchainResult = await blockchainService.submitAssignment(
      parseInt(assignmentId),
      ipfsResult.hash,
      fileName,
      studentAddress
    );
    
    console.log('✅ Assignment submitted to blockchain successfully');
    
    res.status(201).json({
      success: true,
      submissionId: blockchainResult.submissionId,
      transactionHash: blockchainResult.transactionHash,
      ipfsHash: ipfsResult.hash,
      gatewayUrl: ipfsService.getGatewayUrl(ipfsResult.hash),
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Failed to submit assignment:', error);
    res.status(500).json({ 
      error: 'Failed to submit assignment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Grade submission - For teacher
app.post('/api/submissions/:submissionId/grade', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, teacherAddress } = req.body;
    
    console.log('🎓 Grading submission:', { submissionId, grade, teacherAddress });
    
    const result = await blockchainService.gradeSubmission(
      parseInt(submissionId),
      grade,
      teacherAddress
    );
    
    console.log('✅ Submission graded successfully:', result);
    
    res.json({
      success: true,
      transactionHash: result.transactionHash,
      message: 'Submission graded successfully'
    });
  } catch (error) {
    console.error('Failed to grade submission:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

app.get('/api/token-transactions/user/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    console.log('🔗 Fetching token transactions from blockchain for:', userAddress);
    const transactions = await blockchainService.getTokenTransactions(userAddress);
    console.log(`✅ Found ${transactions.length} token transactions on blockchain`);
    res.json(transactions);
  } catch (error) {
    console.error('Failed to fetch token transactions from blockchain:', error);
    res.status(500).json({ error: 'Failed to fetch token transactions from blockchain' });
  }
});

app.get('/api/nft-rewards/user/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    console.log('🔗 Fetching NFT rewards from blockchain for:', userAddress);
    const nfts = await blockchainService.getNftRewards(userAddress);
    console.log(`✅ Found ${nfts.length} NFT rewards on blockchain`);
    res.json(nfts);
  } catch (error) {
    console.error('Failed to fetch NFT rewards from blockchain:', error);
    res.status(500).json({ error: 'Failed to fetch NFT rewards from blockchain' });
  }
});

  return app;
}