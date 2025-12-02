import React from 'react';

interface HeaderProps {
    onNavigate: (page: any) => void;
    currentView: 'home' | 'apply' | 'contact' | 'about' | 'check-status' | 'employers';
    onAdminToggle: () => void;
}

const Header = ({ onNavigate, currentView, onAdminToggle }: HeaderProps) => {
  const [logoClickCount, setLogoClickCount] = React.useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  const navLinkClass = (view: string) => `cursor-pointer font-medium transition duration-300 whitespace-nowrap ${currentView === view ? 'text-green-600 font-bold' : 'text-gray-600 hover:text-green-500'}`;

  const handleLogoClick = () => {
      onNavigate('home');
      const newCount = logoClickCount + 1;
      setLogoClickCount(newCount);
      if (newCount >= 7) {
          onAdminToggle();
          setLogoClickCount(0);
      }
  };
  
  const handleNavClick = (view: any) => {
      onNavigate(view);
      setMobileMenuOpen(false);
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
            onClick={handleLogoClick} 
            className="cursor-pointer flex items-center gap-2 select-none"
            title="Go to Home"
        >
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            <span className="text-orange-500">ka bwangu</span> 
            <span className="text-green-600">bwangu</span>
            </h1>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-5">
            <button onClick={() => handleNavClick('home')} className={navLinkClass('home')}>Home</button>
            <button onClick={() => handleNavClick('employers')} className={navLinkClass('employers')}>Employers</button>
            <button onClick={() => handleNavClick('calculator')} className="text-gray-600 hover:text-green-500 font-medium transition duration-300">Schedule</button>
            <button onClick={() => handleNavClick('about')} className={navLinkClass('about')}>About</button>
            <button onClick={() => handleNavClick('contact')} className={navLinkClass('contact')}>Contact</button>
            
            {/* Highlighted Check Status Link */}
            <button 
                onClick={() => handleNavClick('check-status')} 
                className={`font-bold transition duration-300 whitespace-nowrap flex items-center gap-1 ${currentView === 'check-status' ? 'text-green-700 bg-green-50 px-3 py-1 rounded-full' : 'text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-1 rounded-full'}`}
            >
                <i className="fa-solid fa-magnifying-glass text-sm"></i> My Status
            </button>
            
            <span className="text-gray-300">|</span>
            <button 
                onClick={() => handleNavClick('apply')}
                className={`bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition duration-300 shadow-sm ${currentView === 'apply' ? 'ring-2 ring-green-300 ring-offset-2' : ''}`}
            >
                Apply Now
            </button>
        </nav>

        {/* Mobile Menu Button (Hamburger) */}
        <button 
            className="md:hidden text-gray-600 text-2xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
            <i className={`fa-solid ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>

      {/* Mobile Quick Nav Strip (Gradient) */}
      <div className="md:hidden bg-gradient-to-r from-green-600 to-orange-500 py-3 px-2 flex justify-between items-center shadow-inner overflow-x-auto">
          <button 
            onClick={() => handleNavClick('employers')} 
            className={`text-sm font-medium whitespace-nowrap px-3 transition ${currentView === 'employers' ? 'text-white font-bold' : 'text-green-50 hover:text-white'}`}
          >
            Employers
          </button>
          <button 
            onClick={() => handleNavClick('check-status')} 
            className={`text-sm font-medium whitespace-nowrap px-3 transition ${currentView === 'check-status' ? 'text-white font-bold' : 'text-green-50 hover:text-white'}`}
          >
            Loan Status
          </button>
          <button 
            onClick={() => handleNavClick('calculator')} 
            className="text-sm font-medium whitespace-nowrap px-3 text-green-50 hover:text-white transition"
          >
            Schedule
          </button>
          <button 
            onClick={() => handleNavClick('contact')} 
            className={`text-sm font-medium whitespace-nowrap px-3 transition ${currentView === 'contact' ? 'text-white font-bold' : 'text-green-50 hover:text-white'}`}
          >
            Contact
          </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-t shadow-lg p-4 flex flex-col gap-4 md:hidden animate-slide-down border-b-4 border-green-500 z-40">
                <button 
                    onClick={() => handleNavClick('apply')}
                    className="bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition text-center"
                >
                    Apply Now
                </button>
                <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => handleNavClick('home')} className={`text-left p-2 rounded hover:bg-gray-50 ${navLinkClass('home')}`}>Home</button>
                     <button onClick={() => handleNavClick('employers')} className={`text-left p-2 rounded hover:bg-gray-50 ${navLinkClass('employers')}`}>Employers</button>
                     <button onClick={() => handleNavClick('calculator')} className="text-left p-2 rounded hover:bg-gray-50 text-gray-600">Schedule</button>
                     <button onClick={() => handleNavClick('check-status')} className={`text-left p-2 rounded hover:bg-gray-50 ${navLinkClass('check-status')}`}>My Status</button>
                     <button onClick={() => handleNavClick('about')} className={`text-left p-2 rounded hover:bg-gray-50 ${navLinkClass('about')}`}>About Us</button>
                     <button onClick={() => handleNavClick('contact')} className={`text-left p-2 rounded hover:bg-gray-50 ${navLinkClass('contact')}`}>Contact Us</button>
                </div>
            </div>
      )}

      <style>{`
          @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-slide-down { animation: slide-down 0.2s ease-out forwards; }
      `}</style>
    </header>
  );
};

export default Header;