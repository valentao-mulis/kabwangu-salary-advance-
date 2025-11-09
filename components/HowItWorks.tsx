import React from 'react';

interface HowItWorksProps {
    onNavigate: (page: 'home' | 'apply' | 'contact') => void;
}

const HowItWorks = ({ onNavigate }: HowItWorksProps) => {
  
  const handleStep1Click = () => {
      // Stay on home page, just scroll to calculator
      onNavigate('home');
      setTimeout(() => {
          document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
  };

  return (
    <section className="my-16">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Get Your Advance in 3 Simple Steps</h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        
        {/* Step 1 */}
        <div 
            onClick={handleStep1Click}
            className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transform hover:scale-105 transition-all duration-300 cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label="Go to calculator"
        >
          <div className="h-48 overflow-hidden relative bg-orange-100 flex items-center justify-center">
             <img 
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80" 
                alt="Calculator and financial planning" 
                className="w-full h-full object-cover relative z-10 group-hover:opacity-90 transition-opacity"
                loading="lazy"
             />
          </div>
          <div className="p-6 flex flex-col flex-grow text-center">
            <div className="bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-md">1</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Our Rates</h3>
            <p className="text-gray-600">Use our easy calculator to see exactly how much you can borrow and what your repayments will be. No hidden fees.</p>
          </div>
        </div>

        {/* Step 2 */}
        <div 
            onClick={() => onNavigate('apply')}
            className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transform hover:scale-105 transition-all duration-300 cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label="Go to application form page"
        >
          <div className="h-48 overflow-hidden relative bg-green-100 flex items-center justify-center">
             <img 
                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80" 
                alt="Signing documents digitally" 
                className="w-full h-full object-cover relative z-10 group-hover:opacity-90 transition-opacity"
                loading="lazy"
             />
          </div>
          <div className="p-6 flex flex-col flex-grow text-center">
            <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-md">2</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Online Application</h3>
            <p className="text-gray-600">Complete our simple online application form. Upload a quick selfie and sign digitally. It only takes a few minutes.</p>
          </div>
        </div>

        {/* Step 3 */}
        <div 
            onClick={() => onNavigate('contact')}
            className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transform hover:scale-105 transition-all duration-300 cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label="Go to contact page"
        >
          <div className="h-48 overflow-hidden relative bg-blue-100 flex items-center justify-center">
             <img 
                src="https://images.unsplash.com/photo-1621981386829-9b7476c4bf41?auto=format&fit=crop&w=800&q=80" 
                alt="Receiving cash" 
                className="w-full h-full object-cover relative z-10 group-hover:opacity-90 transition-opacity"
                loading="lazy"
             />
          </div>
          <div className="p-6 flex flex-col flex-grow text-center">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-md">3</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Receive Your Cash</h3>
            <p className="text-gray-600">Once approved, your salary advance is disbursed directly to your bank or mobile money account instantly.</p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;