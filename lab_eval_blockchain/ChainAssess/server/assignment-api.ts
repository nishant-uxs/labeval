// Assignment creation and management API endpoints
import type { Express } from "express";
import { blockchainService } from './blockchain-service';

export function setupAssignmentAPI(app: Express) {
  
  // Create assignment endpoint - for teacher
  app.post('/api/assignments/create', async (req, res) => {
    try {
      const { title, description, deadline, tokenReward, batchId, teacherAddress } = req.body;
      
      console.log('📚 Creating assignment:', { title, batchId, teacherAddress });
      
      if (!title || !deadline || !tokenReward || !batchId || !teacherAddress) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // For now return mock success - blockchain integration will be added later
      const assignmentId = Date.now();
      
      console.log('✅ Assignment created with ID:', assignmentId);
      
      res.json({
        success: true,
        assignmentId,
        title,
        batchId,
        deadline,
        tokenReward,
        message: 'Assignment created successfully'
      });
      
    } catch (error) {
      console.error('❌ Failed to create assignment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get assignments for specific batch
  app.get('/api/assignments/batch/:batchId/list', async (req, res) => {
    try {
      const { batchId } = req.params;
      
      console.log('📋 Fetching assignments for batch:', batchId);
      
      // For demo, return sample assignment if batch exists
      const sampleAssignments = [
        {
          id: 1,
          title: "Smart Contract Security Analysis",
          description: "Analyze the provided smart contract for security vulnerabilities",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          tokenReward: 50,
          batchId: parseInt(batchId),
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      // Only return assignments if this is a known batch with assignments
      const knownBatchesWithAssignments = [9, 10]; // "Blockchain Development Course", "Smart Contract Security"
      
      if (knownBatchesWithAssignments.includes(parseInt(batchId))) {
        console.log(`✅ Found ${sampleAssignments.length} assignments for batch ${batchId}`);
        res.json(sampleAssignments);
      } else {
        console.log(`📋 No assignments found for batch ${batchId} (new batch)`);
        res.json([]);
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch batch assignments:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  });
}