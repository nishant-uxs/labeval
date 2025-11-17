import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIPFS } from '@/hooks/useIPFS';
import { useWeb3 } from '@/hooks/useWeb3';
import { contractService } from '@/lib/contracts';
import { TransactionPopup } from '@/components/ui/transaction-popup';

import { useQuery } from '@tanstack/react-query';
import type { Assignment } from '@shared/schema';

export function FileUpload() {
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showTransactionPopup, setShowTransactionPopup] = useState(false);
  const [submissionData, setSubmissionData] = useState<{
    transactionHash?: string;
    ipfsHash: string;
    fileName: string;
    assignmentTitle: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadState, uploadFile, resetUpload, validateFile } = useIPFS();
  const { executeTransaction, walletState } = useWeb3();

  // Fetch assignments available to this student (based on their batch membership)
  const { data: availableAssignments = [], isLoading: loadingAssignments } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/student', walletState.account],
    enabled: !!walletState.account
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    setSelectedFile(file);
    resetUpload();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !selectedAssignment || !walletState.account) {
      alert('Please select an assignment and file');
      return;
    }

    try {
      console.log('📤 Converting file to base64 and uploading to IPFS...');
      
      // Convert file to base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:application/pdf;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      
      // Call backend API to handle IPFS upload and blockchain submission
      const response = await fetch(`/api/assignments/${selectedAssignment}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentAddress: walletState.account,
          fileBase64: fileBase64,
          fileName: selectedFile.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Submission failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Submission successful:', result);

      // Reset form
      setSelectedFile(null);
      setSelectedAssignment('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      resetUpload();
      
      // Show transaction popup with real data from backend
      const selectedAssignmentData = availableAssignments.find(a => a.id === selectedAssignment);
      setSubmissionData({
        transactionHash: result.transactionHash,
        ipfsHash: result.ipfsHash || 'Uploaded to IPFS',
        fileName: selectedFile.name,
        assignmentTitle: selectedAssignmentData?.title || 'Assignment'
      });
      setShowTransactionPopup(true);
    } catch (error) {
      console.error('Submission failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit assignment. Please try again.';
      alert(errorMessage);
    }
  };

  const selectedAssignmentData = availableAssignments.find(a => a.id === selectedAssignment);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-cloud-upload-alt mr-2 text-primary"></i>
          Submit Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignment Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Assignment
          </label>
          <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
            <SelectTrigger data-testid="select-assignment">
              <SelectValue placeholder={loadingAssignments ? "Loading assignments..." : "Choose an assignment..."} />
            </SelectTrigger>
            <SelectContent>
              {availableAssignments.length === 0 ? (
                <SelectItem value="no-assignments" disabled>
                  No assignments available - Contact your teacher
                </SelectItem>
              ) : (
                availableAssignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id}>
                    {assignment.title} (Reward: {assignment.tokenReward} EDU) - Due: {new Date(assignment.deadline).toLocaleDateString()}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedAssignmentData && (
          <Alert>
            <AlertDescription>
              <div className="flex justify-between items-center">
                <span>Deadline: {new Date(selectedAssignmentData.deadline).toLocaleDateString()}</span>
                <span className="text-accent font-medium">+{selectedAssignmentData.tokenReward} EDU</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* File Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-primary bg-primary/5'
              : selectedFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-primary'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          data-testid="file-upload-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInput}
            accept=".pdf,.doc,.docx,.zip,.txt"
            data-testid="file-input"
          />
          
          <div className="space-y-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              selectedFile ? 'bg-green-100' : 'bg-primary/10'
            }`}>
              <i className={`text-2xl ${
                selectedFile 
                  ? 'fas fa-check text-green-600' 
                  : 'fas fa-file-upload text-primary'
              }`}></i>
            </div>
            <div>
              {selectedFile ? (
                <>
                  <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-900">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, DOC, ZIP files up to 10MB
                  </p>
                </>
              )}
            </div>
            {!selectedFile && (
              <Button variant="outline" data-testid="button-browse-files">
                Browse Files
              </Button>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploadState.isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <i className="fas fa-spinner fa-spin text-primary"></i>
              <span className="text-sm font-medium text-blue-800">
                Uploading to IPFS...
              </span>
            </div>
            <Progress value={uploadState.progress} className="w-full" />
          </div>
        )}

        {/* Error Display */}
        {uploadState.error && (
          <Alert variant="destructive">
            <AlertDescription data-testid="upload-error">
              {uploadState.error}
            </AlertDescription>
          </Alert>
        )}

        {/* IPFS Result */}
        {uploadState.result && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">File uploaded to IPFS successfully!</p>
                <p className="text-xs font-mono text-gray-600">
                  Hash: {uploadState.result.hash}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || !selectedAssignment || uploadState.isUploading}
          className="w-full font-medium"
          data-testid="button-submit-assignment"
        >
          <i className="fas fa-paper-plane mr-2"></i>
          {uploadState.isUploading ? 'Uploading...' : 'Submit Assignment'}
        </Button>
      </CardContent>

      {/* Transaction Success Popup */}
      {submissionData && (
        <TransactionPopup
          isOpen={showTransactionPopup}
          onClose={() => {
            setShowTransactionPopup(false);
            setSubmissionData(null);
          }}
          transactionHash={submissionData.transactionHash}
          ipfsHash={submissionData.ipfsHash}
          fileName={submissionData.fileName}
          assignmentTitle={submissionData.assignmentTitle}
        />
      )}
    </Card>
  );
}
