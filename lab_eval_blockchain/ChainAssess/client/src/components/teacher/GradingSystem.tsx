import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, FileText, Star, Award } from 'lucide-react';

interface Submission {
  id: string;
  studentAddress: string;
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  fileName: string;
  ipfsHash: string;
  submittedAt: Date;
  status: 'pending' | 'graded' | 'tokens_awarded';
  grade?: string;
  feedback?: string;
  tokensAwarded?: number;
  transactionHash?: string;
}

const mockSubmissions: Submission[] = [
  {
    id: '1',
    studentAddress: '0xc39d22dc2d0a3ca341ce8f69efa563d113607688',
    studentName: 'Student A',
    assignmentId: 'blockchain-contract',
    assignmentTitle: 'Blockchain Smart Contract Development',
    fileName: 'smart_contract.pdf',
    ipfsHash: 'QmExample123456789',
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'pending'
  },
  {
    id: '2',
    studentAddress: '0x1234567890123456789012345678901234567890',
    studentName: 'Student B',
    assignmentId: 'ipfs-integration',
    assignmentTitle: 'IPFS Integration Project',
    fileName: 'ipfs_project.zip',
    ipfsHash: 'QmExample987654321',
    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    status: 'graded',
    grade: 'A',
    feedback: 'Excellent work on implementing IPFS integration!',
    tokensAwarded: 80
  }
];

export function GradingSystem() {
  const [submissions, setSubmissions] = useState<Submission[]>(mockSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isAwarding, setIsAwarding] = useState(false);

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  const awardedSubmissions = submissions.filter(s => s.status === 'tokens_awarded');

  const handleGradeSubmission = async (submissionId: string) => {
    if (!grade || !feedback) {
      alert('Please provide both grade and feedback');
      return;
    }

    setSubmissions(prev => prev.map(sub => 
      sub.id === submissionId 
        ? { ...sub, status: 'graded' as const, grade, feedback }
        : sub
    ));

    setGrade('');
    setFeedback('');
    setSelectedSubmission(null);
    
    alert('Assignment graded successfully! Student can now see the grade, but tokens are not awarded yet.');
  };

  const handleAwardTokens = async (submissionId: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission || submission.status !== 'graded') return;

    setIsAwarding(true);
    
    try {
      // Simulate blockchain transaction for token reward
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const tokenAmount = getTokenAmount(submission.grade);
      const mockTxHash = `0x${Date.now().toString(16)}${'0'.repeat(56)}`.substring(0, 66);
      
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { 
              ...sub, 
              status: 'tokens_awarded' as const, 
              tokensAwarded: tokenAmount,
              transactionHash: mockTxHash
            }
          : sub
      ));

      alert(`Tokens awarded successfully! ${tokenAmount} tokens sent to ${submission.studentName}`);
    } catch (error) {
      alert('Failed to award tokens. Please try again.');
    } finally {
      setIsAwarding(false);
    }
  };

  const getTokenAmount = (grade?: string): number => {
    switch (grade) {
      case 'A': return 100;
      case 'B': return 80;
      case 'C': return 60;
      case 'D': return 40;
      default: return 0;
    }
  };

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'graded':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'tokens_awarded':
        return <Award className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  const SubmissionCard = ({ submission }: { submission: Submission }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(submission.status)}
            <h3 className="font-medium text-gray-900">{submission.assignmentTitle}</h3>
          </div>
          <Badge
            variant={submission.status === 'pending' ? 'secondary' : 'default'}
            className={
              submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              submission.status === 'graded' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }
          >
            {submission.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Student:</strong> {submission.studentName}</p>
          <p><strong>File:</strong> {submission.fileName}</p>
          <p><strong>Submitted:</strong> {formatDate(submission.submittedAt)}</p>
          {submission.grade && (
            <div className="flex items-center space-x-2">
              <strong>Grade:</strong>
              <Badge className={getGradeColor(submission.grade)}>
                {submission.grade}
              </Badge>
            </div>
          )}
          {submission.tokensAwarded && (
            <p><strong>Tokens Awarded:</strong> {submission.tokensAwarded}</p>
          )}
        </div>

        <div className="flex space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://ipfs.io/ipfs/${submission.ipfsHash}`, '_blank')}
            data-testid={`button-view-file-${submission.id}`}
          >
            <FileText className="h-4 w-4 mr-1" />
            View File
          </Button>
          
          {submission.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => setSelectedSubmission(submission)}
              data-testid={`button-grade-${submission.id}`}
            >
              <Star className="h-4 w-4 mr-1" />
              Grade
            </Button>
          )}
          
          {submission.status === 'graded' && (
            <Button
              size="sm"
              onClick={() => handleAwardTokens(submission.id)}
              disabled={isAwarding}
              data-testid={`button-award-tokens-${submission.id}`}
            >
              <Award className="h-4 w-4 mr-1" />
              {isAwarding ? 'Awarding...' : 'Award Tokens'}
            </Button>
          )}
          
          {submission.transactionHash && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://sepolia.etherscan.io/tx/${submission.transactionHash}`, '_blank')}
              data-testid={`button-view-tx-${submission.id}`}
            >
              View Transaction
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Assignment Grading</h2>
        <div className="flex space-x-4 text-sm">
          <span className="flex items-center">
            <Clock className="h-4 w-4 text-yellow-600 mr-1" />
            {pendingSubmissions.length} Pending
          </span>
          <span className="flex items-center">
            <CheckCircle className="h-4 w-4 text-blue-600 mr-1" />
            {gradedSubmissions.length} Graded
          </span>
          <span className="flex items-center">
            <Award className="h-4 w-4 text-green-600 mr-1" />
            {awardedSubmissions.length} Tokens Awarded
          </span>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Review ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="graded" data-testid="tab-graded">
            Graded ({gradedSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="awarded" data-testid="tab-awarded">
            Tokens Awarded ({awardedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingSubmissions.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No pending submissions to review.
                </AlertDescription>
              </Alert>
            ) : (
              pendingSubmissions.map(submission => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="graded">
          <div className="space-y-4">
            {gradedSubmissions.map(submission => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="awarded">
          <div className="space-y-4">
            {awardedSubmissions.map(submission => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Grade Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{selectedSubmission.assignmentTitle}</p>
                <p className="text-sm text-gray-600">Student: {selectedSubmission.studentName}</p>
                <p className="text-sm text-gray-600">File: {selectedSubmission.fileName}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grade</label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger data-testid="select-grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A (Excellent - 100 tokens)</SelectItem>
                    <SelectItem value="B">B (Good - 80 tokens)</SelectItem>
                    <SelectItem value="C">C (Average - 60 tokens)</SelectItem>
                    <SelectItem value="D">D (Below Average - 40 tokens)</SelectItem>
                    <SelectItem value="F">F (Fail - 0 tokens)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Feedback</label>
                <Textarea
                  placeholder="Provide feedback to the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  data-testid="textarea-feedback"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubmission(null)}
                  className="flex-1"
                  data-testid="button-cancel-grade"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleGradeSubmission(selectedSubmission.id)}
                  disabled={!grade || !feedback}
                  className="flex-1"
                  data-testid="button-submit-grade"
                >
                  Submit Grade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}