import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TransactionPopup } from '@/components/ui/transaction-popup';
import { ipfsService } from '@/lib/ipfs';
import { blockchainService } from '@/lib/blockchain-service';
import { useWeb3 } from '@/hooks/useWeb3';
import { useQuery } from '@tanstack/react-query';
import type { Assignment, InsertSubmission } from '@shared/schema';
import { FileText, Upload, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

// Removed mock assignments - now using real API data

export function EnhancedFileUpload() {
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submissionData, setSubmissionData] = useState<{
    ipfsHash: string;
    transactionHash: string;
    fileName: string;
    assignmentTitle: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { walletState } = useWeb3();

  // Fetch assignments for this student based on batch membership
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/student', walletState.account],
    enabled: !!walletState.account
  });

  console.log('📋 Available assignments for student:', assignments);

  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment);

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
    setUploadError(null);
    
    // Validate file
    const validation = ipfsService.validateFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    // Check assignment-specific requirements (basic file validation)
    if (selectedAssignmentData) {
      // Basic file type check for PDF, DOCX, ZIP files
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`File type not accepted. Please upload PDF, DOCX, ZIP, or TXT files.`);
        return;
      }

      // 10MB file size limit
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setUploadError(`File size exceeds 10MB limit.`);
        return;
      }
    }

    setSelectedFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const isDeadlinePassed = (deadline: Date): boolean => {
    return new Date() > deadline;
  };

  const handleSubmission = async () => {
    if (!selectedFile || !selectedAssignment || !walletState.account || !selectedAssignmentData) {
      setUploadError('Please select both an assignment and file, and ensure your wallet is connected');
      return;
    }

    if (isDeadlinePassed(selectedAssignmentData.deadline)) {
      setUploadError('Assignment deadline has passed. Submission not allowed.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Step 1: Convert file to base64 and upload to IPFS via backend (40% progress)
      setUploadProgress(10);
      console.log('📤 Converting file to base64 and uploading to IPFS...');
      
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Upload to IPFS via backend
      const ipfsResponse = await fetch(`/api/assignments/${selectedAssignment}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          fileName: selectedFile.name,
          studentAddress: walletState.account
        })
      });

      if (!ipfsResponse.ok) {
        const error = await ipfsResponse.json();
        throw new Error(error.details || error.error || 'IPFS upload failed');
      }

      const ipfsResult = await ipfsResponse.json();
      console.log('✅ File uploaded to IPFS:', ipfsResult.ipfsHash);
      setUploadProgress(40);

      // Step 2: Initialize blockchain service (50% progress)
      await blockchainService.initialize();
      setUploadProgress(50);

      // Step 3: Submit to blockchain via MetaMask (80% progress)
      console.log('📝 Submitting to blockchain via MetaMask...');
      const blockchainResult = await blockchainService.submitAssignment(
        selectedAssignment,
        ipfsResult.ipfsHash,
        selectedFile.name,
        selectedAssignmentData.deadline
      );
      setUploadProgress(80);
      console.log('✅ Blockchain submission successful:', blockchainResult.transactionHash);

      setUploadProgress(100);

      // Show success popup
      setSubmissionData({
        ipfsHash: ipfsResult.ipfsHash,
        transactionHash: blockchainResult.transactionHash,
        fileName: selectedFile.name,
        assignmentTitle: selectedAssignmentData.title
      });
      setShowSuccessPopup(true);

      // Reset form
      setSelectedFile(null);
      setSelectedAssignment('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Submission failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Submission failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-8 w-8 text-blue-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText className="h-8 w-8 text-green-600" />;
      case 'zip':
        return <FileText className="h-8 w-8 text-orange-600" />;
      default:
        return <FileText className="h-8 w-8 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-6 w-6 mr-2 text-blue-600" />
            Submit Assignment to Blockchain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assignment Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Assignment</label>
            <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
              <SelectTrigger data-testid="select-assignment">
                <SelectValue placeholder="Choose an assignment" />
              </SelectTrigger>
              <SelectContent>
                {loadingAssignments ? (
                  <SelectItem value="loading" disabled>
                    Loading assignments...
                  </SelectItem>
                ) : assignments.length === 0 ? (
                  <SelectItem value="no-assignments" disabled>
                    No active assignments found
                  </SelectItem>
                ) : (
                  assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{assignment.title}</span>
                        <div className="flex items-center ml-2">
                          {isDeadlinePassed(assignment.deadline) ? (
                            <Badge variant="destructive" className="ml-2">
                              <Clock className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="ml-2">
                              <Clock className="h-3 w-3 mr-1" />
                              {Math.ceil((assignment.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Assignment Details */}
          {selectedAssignmentData && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900">{selectedAssignmentData.title}</h4>
                  <p className="text-sm text-blue-700">{selectedAssignmentData.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      <p className="text-blue-600">
                        <strong>Deadline:</strong> {selectedAssignmentData.deadline.toLocaleDateString()}
                      </p>
                      <p className="text-blue-600">
                        <strong>Reward:</strong> {selectedAssignmentData.tokenReward} EDU tokens
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-blue-600">
                        <strong>Max Size:</strong> 10MB
                      </p>
                      <p className="text-blue-600">
                        <strong>Accepted:</strong> PDF, DOCX, ZIP, TXT
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileInput}
              accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.txt,.zip"
              data-testid="file-input"
            />

            <div className="space-y-4">
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-3">
                  {getFileTypeIcon(selectedFile.name)}
                  <div className="text-left">
                    <p className="font-medium text-green-800">{selectedFile.name}</p>
                    <p className="text-sm text-green-600">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Drop your assignment file here or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supports PDF, DOCX, Images, ZIP files up to 10MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">
                      {uploadProgress < 30 ? 'Uploading to IPFS...' :
                       uploadProgress < 50 ? 'Connecting to blockchain...' :
                       uploadProgress < 80 ? 'Submitting to smart contract...' :
                       'Finalizing submission...'}
                    </span>
                    <span className="text-sm text-blue-600">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-blue-600">
                    Your assignment is being securely stored on IPFS and recorded on the blockchain
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {uploadError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription data-testid="upload-error">
                {uploadError}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmission}
            disabled={
              !selectedFile || 
              !selectedAssignment || 
              !walletState.account || 
              isUploading ||
              (selectedAssignmentData && isDeadlinePassed(selectedAssignmentData.deadline))
            }
            className="w-full font-medium py-3"
            data-testid="button-submit-assignment"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting to Blockchain...
              </>
            ) : selectedAssignmentData && isDeadlinePassed(selectedAssignmentData.deadline) ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Assignment Deadline Passed
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Submit Assignment to Blockchain
              </>
            )}
          </Button>

          {/* Important Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Once submitted, your assignment will be permanently stored on IPFS and recorded on the blockchain. 
              Only your teacher can review and award tokens after the submission. Tokens are non-transferable and locked to your wallet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Success Popup */}
      {submissionData && (
        <TransactionPopup
          isOpen={showSuccessPopup}
          onClose={() => {
            setShowSuccessPopup(false);
            setSubmissionData(null);
          }}
          transactionHash={submissionData.transactionHash}
          ipfsHash={submissionData.ipfsHash}
          fileName={submissionData.fileName}
          assignmentTitle={submissionData.assignmentTitle}
        />
      )}
    </div>
  );
}