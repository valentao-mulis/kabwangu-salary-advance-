export interface ScheduleEntry {
  disbursedAmount: number;
  installments: {
    [key: number]: number;
  };
}

export interface ApplicationFormData {
  dateOfApplication: string;
  fullNames: string;
  nrc: string;
  employeeNumber: string;
  employer: string;
  phone: string;
  email: string;
  employmentAddress: string;
  employmentTerms: string;
  loanPurpose?: string;
  selfie: string | null;
  latestPayslip: string | ArrayBuffer | null;
  kinFullNames: string;
  kinNrc: string;
  kinRelationship: string;
  kinPhone: string;
  kinResidentialAddress: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  declarationAgreed: boolean;
  signature: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}