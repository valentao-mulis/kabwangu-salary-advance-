import React from 'react';

const Header = () => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      // Account for sticky header height (approx 80px) plus extra breathing room
      // Increased to 130 to ensure the section title is clearly visible below the header
      const headerOffset = 130;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          <span className="text-orange-500">Xtenda</span> 
          <span className="text-green-600"> Salary Advance</span>
        </h1>
        <a 
          href="#application-form" 
          onClick={(e) => handleNavClick(e, 'application-form')}
          className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition duration-300 text-sm md:text-base cursor-pointer shadow-sm"
        >
          Apply Now
        </a>
      </div>
    </header>
  );
};

export default Header;