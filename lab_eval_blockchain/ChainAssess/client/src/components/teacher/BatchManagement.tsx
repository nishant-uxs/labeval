import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Users, UserPlus, UserX, Calendar, Hash, Trash2, AlertTriangle, Edit2, X, Check } from 'lucide-react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContracts } from '@/hooks/useContracts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Batch, BatchStudent, InsertBatch } from '@shared/schema';
import { AssignmentCreator } from './AssignmentCreator';
import { ContractDebugPanel } from '../debug/ContractDebugPanel';

export function BatchManagement() {
  const [newBatchName, setNewBatchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addingStudentBatchId, setAddingStudentBatchId] = useState<number | null>(null);
  const [studentAddress, setStudentAddress] = useState('');
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
  const [editBatchName, setEditBatchName] = useState('');
  const { walletState } = useWeb3();
  const contracts = useContracts();
  const queryClient = useQueryClient();

  // Fetch teacher's batches from blockchain with force refresh
  const { data: batches = [], isLoading: loadingBatches, error: batchError, refetch: refetchBatches } = useQuery({
    queryKey: ['teacher-batches', walletState.account],
    queryFn: async () => {
      if (!walletState.account) {
        return [];
      }
      try {
        console.log('🔗 Fetching teacher batches for:', walletState.account);
        
        // Use API call instead of contract call for better reliability
        const response = await fetch(`/api/batches/teacher/${walletState.account}`);
        const result = await response.json();
        
        console.log('📊 Teacher batches from API:', result);
        
        // Fix serialization issue by converting Date objects to strings
        return result.map((batch: any) => ({
          ...batch,
          createdAt: batch.createdAt instanceof Date ? batch.createdAt.toISOString() : batch.createdAt,
          updatedAt: batch.updatedAt instanceof Date ? batch.updatedAt.toISOString() : batch.updatedAt
        }));
      } catch (error) {
        console.error('❌ Failed to fetch teacher batches:', error);
        // Return empty array when API fails
        return [];
      }
    },
    enabled: !!walletState.account,
    retry: 1,
    // Disable cache to always fetch fresh data
    staleTime: 0,
    gcTime: 0,
    structuralSharing: false
  });

  // Create batch mutation - Now using blockchain
  const createBatchMutation = useMutation({
    mutationFn: async (batchName: string) => {
      if (!contracts.createBatch) {
        throw new Error('Batch management contract not ready');
      }
      return await contracts.createBatch(batchName);
    },
    onSuccess: (result) => {
      // Force clear cache and refetch
      queryClient.removeQueries({ queryKey: ['teacher-batches'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-batches', walletState.account] });
      
      // Force refetch after a short delay
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['teacher-batches', walletState.account] });
      }, 2000);
      
      setNewBatchName('');
      setIsCreating(false);
      alert(`✅ Batch Created Successfully on Blockchain!\n\nBatch Name: ${newBatchName}\nBatch ID: ${result.batchId}\nTransaction Hash: ${result.receipt.hash}\nTeacher: ${walletState.account?.slice(0, 6)}...${walletState.account?.slice(-4)}\n\nYou can now add students and create assignments for this batch!`);
    },
    onError: (error: any) => {
      console.error('Batch creation failed:', error);
      alert('Failed to create batch on blockchain. Please try again.');
      setIsCreating(false);
    }
  });

  // Remove student from batch mutation - Now using blockchain
  const removeStudentMutation = useMutation({
    mutationFn: async ({ batchId, studentAddress }: { batchId: number, studentAddress: string }) => {
      if (!contracts.removeStudentFromBatch) {
        throw new Error('Batch management contract not ready');
      }
      return await contracts.removeStudentFromBatch(batchId, studentAddress);
    },
    onSuccess: (receipt, { batchId, studentAddress }) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-batches', walletState.account] });
      const batch = batches.find(b => b.id === batchId);
      alert(`✅ Student Removed Successfully!\n\nStudent: ${studentAddress.slice(0, 6)}...${studentAddress.slice(-4)}\nBatch: ${batch?.name}\nTransaction Hash: ${receipt.hash}`);
    },
    onError: (error: any) => {
      console.error('Remove student failed:', error);
      const errorMessage = error?.message || 'Failed to remove student';
      if (errorMessage.includes('not in this batch') || errorMessage.includes('not enrolled')) {
        alert('⚠️ Student is not in this batch!');
      } else {
        alert('Failed to remove student from batch. Please try again.');
      }
    }
  });

  // Deactivate batch mutation - Now using blockchain
  const deleteBatchMutation = useMutation({
    mutationFn: async (batchId: number) => {
      if (!contracts.deactivateBatch) {
        throw new Error('Batch management contract not ready');
      }
      return await contracts.deactivateBatch(batchId);
    },
    onSuccess: (receipt, batchId) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-batches', walletState.account] });
      const batch = batches.find(b => b.id === batchId);
      alert(`✅ Batch Deactivated Successfully!\n\nBatch: ${batch?.name}\nTransaction Hash: ${receipt.hash}`);
    },
    onError: (error: any) => {
      console.error('Deactivate batch failed:', error);
      if (error.code === 'ACTION_REJECTED') {
        alert('❌ Transaction rejected. Please approve the transaction to deactivate the batch.');
      } else {
        alert(`❌ Failed to deactivate batch: ${error.message}`);
      }
    }
  });

  // Edit batch name mutation (temporarily disabled - not implemented in smart contract yet)
  const editBatchMutation = useMutation({
    mutationFn: async ({ batchId, newName }: { batchId: number, newName: string }) => {
      // TODO: Implement renameBatch in smart contract and useContracts hook
      throw new Error('Batch rename functionality is not yet implemented on blockchain');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-batches', walletState.account] });
      setEditingBatchId(null);
      setEditBatchName('');
    },
    onError: (error: any) => {
      console.error('Edit batch failed:', error);
      alert('Edit batch functionality is not yet available. This feature will be added in future updates.');
    }
  });

  // Add student to batch mutation - Now using blockchain
  const addStudentMutation = useMutation({
    mutationFn: async ({ batchId, studentAddress }: { batchId: number, studentAddress: string }) => {
      if (!contracts.addStudentToBatch) {
        throw new Error('Batch management contract not ready');
      }
      
      // First add to blockchain
      const receipt = await contracts.addStudentToBatch(batchId, studentAddress);
      
      // Then create notification via API (still in-memory for now)
      try {
        await fetch(`/api/batches/${batchId}/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studentAddress })
        });
      } catch (notifError) {
        console.warn('Failed to create notification:', notifError);
      }
      
      return { receipt, batchId, studentAddress };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-batches', walletState.account] });
      setStudentAddress('');
      setAddingStudentBatchId(null);
      const batch = batches.find(b => b.id === data.batchId);
      alert(`✅ Student Added Successfully to Blockchain!\n\nStudent: ${data.studentAddress.slice(0, 6)}...${data.studentAddress.slice(-4)}\nBatch: ${batch?.name}\nTransaction Hash: ${data.receipt.hash}\n\nThe student has been enrolled and can now see assignments for this batch!`);
    },
    onError: (error: any) => {
      console.error('Add student failed:', error);
      const errorMessage = error?.message || 'Failed to add student';
      if (errorMessage.includes('already in this batch') || errorMessage.includes('already in batch')) {
        alert('⚠️ Student is already in this batch!');
      } else {
        alert('Failed to add student to blockchain. Please check the wallet address and try again.');
      }
    }
  });

  const handleCreateBatch = () => {
    if (!newBatchName.trim()) {
      alert('Please enter a batch name');
      return;
    }

    if (!walletState.account) {
      alert('Please connect your wallet');
      return;
    }

    setIsCreating(true);

    createBatchMutation.mutate(newBatchName.trim());
  };

  const handleAddStudent = (batchId: number) => {
    if (!studentAddress.trim()) {
      alert('Please enter a student wallet address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(studentAddress)) {
      alert('Please enter a valid Ethereum wallet address');
      return;
    }

    addStudentMutation.mutate({ batchId, studentAddress: studentAddress.trim() });
  };

  const handleRemoveStudent = (batchId: number, studentAddress: string) => {
    if (confirm(`Are you sure you want to remove ${formatAddress(studentAddress)} from this batch?`)) {
      removeStudentMutation.mutate({ batchId, studentAddress });
    }
  };

  const handleDeleteBatch = (batch: any) => {
    const studentCount = batch.students?.length || 0;
    const confirmMessage = studentCount > 0 
      ? `⚠️ Are you sure you want to DEACTIVATE "${batch.name}"?\n\nThis batch has ${studentCount} student(s). All students will be removed from this batch.\n\nConfirm deactivation?`
      : `Are you sure you want to DEACTIVATE "${batch.name}"?\n\nThis will mark the batch as inactive.\n\nConfirm deactivation?`;
    
    if (confirm(confirmMessage)) {
      deleteBatchMutation.mutate(batch.id);
    }
  };

  const handleEditBatch = (batchId: number) => {
    if (!editBatchName.trim()) {
      alert('Please enter a new batch name');
      return;
    }
    editBatchMutation.mutate({ batchId, newName: editBatchName.trim() });
  };

  const startEditingBatch = (batch: any) => {
    setEditingBatchId(batch.id);
    setEditBatchName(batch.name);
  };

  const cancelEditingBatch = () => {
    setEditingBatchId(null);
    setEditBatchName('');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!walletState.account) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Please connect your wallet to access batch management.</p>
        </div>
      </div>
    );
  }

  if (loadingBatches) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading your batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-600 mt-1">Create and manage student batches for your courses</p>
          <p className="text-xs text-gray-500 mt-1">
            Connected as: {formatAddress(walletState.account)}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {batches.length} Active Batches
        </Badge>
      </div>

      {/* Debug Panel */}
      <ContractDebugPanel />
      
      {/* Assignment Creator */}
      <AssignmentCreator />

      {/* Create New Batch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2 text-blue-600" />
            Create New Batch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-3">
            <Input
              placeholder="Enter batch name (e.g., Blockchain Fundamentals - Spring 2025)"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              className="flex-1"
              data-testid="input-batch-name"
            />
            <Button 
              onClick={handleCreateBatch}
              disabled={isCreating || !newBatchName.trim()}
              data-testid="button-create-batch"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Batch
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This will create a new batch on the blockchain. Only you can manage students in this batch.
          </p>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {batchError && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Blockchain Connection Issue</strong>
            <br />
            Unable to fetch batches from blockchain. This might be because the contract addresses are placeholders or the contracts don't exist on Sepolia testnet.
            <br />
            Error: {batchError instanceof Error ? batchError.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      )}

      {/* Batches List */}
      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Batches Yet</h3>
              <p className="text-gray-500 mb-4">Create your first batch to start organizing students</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {batches.map((batch) => (
            <Card key={batch.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingBatchId === batch.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editBatchName}
                          onChange={(e) => setEditBatchName(e.target.value)}
                          className="text-lg font-semibold"
                          data-testid={`input-edit-batch-name-${batch.id}`}
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditBatch(batch.id)}
                            disabled={editBatchMutation.isPending || !editBatchName.trim()}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {editBatchMutation.isPending ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditingBatch}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg">{batch.name}</CardTitle>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingBatch(batch)}
                                className="p-1 h-auto"
                                data-testid={`button-edit-batch-${batch.id}`}
                              >
                                <Edit2 className="h-3 w-3 text-gray-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit batch name</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteBatch(batch)}
                              disabled={deleteBatchMutation.isPending}
                              className="p-1 h-auto text-red-500 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-delete-batch-${batch.id}`}
                            >
                              {deleteBatchMutation.isPending ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Deactivate batch</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Created: {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString() : 'Unknown'}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Hash className="h-3 w-3 mr-1" />
                        ID: {batch.id}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={batch.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {batch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Add Student Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Students</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAddingStudentBatchId(addingStudentBatchId === batch.id ? null : batch.id)}
                      data-testid={`button-add-student-${batch.id}`}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Student
                    </Button>
                  </div>

                  {/* Add Student Form */}
                  {addingStudentBatchId === batch.id && (
                    <div className="border rounded-lg p-3 bg-blue-50">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Student Wallet Address
                          </label>
                          <Input
                            placeholder="0x1234567890123456789012345678901234567890"
                            value={studentAddress}
                            onChange={(e) => setStudentAddress(e.target.value)}
                            className="text-sm font-mono"
                            data-testid={`input-student-address-${batch.id}`}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter the student's Ethereum wallet address to add them to this batch
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddStudent(batch.id)}
                            disabled={addStudentMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-confirm-add-student-${batch.id}`}
                          >
                            {addStudentMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                Adding...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3 mr-2" />
                                Add to Batch
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAddingStudentBatchId(null);
                              setStudentAddress('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Students List */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Students ({batch.students?.length || 0})
                          </span>
                        </div>
                      </div>
                      
                      {batch.students && batch.students.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {batch.students.map((studentAddress: string, index: number) => (
                            <div 
                              key={`${studentAddress}-${index}`}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-600">
                                    {index + 1}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-mono text-gray-800">
                                    {formatAddress(studentAddress)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Student Address
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => navigator.clipboard.writeText(studentAddress)}
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                                    >
                                      <Hash className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copy address</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveStudent(batch.id, studentAddress)}
                                      disabled={removeStudentMutation.isPending}
                                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                                      data-testid={`button-remove-student-${batch.id}-${index}`}
                                    >
                                      {removeStudentMutation.isPending ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-400"></div>
                                      ) : (
                                        <UserX className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remove from batch</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No students in this batch yet</p>
                          <p className="text-xs">Use "Add Student" to enroll students</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}