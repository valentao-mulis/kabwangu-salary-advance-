import React from 'react';

interface HeaderProps {
    onNavigate: (page: 'home' | 'apply' | 'contact') => void;
    currentView: 'home' | 'apply' | 'contact';
    onAdminToggle: () => void;
}

const Header = ({ onNavigate, currentView, onAdminToggle }: HeaderProps) => {
  const [logoClickCount, setLogoClickCount] = React.useState(0);
  
  const navLinkClass = (view: string) => `cursor-pointer font-medium transition duration-300 ${currentView === view ? 'text-green-600 font-bold' : 'text-gray-600 hover:text-green-500'}`;

  const handleLogoClick = () => {
      onNavigate('home');
      const newCount = logoClickCount + 1;
      setLogoClickCount(newCount);
      if (newCount >= 5) {
          onAdminToggle();
          setLogoClickCount(0);
      }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
            onClick={handleLogoClick} 
            className="cursor-pointer flex items-center gap-2 select-none"
            title="Go to Home"
        >
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            <span className="text-orange-500">Xtenda</span> 
            <span className="text-green-600"> Salary Advance</span>
            </h1>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate('home')} className={navLinkClass('home')}>Home</button>
            <button onClick={() => onNavigate('contact')} className={navLinkClass('contact')}>Contact Us</button>
            <button 
            onClick={() => onNavigate('apply')}
            className={`bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition duration-300 shadow-sm ${currentView === 'apply' ? 'ring-2 ring-orange-300 ring-offset-2' : ''}`}
            >
            Apply Now
            </button>
        </nav>

        {/* Mobile simplified nav */}
        <div className="md:hidden flex gap-4 items-center">
             {currentView !== 'home' && (
                 <button onClick={() => onNavigate('home')} className="text-gray-600">
                     <i className="fa-solid fa-home text-xl"></i>
                 </button>
             )}
             <button 
                onClick={() => onNavigate('apply')}
                className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
                Apply
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;