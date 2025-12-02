import React from 'react';

// A reusable component for a single FAQ item with an accordion effect.
interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick }) => {
    const contentRef = React.useRef<HTMLDivElement>(null);

    return (
        <div className="border-b border-gray-200 last:border-b-0">
            <button
                onClick={onClick}
                className="w-full text-left py-5 px-6 flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:bg-orange-50 transition-colors"
                aria-expanded={isOpen}
            >
                <span className="text-lg font-semibold text-gray-800">{question}</span>
                <i className={`fa-solid fa-chevron-down text-orange-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}></i>
            </button>
            <div
                ref={contentRef}
                style={{ maxHeight: isOpen ? `${contentRef.current?.scrollHeight}px` : '0px' }}
                className="overflow-hidden transition-max-height duration-500 ease-in-out"
            >
                <div className="p-6 pt-0 text-gray-700 leading-relaxed">
                    {answer}
                </div>
            </div>
        </div>
    );
};


const AboutUs = () => {
  const [openFAQ, setOpenFAQ] = React.useState<number | null>(null);

  const faqData = [
    {
      question: "Who is eligible for a salary advance?",
      answer: "Any employee of a registered company in Zambia who receives a regular salary through a bank account is eligible to apply. We consider applicants from both public and private sectors."
    },
    {
      question: "What documents do I need to apply?",
      answer: "Our application process is designed to be simple. You will need a clear photo of the front and back of your NRC and your latest payslip. You will also be required to sign the application digitally on our platform. No complex paperwork is required!"
    },
    {
      question: "How long does the application and approval process take?",
      answer: "The 'Ka Bwangu Bwangu' name says it all! The online application takes only a few minutes to complete. Once submitted, our team reviews it promptly. If approved, the funds are typically disbursed to your account on the same day."
    },
    {
      question: "How do I repay the loan?",
      answer: "Repayments are made through direct deductions from your salary account via a DDACC (Direct Debit and Credit Clearing) instruction, which you authorize during the application process. This ensures timely and hassle-free repayments."
    },
    {
      question: "Are there any penalties for early repayment?",
      answer: "No, we do not penalize early repayments. If you wish to settle your advance earlier than the agreed tenure, please contact our support team to get the settlement amount and procedure."
    }
  ];

  const handleToggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };


  return (
    <section id="about-us" className="max-w-4xl mx-auto my-12 animate-fade-in px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 leading-tight mb-4">
          About <span className="text-orange-500">Xtenda</span> <span className="text-green-600">Zambia</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your trusted partner for fast, fair, and flexible financial solutions.
        </p>
      </div>

      <div className="space-y-10">
        {/* Our Mission */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row items-center">
          <div className="md:w-1/3 text-center p-8 bg-orange-500 text-white">
            <i className="fa-solid fa-bullseye fa-4x"></i>
          </div>
          <div className="p-8 md:w-2/3">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Our Mission</h3>
            <p className="text-gray-700 leading-relaxed">
              To empower salaried employees across Zambia by providing immediate and accessible credit solutions. We strive to bridge financial gaps with our "Ka Bwangu Bwangu" service, ensuring our clients can meet their urgent needs with dignity and speed.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row-reverse items-center">
          <div className="md:w-1/3 text-center p-8 bg-green-600 text-white">
             <i className="fa-solid fa-book-open fa-4x"></i>
          </div>
          <div className="p-8 md:w-2/3">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Our Story</h3>
            <p className="text-gray-700 leading-relaxed">
              Founded with a deep understanding of the everyday financial challenges faced by Zambians, Xtenda was created to offer a better alternative to traditional lending. We saw the need for a faster, more transparent, and customer-friendly salary advance service. Today, we are proud to have helped thousands of individuals manage their finances with our simple and reliable platform.
            </p>
          </div>
        </div>
        
        {/* Our Values */}
        <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Our Core Values</h3>
            <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                    <div className="bg-orange-100 text-orange-500 w-16 h-16 rounded-full flex items-center justify-center mb-3 text-2xl">
                        <i className="fa-solid fa-bolt"></i>
                    </div>
                    <h4 className="font-bold text-lg mb-1">Speed</h4>
                    <p className="text-gray-600 text-sm">We value your time. Our processes are streamlined for instant decisions and disbursement.</p>
                </div>
                 <div className="flex flex-col items-center">
                    <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mb-3 text-2xl">
                       <i className="fa-solid fa-handshake-simple"></i>
                    </div>
                    <h4 className="font-bold text-lg mb-1">Integrity</h4>
                    <p className="text-gray-600 text-sm">We operate with complete transparency. No hidden fees, no surprises.</p>
                </div>
                 <div className="flex flex-col items-center">
                    <div className="bg-blue-100 text-blue-500 w-16 h-16 rounded-full flex items-center justify-center mb-3 text-2xl">
                        <i className="fa-solid fa-users"></i>
                    </div>
                    <h4 className="font-bold text-lg mb-1">Customer Focus</h4>
                    <p className="text-gray-600 text-sm">You are at the heart of everything we do. We are committed to your financial well-being.</p>
                </div>
            </div>
        </div>

        {/* FAQ Section */}
        <div className="pt-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">Frequently Asked Questions</h3>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
                {faqData.map((faq, index) => (
                    <FAQItem
                        key={index}
                        question={faq.question}
                        answer={faq.answer}
                        isOpen={openFAQ === index}
                        onClick={() => handleToggleFAQ(index)}
                    />
                ))}
            </div>
        </div>

      </div>
      <style>{`
        .transition-max-height {
            transition: max-height 0.5s ease-in-out;
        }
      `}</style>
    </section>
  );
};

export default AboutUs;