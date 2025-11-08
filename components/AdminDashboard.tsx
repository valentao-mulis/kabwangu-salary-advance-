import React from 'react';

interface AdminDashboardProps {
    onSelectApplication: (app: any) => void;
    onExitAdmin: () => void;
}

const AdminDashboard = ({ onSelectApplication, onExitAdmin }: AdminDashboardProps) => {
  const [applications, setApplications] = React.useState<any[]>([]);

  React.useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    try {
        const data = localStorage.getItem('xtenda_applications');
        if (data) {
            const parsed = JSON.parse(data);
            // Sort by newest first
            parsed.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
            setApplications(parsed);
        }
    } catch (error) {
        console.error("Error loading applications:", error);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this application? This cannot be undone.")) {
          const updatedApps = applications.filter(app => app.id !== id);
          setApplications(updatedApps);
          localStorage.setItem('xtenda_applications', JSON.stringify(updatedApps));
      }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-md">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    <span className="text-orange-500">Xtenda</span> Admin Dashboard
                </h1>
                <p className="text-gray-500 mt-1">Manage incoming loan applications</p>
            </div>
            <button 
                onClick={onExitAdmin} 
                className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
            >
                <i className="fa-solid fa-right-from-bracket"></i> Exit
            </button>
        </header>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-700">Submitted Applications ({applications.length})</h2>
                <button onClick={loadApplications} className="text-blue-600 hover:text-blue-800 transition" title="Refresh List">
                    <i className="fa-solid fa-sync"></i> Refresh
                </button>
            </div>
            
            {applications.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <i className="fa-solid fa-inbox fa-4x mb-4 text-gray-300"></i>
                    <p className="text-xl">No applications received yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Applicant Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 hidden md:table-cell">Employer</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 hidden sm:table-cell">Phone</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {applications.map((app) => (
                                <tr 
                                    key={app.id} 
                                    onClick={() => onSelectApplication(app)}
                                    className="hover:bg-orange-50 cursor-pointer transition"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                        {new Date(app.submittedAt).toLocaleDateString()} <br/>
                                        <span className="text-xs text-gray-500">{new Date(app.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{app.fullNames}</td>
                                    <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{app.employer}</td>
                                    <td className="px-6 py-4 text-gray-600 hidden sm:table-cell">{app.phone}</td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onSelectApplication(app); }} 
                                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                                        >
                                            View
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(app.id, e)} 
                                            className="text-red-500 hover:text-red-700"
                                            title="Delete Application"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;