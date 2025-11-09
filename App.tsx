import React from 'react';
import Header from './components/Header';
import HowItWorks from './components/HowItWorks';
import SalaryCalculator from './components/SalaryCalculator';
import ApplicationForm from './components/ApplicationForm';
import ContactButtons from './components/ContactButtons';
import Footer from './components/Footer';
import AdminView from './components/AdminView';
import AdminDashboard from './components/AdminDashboard';
import Chatbot from './components/Chatbot';
import InstallPrompt from './components/InstallPrompt';

declare var pako: any;

type PageView = 'home' | 'apply' | 'contact';
type ViewState = PageView | 'admin_dashboard' | 'admin_view_application';

const App = () => {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<ViewState>('home');
  const [selectedApplication, setSelectedApplication] = React.useState(null);
  // Lifted state for loan details to share between Calculator and Application Form
  const [loanSummary, setLoanSummary] = React.useState({ amount: 0, months: 0, monthlyPayment: 0 });

  React.useEffect(() => {
    const processHashData = () => {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            // Legacy support for hash-based links if needed
            let viewData = hash.substring(1);
            try {
                viewData = viewData.replace(/-/g, '+').replace(/_/g, '/');
                const binaryString = atob(viewData);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                const jsonString = pako.inflate(bytes, { to: 'string' });
                const data = JSON.parse(jsonString);
                setSelectedApplication(data);
                setCurrentView('admin_view_application');
                setIsAdmin(true);
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
            } catch (error) {
                console.error("Failed to parse application data from hash:", error);
                window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
            }
        }
    };
    processHashData();
    window.addEventListener('hashchange', processHashData, false);
    return () => window.removeEventListener('hashchange', processHashData, false);
  }, []);

  const handleAdminToggle = () => {
      setIsAdmin(true);
      setCurrentView('admin_dashboard');
  };

  const handleExitAdmin = () => {
      setIsAdmin(false);
      setCurrentView('home');
      setSelectedApplication(null);
  };

  const initialSchedule = [
    { disbursedAmount: 500, installments: { 1: 664, 2: 357, 3: 243, 4: 194, 5: 161, 6: 189 } }, { disbursedAmount: 600, installments: { 1: 780, 2: 420, 3: 285, 4: 228, 5: 189, 6: 213 } }, { disbursedAmount: 700, installments: { 1: 896, 2: 472, 3: 328, 4: 261, 5: 217, 6: 237 } }, { disbursedAmount: 800, installments: { 1: 1012, 2: 533, 3: 370, 4: 295, 5: 245, 6: 262 } }, { disbursedAmount: 900, installments: { 1: 1129, 2: 594, 3: 412, 4: 329, 5: 273, 6: 286 } }, { disbursedAmount: 1000, installments: { 1: 1245, 2: 665, 3: 455, 4: 363, 5: 301, 6: 310 } }, { disbursedAmount: 1500, installments: { 1: 1825, 2: 961, 3: 667, 4: 533, 5: 442, 6: 431 } }, { disbursedAmount: 2000, installments: { 1: 2406, 2: 1266, 3: 879, 4: 702, 5: 582, 6: 552 } }, { disbursedAmount: 2500, installments: { 1: 2986, 2: 1572, 3: 1091, 4: 872, 5: 723, 6: 673 } }, { disbursedAmount: 3000, installments: { 1: 3567, 2: 1878, 3: 1303, 4: 1042, 5: 864, 6: 804 } }, { disbursedAmount: 3500, installments: { 1: 4147, 2: 2183, 3: 1515, 4: 1211, 5: 1004, 6: 935 } }, { disbursedAmount: 4000, installments: { 1: 4728, 2: 2489, 3: 1727, 4: 1381, 5: 1145, 6: 1066 } }, { disbursedAmount: 4500, installments: { 1: 5308, 2: 2794, 3: 1939, 4: 1550, 5: 1286, 6: 1197 } }, { disbursedAmount: 5000, installments: { 1: 5889, 2: 3100, 3: 2151, 4: 1720, 5: 1427, 6: 1328 } }, { disbursedAmount: 6000, installments: { 1: 7050, 2: 3711, 3: 2575, 4: 2059, 5: 1708, 6: 1590 } }, { disbursedAmount: 7000, installments: { 1: 8211, 2: 4322, 3: 3000, 4: 2398, 5: 1990, 6: 1852 } }, { disbursedAmount: 8000, installments: { 1: 9372, 2: 4933, 3: 3424, 4: 2738, 5: 2271, 6: 2114 } }, { disbursedAmount: 9000, installments: { 1: 10533, 2: 5545, 3: 3848, 4: 3077, 5: 2553, 6: 2376 } }, { disbursedAmount: 10000, installments: { 1: 11694, 2: 6156, 3: 4273, 4: 3416, 5: 2834, 6: 2638 } }
  ];

  const [schedule, setSchedule] = React.useState(() => {
    const savedSchedule = localStorage.getItem('xtenda_schedule');
    return savedSchedule ? JSON.parse(savedSchedule) : initialSchedule;
  });

  const handleScheduleChange = (newSchedule: any) => {
    setSchedule(newSchedule);
    localStorage.setItem('xtenda_schedule', JSON.stringify(newSchedule));
  };

  const navigateTo = (view: PageView) => {
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
      if (isAdmin) {
          if (currentView === 'admin_dashboard') {
              return <AdminDashboard onSelectApplication={(app) => { setSelectedApplication(app); setCurrentView('admin_view_application'); }} onExitAdmin={handleExitAdmin} />;
          } else if (currentView === 'admin_view_application' && selectedApplication) {
              return <AdminView data={selectedApplication} onBack={() => setCurrentView('admin_dashboard')} />;
          }
      }

      switch (currentView) {
          case 'apply':
              return <ApplicationForm loanSummary={loanSummary} />;
          case 'contact':
              return <ContactButtons />;
          case 'home':
          default:
              return (
                  <>
                      <section className="text-center my-12 md:my-20 px-4 animate-fade-in">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 leading-tight mb-6">
                          Need Cash? Get a <span className="text-orange-500">Ka Bwangu Bwangu</span> Salary Advance!
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                          Flexible repayments, competitive rates, and instant disbursement to your account.
                        </p>
                        <button 
                            onClick={() => navigateTo('apply')}
                            className="bg-green-600 text-white font-bold py-4 px-10 rounded-full hover:bg-green-700 transition duration-300 text-lg shadow-xl transform hover:scale-105"
                        >
                          Apply Now <i className="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                      </section>

                      <HowItWorks onNavigate={navigateTo} />
                      
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
    <div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-orange-50 to-green-50">
      {!isAdmin && <Header onNavigate={navigateTo} currentView={currentView as PageView} onAdminToggle={handleAdminToggle} />}
      
      <main className={`flex-grow container mx-auto px-4 ${!isAdmin ? 'py-8' : ''}`}>
        {renderContent()}
      </main>

      {!isAdmin && <Footer onAdminToggle={handleAdminToggle} />}
      
      {!isAdmin && <Chatbot schedule={schedule} />}
      <InstallPrompt />
      <style>{`
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;
