import React from 'react';
import { ApplicationFormData, ScheduleEntry } from '../types';
import SignaturePad from './SignaturePad';
import CameraCapture from './CameraCapture';
import FileUpload from './FileUpload';
import { firestore } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

// Helper to convert a file/blob to a Base64 Data URL
const fileToDataUrl = (file: Blob | File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

// Helper to compress an image Data URL
const compressImageDataUrl = (dataUrl: string, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!dataUrl.startsWith('data:image')) {
            resolve(dataUrl); // Don't compress non-images (like PDFs)
            return;
        }

        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIMENSION = 800; // Reduced for smaller file size
            let { width, height } = img;

            if (width > height) {
                if (width > MAX_DIMENSION) {
                    height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                }
            } else {
                if (height > MAX_DIMENSION) {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        img.onerror = (error) => reject(error);
    });
};


const ApplicationForm = ({ loanSummary, schedule, onSubmitSuccess }: {
    loanSummary?: {
        amount: number;
        months: number;
        monthlyPayment: number;
    };
    schedule: ScheduleEntry[];
    onSubmitSuccess: (id: string) => void;
}) => {
  // Re-ordered employers list: Priority items first, then alphabetical
  const priorityEmployers = [
      "GRZ",
      "ZNS",
      "ZAF",
      "ZEMA",
      "WARMA",
      "RTSA",
      "Zambia Army",
      "ZPPA",
      "National Assembly of Zambia (NAZ)",
      "National Prosecution Authority"
  ];

  const otherEmployers = [
      "Infratel",
      "Kalikiliki Water Trust",
      "LASF Local Authorities Superannuation Fund",
      "Lusaka Water and Sewerage Company",
      "Majoru",
      "MEDLINK",
      "Mutendere East Water Trust",
      "National Food and Nutrition (NFNC)",
      "NCC",
      "NGOMBE WATER TRUST",
      "Nkwazi: Nkwazi Primary School",
      "Professional Teachers' Union of Zambia",
      "SAMI: Southern Africa Management Institute",
      "Staff",
      "USA",
      "Zambia Development Agency",
      "Zambia Forestry and Forest Industries Corporation",
      "Zambia National Data Centre (ZNDC)",
      "Zambia National Union of Teachers (ZNUT)",
      "Zambia Open University"
  ].sort();

  const employers = [...priorityEmployers, ...otherEmployers];

  const banks = [
      "AB Bank",
      "Access Bank",
      "Absa Bank",
      "Bank of China",
      "Citibank",
      "Ecobank",
      "First Alliance Bank",
      "First Capital Bank",
      "First National Bank (FNB)",
      "Indo-Zambia Bank",
      "Investrust Bank",
      "Stanbic Bank",
      "Standard Chartered Bank",
      "United Bank for Africa (UBA)",
      "Zambia Industrial Commercial Bank (ZICB)",
      "Zanaco",
      "ZNBS"
  ];
  
  const loanPurposes = [
      "Agricultural inputs/Equipment",
      "Building/Purchase home",
      "Land purchase",
      "Debt consolidation",
      "Funeral",
      "Home improvement",
      "Furniture/Home appliances",
      "Television/Sound system",
      "School Fees",
      "Mobile phone",
      "Laptop/Tablet",
      "Medical expenses",
      "Renewable energy/Energy efficiency products",
      "Environmental recycling treatments/operations",
      "Start/Grow business",
      "Vehicle/Motor bike purchase/Import duty/Maintenance",
      "Tertiary Loans",
      "Teacher Loans",
      "Vocational loans"
  ];

  const initialFormData: Omit<ApplicationFormData, 'signature' | 'nrcImageFront' | 'nrcImageBack' | 'latestPayslip' | 'id' | 'createdAt' | 'lastModifiedAt' | 'loanDetails' | 'status' | 'submittedAt' | 'statusHistory'> = {
    dateOfApplication: new Date().toISOString().split('T')[0],
    firstName: '', surname: '', nrc: '', employeeNumber: '', employer: '', phone: '', email: '',
    employmentAddress: '', employmentTerms: 'Permanent', grossSalary: '', netSalary: '',
    kinFullNames: '', kinNrc: '', kinRelationship: '', kinPhone: '', kinResidentialAddress: '',
    bankName: '', branchName: '', accountNumber: '', accountNames: '',
    loanPurpose: '', sourceOfRepayment: 'Salary', otherLoans: '',
    declarationAgreed: true,
  };

  const [formData, setFormData] = React.useState<Partial<ApplicationFormData>>(initialFormData);
  const [signatureBlob, setSignatureBlob] = React.useState<Blob | null>(null);
  const [nrcFrontBlob, setNrcFrontBlob] = React.useState<Blob | null>(null);
  const [nrcBackBlob, setNrcBackBlob] = React.useState<Blob | null>(null);
  const [payslipFile, setPayslipFile] = React.useState<File | null>(null);

  // Searchable Dropdown States
  const [isBankListOpen, setIsBankListOpen] = React.useState(false);
  const [isEmployerListOpen, setIsEmployerListOpen] = React.useState(false);
  const bankWrapperRef = React.useRef<HTMLDivElement>(null);
  const employerWrapperRef = React.useRef<HTMLDivElement>(null);

  // Optimization: Pre-processed base64 strings
  const [preparedFiles, setPreparedFiles] = React.useState({
      signature: '',
      nrcFront: '',
      nrcBack: '',
      payslip: ''
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState('');
  
  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (bankWrapperRef.current && !bankWrapperRef.current.contains(event.target as Node)) {
            setIsBankListOpen(false);
        }
        if (employerWrapperRef.current && !employerWrapperRef.current.contains(event.target as Node)) {
            setIsEmployerListOpen(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Effects to pre-process images in background to speed up submission
  React.useEffect(() => {
    if (!signatureBlob) {
        setPreparedFiles(p => ({...p, signature: ''}));
        return;
    }
    fileToDataUrl(signatureBlob).then(res => setPreparedFiles(p => ({...p, signature: res})));
  }, [signatureBlob]);

  React.useEffect(() => {
    if (!nrcFrontBlob) {
        setPreparedFiles(p => ({...p, nrcFront: ''}));
        return;
    }
    fileToDataUrl(nrcFrontBlob).then(raw => compressImageDataUrl(raw)).then(res => setPreparedFiles(p => ({...p, nrcFront: res})));
  }, [nrcFrontBlob]);

  React.useEffect(() => {
    if (!nrcBackBlob) {
        setPreparedFiles(p => ({...p, nrcBack: ''}));
        return;
    }
    fileToDataUrl(nrcBackBlob).then(raw => compressImageDataUrl(raw)).then(res => setPreparedFiles(p => ({...p, nrcBack: res})));
  }, [nrcBackBlob]);

  React.useEffect(() => {
    if (!payslipFile) {
        setPreparedFiles(p => ({...p, payslip: ''}));
        return;
    }
    fileToDataUrl(payslipFile).then(res => setPreparedFiles(p => ({...p, payslip: res})));
  }, [payslipFile]);


  // Auto-populate Account Names based on First Name and Surname
  React.useEffect(() => {
    setFormData(prev => {
        const newAccountName = `${prev.firstName || ''} ${prev.surname || ''}`.trim();
        if (prev.accountNames === newAccountName) return prev;
        return { ...prev, accountNames: newAccountName };
    });
  }, [formData.firstName, formData.surname]);
  
  const allAmounts = React.useMemo(() => schedule.map(s => s.disbursedAmount), [schedule]);
  const repaymentPeriods = [1, 2, 3, 4, 5, 6];

  // State for loan details, initialized from calculator if available
  const [loanAmount, setLoanAmount] = React.useState<number>(loanSummary?.amount && loanSummary.amount > 0 ? loanSummary.amount : 2500);
  const [loanTenure, setLoanTenure] = React.useState<number>(loanSummary?.months && loanSummary.months > 0 ? loanSummary.months : 3);
  
  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount) || amount <= 0) {
        return 'K0';
    }
    return 'K' + new Intl.NumberFormat('en-US').format(Math.round(amount));
  };

  const calculateDynamicInstallment = React.useCallback((amount: number, months: number): number => {
    if (amount <= 0) return 0;

    // 1. Exact match lookup
    const exactMatch = schedule.find(s => s.disbursedAmount === amount);
    if (exactMatch) {
        return exactMatch.installments[months];
    }

    // 2. Sort schedule to ensure correct interpolation
    const sortedSchedule = [...schedule].sort((a, b) => a.disbursedAmount - b.disbursedAmount);

    // 3. Handle extrapolation below minimum
    if (amount < sortedSchedule[0].disbursedAmount) {
        const base = sortedSchedule[0];
        const ratio = amount / base.disbursedAmount;
        return base.installments[months] * ratio;
    }

    // 4. Handle extrapolation above maximum
    if (amount > sortedSchedule[sortedSchedule.length - 1].disbursedAmount) {
        const base = sortedSchedule[sortedSchedule.length - 1];
        const ratio = amount / base.disbursedAmount;
        return base.installments[months] * ratio;
    }

    // 5. Linear interpolation between two points
    for (let i = 0; i < sortedSchedule.length - 1; i++) {
        const lower = sortedSchedule[i];
        const upper = sortedSchedule[i+1];
        if (amount > lower.disbursedAmount && amount < upper.disbursedAmount) {
            const ratio = (amount - lower.disbursedAmount) / (upper.disbursedAmount - lower.disbursedAmount);
            const lowerInstallment = lower.installments[months];
            const upperInstallment = upper.installments[months];
            return lowerInstallment + ratio * (upperInstallment - lowerInstallment);
        }
    }

    return 0;
  }, [schedule]);

  const monthlyPayment = React.useMemo(() => {
    return calculateDynamicInstallment(loanAmount, loanTenure);
  }, [loanAmount, loanTenure, calculateDynamicInstallment]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // NRC Input Masking (Auto-formatting)
    if (name === 'nrc' || name === 'kinNrc') {
        const raw = value.replace(/[^0-9]/g, '');
        let formatted = raw;

        // Apply mask: XXXXXX/XX/X
        if (raw.length > 6) {
            formatted = `${raw.slice(0, 6)}/${raw.slice(6)}`;
        }
        if (raw.length > 8) {
            formatted = `${formatted.slice(0, 9)}/${raw.slice(8)}`;
        }
        
        // Enforce max length (11 chars: 9 digits + 2 slashes)
        if (formatted.length > 11) {
             formatted = formatted.slice(0, 11);
        }

        setFormData(prev => ({ ...prev, [name]: formatted }));
        return;
    }

    // Phone Input Masking (Auto-formatting)
    if (name === 'phone' || name === 'kinPhone') {
        // Strip non-numeric characters
        let raw = value.replace(/\D/g, '');

        // Handle local numbers starting with 0 (e.g., 097...) -> 26097...
        if (raw.startsWith('0')) {
            raw = '260' + raw.substring(1);
        }

        // Limit length (12 digits max for ZM: 260 + 9 digits)
        if (raw.length > 12) raw = raw.substring(0, 12);

        let formatted = '';
        if (raw.length > 0) {
            formatted = '+' + raw.substring(0, 3);
            if (raw.length > 3) formatted += ' ' + raw.substring(3, 5);
            if (raw.length > 5) formatted += ' ' + raw.substring(5, 8);
            if (raw.length > 8) formatted += ' ' + raw.substring(8);
        }
        
        setFormData(prev => ({ ...prev, [name]: formatted }));
        return;
    }

    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Open bank list if user is typing in bank name field
        if (name === 'bankName') {
            setIsBankListOpen(true);
        }
        if (name === 'employer') {
            setIsEmployerListOpen(true);
        }
    }
  };

  const handleBankSelect = (bank: string) => {
      setFormData(prev => ({ ...prev, bankName: bank }));
      setIsBankListOpen(false);
  };
  
  const handleEmployerSelect = (employer: string) => {
      setFormData(prev => ({ ...prev, employer: employer }));
      setIsEmployerListOpen(false);
  }
  
  // Function to send email notification using EmailJS
  const sendEmailNotification = (data: Partial<ApplicationFormData>) => {
    // IMPORTANT: To make this work, create a free account at emailjs.com
    const SERVICE_ID = 'service_placeholder'; 
    const TEMPLATE_ID = 'template_placeholder';
    const PUBLIC_KEY = 'public_key_placeholder';

    const templateParams = {
        to_email: 'vincentM@xtendafin.com',
        applicant_name: `${data.firstName} ${data.surname}`,
        loan_amount: data.loanDetails?.amount,
        phone_number: data.phone,
        nrc_number: data.nrc,
        message: 'A new loan application has been submitted and is waiting for your review.'
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
        .then((response) => {
           console.log('Email sent successfully!', response.status, response.text);
        }, (err) => {
           console.warn('Email notification failed.', err);
        });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(''); // Clear previous errors
    
    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Manual validation for custom file inputs, as they aren't covered by checkValidity()
    const validationErrors = [];
    if (!nrcFrontBlob) validationErrors.push("A photo of the front of your NRC is required.");
    if (!nrcBackBlob) validationErrors.push("A photo of the back of your NRC is required.");
    if (!payslipFile) validationErrors.push("Your latest payslip file is required.");
    if (!signatureBlob) validationErrors.push("A signature is required to agree to the declaration.");
    
    // Additional validation for bank selection from list
    const bankExists = banks.some(b => b.toLowerCase() === formData.bankName?.toLowerCase());
    if (formData.bankName && !bankExists) {
         // Custom bank check logic can go here
    }

    if (validationErrors.length > 0) {
        const errorMessage = "Please fix the following issues:\n- " + validationErrors.join('\n- ');
        setSubmissionError(errorMessage);
        // Scroll to the first problematic section to help the user
        const firstErrorSection = document.getElementById(
            !nrcFrontBlob || !nrcBackBlob ? 'nrc-section' :
            !payslipFile ? 'payslip-section' :
            'signature-section'
        );
        firstErrorSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    setIsSubmitting(true);

    try {
        // 1. Get files (Use pre-processed if available to ensure immediate response, otherwise process now)
        const getSignature = () => preparedFiles.signature ? Promise.resolve(preparedFiles.signature) : (signatureBlob ? fileToDataUrl(signatureBlob) : Promise.resolve(''));
        const getNrcFront = () => preparedFiles.nrcFront ? Promise.resolve(preparedFiles.nrcFront) : (nrcFrontBlob ? fileToDataUrl(nrcFrontBlob).then(compressImageDataUrl) : Promise.resolve(''));
        const getNrcBack = () => preparedFiles.nrcBack ? Promise.resolve(preparedFiles.nrcBack) : (nrcBackBlob ? fileToDataUrl(nrcBackBlob).then(compressImageDataUrl) : Promise.resolve(''));
        const getPayslip = () => preparedFiles.payslip ? Promise.resolve(preparedFiles.payslip) : (payslipFile ? fileToDataUrl(payslipFile) : Promise.resolve(''));

        const [signature, nrcImageFront, nrcImageBack, latestPayslip] = await Promise.all([
            getSignature(),
            getNrcFront(),
            getNrcBack(),
            getPayslip(),
        ]);

        // 2. Pre-submission size check to avoid Firestore errors
        const totalSize = (signature?.length || 0) + (nrcImageFront?.length || 0) + (nrcImageBack?.length || 0) + (latestPayslip?.length || 0);
        const FIRESTORE_LIMIT_BYTES = 1000 * 1024; // 1MB limit (a bit less to be safe)

        if (totalSize > FIRESTORE_LIMIT_BYTES) {
            let errorDetails = "Total application size is too large, mainly due to large files.";
             if ((latestPayslip?.length || 0) > 500 * 1024 * 1.33) { // 500KB file -> ~665KB base64
                errorDetails = "Your payslip file is very large. Please upload a smaller version (under 500KB).";
            } else {
                errorDetails = "Your NRC photos are too large. Please retake them or upload smaller image files.";
            }
            setSubmissionError(`Submission failed: ${errorDetails}`);
            setIsSubmitting(false);
            return;
        }
        
        // 3. Prepare the final document
        const finalData: Partial<ApplicationFormData> = {
            ...formData,
            nrc: formData.nrc?.trim(), // Ensure NRC is trimmed to prevent search issues
            loanDetails: {
                amount: loanAmount,
                months: loanTenure,
                monthlyPayment: Math.round(monthlyPayment),
            },
            signature,
            nrcImageFront,
            nrcImageBack,
            latestPayslip,
            status: 'New' as const,
            submittedAt: new Date().toISOString(),
            statusHistory: [{ status: 'New', timestamp: new Date(), changedBy: 'user' }],
            createdAt: serverTimestamp(),
            lastModifiedAt: serverTimestamp(),
        };

        // 4. Save everything in a single Firestore call
        const docRef = await addDoc(collection(firestore, 'applications'), finalData);

        // 5. Send Email Notification (Background task)
        sendEmailNotification(finalData);

        // 6. Use callback to switch view instantly, preventing reload crash
        onSubmitSuccess(docRef.id);

    } catch (error: any) {
      console.error("Submission failed:", error);
      let message = "An unexpected error occurred during submission. Please check your connection and try again.";
      if (error.message && String(error.message).toLowerCase().includes('maximum size')) {
          message = "Submission failed: One of your uploaded files is too large. Please use a smaller file for the payslip (under 500KB) and retake NRC photos if needed.";
      }
      setSubmissionError(message);
      setIsSubmitting(false);
    }
  };
  
  const formFieldClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500";
  const sectionHeaderClass = "text-xl font-bold text-gray-800 flex items-center gap-2 border-b border-gray-300 pb-3 mb-6";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const requiredSpan = <span className="text-red-500 ml-1">*</span>;

  const fullName = `${formData.firstName || ''} ${formData.surname || ''}`.trim();
  const isAbsa = formData.bankName === 'Absa Bank';

  // Filter banks based on current input
  const filteredBanks = banks.filter(b => 
    b.toLowerCase().includes((formData.bankName || '').toLowerCase())
  ).sort();
  
  // Filter employers based on current input
  const filteredEmployers = employers.filter(e => 
      e.toLowerCase().includes((formData.employer || '').toLowerCase())
  );


  return (
    <section id="application-form" className="max-w-4xl mx-auto my-12 bg-white p-6 md:p-10 rounded-2xl shadow-xl px-4">
      <header className="mb-10 border-b pb-6">
          <div className="flex justify-between items-start">
              <div>
                  <p className="font-bold text-gray-800 text-lg">Loan officer: 0774219397</p>
                  <p className="font-bold text-gray-800 text-lg">Mr Mulisha</p>
              </div>
              <img src="https://firebasestorage.googleapis.com/v0/b/my-salary-app-78a41.appspot.com/o/xtenda-logo.png?alt=media&token=c2a13d7c-3a32-4293-875f-33126f2161f4" alt="Xtenda Logo" className="h-12"/>
          </div>
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-gray-800 mt-4">SALARY ADVANCE APPLICATION FORM</h2>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10" noValidate>
        
        <div>
            <label htmlFor="dateOfApplication" className={`${labelClass} font-bold`}>DATE OF APPLICATION</label>
            <input 
                id="dateOfApplication" 
                type="date" 
                name="dateOfApplication" 
                value={formData.dateOfApplication} 
                required 
                onChange={handleInputChange} 
                className={formFieldClass} 
                aria-label="Date of Application"
            />
        </div>
        
        {/* Personal Details */}
        <div>
          <h3 id="personal-details-header" className={sectionHeaderClass}>
              PERSONAL DETAILS
          </h3>
          <div role="group" aria-labelledby="personal-details-header" className="grid md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="firstName" className={labelClass}>FIRST NAME {requiredSpan}</label>
              <input 
                id="firstName" 
                type="text" 
                name="firstName" 
                placeholder="First Name" 
                required 
                onChange={handleInputChange} 
                className={formFieldClass} 
                aria-label="First Name input"
              />
            </div>
            <div>
              <label htmlFor="surname" className={labelClass}>SURNAME {requiredSpan}</label>
              <input 
                id="surname" 
                type="text" 
                name="surname" 
                placeholder="Surname" 
                required 
                onChange={handleInputChange} 
                className={formFieldClass} 
                aria-label="Surname input"
              />
            </div>
             <div>
              <label htmlFor="nrc" className={labelClass}>NRC {requiredSpan}</label>
              <input 
                id="nrc" 
                type="text" 
                name="nrc" 
                value={formData.nrc || ''}
                placeholder="e.g. 123456/10/1" 
                maxLength={11}
                required 
                onChange={handleInputChange} 
                className={formFieldClass} 
                aria-label="NRC Number input"
              />
            </div>
             <div>
              <label htmlFor="employeeNumber" className={labelClass}>EMPLOYEE NUMBER</label>
              <input 
                id="employeeNumber" 
                type="text" 
                name="employeeNumber" 
                placeholder="Your staff ID" 
                onChange={handleInputChange} 
                className={formFieldClass} 
                aria-label="Employee Number input"
              />
            </div>
            
            {/* EMPLOYER SEARCHABLE DROPDOWN */}
            <div ref={employerWrapperRef}>
                <label htmlFor="employerInput" className={labelClass}>EMPLOYER {requiredSpan}</label>
                <div className="relative">
                    <input
                        id="employerInput"
                        type="text"
                        name="employer"
                        value={formData.employer}
                        onChange={handleInputChange}
                        onClick={() => setIsEmployerListOpen(true)}
                        onFocus={() => setIsEmployerListOpen(true)}
                        placeholder="Select or type Employer"
                        className={`${formFieldClass} bg-white pr-10`}
                        required
                        autoComplete="off"
                        aria-label="Select or Type Employer"
                    />
                    <i className={`fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${isEmployerListOpen ? 'rotate-180' : ''}`}></i>
                    
                    {isEmployerListOpen && (
                        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {filteredEmployers.length > 0 ? (
                                filteredEmployers.map(emp => (
                                    <li 
                                        key={emp}
                                        onClick={() => handleEmployerSelect(emp)}
                                        className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-gray-700 transition-colors border-b border-gray-100 last:border-0"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span>{emp}</span>
                                            {priorityEmployers.includes(emp) && (
                                                <i className="fa-solid fa-star text-yellow-400 text-xs" title="Popular"></i>
                                            )}
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-2 text-gray-400 italic">No matches found</li>
                            )}
                        </ul>
                    )}
                </div>
            </div>

             <div>
              <label htmlFor="phone" className={labelClass}>PHONE {requiredSpan}</label>
              <input 
                id="phone" 
                type="tel" 
                name="phone" 
                value={formData.phone || ''}
                placeholder="e.g. +260 97..." 
                required 
                onChange={handleInputChange} 
                className={formFieldClass} 
                aria-label="Phone Number input"
              />
            </div>
             <div className="md:col-span-2">
              <label htmlFor="email" className={labelClass}>EMAIL {requiredSpan}</label>
              <input 
                id="email" 
                type="email" 
                name="email" 
                placeholder="e.g. name@example.com" 
                required 
                onChange={handleInputChange} 
                className={formFieldClass} 
                aria-label="Email Address input"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="employmentAddress" className={labelClass}>EMPLOYMENT ADDRESS</label>
              <input 
                id="employmentAddress" 
                type="text" 
                name="employmentAddress" 
                placeholder="Your work address" 
                onChange={handleInputChange} 
                className={formFieldClass} 
                aria-label="Employment Address input"
              />
            </div>
             <div>
                <label htmlFor="employmentTerms" className={labelClass}>EMPLOYMENT TERMS (PERMANENT/CONTRACT)</label>
                <select 
                    id="employmentTerms" 
                    name="employmentTerms" 
                    onChange={handleInputChange} 
                    className={`${formFieldClass} bg-white`} 
                    defaultValue="Permanent"
                    aria-label="Select Employment Terms"
                >
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                </select>
            </div>
            <div>
                <label htmlFor="grossSalary" className={labelClass}>GROSS SALARY</label>
                <input 
                    id="grossSalary" 
                    type="number" 
                    name="grossSalary" 
                    placeholder="e.g. 5000" 
                    onChange={handleInputChange} 
                    className={formFieldClass} 
                    aria-label="Gross Salary input"
                />
            </div>
            <div>
                <label htmlFor="netSalary" className={labelClass}>NET SALARY</label>
                <input 
                    id="netSalary" 
                    type="number" 
                    name="netSalary" 
                    placeholder="e.g. 4000" 
                    onChange={handleInputChange} 
                    className={formFieldClass} 
                    aria-label="Net Salary input"
                />
            </div>
          </div>
        </div>

        {/* Next of Kin */}
        <div>
          <h3 id="kin-details-header" className={sectionHeaderClass}>
              NEXT OF KIN DETAILS
          </h3>
          <div role="group" aria-labelledby="kin-details-header" className="grid md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2">
                <label htmlFor="kinFullNames" className={labelClass}>FULL NAMES {requiredSpan}</label>
                <input 
                    id="kinFullNames" 
                    type="text" 
                    name="kinFullNames" 
                    placeholder="Full names of your next of kin" 
                    required 
                    onChange={handleInputChange} 
                    className={formFieldClass} 
                    aria-label="Next of Kin Full Names input"
                />
            </div>
            <div>
                <label htmlFor="kinNrc" className={labelClass}>NRC</label>
                <input 
                    id="kinNrc" 
                    type="text" 
                    name="kinNrc" 
                    value={formData.kinNrc || ''}
                    placeholder="Next of kin's NRC" 
                    maxLength={11}
                    onChange={handleInputChange} 
                    className={formFieldClass} 
                    aria-label="Next of Kin NRC input"
                />
            </div>
            <div>
                <label htmlFor="kinPhone" className={labelClass}>PHONE {requiredSpan}</label>
                <input 
                    id="kinPhone" 
                    type="tel" 
                    name="kinPhone" 
                    value={formData.kinPhone || ''}
                    placeholder="e.g. +260 97..." 
                    required 
                    onChange={handleInputChange} 
                    className={formFieldClass} 
                    aria-label="Next of Kin Phone input"
                />
            </div>
             <div>
                <label htmlFor="kinRelationship" className={labelClass}>RELATIONSHIP {requiredSpan}</label>
                <select 
                    id="kinRelationship" 
                    name="kinRelationship" 
                    defaultValue="" 
                    required 
                    onChange={handleInputChange} 
                    className={`${formFieldClass} bg-white`}
                    aria-label="Select Relationship with Next of Kin"
                >
                    <option value="" disabled>-- Select --</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Husband">Husband</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Friend">Friend</option>
                    <option value="Colleague">Colleague</option>
                </select>
            </div>
            <div className="md:col-span-2">
                <label htmlFor="kinResidentialAddress" className={labelClass}>RESIDENTIAL ADDRESS {requiredSpan}</label>
                <input 
                    id="kinResidentialAddress" 
                    type="text" 
                    name="kinResidentialAddress" 
                    placeholder="Next of kin's address" 
                    required 
                    onChange={handleInputChange} 
                    className={formFieldClass} 
                    aria-label="Next of Kin Residential Address input"
                />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 id="bank-details-header" className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6 border-b pb-3 border-gray-200">
                <i className="fa-solid fa-building-columns text-green-600"></i>
                SALARY BANK DETAILS
            </h3>
            <div role="group" aria-labelledby="bank-details-header" className="grid md:grid-cols-2 gap-6">
                 <div className="md:col-span-2" ref={bankWrapperRef}>
                    <label htmlFor="bankNameInput" className={labelClass}>BANK NAME {requiredSpan}</label>
                    <div className="relative">
                        <input
                            id="bankNameInput"
                            type="text"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleInputChange}
                            onClick={() => setIsBankListOpen(true)}
                            onFocus={() => setIsBankListOpen(true)}
                            placeholder="Select or type your bank"
                            className={`${formFieldClass} bg-white pl-10`}
                            required
                            autoComplete="off"
                            aria-label="Select or Type Bank Name"
                        />
                         <i className="fa-solid fa-building-columns absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                         <i className={`fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${isBankListOpen ? 'rotate-180' : ''}`}></i>
                        
                        {/* Custom Dropdown List */}
                        {isBankListOpen && (
                            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredBanks.length > 0 ? (
                                    filteredBanks.map(bank => (
                                        <li 
                                            key={bank}
                                            onClick={() => handleBankSelect(bank)}
                                            className="px-4 py-2 hover:bg-orange-50 cursor-pointer text-gray-700 transition-colors"
                                        >
                                            {bank}
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-4 py-2 text-gray-400 italic">No banks match your search</li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
                 <div>
                    <label htmlFor="branchName" className={labelClass}>BRANCH NAME {requiredSpan}</label>
                    <div className="relative">
                        <input 
                            id="branchName" 
                            type="text" 
                            name="branchName" 
                            placeholder="e.g. Cairo Road" 
                            required 
                            onChange={handleInputChange} 
                            className={`${formFieldClass} pl-10`} 
                            aria-label="Branch Name input"
                        />
                        <i className="fa-solid fa-code-branch absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
                <div>
                    <label htmlFor="accountNumber" className={labelClass}>ACCOUNT NUMBER {requiredSpan}</label>
                     <div className="relative">
                        <input 
                            id="accountNumber" 
                            type="text" 
                            name="accountNumber" 
                            placeholder={isAbsa ? "Last 7 digits only" : "e.g. 1234567890"} 
                            maxLength={isAbsa ? 7 : 20}
                            required 
                            onChange={handleInputChange} 
                            className={`${formFieldClass} pl-10`} 
                            aria-label="Account Number input"
                        />
                        <i className="fa-solid fa-hashtag absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                    {isAbsa && <p className="text-xs text-orange-600 mt-1 pl-1">For Absa, please capture the last 7 digits only.</p>}
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="accountNames" className={labelClass}>ACCOUNT NAMES {requiredSpan}</label>
                    <div className="relative">
                        <input 
                            id="accountNames" 
                            type="text" 
                            name="accountNames" 
                            value={formData.accountNames || ''}
                            placeholder="Auto-filled from personal details" 
                            required 
                            readOnly
                            className={`${formFieldClass} pl-10 bg-gray-100 cursor-not-allowed`} 
                            aria-label="Account Names (Auto-filled)"
                        />
                        <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Advance Details */}
        <div>
            <h3 id="advance-details-header" className={sectionHeaderClass}>
                ADVANCE DETAILS
            </h3>
            <div role="group" aria-labelledby="advance-details-header" className="space-y-[-1px]">
                 <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] border">
                    <label htmlFor="loanPurpose" className="p-3 font-medium bg-gray-50 border-r">PURPOSE FOR THE ADVANCE</label>
                    <select 
                        id="loanPurpose" 
                        name="loanPurpose" 
                        value={formData.loanPurpose} 
                        onChange={handleInputChange} 
                        className="p-3 w-full bg-white"
                        aria-label="Select Purpose for the Advance"
                    >
                        <option value="">-- Select Purpose --</option>
                        {loanPurposes.map(purpose => (
                            <option key={purpose} value={purpose}>{purpose}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] border">
                    <label htmlFor="sourceOfRepayment" className="p-3 font-medium bg-gray-50 border-r">SOURCE OF PROCEEDS FOR ADVANCE REPAYMENT</label>
                    <input 
                        id="sourceOfRepayment" 
                        type="text" 
                        name="sourceOfRepayment" 
                        value="Salary" 
                        readOnly 
                        className="p-3 w-full bg-gray-100 cursor-not-allowed font-semibold text-gray-700" 
                        aria-label="Source of Repayment (Read only)"
                    />
                </div>
                 <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] border">
                    <label htmlFor="otherLoans" className="p-3 font-medium bg-gray-50 border-r">NUMBER OF OTHER LOANS/ADVANCE OBLIGATIONS</label>
                    <input 
                        id="otherLoans" 
                        type="text" 
                        name="otherLoans" 
                        placeholder="e.g., 1" 
                        onChange={handleInputChange} 
                        className="p-3 w-full" 
                        aria-label="Number of other loans"
                    />
                </div>
                 <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] border items-center">
                    <label htmlFor="loanAmount" className="p-3 font-medium bg-gray-50 border-r h-full flex items-center">ADVANCE AMOUNT (ZMW) {requiredSpan}</label>
                    <select 
                        id="loanAmount" 
                        name="loanAmount" 
                        value={loanAmount} 
                        onChange={(e) => setLoanAmount(Number(e.target.value))} 
                        className="p-3 w-full bg-white h-full" 
                        required
                        aria-label="Select Advance Amount"
                    >
                        {allAmounts.map(amount => <option key={amount} value={amount}>{formatCurrency(amount)}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] border items-center">
                    <label className="p-3 font-medium bg-gray-50 border-r h-full flex items-center">MONTHLY INSTALLMENT</label>
                    <div className="p-3 w-full bg-orange-50 font-bold text-orange-700" aria-label={`Monthly Installment: ${formatCurrency(monthlyPayment)}`}>
                        {formatCurrency(monthlyPayment)}
                    </div>
                </div>
                 <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] border items-center">
                    <label htmlFor="loanTenure" className="p-3 font-medium bg-gray-50 border-r h-full flex items-center">ADVANCE TENURE {requiredSpan}</label>
                    <select 
                        id="loanTenure" 
                        name="loanTenure" 
                        value={loanTenure} 
                        onChange={(e) => setLoanTenure(Number(e.target.value))} 
                        className="p-3 w-full bg-white h-full" 
                        required
                        aria-label="Select Advance Tenure"
                    >
                        {repaymentPeriods.map(months => <option key={months} value={months}>{months} Month{months > 1 ? 's' : ''}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {/* Attachments */}
        <div>
            <h3 id="attachments-header" className={sectionHeaderClass}>
                <i className="fa-solid fa-paperclip text-orange-500" aria-hidden="true"></i>
                Attachments
            </h3>
            <div role="group" aria-labelledby="attachments-header" className="space-y-8">
                <div id="nrc-section" className="grid md:grid-cols-2 gap-x-8 gap-y-8">
                    <CameraCapture title="NRC (Front)" onCapture={setNrcFrontBlob} guideType="nrc" />
                    <CameraCapture title="NRC (Back)" onCapture={setNrcBackBlob} guideType="nrc" />
                </div>
                <div id="payslip-section">
                    <FileUpload label="Latest Payslip" fileType="application/pdf,image/*" onFileSelect={setPayslipFile} />
                </div>
            </div>
        </div>
        
        {/* Declaration & Signature */}
        <div id="signature-section">
          <h3 id="declaration-header" className={sectionHeaderClass}>
              DECLARATION
          </h3>
           <div role="group" aria-labelledby="declaration-header" className="space-y-4 bg-gray-50 p-6 rounded-lg border">
                <p className="text-sm text-gray-700 leading-relaxed">
                    I <input type="text" value={fullName} readOnly className="font-bold bg-gray-200 border-b border-gray-400 px-2 mx-1 w-48 text-center" placeholder="Your Name" aria-label="Your name (auto-filled)"/> hereby apply for an Xtenda Salary Advance and authorize the recovery of the loan issued to be deducted through my Bank Account. I further confirm that the DDACC confirmation provided to Xtenda Finance Limited for purposes of recovery of the advance I am obtaining are being issued on a sufficiently funded account and that I accept any action which my bank and/or Xtenda Finance Limited will take against me should the DDACC instruction bounce on grounds of insufficient funds on my bank account and/or any other reason which may lead to Xtenda Finance Limited not recovering as agreed. I also authorize Xtenda Finance Limited to take necessary legal action against me should this advance I am applying for go into arrears for any reason arising from my failure to honour this advance agreement.
                </p>
            </div>
            <div className="mt-6 grid md:grid-cols-2 gap-6 items-end">
                <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block" id="signature-label">Signature</label>
                    <SignaturePad onSignatureChange={setSignatureBlob} aria-labelledby="signature-label" />
                </div>
                 <div>
                    <label htmlFor="signatureDate" className="text-sm font-medium text-gray-600 mb-2 block">Date</label>
                    <input 
                        id="signatureDate" 
                        type="date" 
                        readOnly 
                        value={formData.dateOfApplication} 
                        className={`${formFieldClass} bg-gray-100`} 
                        aria-label="Signature Date"
                    />
                </div>
            </div>
        </div>
        
        <div className="mt-12 pt-8 border-t-2 border-dashed">
            <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white font-extrabold py-4 px-6 rounded-xl hover:bg-green-700 transition duration-300 text-xl shadow-lg flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isSubmitting ? (
                    <>
                        <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Submitting...
                    </>
                ) : (
                     <>
                        Submit Application <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                     </>
                )}
            </button>
            {submissionError && (
                <p role="alert" className="text-red-600 text-center font-semibold mt-4" style={{ whiteSpace: 'pre-wrap' }}>{submissionError}</p>
            )}
        </div>

      </form>
    </section>
  );
};

export default ApplicationForm;