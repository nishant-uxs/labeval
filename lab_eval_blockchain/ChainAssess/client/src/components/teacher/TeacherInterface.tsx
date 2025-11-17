import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BatchOperations } from './BatchOperations';

export function TeacherInterface() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
      </div>

      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews">
            Reviews
          </TabsTrigger>
          <TabsTrigger value="rewards" data-testid="tab-rewards">
            Rewards
          </TabsTrigger>
          <TabsTrigger value="batch" data-testid="tab-batch">
            Batch Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <div className="text-center py-8">
            <p className="text-gray-500">Assignment creation interface</p>
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="text-center py-8">
            <p className="text-gray-500">Submission review interface</p>
          </div>
        </TabsContent>

        <TabsContent value="rewards">
          <div className="text-center py-8">
            <p className="text-gray-500">Reward management interface</p>
          </div>
        </TabsContent>

        <TabsContent value="batch">
          <BatchOperations />
        </TabsContent>
      </Tabs>
    </div>
  );
}