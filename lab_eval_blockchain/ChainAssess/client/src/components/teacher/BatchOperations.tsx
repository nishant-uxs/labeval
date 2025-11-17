import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Progress component - custom implementation
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3 } from '@/hooks/useWeb3';
import { contractService } from '@/lib/contracts';

interface BatchAssignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  tokenReward: number;
  maxGrade: number;
}

interface BatchSubmission {
  id: string;
  studentAddress: string;
  assignmentId: string;
  ipfsHash: string;
  title: string;
  grade?: number;
  issueToken: boolean;
  issueNFT: boolean;
}

export function BatchOperations() {
  const { walletState } = useWeb3();
  const [activeTab, setActiveTab] = useState('create');
  
  // Batch Assignment Creation
  const [assignments, setAssignments] = useState<BatchAssignment[]>([]);
  const [newAssignment, setNewAssignment] = useState<Omit<BatchAssignment, 'id'>>({
    title: '',
    description: '',
    deadline: '',
    tokenReward: 100,
    maxGrade: 100
  });
  
  // Batch Review
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [batchGrade, setBatchGrade] = useState<number>(0);
  const [batchTokenReward, setBatchTokenReward] = useState<boolean>(true);
  const [batchNFTReward, setBatchNFTReward] = useState<boolean>(false);
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<string[]>([]);

  // Mock submissions for batch review
  const mockSubmissions: BatchSubmission[] = [
    {
      id: '1',
      studentAddress: '0x1234...5678',
      assignmentId: 'assignment1',
      ipfsHash: 'QmExample1',
      title: 'React Component Assignment',
      issueToken: true,
      issueNFT: false
    },
    {
      id: '2',
      studentAddress: '0x2345...6789',
      assignmentId: 'assignment1',
      ipfsHash: 'QmExample2',
      title: 'React Component Assignment',
      issueToken: true,
      issueNFT: false
    },
    {
      id: '3',
      studentAddress: '0x3456...7890',
      assignmentId: 'assignment2',
      ipfsHash: 'QmExample3',
      title: 'Blockchain Integration',
      issueToken: true,
      issueNFT: true
    }
  ];

  const addAssignment = () => {
    if (newAssignment.title && newAssignment.description) {
      setAssignments([...assignments, {
        ...newAssignment,
        id: Date.now().toString()
      }]);
      setNewAssignment({
        title: '',
        description: '',
        deadline: '',
        tokenReward: 100,
        maxGrade: 100
      });
    }
  };

  const removeAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const processBatchCreation = async () => {
    if (assignments.length === 0) return;
    
    setIsProcessing(true);
    setResults([]);
    setProgress(0);
    
    try {
      for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        
        // Simulate assignment creation
        const result = `Assignment "${assignment.title}" created successfully`;
        setResults(prev => [...prev, result]);
        setProgress(((i + 1) / assignments.length) * 100);
        
        // Add small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Clear assignments after successful creation
      setAssignments([]);
    } catch (error) {
      setResults(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const processBatchReview = async () => {
    if (selectedSubmissions.length === 0) return;
    
    setIsProcessing(true);
    setResults([]);
    setProgress(0);
    
    try {
      for (let i = 0; i < selectedSubmissions.length; i++) {
        const submissionId = selectedSubmissions[i];
        const submission = mockSubmissions.find(s => s.id === submissionId);
        
        if (submission) {
          // Simulate review processing
          const result = `Submission from ${submission.studentAddress} reviewed (Grade: ${batchGrade})`;
          setResults(prev => [...prev, result]);
          setProgress(((i + 1) / selectedSubmissions.length) * 100);
          
          // Add small delay for UX
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Clear selections after successful review
      setSelectedSubmissions([]);
    } catch (error) {
      setResults(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId) 
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const selectAllSubmissions = () => {
    setSelectedSubmissions(
      selectedSubmissions.length === mockSubmissions.length 
        ? [] 
        : mockSubmissions.map(s => s.id)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Batch Operations</h2>
        <Badge variant="secondary">
          {assignments.length} Queued | {selectedSubmissions.length} Selected
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" data-testid="tab-batch-create">
            Batch Create Assignments
          </TabsTrigger>
          <TabsTrigger value="review" data-testid="tab-batch-review">
            Batch Review Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {/* Assignment Creation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    data-testid="input-assignment-title"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter assignment title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    data-testid="input-assignment-deadline"
                    value={newAssignment.deadline}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  data-testid="textarea-assignment-description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter assignment description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenReward">Token Reward</Label>
                  <Input
                    id="tokenReward"
                    type="number"
                    data-testid="input-token-reward"
                    value={newAssignment.tokenReward}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, tokenReward: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGrade">Maximum Grade</Label>
                  <Input
                    id="maxGrade"
                    type="number"
                    data-testid="input-max-grade"
                    value={newAssignment.maxGrade}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, maxGrade: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>
              
              <Button 
                onClick={addAssignment} 
                disabled={!newAssignment.title || !newAssignment.description}
                data-testid="button-add-assignment"
              >
                Add to Batch
              </Button>
            </CardContent>
          </Card>

          {/* Queued Assignments */}
          {assignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Queued Assignments ({assignments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-gray-600">{assignment.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>Deadline: {assignment.deadline || 'Not set'}</span>
                          <span>Reward: {assignment.tokenReward} EDU</span>
                          <span>Max Grade: {assignment.maxGrade}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAssignment(assignment.id)}
                        data-testid={`button-remove-assignment-${assignment.id}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={processBatchCreation}
                    disabled={isProcessing}
                    className="w-full"
                    data-testid="button-process-batch-creation"
                  >
                    {isProcessing ? 'Creating Assignments...' : `Create ${assignments.length} Assignments`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          {/* Batch Review Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Review Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchGrade">Grade for Selected</Label>
                  <Input
                    id="batchGrade"
                    type="number"
                    data-testid="input-batch-grade"
                    value={batchGrade}
                    onChange={(e) => setBatchGrade(parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="batchToken"
                    checked={batchTokenReward}
                    onCheckedChange={(checked) => setBatchTokenReward(checked as boolean)}
                    data-testid="checkbox-batch-token"
                  />
                  <Label htmlFor="batchToken">Issue Token Rewards</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="batchNFT"
                    checked={batchNFTReward}
                    onCheckedChange={(checked) => setBatchNFTReward(checked as boolean)}
                    data-testid="checkbox-batch-nft"
                  />
                  <Label htmlFor="batchNFT">Issue NFT Rewards</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Submissions</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllSubmissions}
                  data-testid="button-select-all"
                >
                  {selectedSubmissions.length === mockSubmissions.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedSubmissions.includes(submission.id)}
                      onCheckedChange={() => toggleSubmissionSelection(submission.id)}
                      data-testid={`checkbox-submission-${submission.id}`}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{submission.title}</h4>
                      <p className="text-sm text-gray-600">Student: {submission.studentAddress}</p>
                      <p className="text-xs text-gray-500">IPFS: {submission.ipfsHash}</p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                ))}
              </div>
              
              {selectedSubmissions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={processBatchReview}
                    disabled={isProcessing}
                    className="w-full"
                    data-testid="button-process-batch-review"
                  >
                    {isProcessing ? 'Processing Reviews...' : `Review ${selectedSubmissions.length} Submissions`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Progress and Results */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>Processing...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {activeTab === 'create' ? 'Creating assignments...' : 'Reviewing submissions...'}
            </p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {results.map((result, index) => (
                <Alert key={index}>
                  <AlertDescription>{result}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}