import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { store } from '@/store/store';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import StaffRoute from '@/components/StaffRoute';
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import CreateResident from './pages/CreateResident';
import EditResident from './pages/EditResident';
import ResidentDetail from './pages/ResidentDetail';
import NoticeBoard from './pages/NoticeBoard';
import Maintenance from './pages/Maintenance';
import MaintenancePayments from './pages/MaintenancePayments';
// import Amenities from './pages/Amenities';
// import Finance from './pages/Finance';
// import Visitors from './pages/Visitors';
// import Security from './pages/Security';
// import SecurityAdvanced from './pages/SecurityAdvanced';
// import Parking from './pages/Parking';
import Vendors from './pages/Vendors';
import CreateVendor from './pages/CreateVendor';
import VendorDetail from './pages/VendorDetail';
import CreateVendorInvoice from './pages/CreateVendorInvoice';
import UsersList from './pages/UsersList';
import CreateUser from './pages/CreateUser';
import Helpers from './pages/Helpers';
import CreateHelper from './pages/CreateHelper';
import HelperDetail from './pages/HelperDetail';
import EditHelper from './pages/EditHelper';
import Complaints from './pages/Complaints';
import CreateComplaint from './pages/CreateComplaint';
import ComplaintDetail from './pages/ComplaintDetail';
import EditComplaint from './pages/EditComplaint';
import Permissions from './pages/Permissions';
import CreatePermission from './pages/CreatePermission';
import PermissionDetail from './pages/PermissionDetail';
import EditPermission from './pages/EditPermission';
import ChangeOwner from './pages/ChangeOwner';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/residents" element={
              <ProtectedRoute>
                <Residents />
              </ProtectedRoute>
            } />
            <Route path="/residents/create" element={
              <ProtectedRoute>
                <CreateResident />
              </ProtectedRoute>
            } />
            <Route path="/residents/:id" element={
              <ProtectedRoute>
                <ResidentDetail />
              </ProtectedRoute>
            } />
            <Route path="/residents/:id/edit" element={
              <ProtectedRoute>
                <EditResident />
              </ProtectedRoute>
            } />
            <Route path="/residents/:id/change-owner" element={
              <ProtectedRoute>
                <ChangeOwner />
              </ProtectedRoute>
            } />
            <Route path="/notices" element={
              <ProtectedRoute>
                <NoticeBoard />
              </ProtectedRoute>
            } />
            <Route path="/maintenance" element={
              <ProtectedRoute>
                <Maintenance />
              </ProtectedRoute>
            } />
            <Route path="/maintenance-payments" element={
              <ProtectedRoute>
                <MaintenancePayments />
              </ProtectedRoute>
            } />
            {/* Commented out routes - to be implemented later */}
            {/* <Route path="/amenities" element={
              <ProtectedRoute>
                <Amenities />
              </ProtectedRoute>
            } /> */}
            {/* <Route path="/finance" element={
              <ProtectedRoute>
                <Finance />
              </ProtectedRoute>
            } /> */}
            {/* <Route path="/visitors" element={
              <ProtectedRoute>
                <Visitors />
              </ProtectedRoute>
            } /> */}
            {/* <Route path="/security" element={
              <ProtectedRoute>
                <Security />
              </ProtectedRoute>
            } /> */}
            {/* <Route path="/security-advanced" element={
              <ProtectedRoute>
                <SecurityAdvanced />
              </ProtectedRoute>
            } /> */}
            {/* <Route path="/parking" element={
              <ProtectedRoute>
                <Parking />
              </ProtectedRoute>
            } /> */}
            <Route path="/vendors" element={
              <ProtectedRoute>
                <Vendors />
              </ProtectedRoute>
            } />
            <Route path="/vendors/create" element={
              <ProtectedRoute>
                <StaffRoute>
                <CreateVendor />
                </StaffRoute>
              </ProtectedRoute>
            } />
            <Route path="/vendors/:id" element={
              <ProtectedRoute>
                <VendorDetail />
              </ProtectedRoute>
            } />
            <Route path="/vendors/create-invoice" element={
              <ProtectedRoute>
                <StaffRoute>
                  <CreateVendorInvoice />
                </StaffRoute>
              </ProtectedRoute>
            } />
            <Route path="/vendors/:vendorId/create-invoice" element={
              <ProtectedRoute>
                <StaffRoute>
                <CreateVendorInvoice />
                </StaffRoute>
              </ProtectedRoute>
            } />
            <Route path="/helpers" element={
              <ProtectedRoute>
                <Helpers />
              </ProtectedRoute>
            } />
            <Route path="/helpers/create" element={
              <ProtectedRoute>
                <CreateHelper />
              </ProtectedRoute>
            } />
            <Route path="/helpers/:id" element={
              <ProtectedRoute>
                <HelperDetail />
              </ProtectedRoute>
            } />
            <Route path="/helpers/:id/edit" element={
              <ProtectedRoute>
                <EditHelper />
              </ProtectedRoute>
            } />
            <Route path="/complaints" element={
              <ProtectedRoute>
                <Complaints />
              </ProtectedRoute>
            } />
            <Route path="/complaints/create" element={
              <ProtectedRoute>
                <CreateComplaint />
              </ProtectedRoute>
            } />
            <Route path="/complaints/:id" element={
              <ProtectedRoute>
                <ComplaintDetail />
              </ProtectedRoute>
            } />
            <Route path="/complaints/:id/edit" element={
              <ProtectedRoute>
                <EditComplaint />
              </ProtectedRoute>
            } />
            <Route path="/permissions" element={
              <ProtectedRoute>
                <Permissions />
              </ProtectedRoute>
            } />
            <Route path="/permissions/create" element={
              <ProtectedRoute>
                <CreatePermission />
              </ProtectedRoute>
            } />
            <Route path="/permissions/:id" element={
              <ProtectedRoute>
                <PermissionDetail />
              </ProtectedRoute>
            } />
            <Route path="/permissions/:id/edit" element={
              <ProtectedRoute>
                <EditPermission />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <AdminRoute>
                  <UsersList />
                </AdminRoute>
              </ProtectedRoute>
            } />
            <Route path="/users/create" element={
              <ProtectedRoute>
                <AdminRoute>
                  <CreateUser />
                </AdminRoute>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </Provider>
);

export default App;