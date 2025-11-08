import React from 'react';

const HowItWorks = () => {
  return (
    <section className="my-16">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Get Your Advance in 3 Simple Steps</h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center flex flex-col items-center justify-start transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-green-100 text-green-600">
            <i className="fa-solid fa-calculator fa-3x"></i>
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-800">1. Calculate Your Loan</h3>
          <p className="text-gray-600">Use our simple calculator to see how much you qualify for and what your repayments will be.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 text-center flex flex-col items-center justify-start transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-orange-100 text-orange-500">
            <i className="fa-solid fa-file-signature fa-3x"></i>
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-800">2. Fill Application</h3>
          <p className="text-gray-600">Complete our straightforward application form with your details. It only takes a few minutes.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 text-center flex flex-col items-center justify-start transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-green-100 text-green-600">
            <i className="fa-solid fa-hand-holding-dollar fa-3x"></i>
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-800">3. Receive Your Cash</h3>
          <p className="text-gray-600">Once approved, the funds are disbursed to your account quickly. It's that simple!</p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
