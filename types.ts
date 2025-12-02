export interface ScheduleEntry {
  disbursedAmount: number;
  installments: {
    [key: number]: number;
  };
}

export interface StatusHistoryEntry {
    status: 'New' | 'Under Review' | 'Approved' | 'Rejected';
    timestamp: any; // Firestore Server Timestamp
    changedBy?: string; // 'user' or 'admin'
    reason?: string; // Reason for status change, e.g., rejection
}

export interface ApplicationFormData {
  id?: string; // Firestore document ID
  dateOfApplication: string;
  // Personal Details
  firstName: string;
  surname: string;
  nrc: string;
  employeeNumber: string;
  employer: string;
  phone: string;
  email: string;
  employmentAddress: string;
  employmentTerms: string;
  grossSalary: string;
  netSalary: string;
  // Next of Kin Details
  kinFullNames: string;
  kinNrc: string;
  kinRelationship: string;
  kinPhone: string;
  kinResidentialAddress: string;
  // Bank Details
  bankName: string;
  branchName: string;
  accountNumber: string;
  accountNames: string;
  // Loan Details
  loanPurpose: string;
  sourceOfRepayment: string;
  otherLoans: string;
  // Declaration
  declarationAgreed: boolean;

  // --- Fields added on submission ---
  loanDetails?: {
    amount: number;
    months: number;
    monthlyPayment: number;
  };
  signature?: string; // base64 data URL
  nrcImageFront?: string; // base64 data URL
  nrcImageBack?: string; // base64 data URL
  latestPayslip?: string; // base64 data URL
  status?: 'New' | 'Under Review' | 'Approved' | 'Rejected';
  statusHistory?: StatusHistoryEntry[];
  submittedAt?: string; // ISO string
  createdAt?: any; // Firestore serverTimestamp
  lastModifiedAt?: any; // Firestore serverTimestamp
  rejectionReason?: string;
}


export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}