
import React from 'react';
import { firestore } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ApplicationFormData } from '../types';

interface CheckStatusProps {
    onNavigate: (page: any) => void;
    onCheckStatus: (id: string) => void;
}

// Safe stringify helper
const safeStringify = (obj: any) => {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) {
                return; // Duplicate reference found
            }
            cache.add(value);
        }
        return value;
    });
};

const CheckStatus = ({ onNavigate, onCheckStatus }: CheckStatusProps) => {
  const [nrc, setNrc] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<Partial<ApplicationFormData> & { id: string } | null>(null);

  const handleNrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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

    setNrc(formatted);
    if(error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNrc = nrc.trim();
    
    if (!cleanNrc) {
      setError('Please enter a valid NRC Number.');
      return;
    }
    
    // Reset error, keep preview if exists to prevent flashing
    setError('');
    setIsLoading(true);

    // 1. INSTANT CHECK: Look in local cache first and display immediately
    try {
        const cachedId = localStorage.getItem(`xtenda_nrc_map_${cleanNrc}`);
        if (cachedId) {
            const cachedAppStr = localStorage.getItem(`xtenda_app_${cachedId}`);
            if (cachedAppStr) {
                 const cachedApp = JSON.parse(cachedAppStr);
                 setPreviewData(cachedApp);
                 // Do NOT return here. Continue to fetch fresh data.
            }
        }
    } catch (e) {
        // Ignore storage errors
    }

    try {
        // 2. NETWORK CHECK: Query for fresh data
        const q = query(
            collection(firestore, 'applications'),
            where('nrc', '==', cleanNrc)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // Find the most recent application client-side
            const docs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as (Partial<ApplicationFormData> & { id: string })[];
            
            // Sort by createdAt desc if available, or submittedAt
            docs.sort((a: any, b: any) => {
                const dateA = a.createdAt?.seconds || (a.submittedAt ? new Date(a.submittedAt).getTime() / 1000 : 0);
                const dateB = b.createdAt?.seconds || (b.submittedAt ? new Date(b.submittedAt).getTime() / 1000 : 0);
                return dateB - dateA;
            });

            const foundApp = docs[0];
            const appId = foundApp.id;
            
            // 3. CACHE RESULT: Save fresh data for next time
            try {
                localStorage.setItem(`xtenda_nrc_map_${cleanNrc}`, appId);
                localStorage.setItem(`xtenda_app_${appId}`, safeStringify(foundApp));
            } catch (e) {
                console.warn("Failed to cache NRC map", e);
            }

            // Update state with fresh data
            setPreviewData(foundApp);
        } else {
            // If server says nothing found, but we had a preview, we must clear it (it might have been deleted)
            if (previewData) {
                setPreviewData(null);
            }
            setError('No application found with this NRC number. Please check the number or apply for a new loan.');
        }
    } catch (err) {
        console.error("Error searching by NRC:", err);
        setError('An error occurred while searching. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const getStatusColor = (status?: string) => {
      switch(status) {
          case 'Approved': return 'text-green-600 bg-green-100 border-green-200';
          case 'Rejected': return 'text-red-600 bg-red-100 border-red-200';
          case 'Under Review': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
          default: return 'text-blue-600 bg-blue-100 border-blue-200';
      }
  };

  const getStatusIcon = (status?: string) => {
      switch(status) {
          case 'Approved': return 'fa-circle-check';
          case 'Rejected': return 'fa-circle-xmark';
          case 'Under Review': return 'fa-hourglass-half';
          default: return 'fa-file-circle-check';
      }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 my-12 animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 leading-tight mb-4">
          <span className="text-orange-500">My Loan Status</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Enter your NRC Number below to check the current status of your salary advance.
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-600 to-orange-500 rounded-2xl shadow-xl p-8 md:p-12 max-w-lg mx-auto border border-orange-400 text-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nrc" className="block text-sm font-bold text-white mb-2">
              NRC Number
            </label>
            <div className="relative">
              <input
                id="nrc"
                type="text"
                value={nrc}
                onChange={handleNrcChange}
                placeholder="e.g. 123456/10/1"
                maxLength={11}
                className="w-full p-4 pl-12 border border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-white text-lg bg-white/10 text-white placeholder-white/60 backdrop-blur-sm"
              />
              <i className="fa-solid fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-white/80 text-lg"></i>
            </div>
            {error && <div className="bg-red-500/20 text-white p-3 rounded-lg text-sm mt-2 font-medium border border-red-400/50 flex items-center gap-2"><i className="fa-solid fa-triangle-exclamation"></i> {error}</div>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-orange-600 font-extrabold py-4 px-6 rounded-xl hover:bg-orange-50 transition duration-300 text-lg shadow-lg flex items-center justify-center gap-2 transform active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-magnifying-glass"></i> Check Status</>}
          </button>
        </form>

        {/* Status Preview Card */}
        {previewData && (
             <div className="mt-8 animate-fade-in-up">
                <div className={`p-5 rounded-xl border-2 ${getStatusColor(previewData.status).split(' ')[2]} bg-white shadow-lg`}>
                    <div className="flex items-start gap-4">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getStatusColor(previewData.status).split(' ')[1]}`}>
                             <i className={`fa-solid ${getStatusIcon(previewData.status)} text-2xl ${getStatusColor(previewData.status).split(' ')[0]}`}></i>
                         </div>
                         <div className="flex-1 text-gray-800">
                             <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Status</p>
                             <h3 className={`text-xl font-extrabold ${getStatusColor(previewData.status).split(' ')[0]}`}>
                                 {previewData.status || 'Received'}
                             </h3>
                             <p className="text-gray-700 mt-2 text-sm">
                                 Hi <span className="font-bold">{previewData.firstName}</span>, 
                                 {previewData.status === 'Approved' 
                                    ? ` great news! Your loan of K${previewData.loanDetails?.amount?.toLocaleString() ?? '...'} has been approved.`
                                    : previewData.status === 'Rejected'
                                    ? ` your application has been declined.`
                                    : ` your application for K${previewData.loanDetails?.amount?.toLocaleString() ?? '...'} is currently being reviewed.`
                                 }
                             </p>
                         </div>
                    </div>
                    
                    <button 
                        onClick={() => onCheckStatus(previewData.id)}
                        className="w-full mt-4 bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition flex items-center justify-center gap-2"
                    >
                        View Full Details <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        )}

        <div className="mt-8 pt-8 border-t border-dashed border-white/30 text-center">
            <p className="text-white/80 text-sm mb-2">Have a question?</p>
            <button 
                onClick={() => onNavigate('contact')}
                className="text-white font-bold hover:text-orange-100 hover:underline flex items-center justify-center gap-2 mx-auto"
            >
                <i className="fa-solid fa-headset"></i> Contact Support
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CheckStatus;
