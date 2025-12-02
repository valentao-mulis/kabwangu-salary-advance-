import React from 'react';
import Header from './components/Header';
import WhyChooseUs from './components/WhyChooseUs';
import SalaryCalculator from './components/SalaryCalculator';
import ApplicationForm from './components/ApplicationForm';
import ContactButtons from './components/ContactButtons';
import Footer from './components/Footer';
import AdminView from './components/AdminView';
import AdminDashboard from './components/AdminDashboard';
import Chatbot from './components/Chatbot';
import InstallPrompt from './components/InstallPrompt';
import RemoteUpload from './components/RemoteUpload';
import SubmissionStatus from './components/SubmissionStatus';
import ApplicationReview from './components/ApplicationReview';
import AboutUs from './components/AboutUs';
import CheckStatus from './components/CheckStatus';
import EmployersList from './components/EmployersList';
import { ScheduleEntry } from './types';


type PageView = 'home' | 'apply' | 'contact' | 'about' | 'check-status' | 'employers';
type ViewState = PageView | 'admin_dashboard' | 'admin_view_application';

const AdminLoginModal = ({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [code, setCode] = React.useState('');
    const [error, setError] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        // Auto-focus the input field when the modal opens
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code === '8253') {
            onSuccess();
        } else {
            setError('Incorrect code. Please try again.');
            setCode('');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-modal-fade" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-800">
                    <i className="fa-solid fa-times text-2xl"></i>
                </button>

                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Admin Access</h2>
                <p className="text-gray-600 text-center mb-6">Please enter the access code to continue.</p>

                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="password"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value);
                            setError(''); // Clear error on type
                        }}
                        maxLength={4}
                        className={`w-full p-4 border rounded-lg text-2xl font-semibold text-center tracking-[1em] ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-orange-500'}`}
                        placeholder="----"
                    />
                    {error && <p className="text-red-600 text-sm text-center mt-2">{error}</p>}
                    <button
                        type="submit"
                        className="w-full mt-6 bg-orange-500 text-white font-bold py-3 rounded-lg text-lg hover:bg-orange-600 transition duration-300"
                    >
                        Unlock
                    </button>
                </form>
            </div>
        </div>
    );
};


const App = () => {
  // --- HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS ---
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<ViewState>('home');
  const [selectedApplicationId, setSelectedApplicationId] = React.useState<string | null>(null);
  const [loanSummary, setLoanSummary] = React.useState({ amount: 0, months: 0, monthlyPayment: 0 });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = React.useState(false);

  // State for application status/review pages
  const [viewedAppId, setViewedAppId] = React.useState<string | null>(null);
  const [isReviewing, setIsReviewing] = React.useState(false);
  
  const initialSchedule: ScheduleEntry[] = [
    { disbursedAmount: 500, installments: { 1: 664, 2: 357, 3: 243, 4: 194, 5: 161, 6: 189 } },
    { disbursedAmount: 600, installments: { 1: 780, 2: 420, 3: 285, 4: 228, 5: 189, 6: 213 } },
    { disbursedAmount: 700, installments: { 1: 896, 2: 472, 3: 328, 4: 261, 5: 217, 6: 237 } },
    { disbursedAmount: 800, installments: { 1: 1012, 2: 533, 3: 370, 4: 295, 5: 245, 6: 262 } },
    { disbursedAmount: 900, installments: { 1: 1129, 2: 594, 3: 412, 4: 329, 5: 273, 6: 286 } },
    { disbursedAmount: 1000, installments: { 1: 1245, 2: 665, 3: 455, 4: 363, 5: 301, 6: 310 } },
    { disbursedAmount: 1500, installments: { 1: 1825, 2: 961, 3: 667, 4: 533, 5: 442, 6: 431 } },
    { disbursedAmount: 2000, installments: { 1: 2406, 2: 1266, 3: 879, 4: 702, 5: 582, 6: 552 } },
    { disbursedAmount: 2500, installments: { 1: 2986, 2: 1572, 3: 1091, 4: 872, 5: 723, 6: 673 } },
    { disbursedAmount: 3000, installments: { 1: 3567, 2: 1878, 3: 1303, 4: 1041, 5: 863, 6: 795 } },
    { disbursedAmount: 3500, installments: { 1: 4147, 2: 2183, 3: 1515, 4: 1211, 5: 1004, 6: 916 } },
    { disbursedAmount: 4000, installments: { 1: 4728, 2: 2489, 3: 1728, 4: 1380, 5: 1145, 6: 1037 } },
    { disbursedAmount: 4500, installments: { 1: 5309, 2: 2794, 3: 1940, 4: 1550, 5: 1285, 6: 1158 } },
    { disbursedAmount: 5000, installments: { 1: 5889, 2: 3100, 3: 2152, 4: 1719, 5: 1426, 6: 1279 } },
    { disbursedAmount: 5500, installments: { 1: 6470, 2: 3406, 3: 2364, 4: 1889, 5: 1566, 6: 1400 } },
    { disbursedAmount: 6000, installments: { 1: 7050, 2: 3711, 3: 2579, 4: 2059, 5: 1707, 6: 1521 } },
    { disbursedAmount: 6500, installments: { 1: 7634, 2: 4024, 3: 2792, 4: 2228, 5: 1848, 6: 1642 } },
    { disbursedAmount: 7000, installments: { 1: 8215, 2: 4329, 3: 3004, 4: 2398, 5: 1988, 6: 1764 } },
    { disbursedAmount: 7500, installments: { 1: 8796, 2: 4636, 3: 3216, 4: 2567, 5: 2129, 6: 1885 } },
    { disbursedAmount: 8000, installments: { 1: 9377, 2: 4942, 3: 3429, 4: 2737, 5: 2269, 6: 2006 } },
    { disbursedAmount: 8500, installments: { 1: 9958, 2: 5248, 3: 3641, 4: 2906, 5: 2410, 6: 2127 } },
    { disbursedAmount: 9000, installments: { 1: 10538, 2: 5554, 3: 3854, 4: 3064, 5: 2541, 6: 2248 } },
    { disbursedAmount: 9500, installments: { 1: 11119, 2: 5860, 3: 4066, 4: 3233, 5: 2681, 6: 2369 } },
    { disbursedAmount: 10000, installments: { 1: 11700, 2: 6166, 3: 4278, 4: 3402, 5: 2821, 6: 2490 } },
  ];

  const [schedule, setSchedule] = React.useState<ScheduleEntry[]>(() => {
    try {
        const savedSchedule = localStorage.getItem('xtenda_schedule');
        return savedSchedule ? JSON.parse(savedSchedule) : initialSchedule;
    } catch(e) {
        return initialSchedule;
    }
  });

  React.useEffect(() => {
    // This effect runs once on mount to check URL params
    const urlParams = new URLSearchParams(window.location.search);
    const applicationId = urlParams.get('applicationId');
    const reviewMode = urlParams.get('review') === 'true';
    const viewParam = urlParams.get('view');

    if (applicationId) {
        setViewedAppId(applicationId);
        if (reviewMode) {
            setIsReviewing(true);
        }
    } else if (viewParam) {
        // Handle deep linking for specific views
        if (viewParam === 'calculator') {
            setCurrentView('home');
            // Slight delay to ensure render finishes before scroll
            setTimeout(() => {
                const calculator = document.getElementById('calculator');
                if (calculator) {
                    calculator.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        } else if (['employers', 'check-status', 'contact', 'apply', 'about'].includes(viewParam)) {
            setCurrentView(viewParam as PageView);
        }
    }
  }, []);
  
  // --- END HOOKS ---

  const handleAdminToggle = () => {
      setIsAdminLoginOpen(true);
  };

  const handleAdminLoginSuccess = () => {
      setIsAdmin(true);
      setCurrentView('admin_dashboard');
      setIsAdminLoginOpen(false);
  };
  
  const handleSelectApplication = (id: string) => {
      setSelectedApplicationId(id);
      setCurrentView('admin_view_application');
  };

  const handleExitAdmin = () => {
      setIsAdmin(false);
      setCurrentView('home');
      setSelectedApplicationId(null);
      // Clean up URL
      try {
        const newUrl = new URL(window.location.href);
        newUrl.search = '';
        window.history.pushState({}, '', newUrl.toString());
      } catch (e) {}
  };

  const handleApplicationSuccess = (id: string) => {
      // Switch view immediately without reload
      setViewedAppId(id);
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('applicationId', id);
        // Remove view param if it exists to avoid confusion
        newUrl.searchParams.delete('view');
        window.history.pushState({}, '', newUrl.toString());
      } catch (e) {
        // Fallback or silence error if pushState fails in restricted env
        console.warn('Could not update URL history:', e);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCheckStatus = (id: string) => {
      handleApplicationSuccess(id);
  }

  const handleBackToHome = () => {
      setViewedAppId(null);
      setIsReviewing(false);
      setSelectedApplicationId(null);
      
      try {
          const newUrl = new URL(window.location.href);
          newUrl.search = ''; // Clear all params
          window.history.pushState({}, '', newUrl.toString());
      } catch (e) {
          console.warn('Could not update URL history:', e);
      }
      
      setCurrentView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScheduleChange = (newSchedule: ScheduleEntry[]) => {
    setSchedule(newSchedule);
    localStorage.setItem('xtenda_schedule', JSON.stringify(newSchedule));
  };

  const navigateTo = (view: any) => {
      if (view === 'calculator') {
          setCurrentView('home');
          // Update URL for sharing
          try {
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set('view', 'calculator');
              window.history.pushState({}, '', newUrl.toString());
          } catch(e) {}

          setTimeout(() => {
              const calculator = document.getElementById('calculator');
              if (calculator) {
                  calculator.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
          }, 100);
      } else {
          setCurrentView(view);
          // Update URL for sharing
          try {
              const newUrl = new URL(window.location.href);
              if (view === 'home') {
                  newUrl.search = '';
              } else {
                  newUrl.searchParams.set('view', view);
              }
              // Clear app ID if navigating away
              newUrl.searchParams.delete('applicationId');
              window.history.pushState({}, '', newUrl.toString());
          } catch(e) {}
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };
  
  // -- CONDITIONAL RENDERING STARTS HERE --
  
  // Simple routing based on URL path for special pages
  if (window.location.pathname === '/upload') {
    return <RemoteUpload />;
  }

  // Show submission status or review page if an ID is present
  if (viewedAppId) {
      if (isReviewing) {
          const handleBackToStatus = () => {
              // Update URL safely
              try {
                  const newParams = new URLSearchParams(window.location.search);
                  newParams.delete('review');
                  const newUrl = new URL(window.location.href);
                  newUrl.search = newParams.toString();
                  window.history.pushState({}, '', newUrl.toString());
              } catch (e) { console.warn("Nav update failed", e) }
              
              setIsReviewing(false); 
          };
          return <ApplicationReview applicationId={viewedAppId} onBack={handleBackToStatus} />;
      }
      
      const handleGoToReview = () => {
        try {
            const newParams = new URLSearchParams(window.location.search);
            newParams.set('review', 'true');
            const newUrl = new URL(window.location.href);
            newUrl.search = newParams.toString();
            window.history.pushState({}, '', newUrl.toString());
        } catch (e) { console.warn("Nav update failed", e) }
        
        setIsReviewing(true);
      };
      
      return (
        <SubmissionStatus 
            applicationId={viewedAppId} 
            onReview={handleGoToReview} 
            onHome={handleBackToHome}
        />
      );
  }
  
  // Render admin views first as they override other logic
  if (isAdmin) {
      if (currentView === 'admin_dashboard') {
          return <AdminDashboard onSelectApplication={handleSelectApplication} onExitAdmin={handleExitAdmin} />;
      } 
      if (currentView === 'admin_view_application' && selectedApplicationId) {
          return <AdminView applicationId={selectedApplicationId} onBack={() => { setCurrentView('admin_dashboard'); setSelectedApplicationId(null); }} />;
      }
  }

  const renderContent = () => {
      switch (currentView) {
          case 'apply':
              return <ApplicationForm 
                loanSummary={loanSummary} 
                schedule={schedule} 
                onSubmitSuccess={handleApplicationSuccess}
              />;
          case 'contact':
              return <ContactButtons />;
          case 'about':
              return <AboutUs />;
          case 'check-status':
              return <CheckStatus onNavigate={navigateTo} onCheckStatus={handleCheckStatus} />;
          case 'employers':
              return <EmployersList onNavigate={navigateTo} />;
          case 'home':
          default:
              return (
                  <>
                      <section className="text-center my-12 md:my-20 px-4 animate-fade-in">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-green-700 leading-tight mb-6">
                          Need Cash? Get a <span className="text-orange-500">Ka Bwangu Bwangu</span> Salary Advance!
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                          Flexible repayments, competitive rates, and instant disbursement to your account.
                        </p>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mx-auto">
                            <button 
                                onClick={() => navigateTo('apply')}
                                className="w-full md:w-auto bg-green-600 text-white font-bold py-4 px-10 rounded-full hover:bg-green-700 transition duration-300 text-lg shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                              Apply Now <i className="fa-solid fa-arrow-right"></i>
                            </button>
                            <button 
                                onClick={() => navigateTo('check-status')}
                                className="w-full md:w-auto bg-orange-100 text-green-700 border-2 border-green-600 font-bold py-4 px-10 rounded-full hover:bg-orange-200 transition duration-300 text-lg shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                              <i className="fa-solid fa-magnifying-glass"></i> My Loan Status
                            </button>
                        </div>
                      </section>

                      <WhyChooseUs />
                      
                      <SalaryCalculator 
                          schedule={schedule} 
                          isAdmin={isAdmin} 
                          onScheduleChange={handleScheduleChange}
                          onLoanChange={setLoanSummary}
                          onNavigate={navigateTo}
                      />
                  </>
              );
      }
  };

  return (
    <div className="font-sans">
      {isAdminLoginOpen && (
        <AdminLoginModal 
            onClose={() => setIsAdminLoginOpen(false)} 
            onSuccess={handleAdminLoginSuccess} 
        />
      )}
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 to-green-50">
        {!isAdmin && (
            <Header 
                onNavigate={navigateTo} 
                currentView={currentView as PageView} 
                onAdminToggle={handleAdminToggle}
            />
        )}
        
        <main className={`flex-grow w-full ${!isAdmin ? 'py-8' : ''}`}>
          {renderContent()}
        </main>

        {!isAdmin && <Footer onAdminToggle={handleAdminToggle} onNavigate={navigateTo} />}
      </div>
      
      {!isAdmin && <Chatbot schedule={schedule} />}
      <InstallPrompt />
      <style>{`
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-modal-fade { animation: modalFade 0.3s ease-out; }
        @keyframes modalFade { from { opacity: 0; } to { opacity: 1; } }
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
        }
      `}</style>
    </div>
  );
};

export default App;