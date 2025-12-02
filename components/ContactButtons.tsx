import React from 'react';

const ContactButtons = () => {
  return (
    <section id="contact-us" className="max-w-4xl mx-auto my-8 md:my-16">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-green-600 py-8 px-6 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Get in Touch</h2>
              <p className="text-orange-100 text-lg">We're here to help you get your advance quickly.</p>
          </div>
          
          <div className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                  <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-800">Contact Information</h3>
                      <p className="text-gray-600 leading-relaxed">
                          Our team is available to assist you with your application or any questions you might have about our salary advance services.
                      </p>
                      
                      <div className="space-y-4 mt-6">
                          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="bg-orange-100 p-3 rounded-full text-orange-500">
                                  <i className="fa-solid fa-phone text-xl"></i>
                              </div>
                              <div>
                                  <p className="text-sm text-gray-500 font-medium">Phone Support</p>
                                  <a href="tel:+260774219397" className="text-lg font-bold text-gray-800 hover:text-orange-500 transition">Call Support</a>
                              </div>
                          </div>

                          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="bg-green-100 p-3 rounded-full text-green-600">
                                  <i className="fab fa-whatsapp text-2xl"></i>
                              </div>
                              <div>
                                  <p className="text-sm text-gray-500 font-medium">WhatsApp</p>
                                  <a href="https://wa.me/260965732006" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-gray-800 hover:text-green-600 transition">Chat on WhatsApp</a>
                              </div>
                          </div>

                           <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                  <i className="fa-solid fa-envelope text-xl"></i>
                              </div>
                              <div>
                                  <p className="text-sm text-gray-500 font-medium">General Inquiries</p>
                                  <a href="mailto:info@xtenda.co.zm" className="text-lg font-bold text-gray-800 hover:text-blue-600 transition">Email Info</a>
                              </div>
                          </div>
                          
                           <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                  <i className="fa-solid fa-envelope-open-text text-xl"></i>
                              </div>
                              <div>
                                  <p className="text-sm text-gray-500 font-medium">Vincent M's Office</p>
                                  <a href="mailto:vincentM@xtendafin.com" className="text-lg font-bold text-gray-800 hover:text-indigo-600 transition break-all">Email Vincent M</a>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="flex flex-col justify-center items-center bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-200">
                      <i className="fa-solid fa-headset text-6xl text-gray-300 mb-6"></i>
                      <h4 className="text-xl font-bold text-gray-700 mb-2">Need Immediate Help?</h4>
                      <p className="text-center text-gray-600 mb-8">Our agents are ready to assist you right now.</p>
                      <div className="flex flex-col w-full gap-4">
                        <a 
                        href="https://wa.me/260965732006" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 text-lg font-bold text-white bg-green-500 px-6 py-4 rounded-xl hover:bg-green-600 transition-transform transform hover:scale-105 shadow-md"
                        >
                        <i className="fab fa-whatsapp text-2xl"></i>
                        Chat on WhatsApp
                        </a>
                        <a 
                        href="tel:+260774219397"
                        className="flex items-center justify-center gap-3 text-lg font-bold text-white bg-orange-500 px-6 py-4 rounded-xl hover:bg-orange-600 transition-transform transform hover:scale-105 shadow-md"
                        >
                        <i className="fa-solid fa-phone-volume"></i>
                        Call Us Now
                        </a>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </section>
  );
};

export default ContactButtons;