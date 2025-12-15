import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CreditCard, TrendingUp, AlertTriangle, CheckCircle, Clock, Download } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockBills } from '@/lib/mockData';
import type { Bill } from '@/types';

export default function Finance() {
  const [bills] = useState<Bill[]>(mockBills);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'pending': return Clock;
      case 'overdue': return AlertTriangle;
      default: return Clock;
    }
  };

  const totalAmount = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const paidAmount = bills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + bill.totalAmount, 0);
  const pendingAmount = bills.filter(b => b.status === 'pending').reduce((sum, bill) => sum + bill.totalAmount, 0);
  const overdueAmount = bills.filter(b => b.status === 'overdue').reduce((sum, bill) => sum + bill.totalAmount, 0);

  const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
            <p className="text-muted-foreground">
              Financial overview and billing management
            </p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{paidAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{collectionRate.toFixed(1)}% collection rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{overdueAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Requires action</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Collection Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly Target: ₹{totalAmount.toLocaleString()}</span>
                <span>{collectionRate.toFixed(1)}%</span>
              </div>
              <Progress value={collectionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Bills</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {bills.map((bill) => {
              const StatusIcon = getStatusIcon(bill.status);
              return (
                <Card key={bill.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-lg">{bill.flatNumber} - {bill.residentName}</CardTitle>
                          <p className="text-sm text-muted-foreground">{bill.month}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">₹{bill.totalAmount.toLocaleString()}</div>
                        <Badge variant={getStatusColor(bill.status)}>
                          {bill.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Maintenance:</span>
                        <div className="font-medium">₹{bill.maintenanceAmount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Parking:</span>
                        <div className="font-medium">₹{bill.parkingAmount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amenities:</span>
                        <div className="font-medium">₹{bill.amenityCharges}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Penalty:</span>
                        <div className="font-medium text-red-600">₹{bill.penaltyAmount}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Due Date: {new Date(bill.dueDate).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {bill.status !== 'paid' && (
                          <Button size="sm">
                            Send Reminder
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            {bills.filter(b => b.status === 'paid').map((bill) => {
              const StatusIcon = getStatusIcon(bill.status);
              return (
                <Card key={bill.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">{bill.flatNumber} - {bill.residentName}</div>
                          <div className="text-sm text-muted-foreground">{bill.month}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₹{bill.totalAmount.toLocaleString()}</div>
                        <Badge variant="default">Paid</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {bills.filter(b => b.status === 'pending').map((bill) => {
              const StatusIcon = getStatusIcon(bill.status);
              return (
                <Card key={bill.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className="h-5 w-5 text-yellow-500" />
                        <div>
                          <div className="font-medium">{bill.flatNumber} - {bill.residentName}</div>
                          <div className="text-sm text-muted-foreground">Due: {new Date(bill.dueDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₹{bill.totalAmount.toLocaleString()}</div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            {bills.filter(b => b.status === 'overdue').map((bill) => {
              const StatusIcon = getStatusIcon(bill.status);
              return (
                <Card key={bill.id} className="hover:shadow-md transition-shadow border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className="h-5 w-5 text-red-500" />
                        <div>
                          <div className="font-medium">{bill.flatNumber} - {bill.residentName}</div>
                          <div className="text-sm text-red-600">Overdue since: {new Date(bill.dueDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">₹{bill.totalAmount.toLocaleString()}</div>
                        <Badge variant="destructive">Overdue</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}