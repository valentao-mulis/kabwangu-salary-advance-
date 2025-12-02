import React from 'react';

const EmployersList = ({ onNavigate }: { onNavigate: (page: 'apply') => void }) => {
  const priorityEmployers = [
    { name: "Government of the Republic of Zambia (GRZ)", acronym: "GRZ", icon: "fa-building-columns" },
    { name: "Zambia National Service", acronym: "ZNS", icon: "fa-person-military-rifle" },
    { name: "Zambia Airforce", acronym: "ZAF", icon: "fa-jet-fighter" },
    { name: "Zambia Army", acronym: "Army", icon: "fa-person-rifle" },
    { name: "Zambia Police", acronym: "Police", icon: "fa-handcuffs" },
    { name: "Ministry of Health", acronym: "MOH", icon: "fa-user-doctor" },
    { name: "Ministry of Education", acronym: "MOE", icon: "fa-chalkboard-user" }
  ];

  const otherEmployers = [
    "Infratel",
    "Kalikiliki Water Trust",
    "LASF Local Authorities Superannuation Fund",
    "Lusaka Water and Sewerage Company",
    "Majoru",
    "MEDLINK",
    "Mutendere East Water Trust",
    "National Assembly of Zambia (NAZ)",
    "National Food and Nutrition (NFNC)",
    "National Prosecution Authority",
    "NCC",
    "NGOMBE WATER TRUST",
    "Nkwazi: Nkwazi Primary School",
    "Professional Teachers' Union of Zambia",
    "Road Transport and Safety Agency (RTSA)",
    "SAMI: Southern Africa Management Institute",
    "Staff",
    "USA",
    "Water Resources Management Authority (WARMA)",
    "Zambia Development Agency",
    "Zambia Environmental Management Agency (ZEMA)",
    "Zambia Forestry and Forest Industries Corporation",
    "Zambia National Data Centre (ZNDC)",
    "Zambia National Union of Teachers (ZNUT)",
    "Zambia Open University",
    "Zambia Public Procurement Authority (ZPPA)"
  ];

  return (
    <section className="max-w-4xl mx-auto my-12 px-4 animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 leading-tight mb-4">
          Eligible <span className="text-orange-500">Employers</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          We provide salary advances to employees of the following institutions.
        </p>
      </div>

      {/* Priority Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
        {priorityEmployers.map((emp, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-md text-center border-b-4 border-green-500 hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              <i className={`fa-solid ${emp.icon}`}></i>
            </div>
            <h3 className="font-bold text-gray-800">{emp.acronym}</h3>
            <p className="text-xs text-gray-500 mt-1">{emp.name}</p>
          </div>
        ))}
      </div>

      {/* Full List */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-orange-500"></i> Full Institution List
        </h3>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
          {otherEmployers.map((emp, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition border-b border-gray-50 last:border-0">
              <i className="fa-solid fa-check text-green-500 text-sm"></i>
              <span className="text-gray-700 text-sm font-medium">{emp}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-6">Don't see your employer? Contact us to check eligibility.</p>
        <button 
            onClick={() => onNavigate('apply')}
            className="bg-green-600 text-white font-bold py-4 px-10 rounded-full hover:bg-green-700 transition duration-300 text-lg shadow-xl flex items-center justify-center gap-2 mx-auto"
        >
          Apply Now <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </section>
  );
};

export default EmployersList;