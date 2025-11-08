import React from 'react';

const ContactButtons = () => {
  return (
    <section id="contact-us" className="my-16 p-6 md:p-8 bg-white rounded-2xl shadow-lg text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Have Questions? Contact Us Directly!</h2>
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
        <a 
          href="https://wa.me/260965732006" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 text-lg font-bold text-white bg-green-500 px-8 py-4 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105"
        >
          <i className="fab fa-whatsapp"></i>
          Chat on WhatsApp
        </a>
        <a 
          href="tel:+260774219397"
          className="flex items-center justify-center gap-3 text-lg font-bold text-white bg-orange-500 px-8 py-4 rounded-lg hover:bg-orange-600 transition-transform transform hover:scale-105"
        >
          <i className="fa-solid fa-phone"></i>
          Call Us Now
        </a>
      </div>
    </section>
  );
};

export default ContactButtons;