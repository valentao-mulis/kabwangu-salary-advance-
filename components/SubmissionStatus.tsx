import React from 'react';
import { firestore } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { ApplicationFormData } from '../types';

interface SubmissionStatusProps {
    applicationId: string;
    onReview: () => void;
    onHome: () => void;
}

const StatusDisplayConfig = {
    'New': {
        icon: 'fa-solid fa-circle-check',
        color: 'green',
        title: 'Application Submitted Successfully',
        message: "Your application has been successfully submitted and is now under review."
    },
    'Under Review': {
        icon: 'fa-solid fa-magnifying-glass',
        color: 'yellow',
        title: 'Under Review',
        message: "Your application is currently being reviewed by our team. We're checking the details you provided."
    },
    'Approved': {
        icon: 'fa-solid fa-circle-check',
        color: 'green',
        title: 'Loan Approved!',
        message: 'Congratulations! Your salary advance has been approved. The funds will be disbursed to your account shortly.'
    },
    'Rejected': {
        icon: 'fa-solid fa-circle-xmark',
        color: 'red',
        title: 'Application Declined',
        message: 'After careful consideration, we are unable to approve your application at this time. Please contact us for more details.'
    }
};

const SubmissionStatus = ({ applicationId, onReview, onHome }: SubmissionStatusProps) => {
    const [application, setApplication] = React.useState<ApplicationFormData | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [copySuccess, setCopySuccess] = React.useState(false);

    React.useEffect(() => {
        // 1. Load from cache immediately for instant feedback
        try {
            const cachedData = localStorage.getItem(`xtenda_app_${applicationId}`);
            if (cachedData) {
                setApplication(JSON.parse(cachedData));
            }
        } catch (e) {
            console.warn("Failed to load cached application");
        }

        // 2. Subscribe to live updates
        const docRef = doc(firestore, 'applications', applicationId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as ApplicationFormData;
                setApplication(data);
                setError(null);
                
                // Update cache safely
                try {
                    const cache = new Set();
                    const json = JSON.stringify(data, (key, value) => {
                        if (typeof value === 'object' && value !== null) {
                            if (cache.has(value)) return;
                            cache.add(value);
                        }
                        return value;
                    });
                    localStorage.setItem(`xtenda_app_${applicationId}`, json);
                } catch (e) {
                    console.warn("Failed to cache application status", e);
                }
            } else {
                setError("We couldn't find an application with this ID. It may have been deleted or the link is incorrect.");
                setApplication(null);
            }
        }, (err) => {
            console.error("Error fetching application status:", err);
            setError("There was a problem fetching your application status. Please check your connection and try again.");
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [applicationId]);

    const handleNewApplication = () => {
        // Navigate to the home page using internal routing for instant load
        onHome();
    };

    const handleReviewSubmission = () => {
        onReview();
    };
    
    const handleCopyId = () => {
        navigator.clipboard.writeText(applicationId).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const renderContent = () => {
        if (!application && !error) {
             return (
                <div className="text-center py-20">
                    <i className="fa-solid fa-circle-notch fa-spin text-5xl text-gray-300 mb-4"></i>
                    <p className="text-xl text-gray-600">Loading Application Status...</p>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="text-center py-20">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-exclamation-triangle text-5xl text-red-500"></i>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-4">Error</h2>
                    <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
                    <button 
                        onClick={handleNewApplication}
                        className="text-orange-600 hover:text-orange-800 font-bold underline"
                    >
                        Back to Home
                    </button>
                </div>
            );
        }

        if (application) {
            const statusKey = application.status || 'New';
            const config = StatusDisplayConfig[statusKey];
            const colorClasses = {
                'blue': { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
                'yellow': { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
                'green': { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
                'red': { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
            }[config.color];


            return (
                 <div className="text-center">
                    <div className={`w-24 h-24 ${colorClasses.bg} rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in`}>
                        <i className={`${config.icon} text-5xl ${colorClasses.text}`}></i>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-4">{config.title}</h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
                        {config.message}
                    </p>
                    <div className={`p-4 ${colorClasses.bg} border-t-4 ${colorClasses.border} rounded-lg`}>
                        <p className="text-sm text-gray-500">Applicant:</p>
                        <p className="font-bold text-gray-800 text-lg">{`${application.firstName || ''} ${application.surname || ''}`.trim()}</p>
                        
                        <div className="mt-4 pt-4 border-t border-black/10">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Application ID</p>
                            <div className="flex items-center justify-center gap-2">
                                <code className="bg-white/50 px-2 py-1 rounded border font-mono text-gray-700">{application.id}</code>
                                <button 
                                    onClick={handleCopyId} 
                                    className="text-gray-500 hover:text-gray-800 transition relative"
                                    title="Copy ID"
                                >
                                    <i className={`fa-solid ${copySuccess ? 'fa-check text-green-600' : 'fa-copy'}`}></i>
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Save this ID to check your status later.</p>
                        </div>
                    </div>
                     <div className="mt-8">
                        <button
                            onClick={handleReviewSubmission}
                            className="text-sm text-gray-600 hover:text-orange-600 font-semibold underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                        >
                            Review My Submission Details
                        </button>
                    </div>
                </div>
            );
        }
        
        return null;
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-4">
             <section className="my-16 p-8 bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl animate-fade-in relative">
                 <button 
                    onClick={onHome} 
                    className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 flex items-center gap-1 text-sm font-medium transition"
                >
                     <i className="fa-solid fa-arrow-left"></i> Back to Home
                 </button>
                {renderContent()}
                 <div className="mt-12 text-center border-t pt-8">
                    <button
                      onClick={handleNewApplication}
                      className="bg-orange-500 text-white font-bold py-3 px-10 rounded-full hover:bg-orange-600 transition duration-300 shadow-md"
                    >
                        Start New Application
                    </button>
                 </div>
             </section>
        </div>
    );
};

export default SubmissionStatus;