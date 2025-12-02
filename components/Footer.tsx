import React from 'react';

interface FooterProps {
    onAdminToggle: () => void;
    onNavigate: (page: 'home' | 'contact' | 'about') => void;
}

const Footer = ({ onAdminToggle, onNavigate }: FooterProps) => {
  const [clickCount, setClickCount] = React.useState(0);

  const handleCopyrightClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 7) {
      onAdminToggle();
      setClickCount(0);
    }
  };
  
  return (
    <footer className="bg-gradient-to-r from-green-600 to-orange-500 text-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
            <div>
                <h3 className="text-xl font-bold">
                    <span className="text-orange-300">ka bwangu</span> 
                    <span className="text-green-300">bwangu</span>
                </h3>
                <p className="text-gray-200 text-sm mt-1">Your partner for quick financial solutions.</p>
            </div>
            <div className="flex gap-6 font-medium text-green-300">
                <button onClick={() => onNavigate('home')} className="hover:text-white transition">Home</button>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition">About Us</button>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition">Contact</button>
            </div>
        </div>
        <div className="border-t border-green-500/50 mt-6 pt-6 text-center text-gray-300 text-sm">
            <p onClick={handleCopyrightClick} className="cursor-pointer select-none">
              &copy; 2025 ka bwangu bwangu with Mr Mulisha. All rights reserved.
            </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;