export interface AcademicResource {
  id: string;
  code: string;
  title: string;
  level: string; // "100 Level" | "200 Level" | "300 Level" | "400 Level"
  type: string;  // "Past Question" | "Lecture Note" | "Textbook" | "Assignment"
  format: string; // "PDF" | "DOCX" | "PPTX" | "XLSX"
  size: string;
  date: string;
  uploader: string;
  description: string;
  isDemo?: boolean;
  driveUrl?: string;
  trackingId?: string;
  fileName?: string;
  fileBlob?: Blob;
  downloadCount?: number;
  isStudentUpload?: boolean;
  driveSynced?: boolean;
}

export interface PendingUpload {
  trackingId: string;
  id: string;
  code: string;
  title: string;
  courseTitle: string;
  level: string;
  type: string;
  format: string;
  size: string;
  date: string;
  uploader: string;
  uploaderContact?: string;
  description: string;
  fileName: string;
  fileBlob?: Blob;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
}

export interface ComplaintTicket {
  ticketId: string;
  matricNumber: string;
  studentName: string;
  level: string;
  category: string;
  subject: string;
  details: string;
  status: 'Pending' | 'Under Review' | 'Resolved';
  priority: 'Normal' | 'Urgent';
  date: string;
  excosResponse?: string;
  resolvedAt?: string;
}

export interface Leader {
  role: string;
  name: string;
  tenure: string;
  email: string;
  phone: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface SettingItem {
  key: string;
  value: string;
}
