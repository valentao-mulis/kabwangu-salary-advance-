import React from 'react';

interface FooterProps {
    onAdminToggle: () => void;
}

const Footer = ({ onAdminToggle }: FooterProps) => {
  const [clickCount, setClickCount] = React.useState(0);

  const handleCopyrightClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      onAdminToggle();
      setClickCount(0);
    }
  };
  
  return (
    <footer className="bg-gray-800 text-white mt-16">
      <div className="container mx-auto px-4 py-6 text-center">
        <p onClick={handleCopyrightClick} className="cursor-pointer">
          &copy; 2025 Xtenda Salary Advance with Mr Mulisha. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;