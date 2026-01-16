import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AssignmentSubmission } from '@/types/assignment';
import { blockchainService } from '@/lib/blockchain-service';
import { useWeb3 } from '@/hooks/useWeb3';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award, 
  ExternalLink,
  AlertTriangle,
  Eye,
  Star,
  Sparkles
} from 'lucide-react';

export function AssignmentReviewSystem() {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [reviewGrade, setReviewGrade] = useState<string>('');
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const [awardProgress, setAwardProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAIGrading, setIsAIGrading] = useState(false);
  const [aiSuggestion, setAISuggestion] = useState<{
    suggestedGrade: string;
    feedback: string;
    strengths: string[];
    improvements: string[];
    confidence: number;
  } | null>(null);

  const { walletState } = useWeb3();

  // Fetch all submissions for teacher
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!walletState.account) return;

      try {
        setLoading(true);
        console.log('📥 Fetching all submissions for teacher...');

        // Fetch teacher's batches
        const batchesRes = await fetch(`/api/batches/teacher/${walletState.account.toLowerCase()}`);
        const batches = await batchesRes.json();
        console.log('✅ Fetched batches:', batches);

        // Fetch all assignments and submissions for each batch
        const allSubmissions: AssignmentSubmission[] = [];

        for (const batch of batches) {
          const assignmentsRes = await fetch(`/api/assignments/batch/${batch.id}`);
          const assignments = await assignmentsRes.json();
          console.log(`✅ Fetched ${assignments.length} assignments for batch ${batch.id}`);

          for (const assignment of assignments) {
            const submissionsRes = await fetch(`/api/submissions/assignment/${assignment.id}`);
            const apiSubmissions = await submissionsRes.json();
            console.log(`✅ Fetched ${apiSubmissions.length} submissions for assignment ${assignment.id}:`, apiSubmissions);

            // Transform API submissions to component format
            for (const apiSub of apiSubmissions) {
              console.log('📝 Transforming submission:', apiSub);
              
              allSubmissions.push({
                id: apiSub.id,
                assignmentId: assignment.id,
                batchId: batch.id, // Add batchId for token minting
                studentAddress: apiSub.student, // API returns 'student' not 'studentAddress'
                studentName: `Student ${apiSub.student.slice(0, 6)}...${apiSub.student.slice(-4)}`,
                fileName: apiSub.fileName,
                fileSize: 0, // Not available from blockchain
                fileType: apiSub.fileName?.split('.').pop() || 'pdf',
                ipfsHash: apiSub.ipfsHash,
                ipfsUrl: apiSub.ipfsUrl, // API already provides the full URL
                submittedAt: new Date(apiSub.submittedAt), // API returns 'submittedAt'
                deadline: new Date(assignment.deadline),
                status: apiSub.isGraded ? 'approved' : 'submitted',
                blockchainData: {
                  transactionHash: '0x...',
                  blockNumber: 0,
                  gasUsed: '0'
                },
                teacherReview: apiSub.isGraded ? {
                  reviewedBy: apiSub.gradedBy,
                  reviewedAt: apiSub.gradedAt ? new Date(apiSub.gradedAt) : new Date(),
                  grade: apiSub.grade as 'A' | 'B' | 'C' | 'D' | 'F',
                  feedback: '',
                  approved: true
                } : undefined,
                tokenReward: apiSub.tokensAwarded > 0 ? {
                  amount: apiSub.tokensAwarded,
                  transactionHash: '0x...',
                  mintedAt: apiSub.gradedAt ? new Date(apiSub.gradedAt) : new Date()
                } : undefined
              });
            }
          }
        }

        console.log(`✅ Fetched ${allSubmissions.length} total submissions`);
        setSubmissions(allSubmissions);
      } catch (error) {
        console.error('❌ Failed to fetch submissions:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [walletState.account]);

  const pendingSubmissions = submissions.filter(s => s.status === 'submitted');
  const approvedSubmissions = submissions.filter(s => s.status === 'approved');
  const rejectedSubmissions = submissions.filter(s => s.status === 'rejected');

  const getTokenAmount = (grade: string, maxReward: number = 100): number => {
    switch (grade) {
      case 'A': return maxReward;
      case 'B': return Math.floor(maxReward * 0.8);
      case 'C': return Math.floor(maxReward * 0.6);
      case 'D': return Math.floor(maxReward * 0.4);
      case 'F': return 0;
      default: return 0;
    }
  };

  const isDeadlinePassed = (deadline: Date): boolean => {
    return new Date() > deadline;
  };

  const handleAIGrade = async () => {
    if (!selectedSubmission) return;
    
    setIsAIGrading(true);
    setAISuggestion(null);
    
    try {
      console.log('🤖 Requesting AI grading for submission:', selectedSubmission.id);
      
      const response = await fetch(`/api/submissions/${selectedSubmission.id}/ai-grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: selectedSubmission.assignmentId })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        const errorMsg = result.details || result.error || 'AI grading request failed';
        throw new Error(errorMsg);
      }
      
      console.log('✅ AI grading result:', result);
      
      if (result.suggestedGrade && result.feedback) {
        setAISuggestion({
          suggestedGrade: result.suggestedGrade,
          feedback: result.feedback,
          strengths: result.strengths || [],
          improvements: result.improvements || [],
          confidence: result.confidence || 50
        });
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (error) {
      console.error('AI grading failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`AI grading failed: ${errorMessage}\n\nPlease try again or grade manually.`);
    } finally {
      setIsAIGrading(false);
    }
  };

  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    setReviewGrade(aiSuggestion.suggestedGrade);
    setReviewFeedback(aiSuggestion.feedback);
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission || !reviewGrade || !reviewFeedback.trim()) {
      alert('Please provide both grade and feedback');
      return;
    }

    if (isDeadlinePassed(selectedSubmission.deadline)) {
      alert('Cannot review: Assignment deadline has passed');
      return;
    }

    setIsReviewing(true);

    try {
      const approved = reviewGrade !== 'F';
      const tokenAmount = getTokenAmount(reviewGrade);

      // Update submission with teacher review
      const updatedSubmission: AssignmentSubmission = {
        ...selectedSubmission,
        status: approved ? 'approved' : 'rejected',
        teacherReview: {
          reviewedBy: walletState.account || 'teacher',
          reviewedAt: new Date(),
          grade: reviewGrade as 'A' | 'B' | 'C' | 'D' | 'F',
          feedback: reviewFeedback,
          approved
        }
      };

      // Grade submission via blockchain using teacher's MetaMask
      setAwardProgress(25);
      
      try {
        console.log(`🎓 Grading submission ${selectedSubmission.id} with grade: ${reviewGrade}`);
        
        if (!walletState.account) {
          throw new Error('Please connect your wallet first');
        }
        
        setAwardProgress(50);
        
        // Call smart contract directly with teacher's wallet
        // Step 1: reviewSubmission + Step 2: awardTokens
        const result = await blockchainService.gradeSubmission(
          Number(selectedSubmission.id),
          reviewGrade,
          reviewFeedback,
          tokenAmount,
          selectedSubmission.studentAddress,
          Number(selectedSubmission.assignmentId),
          selectedSubmission.batchId || 1 // Use batchId from submission or default to 1
        );
        
        setAwardProgress(90);
        console.log(`✅ Submission graded on blockchain! TX: ${result.transactionHash}`);
        
        // Update with blockchain transaction information
        updatedSubmission.tokenReward = {
          amount: tokenAmount,
          transactionHash: result.transactionHash,
          mintedAt: new Date()
        };
        setAwardProgress(100);
        
        // Show success notification
        alert(`🎉 ${approved ? `${tokenAmount} EDU tokens awarded to student!` : 'Assignment graded!'}\n\nTransaction: ${result.transactionHash}\nGrade: ${reviewGrade}\nStudent: ${selectedSubmission.studentName}`);
        
      } catch (error) {
        console.error('Grading failed:', error);
        alert(`Failed to grade submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsReviewing(false);
        setIsAwarding(false);
        setAwardProgress(0);
        return;
      }

      // Update submissions list
      setSubmissions(prev => 
        prev.map(sub => sub.id === selectedSubmission.id ? updatedSubmission : sub)
      );

      // Reset form
      setSelectedSubmission(null);
      setReviewGrade('');
      setReviewFeedback('');

    } catch (error) {
      console.error('Review failed:', error);
      alert(`Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsReviewing(false);
      setIsAwarding(false);
      setAwardProgress(0);
    }
  };

  const SubmissionCard = ({ submission }: { submission: AssignmentSubmission }) => {
    const getStatusIcon = () => {
      switch (submission.status) {
        case 'submitted':
          return <Clock className="h-5 w-5 text-yellow-600" />;
        case 'approved':
          return <CheckCircle className="h-5 w-5 text-green-600" />;
        case 'rejected':
          return <XCircle className="h-5 w-5 text-red-600" />;
        default:
          return <FileText className="h-5 w-5 text-gray-600" />;
      }
    };

    const getStatusBadge = () => {
      switch (submission.status) {
        case 'submitted':
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
        case 'approved':
          return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
        case 'rejected':
          return <Badge variant="destructive">Rejected</Badge>;
        default:
          return <Badge variant="outline">Unknown</Badge>;
      }
    };

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <h3 className="font-medium text-gray-900">{submission.studentName}</h3>
                <p className="text-sm text-gray-600">{submission.studentAddress.slice(0, 10)}...</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">File:</span>
              <span className="font-medium">{submission.fileName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Size:</span>
              <span>{formatFileSize(submission.fileSize)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Submitted:</span>
              <span>{submission.submittedAt.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Deadline:</span>
              <span className={isDeadlinePassed(submission.deadline) ? 'text-red-600 font-medium' : ''}>
                {submission.deadline.toLocaleDateString()}
                {isDeadlinePassed(submission.deadline) && ' (Expired)'}
              </span>
            </div>

            {submission.teacherReview && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Grade:</span>
                  <Badge className={
                    submission.teacherReview.grade === 'A' ? 'bg-green-100 text-green-800' :
                    submission.teacherReview.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                    submission.teacherReview.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                    submission.teacherReview.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {submission.teacherReview.grade}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-2">{submission.teacherReview.feedback}</p>
                {submission.tokenReward && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600 font-medium">Tokens Awarded:</span>
                    <span className="text-green-600 font-medium">{submission.tokenReward.amount}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(submission.ipfsUrl, '_blank')}
              data-testid={`button-view-file-${submission.id}`}
            >
              <Eye className="h-4 w-4 mr-1" />
              View File
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://sepolia.etherscan.io/tx/${submission.blockchainData.transactionHash}`, '_blank')}
              data-testid={`button-view-blockchain-${submission.id}`}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View on Blockchain
            </Button>

            {submission.status === 'submitted' && !isDeadlinePassed(submission.deadline) && (
              <Button
                size="sm"
                onClick={() => { setSelectedSubmission(submission); setAISuggestion(null); setReviewGrade(''); setReviewFeedback(''); }}
                data-testid={`button-review-${submission.id}`}
              >
                <Star className="h-4 w-4 mr-1" />
                Review & Grade
              </Button>
            )}

            {submission.tokenReward && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${submission.tokenReward?.transactionHash || ''}`, '_blank')}
                data-testid={`button-view-token-tx-${submission.id}`}
              >
                <Award className="h-4 w-4 mr-1" />
                View Token TX
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Assignment Review & Token Award System</h2>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-yellow-600 mr-1" />
            <span>{pendingSubmissions.length} Pending</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
            <span>{approvedSubmissions.length} Approved</span>
          </div>
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-600 mr-1" />
            <span>{rejectedSubmissions.length} Rejected</span>
          </div>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Teacher Instructions:</strong> Review each submission, assign a grade (A-F), and provide feedback. 
          Tokens are automatically minted and transferred to students upon approval. Submissions past deadline cannot be reviewed.
          All tokens are non-transferable and locked to student wallets.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" data-testid="tab-pending-review">
            Pending Review ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved ({approvedSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rejected ({rejectedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingSubmissions.length === 0 ? (
              <Alert>
                <AlertDescription>No pending submissions to review.</AlertDescription>
              </Alert>
            ) : (
              pendingSubmissions.map(submission => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <div className="space-y-4">
            {approvedSubmissions.map(submission => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rejected">
          <div className="space-y-4">
            {rejectedSubmissions.map(submission => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-6 w-6 mr-2" />
                Review Assignment Submission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h3 className="font-medium">{selectedSubmission.studentName}</h3>
                <p className="text-sm text-gray-600">Student Address: {selectedSubmission.studentAddress}</p>
                <p className="text-sm text-gray-600">File: {selectedSubmission.fileName} ({formatFileSize(selectedSubmission.fileSize)})</p>
                <p className="text-sm text-gray-600">Submitted: {selectedSubmission.submittedAt.toLocaleString()}</p>
                <p className="text-sm text-gray-600">IPFS Hash: {selectedSubmission.ipfsHash}</p>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedSubmission.ipfsUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View File
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://sepolia.etherscan.io/tx/${selectedSubmission.blockchainData.transactionHash}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View on Blockchain
                  </Button>
                </div>
              </div>

              {/* AI Grading Section */}
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="font-medium text-purple-800">AI-Powered Grading</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAIGrade}
                      disabled={isAIGrading}
                      className="bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200"
                    >
                      {isAIGrading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Get AI Suggestion
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {aiSuggestion && (
                    <div className="space-y-3 mt-3 p-3 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Suggested Grade:</span>
                        <Badge className="bg-purple-100 text-purple-800 text-lg px-3">
                          {aiSuggestion.suggestedGrade || 'N/A'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Feedback:</p>
                        <p className="text-sm text-gray-700">{aiSuggestion.feedback || 'No feedback available'}</p>
                      </div>
                      {aiSuggestion.strengths && aiSuggestion.strengths.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1 text-green-700">Strengths:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {aiSuggestion.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {aiSuggestion.improvements && aiSuggestion.improvements.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1 text-orange-700">Areas for Improvement:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {aiSuggestion.improvements.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-gray-500">Confidence: {aiSuggestion.confidence ?? 50}%</span>
                        <Button
                          size="sm"
                          onClick={applyAISuggestion}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Apply Suggestion
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grade</label>
                <Select value={reviewGrade} onValueChange={setReviewGrade}>
                  <SelectTrigger data-testid="select-grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Excellent (100 tokens)</SelectItem>
                    <SelectItem value="B">B - Good (80 tokens)</SelectItem>
                    <SelectItem value="C">C - Average (60 tokens)</SelectItem>
                    <SelectItem value="D">D - Below Average (40 tokens)</SelectItem>
                    <SelectItem value="F">F - Fail (0 tokens)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Feedback</label>
                <Textarea
                  placeholder="Provide detailed feedback to help the student improve..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-feedback"
                />
              </div>

              {isAwarding && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-800">Awarding Tokens...</p>
                      <Progress value={awardProgress} className="w-full" />
                      <p className="text-xs text-blue-600">
                        {awardProgress < 50 ? 'Connecting to blockchain...' :
                         awardProgress < 75 ? 'Minting tokens...' :
                         'Transferring to student wallet...'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => { setSelectedSubmission(null); setAISuggestion(null); }}
                  disabled={isReviewing || isAwarding}
                  className="flex-1"
                  data-testid="button-cancel-review"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReviewSubmission}
                  disabled={!reviewGrade || !reviewFeedback.trim() || isReviewing || isAwarding}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-submit-review"
                >
                  {isReviewing || isAwarding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isAwarding ? 'Awarding Tokens...' : 'Reviewing...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Review & Award Tokens
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}