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

type ViewState = 'app' | 'admin_dashboard' | 'admin_view_application';

const App = () => {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<ViewState>('app');
  const [selectedApplication, setSelectedApplication] = React.useState(null);

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
      setCurrentView('app');
      setSelectedApplication(null);
  };

  const initialSchedule = [
    { disbursedAmount: 500, installments: { 1: 664, 2: 357, 3: 243, 4: 194, 5: 161, 6: 189 } }, { disbursedAmount: 600, installments: { 1: 780, 2: 420, 3: 285, 4: 228, 5: 189, 6: 213 } }, { disbursedAmount: 700, installments: { 1: 896, 2: 472, 3: 328, 4: 261, 5: 217, 6: 237 } }, { disbursedAmount: 800, installments: { 1: 1012, 2: 533, 3: 370, 4: 295, 5: 245, 6: 262 } }, { disbursedAmount: 900, installments: { 1: 1129, 2: 594, 3: 412, 4: 329, 5: 273, 6: 286 } }, { disbursedAmount: 1000, installments: { 1: 1245, 2: 665, 3: 455, 4: 363, 5: 301, 6: 310 } }, { disbursedAmount: 1500, installments: { 1: 1825, 2: 961, 3: 667, 4: 533, 5: 442, 6: 431 } }, { disbursedAmount: 2000, installments: { 1: 2406, 2: 1266, 3: 879, 4: 702, 5: 582, 6: 552 } }, { disbursedAmount: 2500, installments: { 1: 2986, 2: 1572, 3: 1091, 4: 872, 5: 723, 6: 673 } }, { disbursedAmount: 3000, installments: { 1: 3567, 2: 1878, 3: 1303, 4: 1041, 5: 863, 6: 795 } }, { disbursedAmount: 3500, installments: { 1: 4147, 2: 2183, 3: 1515, 4: 1211, 5: 1004, 6: 916 } }, { disbursedAmount: 4000, installments: { 1: 4728, 2: 2489, 3: 1728, 4: 1380, 5: 1145, 6: 1037 } }, { disbursedAmount: 4500, installments: { 1: 5309, 2: 2794, 3: 1940, 4: 1550, 5: 1285, 6: 1158 } }, { disbursedAmount: 5000, installments: { 1: 5889, 2: 3100, 3: 2152, 4: 1719, 5: 1426, 6: 1279 } }, { disbursedAmount: 5500, installments: { 1: 6470, 2: 3406, 3: 2364, 4: 1889, 5: 1566, 6: 1400 } }, { disbursedAmount: 6000, installments: { 1: 7050, 2: 3711, 3: 2579, 4: 2059, 5: 1707, 6: 1521 } }, { disbursedAmount: 6500, installments: { 1: 7634, 2: 4024, 3: 2792, 4: 2228, 5: 1848, 6: 1642 } }, { disbursedAmount: 7000, installments: { 1: 8215, 2: 4329, 3: 3004, 4: 2398, 5: 1988, 6: 1764 } }, { disbursedAmount: 7500, installments: { 1: 8796, 2: 4636, 3: 3216, 4: 2567, 5: 2129, 6: 1885 } }, { disbursedAmount: 8000, installments: { 1: 9377, 2: 4942, 3: 3429, 4: 2737, 5: 2269, 6: 2006 } }, { disbursedAmount: 8500, installments: { 1: 9958, 2: 5248, 3: 3641, 4: 2906, 5: 2410, 6: 2127 } }, { disbursedAmount: 9000, installments: { 1: 10538, 2: 5554, 3: 3854, 4: 3064, 5: 2541, 6: 2248 } }, { disbursedAmount: 9500, installments: { 1: 11119, 2: 5860, 3: 4066, 4: 3233, 5: 2681, 6: 2369 } }, { disbursedAmount: 10000, installments: { 1: 11700, 2: 6166, 3: 4278, 4: 3402, 5: 2821, 6: 2490 } },
  ];

  const [schedule, setSchedule] = React.useState(initialSchedule);

  const handleScheduleChange = React.useCallback((updatedSchedule) => {
    setSchedule(updatedSchedule);
  }, []);

  if (currentView === 'admin_dashboard') {
      return (
          <AdminDashboard 
              onSelectApplication={(app) => {
                  setSelectedApplication(app);
                  setCurrentView('admin_view_application');
              }}
              onExitAdmin={handleExitAdmin}
          />
      );
  }

  if (currentView === 'admin_view_application' && selectedApplication) {
    return (
        <AdminView 
            data={selectedApplication} 
            onBack={() => setCurrentView('admin_dashboard')}
        />
    );
  }

  return (
    <div className="min-h-screen font-sans relative">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">
            <span className="text-green-600">Ka Bwangu Bwangu</span> Salary Advance
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Get the cash you need, when you need it. Quick approval, transparent fees. Your financial partner is here.
          </p>
        </div>
        <HowItWorks />
        <SalaryCalculator 
          schedule={schedule}
          isAdmin={isAdmin}
          onScheduleChange={handleScheduleChange}
        />
        <ApplicationForm />
        <ContactButtons />
      </main>
      <Footer onAdminToggle={handleAdminToggle} />
      <Chatbot schedule={schedule} />
      <InstallPrompt />
      
      {/* Floating Admin Button if already authenticated but returned to main app */}
      {isAdmin && currentView === 'app' && (
          <button 
            onClick={() => setCurrentView('admin_dashboard')}
            className="fixed bottom-6 left-6 bg-gray-800 text-white px-4 py-3 rounded-full shadow-lg hover:bg-gray-900 transition z-50 flex items-center gap-2 font-bold"
          >
              <i className="fa-solid fa-lock-open"></i> Admin
          </button>
      )}
    </div>
  );
};

export default App;