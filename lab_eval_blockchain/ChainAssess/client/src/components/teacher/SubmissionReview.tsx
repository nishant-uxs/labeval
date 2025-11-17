import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWeb3 } from '@/hooks/useWeb3';
import { contractService } from '@/lib/contracts';
import { ipfsService } from '@/lib/ipfs';

interface SubmissionData {
  id: string;
  studentName: string;
  studentAddress: string;
  assignment: string;
  assignmentId: string;
  fileName: string;
  ipfsHash: string;
  submissionTime: Date;
  isOnTime: boolean;
  reviewed: boolean;
  rewardIssued: boolean;
}

export function SubmissionReview() {
  const { executeTransaction, walletState } = useWeb3();
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockSubmissions: SubmissionData[] = [
      {
        id: '1',
        studentName: 'Alice Johnson',
        studentAddress: '0x1234567890123456789012345678901234567890',
        assignment: 'Blockchain Smart Contract Development',
        assignmentId: 'blockchain-contract',
        fileName: 'smart-contract-project.zip',
        ipfsHash: 'QmX4Y9K2V8W3N5L7M9P6Q8R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K',
        submissionTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isOnTime: true,
        reviewed: false,
        rewardIssued: false
      },
      {
        id: '2',
        studentName: 'Bob Smith',
        studentAddress: '0x2345678901234567890123456789012345678901',
        assignment: 'IPFS Integration Project',
        assignmentId: 'ipfs-integration',
        fileName: 'ipfs-web-app.zip',
        ipfsHash: 'QmY7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7',
        submissionTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isOnTime: false,
        reviewed: false,
        rewardIssued: false
      }
    ];

    setSubmissions(mockSubmissions);
    setLoading(false);
  }, []);

  const handleViewSubmission = async (submission: SubmissionData) => {
    try {
      const url = ipfsService.getGatewayUrl(submission.ipfsHash);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to view submission:', error);
      alert('Failed to load submission file');
    }
  };

  const handleIssueTokens = async (submission: SubmissionData) => {
    if (!walletState.account) return;

    try {
      const amount = submission.isOnTime ? 100 : 50; // Reduced reward for late submissions
      const reason = `Assignment: ${submission.assignment}`;

      await executeTransaction(
        () => contractService.mintTokens(submission.studentAddress, amount, reason),
        'Issue token reward'
      );

      // Update submission status
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submission.id
            ? { ...s, rewardIssued: true, reviewed: true }
            : s
        )
      );

      alert(`Successfully issued ${amount} tokens to ${submission.studentName}`);
    } catch (error) {
      console.error('Failed to issue tokens:', error);
      alert('Failed to issue token reward');
    }
  };

  const handleIssueNFT = async (submission: SubmissionData) => {
    if (!walletState.account) return;

    try {
      const name = 'Excellence in ' + submission.assignment;
      const description = `Outstanding performance on ${submission.assignment}`;
      const imageUri = 'https://ipfs.io/ipfs/QmExampleNFTImage'; // Would be a real image

      await executeTransaction(
        () => contractService.mintNFT(submission.studentAddress, name, description, imageUri),
        'Issue NFT achievement'
      );

      alert(`Successfully issued NFT achievement to ${submission.studentName}`);
    } catch (error) {
      console.error('Failed to issue NFT:', error);
      alert('Failed to issue NFT achievement');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-clipboard-check mr-2 text-primary"></i>
          Recent Submissions for Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-inbox text-gray-400 text-2xl"></i>
            </div>
            <p className="text-gray-500">No submissions to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-gray-200 rounded-lg p-4"
                data-testid={`submission-${submission.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{submission.studentName}</h4>
                    <p className="text-sm text-gray-600">{submission.assignment}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {submission.submissionTime.toLocaleDateString()} {submission.submissionTime.toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant={submission.isOnTime ? 'default' : 'destructive'}>
                    {submission.isOnTime ? 'On Time' : 'Late'}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-file-alt"></i>
                    <span>{submission.fileName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-database"></i>
                    <span className="font-mono text-xs">
                      {submission.ipfsHash.slice(0, 8)}...{submission.ipfsHash.slice(-6)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => handleViewSubmission(submission)}
                    size="sm"
                    variant="outline"
                    data-testid={`button-view-${submission.id}`}
                  >
                    <i className="fas fa-eye mr-1"></i>
                    View
                  </Button>
                  
                  {submission.isOnTime ? (
                    <>
                      <Button
                        onClick={() => handleIssueTokens(submission)}
                        size="sm"
                        disabled={submission.rewardIssued}
                        data-testid={`button-issue-tokens-${submission.id}`}
                      >
                        <i className="fas fa-coins mr-1"></i>
                        {submission.rewardIssued ? 'Tokens Issued' : 'Issue Tokens'}
                      </Button>
                      
                      <Button
                        onClick={() => handleIssueNFT(submission)}
                        size="sm"
                        variant="secondary"
                        data-testid={`button-issue-nft-${submission.id}`}
                      >
                        <i className="fas fa-medal mr-1"></i>
                        Issue NFT
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      <i className="fas fa-times mr-1"></i>
                      Deadline Passed
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
