export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'receptionist' | 'resident' | 'visitor';
  flatNumber?: string; // Only for residents
  permissions: string[];
}

export interface Resident {
  id: string;
  name: string;
  flatNumber: string;
  phoneNumber: string;
  email: string;
  familyMembers: number;
  moveInDate: string;
  status: 'active' | 'inactive';
  profileImage?: string;
  userId?: string; // Link to user account
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  category: 'general' | 'maintenance' | 'event' | 'emergency';
  author: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'cleaning' | 'security' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  requestedBy: string;
  flatNumber: string;
  dateRequested: string;
  assignedTo?: string;
}

export interface AmenityBooking {
  id: string;
  amenityName: string;
  bookedBy: string;
  flatNumber: string;
  date: string;
  timeSlot: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  amount?: number;
}

export interface Bill {
  id: string;
  flatNumber: string;
  residentName: string;
  month: string;
  maintenanceAmount: number;
  parkingAmount: number;
  amenityCharges: number;
  penaltyAmount: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
}

export interface Visitor {
  id: string;
  name: string;
  phoneNumber: string;
  visitingFlat: string;
  purpose: string;
  entryTime: string;
  exitTime?: string;
  status: 'checked-in' | 'checked-out';
  approvedBy: string;
  parkingSlot?: string;
  photo?: string; // Base64 encoded image data
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phoneNumber: string;
  category: 'medical' | 'fire' | 'police' | 'security' | 'maintenance';
}

export interface ParkingSlot {
  id: string;
  slotNumber: string;
  type: 'resident' | 'visitor' | 'guest';
  status: 'occupied' | 'available' | 'reserved';
  assignedTo?: string; // Resident ID or visitor name
  flatNumber?: string;
  vehicleNumber?: string;
  vehicleType: 'car' | 'bike' | 'suv';
  monthlyRate?: number;
  hourlyRate?: number;
  bookedFrom?: string;
  bookedUntil?: string;
}

export interface ParkingPayment {
  id: string;
  slotId: string;
  payerName: string;
  flatNumber?: string;
  amount: number;
  paymentType: 'monthly' | 'hourly' | 'visitor';
  paymentMethod: 'cash' | 'upi' | 'card' | 'netbanking';
  paymentDate: string;
  validFrom: string;
  validUntil: string;
  status: 'paid' | 'pending' | 'failed';
  receiptNumber: string;
}

export interface Permission {
  module: string;
  actions: string[]; // ['read', 'write', 'delete', 'admin']
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    { module: 'dashboard', actions: ['read', 'write', 'delete', 'admin'] },
    { module: 'residents', actions: ['read', 'write', 'delete', 'admin'] },
    { module: 'notices', actions: ['read', 'write', 'delete', 'admin'] },
    { module: 'maintenance', actions: ['read', 'write', 'delete', 'admin'] },
    { module: 'maintenance_payments', actions: ['read', 'write', 'delete', 'admin'] },
    { module: 'amenities', actions: ['read', 'write', 'delete', 'admin'] },
    { module: 'finance', actions: ['read', 'write', 'delete', 'admin'] },
    { module: 'visitors', actions: ['read', 'write', 'delete', 'admin'] },
    { module: 'security', actions: ['read', 'write', 'delete', 'admin'] },
    { module: 'parking', actions: ['read', 'write', 'delete', 'admin'] },
    { module: 'vendors', actions: ['read', 'write', 'delete', 'admin'] },
    { module: 'users', actions: ['read', 'write', 'delete', 'admin'] },
  ],
  receptionist: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'residents', actions: ['read', 'write', 'delete'] },
    { module: 'notices', actions: ['read', 'write', 'delete'] },
    { module: 'maintenance', actions: ['read', 'write', 'delete'] },
    { module: 'maintenance_payments', actions: ['read', 'write', 'delete'] },
    { module: 'amenities', actions: ['read', 'write', 'delete'] },
    { module: 'visitors', actions: ['read', 'write', 'delete'] },
    { module: 'security', actions: ['read', 'write', 'delete'] },
    { module: 'parking', actions: ['read', 'write', 'delete'] },
    { module: 'vendors', actions: ['read', 'write', 'delete'] },
  ],
  resident: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'residents', actions: ['read'] },
    { module: 'notices', actions: ['read'] },
    { module: 'maintenance', actions: ['read'] },
    { module: 'maintenance_payments', actions: ['read'] },
    { module: 'vendors', actions: ['read'] },
  ],
  visitor: [
    { module: 'notices', actions: ['read'] },
    { module: 'parking', actions: ['read'] },
  ],
};