import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Plus, Upload, FileText, X } from 'lucide-react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContracts } from '@/hooks/useContracts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Batch, Assignment } from '@shared/schema';

export function AssignmentCreator() {
  const { walletState } = useWeb3();
  const contracts = useContracts();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    tokenReward: 100,
    batchId: ''
  });
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch teacher's batches from blockchain
  const { data: blockchainBatches = [] } = useQuery({
    queryKey: ['teacher-batches', walletState.account],
    queryFn: async () => {
      if (!walletState.account || !contracts.isContractsReady) return [];
      
      try {
        const result = await contracts.getTeacherBatches(walletState.account);
        console.log('📊 Assignment Creator - Teacher batches:', result);
        return result;
      } catch (error) {
        console.error('❌ Failed to fetch teacher batches for assignment creator:', error);
        return [];
      }
    },
    enabled: !!walletState.account && contracts.isContractsReady
  });

  // Convert blockchain batches to API format for assignments
  const teacherBatches = blockchainBatches.map((batch: any) => ({
    id: batch.id.toString(), // Convert number to string for API compatibility
    name: batch.name,
    teacher: batch.teacher,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
    isActive: batch.isActive
  }));

  // File upload handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, DOCX, or TXT file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setAssignmentFile(file);
    }
  };

  // Upload file to IPFS
  const uploadFileToIPFS = async (file: File): Promise<string> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const response = await fetch('/api/upload/ipfs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64,
              fileName: file.name,
              uploadType: 'assignment_instructions'
            })
          });
          if (!response.ok) throw new Error('Upload failed');
          const result = await response.json();
          resolve(result.ipfsHash);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Create assignment mutation - Real blockchain call
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      if (!contracts.createAssignment) {
        throw new Error('Assignment contract not ready');
      }
      
      // Upload file to IPFS first if provided
      let ipfsHash = "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn"; // Default empty file hash
      if (assignmentFile) {
        setIsUploadingFile(true);
        try {
          console.log('📤 Uploading assignment file to IPFS:', assignmentFile.name);
          ipfsHash = await uploadFileToIPFS(assignmentFile);
          console.log('✅ Assignment file uploaded to IPFS:', ipfsHash);
        } catch (uploadError) {
          console.error('Failed to upload file:', uploadError);
          throw new Error('Failed to upload assignment file to IPFS');
        } finally {
          setIsUploadingFile(false);
        }
      }
      
      // Convert deadline to timestamp
      const deadlineTimestamp = Math.floor(new Date(assignmentData.deadline).getTime() / 1000);
      
      // Create assignment on real blockchain with IPFS hash
      const result = await contracts.createAssignment(
        assignmentData.title,
        assignmentData.description,
        ipfsHash,
        new Date(assignmentData.deadline),
        assignmentData.tokenReward,
        parseInt(assignmentData.batchId)
      );
      
      // Also notify API for notifications
      try {
        await fetch('/api/assignments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assignmentData)
        });
      } catch (notifError) {
        console.warn('Failed to create notification:', notifError);
      }
      
      return {
        assignmentId: result.assignmentId,
        transactionHash: result.receipt.hash,
        title: assignmentData.title,
        batchId: assignmentData.batchId,
        deadline: assignmentData.deadline,
        tokenReward: assignmentData.tokenReward
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-batches', walletState.account] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments/teacher', walletState.account] });
      
      setFormData({
        title: '',
        description: '',
        deadline: '',
        tokenReward: 100,
        batchId: ''
      });
      setAssignmentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsCreating(false);
      
      const batchName = teacherBatches.find(b => b.id === result.batchId)?.name || 'Unknown Batch';
      
      alert(`✅ Assignment Created Successfully on Blockchain!\n\nTitle: ${result.title}\nAssignment ID: ${result.assignmentId}\nBatch: ${batchName}\nDeadline: ${new Date(result.deadline).toLocaleDateString()}\nReward: ${result.tokenReward} EDU\nTransaction Hash: ${result.transactionHash}\n\nAll students in the batch have been notified!`);
    },
    onError: (error) => {
      console.error('Failed to create assignment:', error);
      alert('Failed to create assignment. Please try again.');
      setIsCreating(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.batchId || !formData.deadline) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!walletState.account) {
      alert('Please connect your wallet');
      return;
    }

    setIsCreating(true);

    const assignmentData = {
      title: formData.title,
      description: formData.description,
      deadline: new Date(formData.deadline),
      tokenReward: formData.tokenReward,
      batchId: formData.batchId,
      createdByAddress: walletState.account,
      isActive: true
    };

    createAssignmentMutation.mutate(assignmentData);
  };

  const selectedBatch = teacherBatches.find(b => b.id === formData.batchId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="h-5 w-5 mr-2 text-green-600" />
          Create New Assignment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Assignment Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title *
            </label>
            <Input
              placeholder="e.g., Blockchain Smart Contract Development"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              data-testid="input-assignment-title"
            />
          </div>

          {/* Assignment Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              placeholder="Describe the assignment requirements, objectives, and any specific instructions..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              data-testid="textarea-assignment-description"
            />
          </div>

          {/* Assignment File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment File (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Upload question paper or instructions (PDF, DOC, DOCX, TXT - max 10MB). Students will be able to view this file.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                data-testid="input-assignment-file"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              {assignmentFile && (
                <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">{assignmentFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setAssignmentFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Batch *
            </label>
            <Select 
              value={formData.batchId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, batchId: value }))}
            >
              <SelectTrigger data-testid="select-batch">
                <SelectValue placeholder="Choose a batch to assign this to..." />
              </SelectTrigger>
              <SelectContent>
                {teacherBatches.length === 0 ? (
                  <SelectItem value="no-batches" disabled>
                    No active batches - Create a batch first
                  </SelectItem>
                ) : (
                  teacherBatches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Deadline and Token Reward Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline *
              </label>
              <Input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                required
                data-testid="input-deadline"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Reward (EDU)
              </label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={formData.tokenReward}
                onChange={(e) => setFormData(prev => ({ ...prev, tokenReward: parseInt(e.target.value) || 100 }))}
                data-testid="input-token-reward"
              />
            </div>
          </div>

          {/* Selected Batch Info */}
          {selectedBatch && (
            <Alert>
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Assignment will be sent to: <strong>{selectedBatch.name}</strong></span>
                  <span className="text-sm text-gray-500">
                    Batch ID: {selectedBatch.id}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  deadline: '',
                  tokenReward: 100,
                  batchId: ''
                });
                setAssignmentFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={isCreating}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !formData.title || !formData.batchId || !formData.deadline}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-create-assignment"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isUploadingFile ? 'Uploading File...' : 'Creating Assignment...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}