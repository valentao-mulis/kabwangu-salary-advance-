import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          <span className="text-orange-500">Xtenda</span> 
          <span className="text-green-600"> Salary Advance</span>
        </h1>
        <a 
          href="#application-form" 
          className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition duration-300 text-sm md:text-base"
        >
          Apply Now
        </a>
      </div>
    </header>
  );
};

export default Header;
