import React from 'react';
import AdminChatbot from './AdminChatbot';
import { firestore } from '../firebaseConfig';
import { doc, onSnapshot, updateDoc, deleteDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { ApplicationFormData, StatusHistoryEntry } from '../types';

// Declare globals from CDN scripts
declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
    }
}

// Helper component for rendering fields in the PDF layout.
const PdfField = ({ label, value, className = '' }: { label: string; value?: string | number | null; className?: string }) => (
    <div className={`py-1 ${className}`}>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-[12px] font-semibold text-gray-800 break-words min-h-[16px] leading-tight">
            {value || <span className="text-gray-400 font-normal">Not provided</span>}
        </p>
    </div>
);


interface AdminViewProps {
    applicationId: string;
    onBack: () => void;
}

const AdminView = ({ applicationId, onBack }: AdminViewProps) => {
    const [application, setApplication] = React.useState<ApplicationFormData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [status, setStatus] = React.useState<'New' | 'Under Review' | 'Approved' | 'Rejected' | ''>('');
    const [pendingStatus, setPendingStatus] = React.useState<string>(''); // For the dropdown
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
    const [showPdfPreview, setShowPdfPreview] = React.useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
    
    const pdfPreviewRef = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
        const docRef = doc(firestore, 'applications', applicationId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as ApplicationFormData;
                setApplication(data);
                setStatus(data.status || 'New');
                setPendingStatus(data.status || 'New');
                // Don't overwrite local rejectionReason state while typing if document updates
                if (!isRejectModalOpen) {
                    setRejectionReason(data.rejectionReason || '');
                }
            } else {
                setError("Application not found.");
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching application: ", err);
            setError("Failed to load application data.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [applicationId, isRejectModalOpen]);

    const handleSaveStatus = () => {
        if (!application) return;

        if (pendingStatus === 'Rejected') {
            setIsRejectModalOpen(true);
            return;
        }

        updateApplicationStatus(pendingStatus as any);
    };

    const confirmRejection = () => {
        updateApplicationStatus('Rejected', rejectionReason);
        setIsRejectModalOpen(false);
    };

    // Helper to update the dashboard cache instantly so the list is updated when going back
    const updateDashboardCache = (newStatus: string, reason?: string) => {
        try {
            const cached = localStorage.getItem('xtenda_admin_apps_cache');
            if (cached) {
                const apps = JSON.parse(cached) as ApplicationFormData[];
                const index = apps.findIndex(a => a.id === applicationId);
                if (index !== -1) {
                    apps[index] = { 
                        ...apps[index], 
                        status: newStatus as any, 
                        rejectionReason: reason || apps[index].rejectionReason 
                    };
                    localStorage.setItem('xtenda_admin_apps_cache', JSON.stringify(apps));
                }
            }
        } catch (e) {
            console.error("Failed to update dashboard cache", e);
        }
    };

    const updateApplicationStatus = async (newStatus: 'Under Review' | 'Approved' | 'Rejected', reason = '') => {
        if (!application?.id) return;

        const docRef = doc(firestore, 'applications', application.id);
        try {
            const newHistoryEntry: StatusHistoryEntry = {
                status: newStatus,
                timestamp: serverTimestamp(),
                changedBy: 'admin',
                reason: newStatus === 'Rejected' ? reason : undefined
            };
            
            await updateDoc(docRef, { 
                status: newStatus,
                rejectionReason: newStatus === 'Rejected' ? reason : '',
                lastModifiedAt: serverTimestamp(),
                statusHistory: arrayUnion(newHistoryEntry)
            });
            setStatus(newStatus);
            updateDashboardCache(newStatus, reason);
            
            // Trigger Email Client
            sendEmailNotification(newStatus, application, reason);
            
            // Alert success briefly
            alert(`Status updated to ${newStatus}`);

        } catch (error) {
            console.error("Error updating status: ", error);
            alert("Failed to update status. Please try again.");
        }
    };

    const sendEmailNotification = (newStatus: string, appData: ApplicationFormData, reason?: string) => {
        if (!appData.email) return;

        const subject = `Update on your Salary Advance Application - ${newStatus}`;
        let body = `Dear ${appData.firstName} ${appData.surname},\n\n`;

        if (newStatus === 'Approved') {
            body += `We are pleased to inform you that your application for a salary advance of K${appData.loanDetails?.amount.toLocaleString()} has been APPROVED.\n\n`;
            body += `The funds will be disbursed to your account shortly.\n\n`;
        } else if (newStatus === 'Rejected') {
            body += `We regret to inform you that your application for a salary advance has been declined.\n\n`;
            body += `Reason: ${reason}\n\n`;
            body += `Please contact us if you require further clarification.\n\n`;
        } else if (newStatus === 'Under Review') {
            body += `Your application is currently under review by our team. We will notify you once a decision has been made.\n\n`;
        }

        body += `Regards,\nVincent M\nXtenda Finance\nvincentM@xtendafin.com`;

        // Encode parameters for mailto link
        const mailtoLink = `mailto:${appData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Open the email client
        window.location.href = mailtoLink;
    };

    const handleDelete = async () => {
        if (!application?.id) return;
        if (window.confirm("Are you sure you want to permanently delete this application?")) {
            try {
                await deleteDoc(doc(firestore, 'applications', application.id));
                onBack(); // Go back after deletion
            } catch (error) {
                console.error("Error deleting application: ", error);
                alert("Failed to delete application.");
            }
        }
    };
    
    const handleGeneratePdf = async () => {
        const { jspdf } = window;
        const { html2canvas } = window;

        if (!pdfPreviewRef.current || !jspdf || !html2canvas) {
            alert("PDF generation library is not loaded.");
            return;
        }
        
        setIsGeneratingPdf(true);
        const element = pdfPreviewRef.current;

        // Temporarily reset transform for capture if preview is showing
        const originalTransform = element.style.transform;
        element.style.transform = 'none';

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));
            pdf.save(`Application_${application?.firstName}_${application?.surname}.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("An error occurred while generating the PDF. Please try again.");
        } finally {
            element.style.transform = originalTransform;
            setIsGeneratingPdf(false);
        }
    };
    
    const getWhatsAppUrl = (phone: string) => {
        if (!phone) return '#';
        let cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
        
        // Basic Zambia formatting logic: replace leading 0 with 260
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '260' + cleanPhone.substring(1);
        } else if (cleanPhone.length === 9 && !cleanPhone.startsWith('260')) {
            // Assume 9 digits (e.g. 977123456) needs prefix
            cleanPhone = '260' + cleanPhone;
        }
        
        return `https://wa.me/${cleanPhone}`;
    };
    
    if (loading) return <div className="p-8 text-center"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!application) return <div className="p-8 text-center text-gray-500">No application data.</div>;

    const fullName = `${application.firstName || ''} ${application.surname || ''}`.trim();

    return (
        <div className="bg-gray-100 min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Data & Actions */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg">
                    <header className="p-6 border-b flex justify-between items-center">
                        <div>
                            <button onClick={onBack} className="text-gray-500 hover:text-gray-800 flex items-center gap-2 mb-2">
                                <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
                            </button>
                            <h2 className="text-2xl font-bold text-gray-800">{fullName}</h2>
                            <p className="text-gray-500">Application ID: {application.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowPdfPreview(!showPdfPreview)} className="text-gray-500 hover:text-blue-600 font-medium py-2 px-3 rounded-lg hover:bg-gray-100 transition flex items-center gap-2" title="Toggle PDF Preview">
                                 <i className={`fa-solid ${showPdfPreview ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                            <button onClick={handleGeneratePdf} disabled={isGeneratingPdf} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-blue-300">
                                {isGeneratingPdf ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-pdf"></i>}
                                Generate Form
                            </button>
                             <button onClick={handleDelete} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">
                                <i className="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </header>
                    <div className="p-6">
                        {/* Data Sections */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <DataSection title="Personal Details">
                                <DataItem label="Full Name" value={fullName} />
                                <DataItem label="NRC" value={application.nrc} />
                                <DataItem 
                                    label="Phone" 
                                    value={
                                        <div className="flex items-center justify-end gap-3">
                                            <a href={`tel:${application.phone}`} className="hover:underline text-gray-900">{application.phone}</a>
                                            <div className="flex gap-1">
                                                <a 
                                                    href={`tel:${application.phone}`} 
                                                    className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition shadow-sm" 
                                                    title="Call"
                                                >
                                                    <i className="fa-solid fa-phone text-xs"></i>
                                                </a>
                                                <a 
                                                    href={getWhatsAppUrl(application.phone)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="w-7 h-7 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition shadow-sm" 
                                                    title="WhatsApp"
                                                >
                                                    <i className="fa-brands fa-whatsapp text-sm"></i>
                                                </a>
                                            </div>
                                        </div>
                                    } 
                                />
                                <DataItem label="Email" value={<a href={`mailto:${application.email}`} className="text-blue-600 hover:underline">{application.email}</a>} />
                                <DataItem label="Employee #" value={application.employeeNumber} />
                                <DataItem label="Employer" value={application.employer} />
                                <DataItem label="Employment Address" value={application.employmentAddress} />
                                <DataItem label="Employment Terms" value={application.employmentTerms} />
                                <DataItem label="Gross Salary" value={application.grossSalary ? `K${application.grossSalary}`: ''} />
                                <DataItem label="Net Salary" value={application.netSalary ? `K${application.netSalary}`: ''} />
                            </DataSection>
                            
                            <DataSection title="Next of Kin Details">
                                <DataItem label="Full Name" value={application.kinFullNames} />
                                <DataItem label="NRC" value={application.kinNrc} />
                                <DataItem label="Relationship" value={application.kinRelationship} />
                                <DataItem label="Phone" value={application.kinPhone} />
                                <DataItem label="Address" value={application.kinResidentialAddress} />
                            </DataSection>

                             <DataSection title="Salary Bank Details">
                                <DataItem label="Bank Name" value={application.bankName} />
                                <DataItem label="Branch Name" value={application.branchName} />
                                <DataItem label="Account #" value={application.accountNumber} />
                                <DataItem label="Account Names" value={application.accountNames} />
                            </DataSection>

                            <DataSection title="Advance Details">
                                <DataItem label="Purpose" value={application.loanPurpose} />
                                <DataItem label="Repayment Source" value={application.sourceOfRepayment} />
                                <DataItem label="Other Loans" value={application.otherLoans} />
                                <DataItem label="Advance Amount" value={application.loanDetails ? `K${application.loanDetails.amount.toLocaleString()}` : 'N/A'} isHighlight />
                                <DataItem label="Tenure" value={application.loanDetails ? `${application.loanDetails.months} Months` : 'N/A'} />
                                <DataItem label="Monthly Installment" value={application.loanDetails ? `K${application.loanDetails.monthlyPayment.toLocaleString()}` : 'N/A'} isHighlight />
                            </DataSection>
                        </div>
                    </div>
                </div>

                {/* Right Column: Status & Attachments */}
                <div className="space-y-8">
                     <div className="bg-white rounded-xl shadow-lg">
                        <header className="p-4 border-b">
                            <h3 className="font-bold text-gray-800 text-lg">Application Status</h3>
                        </header>
                        <div className="p-6 space-y-4">
                             <div className="flex items-center gap-4">
                                <StatusBadge current={status} target="New" />
                                <StatusBadge current={status} target="Under Review" />
                                <StatusBadge current={status} target="Approved" />
                                <StatusBadge current={status} target="Rejected" />
                            </div>
                            
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                                <div className="flex gap-2">
                                    <select 
                                        value={pendingStatus}
                                        onChange={(e) => setPendingStatus(e.target.value)}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="New">New</option>
                                        <option value="Under Review">Under Review</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                    <button 
                                        onClick={handleSaveStatus}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>

                            {status === 'Rejected' && (
                                <div className="bg-red-50 p-3 rounded-md text-red-800 border border-red-200 mt-2">
                                    <p className="font-bold text-sm">Rejection Reason:</p>
                                    <p className="text-sm">{rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg">
                        <header className="p-4 border-b">
                            <h3 className="font-bold text-gray-800 text-lg">Attachments</h3>
                        </header>
                        <div className="p-6 grid grid-cols-2 gap-4">
                           <AttachmentPreview title="NRC Front" src={application.nrcImageFront} />
                           <AttachmentPreview title="NRC Back" src={application.nrcImageBack} />
                           <AttachmentPreview title="Latest Payslip" src={application.latestPayslip} isPdf={application.latestPayslip?.startsWith('data:application/pdf')} />
                           <AttachmentPreview title="Signature" src={application.signature} />
                        </div>
                    </div>
                </div>
            </div>
             <AdminChatbot applicationData={application} />
             
            {/* Rejection Reason Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Reject Application</h3>
                        <p className="text-gray-600 mb-4">Please provide a reason for rejecting this application. This will be sent to the applicant.</p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-6"
                            placeholder="Reason for rejection..."
                            rows={4}
                        />
                        <div className="flex gap-4">
                            <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-3 font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                            <button onClick={confirmRejection} className="flex-1 py-3 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">Reject & Notify</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Generation Layout */}
            <div 
                className={showPdfPreview ? "fixed inset-0 z-50 bg-gray-900/80 flex items-center justify-center overflow-auto p-8" : "fixed -left-[9999px] top-0"} 
                aria-hidden={!showPdfPreview}
            >
                {showPdfPreview && (
                    <button onClick={() => setShowPdfPreview(false)} className="fixed top-4 right-4 text-white text-3xl z-50 hover:text-gray-300">
                        <i className="fa-solid fa-times"></i>
                    </button>
                )}
                
                 {/* PDF Container - A4 Ratio */}
                 <div 
                    ref={pdfPreviewRef} 
                    className="w-[210mm] min-h-[297mm] bg-white text-black font-sans relative"
                    style={{ 
                        transform: showPdfPreview ? 'scale(0.8)' : 'scale(1)', 
                        transformOrigin: 'top center',
                        marginTop: showPdfPreview ? '20px' : '0',
                        padding: '15mm',
                        boxShadow: showPdfPreview ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Orange Border Frame */}
                    <div className="absolute top-0 left-0 w-full h-full border-[3px] border-orange-400 pointer-events-none m-0 box-border"></div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            {/* Logo & Top Right Text */}
                            <div className="absolute -top-16 -right-2 flex flex-col items-end">
                                <img 
                                    src="https://firebasestorage.googleapis.com/v0/b/my-salary-app-78a41.appspot.com/o/xtenda-logo.png?alt=media&token=c2a13d7c-3a32-4293-875f-33126f2161f4" 
                                    alt="Xtenda Logo" 
                                    className="h-14 object-contain"
                                />
                                <span className="text-orange-500 font-extrabold text-xl tracking-wide -mt-4">Xtenda</span>
                            </div>
                            
                            <h1 className="text-center text-xl font-bold uppercase mb-8 mt-8">Salary Advance Application Form</h1>

                            {/* Date */}
                            <div className="mb-6 flex items-end">
                                <span className="font-bold text-sm uppercase mr-1 whitespace-nowrap">Date of Application:</span>
                                <span className="border-b border-black w-64 text-left pl-2 font-medium">{application.dateOfApplication}</span>
                            </div>

                            {/* Personal Details */}
                            <div className="mb-6">
                                <h3 className="font-bold text-sm uppercase mb-3">Personal Details</h3>
                                <div className="space-y-3 text-xs">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="flex items-end">
                                            <span className="uppercase mr-1 whitespace-nowrap">First Name</span>
                                            <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.firstName}</span>
                                        </div>
                                        <div className="flex items-end">
                                            <span className="uppercase mr-1 whitespace-nowrap">Surname</span>
                                            <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.surname}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="flex items-end">
                                            <span className="uppercase mr-1 whitespace-nowrap">NRC</span>
                                            <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.nrc}</span>
                                        </div>
                                        <div className="flex items-end">
                                            <span className="uppercase mr-1 whitespace-nowrap">Employee Number</span>
                                            <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.employeeNumber}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="flex items-end">
                                            <span className="uppercase mr-1 whitespace-nowrap">Employer</span>
                                            <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.employer}</span>
                                        </div>
                                        <div className="flex items-end">
                                            <span className="uppercase mr-1 whitespace-nowrap">Phone</span>
                                            <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.phone}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <span className="uppercase mr-1 whitespace-nowrap">Email</span>
                                        <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.email}</span>
                                    </div>
                                    <div className="flex items-end">
                                        <span className="uppercase mr-1 whitespace-nowrap">Employment Address</span>
                                        <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.employmentAddress}</span>
                                    </div>
                                    <div className="flex items-end">
                                        <span className="uppercase mr-1 whitespace-nowrap">Employment Terms (Permanent/Contract)</span>
                                        <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.employmentTerms}</span>
                                    </div>
                                    <div className="flex items-end w-2/3">
                                        <span className="uppercase mr-1 whitespace-nowrap">Gross Salary</span>
                                        <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.grossSalary}</span>
                                    </div>
                                    <div className="flex items-end w-2/3">
                                        <span className="uppercase mr-1 whitespace-nowrap">Net Salary</span>
                                        <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.netSalary}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Next of Kin */}
                            <div className="mb-6">
                                <h3 className="font-bold text-sm uppercase mb-3">Next of Kin Details</h3>
                                <div className="space-y-3 text-xs">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="flex items-end">
                                            <span className="uppercase mr-1 whitespace-nowrap">Full Names</span>
                                            <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.kinFullNames}</span>
                                        </div>
                                        <div className="flex items-end">
                                            <span className="uppercase mr-1 whitespace-nowrap">NRC</span>
                                            <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.kinNrc}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="flex items-end">
                                            <span className="uppercase mr-1 whitespace-nowrap">Relationship</span>
                                            <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.kinRelationship}</span>
                                        </div>
                                        <div className="flex items-end">
                                            <span className="uppercase mr-1 whitespace-nowrap">Phone</span>
                                            <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.kinPhone}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <span className="uppercase mr-1 whitespace-nowrap">Residential Address</span>
                                        <span className="border-b border-black flex-grow text-left pl-2 font-medium truncate">{application.kinResidentialAddress}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details Table */}
                            <div className="mb-6">
                                <h3 className="font-bold text-sm uppercase mb-2">Salary Bank Details</h3>
                                <div className="border border-black text-xs">
                                    <div className="grid grid-cols-[150px_1fr] border-b border-black">
                                        <div className="p-1 pl-2 font-medium uppercase border-r border-black">Bank Name</div>
                                        <div className="p-1 pl-2">{application.bankName}</div>
                                    </div>
                                    <div className="grid grid-cols-[150px_1fr] border-b border-black">
                                        <div className="p-1 pl-2 font-medium uppercase border-r border-black">Branch Name</div>
                                        <div className="p-1 pl-2">{application.branchName}</div>
                                    </div>
                                    <div className="grid grid-cols-[150px_1fr] border-b border-black">
                                        <div className="p-1 pl-2 font-medium uppercase border-r border-black">Account Number</div>
                                        <div className="p-1 pl-2">{application.accountNumber}</div>
                                    </div>
                                    <div className="grid grid-cols-[150px_1fr]">
                                        <div className="p-1 pl-2 font-medium uppercase border-r border-black">Account Names</div>
                                        <div className="p-1 pl-2">{application.accountNames}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Advance Details Table */}
                            <div className="mb-6">
                                <h3 className="font-bold text-sm uppercase mb-2">Advance Details</h3>
                                <div className="border border-black text-xs">
                                    <div className="grid grid-cols-[280px_1fr] border-b border-black">
                                        <div className="p-1 pl-2 font-medium uppercase border-r border-black">Purpose for the Advance</div>
                                        <div className="p-1 pl-2">{application.loanPurpose}</div>
                                    </div>
                                    <div className="grid grid-cols-[280px_1fr] border-b border-black">
                                        <div className="p-1 pl-2 font-medium uppercase border-r border-black">Source of Proceeds for Advance Repayment</div>
                                        <div className="p-1 pl-2">{application.sourceOfRepayment}</div>
                                    </div>
                                    <div className="grid grid-cols-[280px_1fr] border-b border-black">
                                        <div className="p-1 pl-2 font-medium uppercase border-r border-black">Number of Other Loans/Advance Obligations</div>
                                        <div className="p-1 pl-2">{application.otherLoans}</div>
                                    </div>
                                    <div className="grid grid-cols-[280px_1fr] border-b border-black">
                                        <div className="p-1 pl-2 font-medium uppercase border-r border-black">Advance Amount (ZMW)</div>
                                        <div className="p-1 pl-2 font-bold">{application.loanDetails?.amount.toLocaleString()}</div>
                                    </div>
                                    <div className="grid grid-cols-[280px_1fr] border-b border-black">
                                        <div className="p-1 pl-2 font-medium uppercase border-r border-black">Monthly Installment</div>
                                        <div className="p-1 pl-2">{application.loanDetails?.monthlyPayment.toLocaleString()}</div>
                                    </div>
                                    <div className="grid grid-cols-[280px_1fr]">
                                        <div className="p-1 pl-2 font-medium uppercase border-r border-black">Advance Tenure</div>
                                        <div className="p-1 pl-2">{application.loanDetails?.months} Months</div>
                                    </div>
                                </div>
                            </div>

                            {/* Declaration */}
                            <div>
                                <h3 className="font-bold text-sm uppercase mb-2">Declaration</h3>
                                <p className="text-[10px] leading-tight text-justify mb-8">
                                    I <span className="font-bold underline decoration-dotted px-1">{fullName}</span> hereby apply for an Xtenda Salary Advance and authorize the recovery of the loan issued to be 
                                    deducted through my Bank Account. I further confirm that the DDACC confirmation provided to Xtenda Finance Limited for purposes of recovery of the 
                                    advance I am obtaining are being issued on a sufficiently funded account and that I accept any action which my bank and/or Xtenda Finance Limited 
                                    will take against me should the DDACC instruction bounce on grounds of insufficient funds on my bank account and/or any other reason which may 
                                    lead to Xtenda Finance Limited not recovering as agreed. I also authorize Xtenda Finance Limited to take necessary legal action against me should this 
                                    advance I am applying for go into arrears for any reason arising from my failure to honour this advance agreement. 
                                </p>
                                
                                {/* Signature and Date Section - Inline Layout */}
                                <div className="flex items-end mt-12 gap-12 justify-start">
                                    <div className="flex items-end w-[35%] gap-2">
                                        <span className="text-xs font-bold uppercase mb-1 whitespace-nowrap">Signature</span>
                                        <div className="border-b border-black flex-grow relative h-8">
                                             {application.signature && (
                                                 <img 
                                                    src={application.signature} 
                                                    alt="Signature" 
                                                    className="h-12 object-contain absolute bottom-0 left-0" 
                                                 />
                                             )}
                                        </div>
                                    </div>
                                    <div className="flex items-end w-[25%] gap-2">
                                         <span className="text-xs font-bold uppercase mb-1 whitespace-nowrap">Date</span>
                                         <div className="border-b border-black flex-grow mb-1 pl-2 text-xs font-medium">
                                            {application.dateOfApplication}
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// FIX: Making children optional to satisfy the compiler, which seems to be incorrectly reporting an error.
const DataSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">{title}</h3>
        <dl className="space-y-3">{children}</dl>
    </div>
);

const DataItem = ({ label, value, isHighlight = false }: { label: string, value?: string | React.ReactNode, isHighlight?: boolean }) => (
    <div className={`flex justify-between items-start gap-4 ${isHighlight ? 'bg-orange-50 p-2 rounded-md' : ''}`}>
        <dt className="text-sm font-medium text-gray-500 shrink-0">{label}:</dt>
        <dd className="text-sm text-gray-900 text-right font-semibold break-words">{value || <span className="text-gray-400 font-normal">N/A</span>}</dd>
    </div>
);

const StatusBadge = ({ current, target }: { current: string, target: string }) => {
    const isActive = current === target;
    const colorClasses = {
        'New': { text: 'text-blue-700', bg: 'bg-blue-100' },
        'Under Review': { text: 'text-yellow-700', bg: 'bg-yellow-100' },
        'Approved': { text: 'text-green-700', bg: 'bg-green-100' },
        'Rejected': { text: 'text-red-700', bg: 'bg-red-100' },
    };
    const colors = colorClasses[target as keyof typeof colorClasses] || { text: 'text-gray-700', bg: 'bg-gray-100' };

    return (
        <span className={`px-3 py-1 text-xs font-bold rounded-full ${isActive ? `${colors.text} ${colors.bg}`: 'text-gray-400 bg-gray-100'}`}>
            {target}
        </span>
    )
};


const StatusButton = ({ current, target, onClick }: { current: string, target: string, onClick: () => void }) => {
    const isDisabled = current === target;
     const colorClasses = {
        'Under Review': 'bg-yellow-500 hover:bg-yellow-600',
        'Approved': 'bg-green-600 hover:bg-green-700',
        'Rejected': 'bg-red-600 hover:bg-red-700',
    };
     const color = colorClasses[target as keyof typeof colorClasses] || 'bg-gray-500';

    return (
        <button 
            onClick={onClick}
            disabled={isDisabled}
            className={`flex-1 p-2 rounded-md text-sm font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
        >
            {target}
        </button>
    );
};

const AttachmentPreview = ({ title, src, isPdf = false }: { title: string, src?: string, isPdf?: boolean }) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    if (!src) {
        return (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-600">{title}</p>
                <p className="text-xs text-gray-400 mt-1">Not Provided</p>
            </div>
        );
    }
    
    const content = isPdf ? (
         <a href={src} target="_blank" rel="noopener noreferrer" className="block text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition h-full flex flex-col justify-center items-center">
            <i className="fa-solid fa-file-pdf text-4xl text-red-500 mb-2"></i>
            <p className="text-sm font-semibold text-gray-600">{title}</p>
            <p className="text-xs text-red-500 mt-1 font-bold">View PDF</p>
        </a>
    ) : (
        <div onClick={() => setIsModalOpen(true)} className="cursor-pointer text-center group">
            <img src={src} alt={title} loading="lazy" className="w-full h-24 object-contain bg-gray-50 rounded-lg border p-1 group-hover:shadow-md transition" />
            <p className="text-sm font-semibold text-gray-600 mt-2">{title}</p>
        </div>
    );

    return (
        <>
            {content}
            {isModalOpen && !isPdf && (
                <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <img src={src} alt={title} className="max-h-[90vh] max-w-[90vw] object-contain" />
                     <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white text-3xl">&times;</button>
                </div>
            )}
        </>
    );
};

export default AdminView;