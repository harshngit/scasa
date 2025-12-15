import { Resident, Notice, MaintenanceRequest, AmenityBooking, Bill, Visitor, EmergencyContact, User, ParkingSlot, ParkingPayment } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@society.com',
    role: 'admin',
    permissions: ['all']
  },
  {
    id: '2',
    name: 'Reception Staff',
    email: 'reception@society.com',
    role: 'receptionist',
    permissions: ['visitors', 'parking', 'maintenance']
  },
  {
    id: '3',
    name: 'John Smith',
    email: 'john.smith@email.com',
    role: 'resident',
    flatNumber: 'A-101',
    permissions: ['notices', 'maintenance', 'amenities', 'parking']
  },
  {
    id: '4',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    role: 'resident',
    flatNumber: 'B-205',
    permissions: ['notices', 'maintenance', 'amenities', 'parking']
  }
];

export const mockResidents: Resident[] = [
  {
    id: '1',
    name: 'John Smith',
    flatNumber: 'A-101',
    phoneNumber: '+91 9876543210',
    email: 'john.smith@email.com',
    familyMembers: 4,
    moveInDate: '2023-01-15',
    status: 'active',
    userId: '3'
  },
  {
    id: '2',
    name: 'Priya Sharma',
    flatNumber: 'B-205',
    phoneNumber: '+91 9876543211',
    email: 'priya.sharma@email.com',
    familyMembers: 3,
    moveInDate: '2023-03-20',
    status: 'active',
    userId: '4'
  },
  {
    id: '3',
    name: 'Michael Johnson',
    flatNumber: 'C-302',
    phoneNumber: '+91 9876543212',
    email: 'michael.johnson@email.com',
    familyMembers: 2,
    moveInDate: '2023-05-10',
    status: 'active'
  }
];

export const mockNotices: Notice[] = [
  {
    id: '1',
    title: 'Water Supply Maintenance',
    content: 'Water supply will be interrupted on Sunday, December 15th from 10 AM to 4 PM for maintenance work.',
    date: '2024-12-10',
    priority: 'high',
    category: 'maintenance',
    author: 'Society Management'
  },
  {
    id: '2',
    title: 'Annual General Meeting',
    content: 'The Annual General Meeting is scheduled for December 20th at 6 PM in the community hall.',
    date: '2024-12-08',
    priority: 'medium',
    category: 'event',
    author: 'Secretary'
  },
  {
    id: '3',
    title: 'New Year Celebration',
    content: 'Join us for the New Year celebration on December 31st at the clubhouse. Registration required.',
    date: '2024-12-05',
    priority: 'low',
    category: 'event',
    author: 'Cultural Committee'
  }
];

export const mockMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: '1',
    title: 'Leaking Faucet',
    description: 'Kitchen faucet is leaking continuously',
    category: 'plumbing',
    priority: 'medium',
    status: 'pending',
    requestedBy: 'John Smith',
    flatNumber: 'A-101',
    dateRequested: '2024-12-08'
  },
  {
    id: '2',
    title: 'Elevator Not Working',
    description: 'Elevator in Block B is not functioning properly',
    category: 'electrical',
    priority: 'high',
    status: 'in-progress',
    requestedBy: 'Priya Sharma',
    flatNumber: 'B-205',
    dateRequested: '2024-12-07',
    assignedTo: 'Maintenance Team A'
  }
];

export const mockAmenityBookings: AmenityBooking[] = [
  {
    id: '1',
    amenityName: 'Community Hall',
    bookedBy: 'John Smith',
    flatNumber: 'A-101',
    date: '2024-12-15',
    timeSlot: '6:00 PM - 10:00 PM',
    status: 'confirmed',
    amount: 2000
  },
  {
    id: '2',
    amenityName: 'Swimming Pool',
    bookedBy: 'Priya Sharma',
    flatNumber: 'B-205',
    date: '2024-12-12',
    timeSlot: '7:00 AM - 9:00 AM',
    status: 'confirmed',
    amount: 500
  }
];

export const mockBills: Bill[] = [
  {
    id: '1',
    flatNumber: 'A-101',
    residentName: 'John Smith',
    month: 'December 2024',
    maintenanceAmount: 3500,
    parkingAmount: 1500,
    amenityCharges: 500,
    penaltyAmount: 0,
    totalAmount: 5500,
    status: 'pending',
    dueDate: '2024-12-15'
  },
  {
    id: '2',
    flatNumber: 'B-205',
    residentName: 'Priya Sharma',
    month: 'December 2024',
    maintenanceAmount: 3500,
    parkingAmount: 1000,
    amenityCharges: 0,
    penaltyAmount: 200,
    totalAmount: 4700,
    status: 'overdue',
    dueDate: '2024-12-10'
  }
];

export const mockVisitors: Visitor[] = [
  {
    id: '1',
    name: 'Rahul Kumar',
    phoneNumber: '+91 9876543220',
    visitingFlat: 'A-101',
    purpose: 'Personal Visit',
    entryTime: '2024-12-10 14:30',
    status: 'checked-in',
    approvedBy: 'John Smith',
    parkingSlot: 'V-05'
  },
  {
    id: '2',
    name: 'Delivery Person',
    phoneNumber: '+91 9876543221',
    visitingFlat: 'B-205',
    purpose: 'Package Delivery',
    entryTime: '2024-12-10 10:15',
    exitTime: '2024-12-10 10:25',
    status: 'checked-out',
    approvedBy: 'Priya Sharma'
  }
];

export const mockEmergencyContacts: EmergencyContact[] = [
  {
    id: '1',
    name: 'City Hospital',
    role: 'Emergency Medical',
    phoneNumber: '102',
    category: 'medical'
  },
  {
    id: '2',
    name: 'Fire Department',
    role: 'Fire Emergency',
    phoneNumber: '101',
    category: 'fire'
  },
  {
    id: '3',
    name: 'Police Station',
    role: 'Police Emergency',
    phoneNumber: '100',
    category: 'police'
  },
  {
    id: '4',
    name: 'Security Guard',
    role: 'Society Security',
    phoneNumber: '+91 9876543230',
    category: 'security'
  }
];

export const mockParkingSlots: ParkingSlot[] = [
  {
    id: '1',
    slotNumber: 'A-01',
    type: 'resident',
    status: 'occupied',
    assignedTo: 'John Smith',
    flatNumber: 'A-101',
    vehicleNumber: 'MH-01-AB-1234',
    vehicleType: 'car',
    monthlyRate: 1500
  },
  {
    id: '2',
    slotNumber: 'A-02',
    type: 'resident',
    status: 'occupied',
    assignedTo: 'Priya Sharma',
    flatNumber: 'B-205',
    vehicleNumber: 'MH-01-CD-5678',
    vehicleType: 'car',
    monthlyRate: 1500
  },
  {
    id: '3',
    slotNumber: 'A-03',
    type: 'resident',
    status: 'available',
    vehicleType: 'car',
    monthlyRate: 1500
  },
  {
    id: '4',
    slotNumber: 'B-01',
    type: 'resident',
    status: 'available',
    vehicleType: 'bike',
    monthlyRate: 500
  },
  {
    id: '5',
    slotNumber: 'V-01',
    type: 'visitor',
    status: 'available',
    vehicleType: 'car',
    hourlyRate: 20
  },
  {
    id: '6',
    slotNumber: 'V-02',
    type: 'visitor',
    status: 'available',
    vehicleType: 'car',
    hourlyRate: 20
  },
  {
    id: '7',
    slotNumber: 'V-03',
    type: 'visitor',
    status: 'available',
    vehicleType: 'bike',
    hourlyRate: 10
  },
  {
    id: '8',
    slotNumber: 'V-04',
    type: 'visitor',
    status: 'available',
    vehicleType: 'bike',
    hourlyRate: 10
  },
  {
    id: '9',
    slotNumber: 'V-05',
    type: 'visitor',
    status: 'occupied',
    assignedTo: 'Rahul Kumar',
    vehicleNumber: 'MH-01-XY-9999',
    vehicleType: 'car',
    hourlyRate: 20,
    bookedFrom: '2024-12-10 14:30',
    bookedUntil: '2024-12-10 18:30'
  },
  {
    id: '10',
    slotNumber: 'G-01',
    type: 'guest',
    status: 'available',
    vehicleType: 'car',
    hourlyRate: 30
  }
];

export const mockParkingPayments: ParkingPayment[] = [
  {
    id: '1',
    slotId: '1',
    payerName: 'John Smith',
    flatNumber: 'A-101',
    amount: 1500,
    paymentType: 'monthly',
    paymentMethod: 'upi',
    paymentDate: '2024-12-01',
    validFrom: '2024-12-01',
    validUntil: '2024-12-31',
    status: 'paid',
    receiptNumber: 'PKG-2024-001'
  },
  {
    id: '2',
    slotId: '2',
    payerName: 'Priya Sharma',
    flatNumber: 'B-205',
    amount: 1500,
    paymentType: 'monthly',
    paymentMethod: 'netbanking',
    paymentDate: '2024-12-01',
    validFrom: '2024-12-01',
    validUntil: '2024-12-31',
    status: 'paid',
    receiptNumber: 'PKG-2024-002'
  },
  {
    id: '3',
    slotId: '9',
    payerName: 'Rahul Kumar',
    amount: 80,
    paymentType: 'visitor',
    paymentMethod: 'cash',
    paymentDate: '2024-12-10',
    validFrom: '2024-12-10 14:30',
    validUntil: '2024-12-10 18:30',
    status: 'paid',
    receiptNumber: 'PKG-2024-003'
  }
];

// Current user context (this would normally come from authentication)
export const currentUser: User = mockUsers[0]; // Admin user for demo