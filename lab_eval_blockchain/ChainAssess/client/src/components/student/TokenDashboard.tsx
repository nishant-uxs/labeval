import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { blockchainService } from '@/lib/blockchain-service';
import { useWeb3 } from '@/hooks/useWeb3';
import { AssignmentSubmission, TokenTransaction } from '@/types/assignment';
import { 
  Award, 
  Lock, 
  TrendingUp, 
  FileText, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface StudentTokenData {
  totalTokens: number;
  tokensThisSemester: number;
  submittedAssignments: number;
  approvedAssignments: number;
  averageGrade: string;
  isTransferLocked: boolean;
  recentTransactions: TokenTransaction[];
  submissionHistory: AssignmentSubmission[];
}

export function TokenDashboard() {
  const [studentData, setStudentData] = useState<StudentTokenData>({
    totalTokens: 0,
    tokensThisSemester: 0,
    submittedAssignments: 0,
    approvedAssignments: 0,
    averageGrade: '-',
    isTransferLocked: true,
    recentTransactions: [],
    submissionHistory: []
  });
  const [loading, setLoading] = useState(false);
  const { walletState } = useWeb3();

  useEffect(() => {
    if (walletState.account) {
      loadStudentData();
    }
  }, [walletState.account]);

  const loadStudentData = async () => {
    if (!walletState.account) return;

    setLoading(true);
    try {
      // Initialize blockchain service
      await blockchainService.initialize();

      // Get current token balance
      const tokenBalance = await blockchainService.getStudentTokenBalance(walletState.account);
      
      // Check transfer lock status  
      const transfersLocked = await blockchainService.areTransfersLocked(walletState.account);

      setStudentData(prev => ({
        ...prev,
        totalTokens: tokenBalance,
        isTransferLocked: transfersLocked
      }));

    } catch (error) {
      console.error('Failed to load student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
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
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Token Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{studentData.totalTokens}</p>
                <p className="text-sm text-gray-600">Total Tokens Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{studentData.tokensThisSemester}</p>
                <p className="text-sm text-gray-600">This Semester</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {studentData.approvedAssignments}/{studentData.submittedAssignments}
                </p>
                <p className="text-sm text-gray-600">Approved Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <Badge className={getGradeColor(studentData.averageGrade)}>
                  {studentData.averageGrade}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Lock Notice */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <strong>Token Transfer Status:</strong> Your tokens are {studentData.isTransferLocked ? 'locked' : 'unlocked'}. 
          {studentData.isTransferLocked 
            ? ' Educational tokens are non-transferable and permanently linked to your wallet for academic integrity.'
            : ' You can transfer your tokens to other addresses.'
          }
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="submissions" data-testid="tab-submissions">
            Assignment Submissions
          </TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">
            Token Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Your Assignment Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {studentData.submissionHistory.length === 0 ? (
                <Alert>
                  <AlertDescription>No assignment submissions yet. Submit your first assignment to start earning tokens!</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {studentData.submissionHistory.map((submission) => (
                    <Card key={submission.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(submission.status)}
                            <div>
                              <h3 className="font-medium">{submission.fileName}</h3>
                              <p className="text-sm text-gray-600">Assignment ID: {submission.assignmentId}</p>
                            </div>
                          </div>
                          <Badge variant={
                            submission.status === 'approved' ? 'default' :
                            submission.status === 'rejected' ? 'destructive' :
                            'secondary'
                          }>
                            {submission.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">File Size</p>
                            <p className="font-medium">{formatFileSize(submission.fileSize)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Submitted</p>
                            <p className="font-medium">{submission.submittedAt.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">IPFS Hash</p>
                            <p className="font-mono text-xs">{submission.ipfsHash.slice(0, 15)}...</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Blockchain TX</p>
                            <p className="font-mono text-xs">{submission.blockchainData.transactionHash.slice(0, 15)}...</p>
                          </div>
                        </div>

                        {submission.teacherReview && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">Teacher Review:</span>
                                <Badge className={getGradeColor(submission.teacherReview.grade)}>
                                  Grade {submission.teacherReview.grade}
                                </Badge>
                              </div>
                              {submission.tokenReward && (
                                <div className="flex items-center text-green-600">
                                  <Award className="h-4 w-4 mr-1" />
                                  <span className="font-medium">{submission.tokenReward.amount} tokens</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{submission.teacherReview.feedback}</p>
                            <p className="text-xs text-gray-500">
                              Reviewed on {submission.teacherReview.reviewedAt.toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(submission.ipfsUrl, '_blank')}
                            data-testid={`button-view-file-${submission.id}`}
                          >
                            <FileText className="h-4 w-4 mr-1" />
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

                          {submission.tokenReward && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://sepolia.etherscan.io/tx/${submission.tokenReward.transactionHash}`, '_blank')}
                              data-testid={`button-view-token-tx-${submission.id}`}
                            >
                              <Award className="h-4 w-4 mr-1" />
                              View Token Transaction
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Token Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {studentData.recentTransactions.length === 0 ? (
                <Alert>
                  <AlertDescription>No token transactions yet. Complete and get approved assignments to start earning tokens!</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {studentData.recentTransactions.map((transaction) => (
                    <Card key={transaction.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Award className={`h-6 w-6 ${transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'}`} />
                            <div>
                              <p className="font-medium">
                                {transaction.type === 'earned' ? '+' : '-'}{transaction.amount} tokens
                              </p>
                              <p className="text-sm text-gray-600">{transaction.description}</p>
                              <p className="text-xs text-gray-500">{transaction.timestamp.toLocaleString()}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transaction.transactionHash}`, '_blank')}
                            data-testid={`button-view-tx-${transaction.id}`}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Transaction
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Academic Achievement Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Academic Integrity Notice:</strong> All tokens earned through assignments are permanently recorded on the blockchain 
          and linked to your specific submissions. This ensures complete transparency and prevents academic fraud. 
          Your token balance represents your genuine academic achievements.
        </AlertDescription>
      </Alert>
    </div>
  );
}