import React from 'react';

const WhyChooseUs = () => {
  const features = [
    {
      icon: "fa-solid fa-bolt",
      color: "text-yellow-500",
      bg: "bg-yellow-100",
      title: "Instant Decision",
      description: "Get approved in minutes. We use advanced technology to assess your application instantly."
    },
    {
      icon: "fa-solid fa-mobile-screen",
      color: "text-blue-500",
      bg: "bg-blue-100",
      title: "100% Digital",
      description: "No paperwork, no queues. Apply from the comfort of your home using your phone."
    },
    {
      icon: "fa-solid fa-hand-holding-dollar",
      color: "text-green-500",
      bg: "bg-green-100",
      title: "Low Interest Rates",
      description: "Competitive rates tailored to your salary scale. We believe in fair lending."
    },
    {
      icon: "fa-solid fa-shield-halved",
      color: "text-orange-500",
      bg: "bg-orange-100",
      title: "Safe & Secure",
      description: "Your data is encrypted and protected. We value your privacy and security."
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-white rounded-xl shadow-sm mx-4 mb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">
            Why Choose <span className="text-orange-500">Ka Bwangu Bwangu</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We make borrowing simple, fast, and transparent.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
              <div className={`w-16 h-16 ${feature.bg} ${feature.color} rounded-full flex items-center justify-center text-2xl mx-auto mb-4`}>
                <i className={feature.icon}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;