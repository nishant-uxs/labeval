import type { Express } from "express";
import { ipfsService } from '../ipfs-service';
import { blockchainService } from '../blockchain-service';

export function setupFileUploadRoutes(app: Express) {
  
  // Real IPFS file upload endpoint
  app.post('/api/upload/ipfs', async (req, res) => {
    try {
      const { fileBase64, fileName, assignmentId, studentAddress } = req.body;
      
      if (!fileBase64 || !fileName) {
        return res.status(400).json({ error: 'File data and name are required' });
      }
      
      console.log('📤 Uploading file to real IPFS:', { fileName, assignmentId, studentAddress });
      
      // Convert base64 to buffer
      const fileBuffer = Buffer.from(fileBase64, 'base64');
      
      // Upload to real IPFS via Pinata
      const ipfsResult = await ipfsService.uploadFile(fileBuffer, fileName, {
        assignmentId,
        studentAddress,
        uploadType: 'assignment_submission'
      });
      
      console.log('✅ File uploaded to IPFS successfully:', ipfsResult);
      
      res.json({
        success: true,
        ipfsHash: ipfsResult.hash,
        fileName: ipfsResult.name,
        fileSize: ipfsResult.size,
        gatewayUrl: ipfsService.getGatewayUrl(ipfsResult.hash),
        uploadedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload file to IPFS',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Real blockchain submission endpoint
  app.post('/api/submissions/submit', async (req, res) => {
    try {
      const { assignmentId, ipfsHash, fileName, studentAddress } = req.body;
      
      if (!assignmentId || !ipfsHash || !fileName || !studentAddress) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      console.log('🔗 Submitting assignment to blockchain:', {
        assignmentId,
        ipfsHash,
        fileName,
        studentAddress
      });
      
      // Submit to blockchain
      const submissionResult = await blockchainService.submitAssignment(
        parseInt(assignmentId),
        ipfsHash,
        fileName,
        studentAddress
      );
      
      console.log('✅ Assignment submitted to blockchain:', submissionResult);
      
      res.json({
        success: true,
        submissionId: submissionResult.submissionId,
        transactionHash: submissionResult.transactionHash,
        submittedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Blockchain submission failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit assignment to blockchain',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}