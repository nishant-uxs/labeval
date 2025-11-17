import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ContractManagement } from './ContractManagement';
import { TeacherManagement } from './TeacherManagement';

interface AdminStats {
  totalContracts: number;
  totalTeachers: number;
  totalStudents: number;
  gasUsed: number;
}

export function AdminDashboard() {
  const [stats] = useState<AdminStats>({
    totalContracts: 0,
    totalTeachers: 0,
    totalStudents: 0,
    gasUsed: 0
  });

  return (
    <div className="space-y-8">
      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-university text-purple-600 text-xl"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-contracts">
                  {stats.totalContracts}
                </p>
                <p className="text-sm text-gray-600">Active Contracts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-chalkboard-teacher text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-teachers">
                  {stats.totalTeachers}
                </p>
                <p className="text-sm text-gray-600">Registered Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-green-600 text-xl"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-students">
                  {stats.totalStudents}
                </p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-gas-pump text-yellow-600 text-xl"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-gas-used">
                  {stats.gasUsed}
                </p>
                <p className="text-sm text-gray-600">ETH Gas Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Management */}
      <ContractManagement />

      {/* Teacher Management */}
      <TeacherManagement />
    </div>
  );
}
