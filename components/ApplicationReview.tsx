import React from 'react';
import { firestore } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { ApplicationFormData } from '../types';

interface ApplicationReviewProps {
    applicationId: string;
    onBack: () => void;
}

const ApplicationReview = ({ applicationId, onBack }: ApplicationReviewProps) => {
    const [application, setApplication] = React.useState<ApplicationFormData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchApplication = async () => {
            try {
                const docRef = doc(firestore, 'applications', applicationId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setApplication({ id: docSnap.id, ...docSnap.data() } as ApplicationFormData);
                } else {
                    setError("Application not found.");
                }
            } catch (err) {
                setError("Failed to load application data.");
            } finally {
                setLoading(false);
            }
        };
        fetchApplication();
    }, [applicationId]);
    
    const renderField = (label: string, value: any) => (
        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-start">
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value ? value : <span className="text-gray-400">Not provided</span>}</dd>
        </div>
    );
    
    const renderSection = (title: string, children: React.ReactNode) => (
        <div className="py-4">
            <h3 className="text-lg font-bold text-orange-600 mb-2 border-b pb-2">{title}</h3>
            <dl className="divide-y divide-gray-200">
                {children}
            </dl>
        </div>
    );

    const renderBody = () => {
        if (loading) {
            return (
                <div className="p-12 text-center">
                    <i className="fa-solid fa-circle-notch fa-spin text-4xl text-gray-400"></i>
                </div>
            );
        }

        if (error || !application) {
            return (
                <div className="p-12 text-center">
                    <i className="fa-solid fa-triangle-exclamation text-5xl text-red-400 mb-4"></i>
                    <h2 className="text-2xl font-bold">Error</h2>
                    <p className="text-gray-600 mt-2">{error || 'Could not load application.'}</p>
                </div>
            );
        }
        
        return (
             <div className="p-6">
                {renderSection('PERSONAL DETAILS', (
                    <>
                        {renderField('Full Names', `${application.firstName || ''} ${application.surname || ''}`.trim())}
                        {renderField('NRC', application.nrc)}
                        {renderField('Employee Number', application.employeeNumber)}
                        {renderField('Employer', application.employer)}
                        {renderField('Phone', application.phone)}
                        {renderField('Email', application.email)}
                        {renderField('Employment Address', application.employmentAddress)}
                        {renderField('Employment Terms', application.employmentTerms)}
                    </>
                ))}

                {renderSection('NEXT OF KIN DETAILS', (
                    <>
                        {renderField('Full Names', application.kinFullNames)}
                        {renderField('NRC', application.kinNrc)}
                        {renderField('Relationship', application.kinRelationship)}
                        {renderField('Phone', application.kinPhone)}
                        {renderField('Residential Address', application.kinResidentialAddress)}
                    </>
                ))}

                {renderSection('SALARY BANK DETAILS', (
                    <>
                        {renderField('Bank Name', application.bankName)}
                        {renderField('Branch Name', application.branchName)}
                        {renderField('Account Number', application.accountNumber)}
                        {renderField('Account Names', application.accountNames)}
                    </>
                ))}
                
                 {renderSection('ADVANCE DETAILS', (
                    <>
                        {renderField('Purpose for Advance', application.loanPurpose)}
                        {renderField('Source of Repayment', application.sourceOfRepayment)}
                        {renderField('Advance Amount (ZMW)', `K${application.loanDetails?.amount?.toLocaleString()}`)}
                        {renderField('Monthly Installment', `K${application.loanDetails?.monthlyPayment?.toLocaleString()}`)}
                        {renderField('Advance Tenure', `${application.loanDetails?.months} Months`)}
                    </>
                ))}

                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 mt-4">
                    <dt className="text-sm font-medium text-gray-500">Attachments</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 space-y-4">
                        <div>
                            <p className="font-medium text-xs text-gray-400 mb-1">NRC (Front)</p>
                            {application.nrcImageFront ? (
                                <img src={application.nrcImageFront} alt="NRC Front" className="h-40 w-auto border rounded bg-gray-50 p-1" />
                            ) : (
                                <span className="text-gray-400">Not provided</span>
                            )}
                        </div>
                            <div>
                            <p className="font-medium text-xs text-gray-400 mb-1">NRC (Back)</p>
                            {application.nrcImageBack ? (
                                <img src={application.nrcImageBack} alt="NRC Back" className="h-40 w-auto border rounded bg-gray-50 p-1" />
                            ) : (
                                <span className="text-gray-400">Not provided</span>
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-xs text-gray-400 mb-1">Payslip</p>
                            {application.latestPayslip ? (
                                <a href={application.latestPayslip} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium flex items-center gap-2">
                                    View Payslip <i className="fa-solid fa-external-link-alt text-xs"></i>
                                </a>
                            ) : (
                                    <span className="text-gray-400">Not provided</span>
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-xs text-gray-400 mb-1">Signature</p>
                            {application.signature ? (
                                <img src={application.signature} alt="Signature" className="h-20 w-auto border rounded bg-gray-50 p-1" />
                            ) : (
                                <span className="text-gray-400">Not signed</span>
                            )}
                        </div>
                    </dd>
                </div>
              </div>
        );
    };
    
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
          <div className="max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                    <i className="fa-solid fa-arrow-left"></i> Back to Status Page
                </button>
            </header>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-800">Reviewing Your Submission</h2>
                <p className="text-gray-500">This is a read-only copy of the data we received.</p>
              </div>
              {renderBody()}
            </div>
          </div>
        </div>
    );
};

export default ApplicationReview;