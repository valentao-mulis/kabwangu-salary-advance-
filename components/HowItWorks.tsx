import React from 'react';

const HowItWorks = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
        // Account for sticky header
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
    <section className="my-16">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Get Your Advance in 3 Simple Steps</h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        
        {/* Step 1 */}
        <div 
            onClick={() => scrollToSection('calculator')}
            className="bg-white rounded-lg shadow-lg p-6 text-center flex flex-col items-center justify-start transform hover:scale-105 transition-all duration-300 cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label="Go to calculator"
        >
          <div className="bg-orange-100 p-4 rounded-full mb-4">
            <i className="fa-solid fa-calculator text-3xl text-orange-500"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">1. Our Rates</h3>
          <p className="text-gray-600">Use our easy calculator to see exactly how much you can borrow and what your repayments will be. No hidden fees.</p>
        </div>

        {/* Step 2 */}
        <div 
            onClick={() => scrollToSection('application-form')}
            className="bg-white rounded-lg shadow-lg p-6 text-center flex flex-col items-center justify-start transform hover:scale-105 transition-all duration-300 cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label="Go to application form"
        >
          <div className="bg-green-100 p-4 rounded-full mb-4">
            <i className="fa-solid fa-file-pen text-3xl text-green-600"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">2. Online Application</h3>
          <p className="text-gray-600">Complete our simple online application form. Upload a quick selfie and sign digitally. It only takes a few minutes.</p>
        </div>

        {/* Step 3 */}
        <div 
            onClick={() => scrollToSection('contact-us')}
            className="bg-white rounded-lg shadow-lg p-6 text-center flex flex-col items-center justify-start transform hover:scale-105 transition-all duration-300 cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label="Go to contact section"
        >
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <i className="fa-solid fa-hand-holding-dollar text-3xl text-blue-600"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">3. Receive Your Cash</h3>
          <p className="text-gray-600">Once approved, your salary advance is disbursed directly to your bank/mobile money account instantly.</p>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;