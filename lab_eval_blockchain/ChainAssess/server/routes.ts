import type { Express } from "express";
import { z } from 'zod';
import { blockchainService } from './blockchain-service';
import { ipfsService } from './ipfs-service';
import { setupFileUploadRoutes } from './routes/file-upload';
import { setupAssignmentAPI } from './assignment-api';
import { gradeSubmissionWithAI, analyzeSubmissionFile } from './ai-grading-service';
import { adminLimiter, writeLimiter, validateEthAddress, validateBatchId, validateAssignmentId } from './middleware';
import { createLogger } from './logger';
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

const log = createLogger('routes');
const MAX_NOTIFICATIONS = 1000;

export async function registerRoutes(app: Express) {

// Initialize blockchain service with server wallet for write operations
const privateKey = process.env.PRIVATE_KEY;
if (privateKey) {
  await blockchainService.initializeWithWallet(privateKey);
  log.info('Server wallet initialized for blockchain transactions');
} else {
  log.warn('PRIVATE_KEY not found - blockchain write operations will fail');
}

// Setup real IPFS file upload routes
setupFileUploadRoutes(app);

// Setup assignment creation and management API
setupAssignmentAPI(app);

// Notifications stored in-memory (capped) — will be moved to blockchain events
let notifications: Notification[] = [];
function addNotification(n: Notification) {
  notifications.push(n);
  // Evict oldest when over cap to prevent memory leak
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications = notifications.slice(-MAX_NOTIFICATIONS);
  }
}

// Helper function to generate ID
const generateId = () => crypto.randomUUID();

// ADMIN ROUTES - Role registration (rate-limited + address validated)
app.post('/api/admin/register-teacher/:teacherAddress', adminLimiter, validateEthAddress('teacherAddress'), async (req, res) => {
  try {
    const { teacherAddress } = req.params;
    log.info('Registering teacher', { teacherAddress });
    const result = await blockchainService.registerTeacher(teacherAddress);
    res.json({ 
      success: true,
      message: 'Teacher registered successfully',
      transactionHash: result.transactionHash 
    });
  } catch (error) {
    log.error('Failed to register teacher', { error: String(error) });
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register teacher'
    });
  }
});

app.post('/api/admin/register-student/:studentAddress', adminLimiter, validateEthAddress('studentAddress'), async (req, res) => {
  try {
    const { studentAddress } = req.params;
    log.info('Registering student', { studentAddress });
    const result = await blockchainService.registerStudent(studentAddress);
    res.json({ 
      success: true,
      message: 'Student registered successfully',
      transactionHash: result.transactionHash 
    });
  } catch (error) {
    log.error('Failed to register student', { error: String(error) });
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register student'
    });
  }
});

// BATCH ROUTES - Using blockchain smart contracts
app.get('/api/batches', async (req, res) => {
  try {
    const batches = await blockchainService.getAllBatches();
    res.json(batches);
  } catch (error) {
    log.error('Failed to fetch all batches', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch all batches from blockchain' });
  }
});

app.get('/api/batches/teacher/:teacherAddress', validateEthAddress('teacherAddress'), async (req, res) => {
  try {
    const batches = await blockchainService.getTeacherBatches(req.params.teacherAddress);
    res.json(batches);
  } catch (error) {
    log.error('Failed to fetch teacher batches', { error: String(error) });
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
    addNotification(notification);
    
    res.status(201).json({ 
      message: 'Student addition happens on blockchain',
      notification 
    });
  } catch (error) {
    log.error('Failed to process student batch addition', { error: String(error) });
    res.status(400).json({ error: 'Failed to process student batch addition' });
  }
});

// Remove student from batch - Blockchain
app.delete('/api/batches/:batchId/students/:studentAddress', async (req, res) => {
  try {
    // Student removal happens on blockchain via frontend
    res.json({ message: 'Student removal happens on blockchain via frontend smart contract calls' });
  } catch (error) {
    log.error('Failed to process student removal', { error: String(error) });
    res.status(400).json({ error: 'Failed to process student removal' });
  }
});

// Get students in batch - Blockchain (fixed: was returning empty array)
app.get('/api/batches/:batchId/students', validateBatchId, async (req, res) => {
  try {
    const { batchId } = req.params;
    const students = await blockchainService.getBatchStudents(parseInt(batchId));
    res.json(students);
  } catch (error) {
    log.error('Failed to fetch batch students', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch batch students from blockchain' });
  }
});

// Get batches for a specific student - Blockchain
app.get('/api/batches/student/:studentAddress', validateEthAddress('studentAddress'), async (req, res) => {
  try {
    const batches = await blockchainService.getStudentBatches(req.params.studentAddress);
    res.json(batches);
  } catch (error) {
    log.error('Failed to fetch student batches', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch student batches from blockchain' });
  }
});

// Get assignments for a specific batch - Blockchain
app.get('/api/assignments/batch/:batchId', validateBatchId, async (req, res) => {
  try {
    const assignments = await blockchainService.getBatchAssignments(req.params.batchId);
    res.json(assignments);
  } catch (error) {
    log.error('Failed to fetch batch assignments', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch batch assignments from blockchain' });
  }
});

// ASSIGNMENT ROUTES - Blockchain
app.get('/api/assignments/teacher/:teacherAddress', validateEthAddress('teacherAddress'), async (req, res) => {
  try {
    const assignments = await blockchainService.getTeacherAssignments(req.params.teacherAddress);
    res.json(assignments);
  } catch (error) {
    log.error('Failed to fetch teacher assignments', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch teacher assignments from blockchain' });
  }
});

app.get('/api/assignments/student/:studentAddress', validateEthAddress('studentAddress'), async (req, res) => {
  try {
    const { studentAddress } = req.params;
    // Fetch batches, then assignments in parallel per batch
    const studentBatches = await blockchainService.getStudentBatches(studentAddress);
    const batchAssignmentResults = await Promise.all(
      studentBatches.map(batch =>
        blockchainService.getBatchAssignments(batch.id.toString()).catch(() => [])
      )
    );
    const allAssignments = batchAssignmentResults.flat();
    res.json(allAssignments);
  } catch (error) {
    log.error('Failed to fetch student assignments', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch student assignments' });
  }
});

app.post('/api/assignments', async (req, res) => {
  try {
    const assignmentData = req.body as InsertAssignment;
    
    log.info('Creating notifications for assignment', { title: assignmentData.title });
    
    // NOTE: Assignment is already created on blockchain via frontend
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
            addNotification(notification);
          }
          log.info('Created notifications for assignment', { title: assignmentData.title, count: batch.students.length });
        }
      } catch (err) {
        log.error('Failed to create notifications', { error: String(err) });
      }
    }
    
    res.status(201).json({ 
      success: true,
      message: 'Notifications created successfully'
    });
  } catch (error) {
    log.error('Failed to create notifications', { error: String(error) });
    res.status(400).json({ error: 'Failed to create notifications' });
  }
});

// NOTIFICATION ROUTES - In-memory (will be moved to blockchain events)
app.get('/api/notifications/:userAddress', validateEthAddress('userAddress'), (req, res) => {
  try {
    const { userAddress } = req.params;
    const userNotifications = notifications
      .filter(n => n.recipientAddress?.toLowerCase() === userAddress.toLowerCase())
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
    res.json(userNotifications);
  } catch (error) {
    log.error('Failed to fetch notifications', { error: String(error) });
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
    log.error('Failed to mark notification as read', { error: String(error) });
    res.status(404).json({ error: 'Notification not found' });
  }
});

// Get active assignments - Blockchain
app.get('/api/assignments/active', async (_req, res) => {
  try {
    const activeAssignments = await blockchainService.getActiveAssignments();
    res.json(activeAssignments);
  } catch (error) {
    log.error('Failed to fetch active assignments', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch active assignments from blockchain' });
  }
});

app.get('/api/submissions/student/:studentAddress', validateEthAddress('studentAddress'), async (req, res) => {
  try {
    const submissions = await blockchainService.getStudentSubmissions(req.params.studentAddress);
    res.json(submissions);
  } catch (error) {
    log.error('Failed to fetch student submissions', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch student submissions from blockchain' });
  }
});

// Get submissions for an assignment - For teacher grading
app.get('/api/submissions/assignment/:assignmentId', validateAssignmentId, async (req, res) => {
  try {
    const submissions = await blockchainService.getAssignmentSubmissions(parseInt(req.params.assignmentId));
    res.json(submissions);
  } catch (error) {
    log.error('Failed to fetch assignment submissions', { error: String(error) });
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
    
    log.info('Processing file upload', { assignmentId, studentAddress, fileName });
    
    // Step 1: Upload file to IPFS
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const ipfsResult = await ipfsService.uploadFile(fileBuffer, fileName, {
      assignmentId,
      studentAddress,
      uploadType: 'assignment_submission'
    });
    
    log.info('File uploaded to IPFS', { hash: ipfsResult.hash });
    
    // Return IPFS hash - frontend will submit to blockchain via MetaMask
    log.info('Returning IPFS hash to frontend for blockchain submission');
    
    res.status(200).json({
      success: true,
      ipfsHash: ipfsResult.hash,
      fileName: fileName,
      gatewayUrl: ipfsService.getGatewayUrl(ipfsResult.hash),
      message: 'File uploaded to IPFS successfully. Please confirm transaction in MetaMask to submit assignment.'
    });
  } catch (error) {
    log.error('Failed to submit assignment', { error: String(error) });
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
    
    log.info('Grading submission', { submissionId, grade, teacherAddress });
    
    const result = await blockchainService.gradeSubmission(
      parseInt(submissionId),
      grade,
      teacherAddress
    );
    
    log.info('Submission graded successfully', { transactionHash: result.transactionHash });
    
    res.json({
      success: true,
      transactionHash: result.transactionHash,
      message: 'Submission graded successfully'
    });
  } catch (error) {
    log.error('Failed to grade submission', { error: String(error) });
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// AI-powered grading suggestion - For teacher
app.post('/api/submissions/:submissionId/ai-grade', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { assignmentId } = req.body;
    
    log.info('AI grading requested', { submissionId });
    
    // Get submission details
    const submission = await blockchainService.getSubmission(parseInt(submissionId));
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Get assignment details
    const assignment = await blockchainService.getAssignment(parseInt(assignmentId));
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Fetch submission content from IPFS with proper text extraction
    const gatewayUrl = ipfsService.getGatewayUrl(submission.ipfsHash);
    const submissionContent = await analyzeSubmissionFile(submission.ipfsHash, gatewayUrl, submission.fileName);
    
    // Fetch assignment file content if available
    let assignmentFileContent: string | undefined;
    if (assignment.ipfsHash && assignment.ipfsHash !== 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn') {
      const assignmentGatewayUrl = ipfsService.getGatewayUrl(assignment.ipfsHash);
      const assignmentFileName = `assignment_${assignment.id}.pdf`;
      assignmentFileContent = await analyzeSubmissionFile(assignment.ipfsHash, assignmentGatewayUrl, assignmentFileName);
      log.debug('Assignment file content fetched for AI grading');
    }
    
    // Get AI grading suggestion
    const aiResult = await gradeSubmissionWithAI(
      assignment.title,
      assignment.description,
      submissionContent,
      submission.fileName,
      assignmentFileContent
    );
    
    log.info('AI grading completed', { submissionId });
    
    res.json({
      success: true,
      ...aiResult
    });
  } catch (error) {
    log.error('AI grading failed', { submissionId: req.params.submissionId, error: String(error) });
    res.status(500).json({ 
      error: 'AI grading failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/token-transactions/user/:userAddress', validateEthAddress('userAddress'), async (req, res) => {
  try {
    const transactions = await blockchainService.getTokenTransactions(req.params.userAddress);
    res.json(transactions);
  } catch (error) {
    log.error('Failed to fetch token transactions', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch token transactions from blockchain' });
  }
});

app.get('/api/nft-rewards/user/:userAddress', validateEthAddress('userAddress'), async (req, res) => {
  try {
    const nfts = await blockchainService.getNftRewards(req.params.userAddress);
    res.json(nfts);
  } catch (error) {
    log.error('Failed to fetch NFT rewards', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch NFT rewards from blockchain' });
  }
});

  return app;
}