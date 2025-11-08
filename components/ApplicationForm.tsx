import React from 'react';
import { ApplicationFormData } from '../types';
import SignaturePad from './SignaturePad';
import CameraCapture from './CameraCapture';
import FileUpload from './FileUpload';

declare var pako: any;

const FormInput = ({
  label,
  name,
  formData,
  handleInputChange,
  placeholder = '',
  required = false,
  type = 'text',
}: {
  label: string;
  name: string;
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) => (
  <div>
    <label htmlFor={name} className="text-sm font-medium text-gray-600">{label}{required && <span className="text-red-500">*</span>}</label>
    <input
      id={name}
      type={type}
      name={name}
      placeholder={placeholder || label}
      required={required}
      value={formData[name]}
      onChange={handleInputChange}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mt-1"
    />
  </div>
);

const ApplicationForm = () => {
  const initialFormData: ApplicationFormData = {
    dateOfApplication: new Date().toISOString().split('T')[0],
    fullNames: '', nrc: '', employeeNumber: '', employer: '', phone: '', email: '',
    employmentAddress: '', employmentTerms: '', selfie: '', latestPayslip: '',
    kinFullNames: '', kinNrc: '', kinRelationship: '', kinPhone: '', kinResidentialAddress: '',
    bankName: '', branchName: '', accountNumber: '',
    declarationAgreed: true, signature: '',
  };

  const [formData, setFormData] = React.useState<any>(initialFormData);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isPreviewing, setIsPreviewing] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleFileChange = (file: File | null) => {
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result;
            setFormData((prev: any) => ({ ...prev, latestPayslip: base64 }));
        };
        reader.readAsDataURL(file);
    } else {
        setFormData((prev: any) => ({ ...prev, latestPayslip: '' }));
    }
  };

  const handleSignatureChange = React.useCallback((signatureDataUrl: string) => {
    setFormData((prev: any) => ({ ...prev, signature: signatureDataUrl }));
  }, []);

  const handleSelfieCapture = React.useCallback((imageDataUrl: string | null) => {
    setFormData((prev: any) => ({ ...prev, selfie: imageDataUrl || '' }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionId = Date.now().toString();
    const submission = {
        ...formData,
        id: submissionId,
        submittedAt: new Date().toISOString(),
        status: 'New'
    };

    try {
        const existingData = localStorage.getItem('xtenda_applications');
        const applications = existingData ? JSON.parse(existingData) : [];
        applications.push(submission);
        localStorage.setItem('xtenda_applications', JSON.stringify(applications));
        
        setIsSubmitted(true);
        setFormData(initialFormData);
    } catch (error) {
        console.error("Failed to save application locally:", error);
        alert("We encountered an issue saving your application. Your device storage might be full. Please try again or contact support.");
    }
  };
  
  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPreviewing(true);
  }

  if (isSubmitted) {
    return (
        <section id="application-form" className="my-16 p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
            <div className="text-green-600 animate-bounce">
                <i className="fas fa-check-circle fa-5x"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mt-6">Application Submitted!</h2>
            <p className="text-gray-600 mt-4 text-lg">
                Thank you for choosing Xtenda. Your application has been securely received by our team.
            </p>
            <p className="text-gray-500 mt-2">
                We will review your details and contact you shortly via phone or email.
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setIsPreviewing(false);
              }}
              className="mt-8 bg-orange-500 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-600 transition duration-300"
            >
                Done
            </button>
        </section>
    );
  }

  const renderField = (label: string, value: string | undefined) => (
    <React.Fragment>
        <dt className="font-medium text-gray-500">{label}:</dt>
        <dd className="text-gray-800">{value || 'Not provided'}</dd>
    </React.Fragment>
  );

  if (isPreviewing) {
    return (
      <section id="application-preview" className="my-16 p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Review Your Application</h2>
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Personal Details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {renderField('Date of Application', formData.dateOfApplication)}
                {renderField('Full Names', formData.fullNames)}
                {renderField('NRC', formData.nrc)}
                {renderField('Employee Number', formData.employeeNumber)}
                {renderField('Employer', formData.employer)}
                {renderField('Phone', formData.phone)}
                {renderField('Email', formData.email)}
                {renderField('Employment Address', formData.employmentAddress)}
                {renderField('Employment Terms', formData.employmentTerms)}
              </dl>
            </div>
             <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Latest Payslip</h3>
               <p className="text-sm text-gray-600">Document Status: <span className="font-bold">{formData.latestPayslip ? 'Uploaded' : 'Not Uploaded'}</span></p>
               {!formData.latestPayslip && <p className="text-red-500 font-bold text-sm mt-1">Payslip is required.</p>}
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">A Picture of Yourself</h3>
               {formData.selfie ? <img src={formData.selfie} alt="Your selfie" className="rounded-lg max-w-xs mx-auto shadow-md border bg-white" /> : <p className="text-red-500 font-bold">Selfie is missing.</p>}
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Next of Kin Details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {renderField('Full Names', formData.kinFullNames)}
                {renderField('NRC', formData.kinNrc)}
                {renderField('Relationship', formData.kinRelationship)}
                {renderField('Phone', formData.kinPhone)}
                {renderField('Residential Address', formData.kinResidentialAddress)}
              </dl>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Salary Bank Details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {renderField('Bank Name', formData.bankName)}
                {renderField('Branch Name', formData.branchName)}
                {renderField('Account Number', formData.accountNumber)}
              </dl>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Declaration & Signature</h3>
               <p className="text-sm text-gray-600 mb-4">Agreement to terms: <span className="font-bold">{formData.declarationAgreed ? 'YES' : 'NO'}</span></p>
               {formData.signature ? <img src={formData.signature} alt="Your signature" className="rounded-lg max-w-xs mx-auto shadow-md border bg-white" /> : <p className="text-red-500 font-bold">Signature is missing.</p>}
            </div>
            <div className="mt-10 flex flex-col md:flex-row justify-center gap-4">
                <button onClick={() => setIsPreviewing(false)} className="w-full md:w-auto bg-gray-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-700 transition duration-300 text-lg flex items-center justify-center gap-2 order-2 md:order-1"><i className="fa-solid fa-pen-to-square"></i>Edit Details</button>
                <button onClick={handleSubmit} disabled={!formData.signature || !formData.selfie || !formData.latestPayslip} className="w-full md:w-auto bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition duration-300 text-lg flex items-center justify-center gap-2 order-1 md:order-2 disabled:bg-gray-400 disabled:cursor-not-allowed"><i className="fa-solid fa-check"></i>Confirm & Submit</button>
            </div>
        </div>
      </section>
    );
  }

  return (
    <section id="application-form" className="my-16 p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Salary Advance Application Form</h2>
      <p className="text-center text-gray-600 mb-8">Please fill in your details accurately.</p>
      
      <form onSubmit={handlePreview} className="max-w-3xl mx-auto space-y-8">
        <details open className="space-y-4 p-4 border rounded-lg">
            <summary className="text-xl font-semibold text-gray-700 cursor-pointer">Personal Details (Mandatory)</summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Date of Application</label>
                  <input type="date" name="dateOfApplication" required value={formData.dateOfApplication} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mt-1"/>
                </div>
                <div className="md:col-span-2">
                  <FormInput label="Full Names" name="fullNames" required formData={formData} handleInputChange={handleInputChange}/>
                </div>
                <FormInput label="NRC" name="nrc" required formData={formData} handleInputChange={handleInputChange}/>
                <FormInput label="Employee Number" name="employeeNumber" formData={formData} handleInputChange={handleInputChange}/>
                <FormInput label="Employer" name="employer" required formData={formData} handleInputChange={handleInputChange}/>
                <FormInput label="Phone" name="phone" required type="tel" formData={formData} handleInputChange={handleInputChange}/>
                <div className="md:col-span-2"><FormInput label="Email" name="email" required type="email" formData={formData} handleInputChange={handleInputChange}/></div>
                <div className="md:col-span-2"><FormInput label="Employment Address" name="employmentAddress" required formData={formData} handleInputChange={handleInputChange}/></div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Employment Terms <span className="text-red-500">*</span></label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center"><input type="radio" name="employmentTerms" value="Permanent" onChange={handleInputChange} required checked={formData.employmentTerms === 'Permanent'} className="mr-2 h-4 w-4"/>Permanent</label>
                    <label className="flex items-center"><input type="radio" name="employmentTerms" value="Contract" onChange={handleInputChange} required checked={formData.employmentTerms === 'Contract'} className="mr-2 h-4 w-4"/>Contract</label>
                  </div>
                </div>
            </div>
        </details>
        
        <details open className="space-y-4 p-4 border rounded-lg">
            <summary className="text-xl font-semibold text-gray-700 cursor-pointer">Latest Payslip (Mandatory)</summary>
            <div className="pt-4">
                <FileUpload label="Upload Latest Payslip" fileType="application/pdf" onFileSelect={handleFileChange} />
                <p className="text-xs text-gray-500 mt-1">Please upload your latest payslip in PDF format.</p>
            </div>
        </details>

        <details open className="space-y-4 p-4 border rounded-lg">
            <summary className="text-xl font-semibold text-gray-700 cursor-pointer">A Picture of Yourself (Mandatory)</summary>
            <div className="pt-4">
                <CameraCapture onCapture={handleSelfieCapture} />
            </div>
        </details>

        <details className="space-y-4 p-4 border rounded-lg">
            <summary className="text-xl font-semibold text-gray-700 cursor-pointer">Next of Kin Details (Optional)</summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="md:col-span-2"><FormInput label="Full Names" name="kinFullNames" formData={formData} handleInputChange={handleInputChange}/></div>
                <FormInput label="NRC" name="kinNrc" formData={formData} handleInputChange={handleInputChange}/>
                <FormInput label="Relationship" name="kinRelationship" formData={formData} handleInputChange={handleInputChange}/>
                <div className="md:col-span-2"><FormInput label="Phone" name="kinPhone" type="tel" formData={formData} handleInputChange={handleInputChange}/></div>
                <div className="md:col-span-2"><FormInput label="Residential Address" name="kinResidentialAddress" formData={formData} handleInputChange={handleInputChange}/></div>
            </div>
        </details>

        <details className="space-y-4 p-4 border rounded-lg">
            <summary className="text-xl font-semibold text-gray-700 cursor-pointer">Salary Bank Details (Optional)</summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <FormInput label="Bank Name" name="bankName" formData={formData} handleInputChange={handleInputChange}/>
                <FormInput label="Branch Name" name="branchName" formData={formData} handleInputChange={handleInputChange}/>
                <div className="md:col-span-2">
                    <FormInput label="Account Number" name="accountNumber" formData={formData} handleInputChange={handleInputChange}/>
                </div>
            </div>
        </details>

        <details open className="space-y-4 p-4 border rounded-lg">
            <summary className="text-xl font-semibold text-gray-700 cursor-pointer">Declaration and Signature (Mandatory)</summary>
            <div className="pt-4 space-y-4">
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                I <span className="font-bold">{formData.fullNames.trim() || '[Your Name]'}</span> hereby apply for an Xtenda Salary Advance...
              </p>
              <div className="flex items-start">
                  <input type="checkbox" id="declarationAgreed" name="declarationAgreed" checked={formData.declarationAgreed} onChange={handleInputChange} required className="h-5 w-5 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"/>
                  <label htmlFor="declarationAgreed" className="ml-2 block text-sm text-gray-900">I have read, understood, and agree... <span className="text-red-500">*</span></label>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature <span className="text-red-500">*</span></label>
                  <SignaturePad onSignatureChange={handleSignatureChange} />
                  <p className="text-xs text-gray-500 mt-1">Please sign in the box above.</p>
              </div>
            </div>
        </details>
        
        <button type="submit" className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-green-700 transition duration-300 text-lg flex items-center justify-center gap-2">
          <i className="fa-solid fa-eye"></i>
          Review & Submit
        </button>
      </form>
    </section>
  );
};

export default ApplicationForm;