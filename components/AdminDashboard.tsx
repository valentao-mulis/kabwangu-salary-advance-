import React from 'react';
import { firestore } from '../firebaseConfig';
import { ApplicationFormData } from '../types';
import { collection, onSnapshot, doc, deleteDoc, query } from 'firebase/firestore';

interface AdminDashboardProps {
    onSelectApplication: (id: string) => void;
    onExitAdmin: () => void;
}

interface Notification {
    id: string;
    message: string;
    appId: string;
    timestamp: string; // ISO string
    read: boolean;
}

const getStatusColor = (status?: 'New' | 'Under Review' | 'Approved' | 'Rejected') => {
    switch (status) {
        case 'New': return 'bg-blue-100 text-blue-800';
        case 'Under Review': return 'bg-yellow-100 text-yellow-800';
        case 'Approved': return 'bg-green-100 text-green-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const AdminDashboard = ({ onSelectApplication, onExitAdmin }: AdminDashboardProps) => {
  // OPTIMIZATION: Initialize state directly from localStorage for instant render
  const [applications, setApplications] = React.useState<ApplicationFormData[]>(() => {
    try {
        const cached = localStorage.getItem('xtenda_admin_apps_cache');
        return cached ? JSON.parse(cached) : [];
    } catch (e) {
        console.warn("Failed to parse cached applications", e);
        return [];
    }
  });

  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string | null>(null);
  
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [applicationToDelete, setApplicationToDelete] = React.useState<string | null>(null);

  // Link copy state
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null);

  const isInitialLoadRef = React.useRef(true);
  const notificationsPanelRef = React.useRef<HTMLDivElement>(null);
  const bellButtonRef = React.useRef<HTMLButtonElement>(null);

  // Load notifications from localStorage on mount
  React.useEffect(() => {
    try {
        const storedNotifications = localStorage.getItem('adminNotifications_v1');
        if (storedNotifications) {
            setNotifications(JSON.parse(storedNotifications));
        }
    } catch (e) {
        console.error("Failed to parse notifications from localStorage", e);
        setNotifications([]);
    }
  }, []);
  
  React.useEffect(() => {
    // Fetch all applications
    const q = query(collection(firestore, 'applications'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ApplicationFormData[];

      // Client-side sorting: Newest first
      appsData.sort((a, b) => {
        const getTime = (val: any) => {
            if (val?.seconds) return val.seconds * 1000; // Firestore Timestamp
            if (val instanceof Date) return val.getTime();
            if (typeof val === 'string') return new Date(val).getTime();
            return 0;
        };
        const timeA = getTime(a.createdAt) || getTime(a.submittedAt) || 0;
        const timeB = getTime(b.createdAt) || getTime(b.submittedAt) || 0;
        return timeB - timeA;
      });

      setApplications(appsData);
      
      // OPTIMIZATION: Create a "lean" version for caching that excludes large base64 images
      // This prevents hitting LocalStorage 5MB limit and speeds up parsing/loading significantly.
      const leanAppsData = appsData.map(app => ({
          ...app,
          signature: undefined,
          nrcImageFront: undefined,
          nrcImageBack: undefined,
          latestPayslip: undefined
      }));

      try {
          localStorage.setItem('xtenda_admin_apps_cache', JSON.stringify(leanAppsData));
      } catch (e) {
          console.warn("Failed to cache applications to localStorage (likely quota exceeded or circular ref)", e);
      }

      // Notification Logic
      if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          return;
      }
      
      const newNotifications: Notification[] = [];
      querySnapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
              const newApp = { id: change.doc.id, ...change.doc.data() } as ApplicationFormData;
              const fullName = `${newApp.firstName || ''} ${newApp.surname || ''}`.trim();
              const appTime = new Date(newApp.submittedAt || Date.now()).getTime();
              // Only notify if within last minute
              if (Date.now() - appTime < 60000) {
                  newNotifications.push({
                      id: `notif-${Date.now()}-${newApp.id}`,
                      message: `New application from ${fullName || 'N/A'}.`,
                      appId: newApp.id!,
                      timestamp: new Date().toISOString(),
                      read: false,
                  });
              }
          }
      });

      if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev.slice(0, 49)]);
      }
      
    }, (err) => {
      console.error("Error fetching applications: ", err);
      setError("Failed to load applications. Check your Firebase connection and permissions.");
    });

    return () => unsubscribe();
  }, []);
  
  React.useEffect(() => {
    if (!isInitialLoadRef.current) {
        try {
            localStorage.setItem('adminNotifications_v1', JSON.stringify(notifications));
        } catch (e) {
            console.warn("Failed to save notifications", e);
        }
    }
  }, [notifications]);
  
  const filteredApplications = React.useMemo(() => {
      const lowercasedQuery = searchQuery.toLowerCase();
      return applications.filter(app => {
          const matchesSearch = (
              `${app.firstName || ''} ${app.surname || ''}`.toLowerCase().includes(lowercasedQuery) ||
              app.phone?.toLowerCase().includes(lowercasedQuery) ||
              app.nrc?.toLowerCase().includes(lowercasedQuery)
          );
          
          const matchesStatus = filterStatus ? app.status === filterStatus : true;

          return matchesSearch && matchesStatus;
      });
  }, [searchQuery, applications, filterStatus]);
  
  // Close notifications on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            isNotificationsOpen &&
            notificationsPanelRef.current &&
            !notificationsPanelRef.current.contains(event.target as Node) &&
            bellButtonRef.current &&
            !bellButtonRef.current.contains(event.target as Node)
        ) {
            setIsNotificationsOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);


  const openDeleteModal = (id: string | undefined, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!id) return;
      setApplicationToDelete(id);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (!applicationToDelete) return;
      
      try {
          await deleteDoc(doc(firestore, 'applications', applicationToDelete));
          setIsDeleteModalOpen(false);
          setApplicationToDelete(null);
      } catch (error) {
          console.error("Error deleting application: ", error);
          alert("Failed to delete the application. Please try again.");
      }
  };
  
  const handleToggleNotifications = () => {
    const nextIsOpen = !isNotificationsOpen;
    setIsNotificationsOpen(nextIsOpen);
    if (nextIsOpen) {
        setTimeout(() => {
             setNotifications(currentNotifications => 
                currentNotifications.map(n => ({ ...n, read: true }))
             );
        }, 500);
    }
  };
  
  const handleNotificationClick = (appId: string) => {
      onSelectApplication(appId);
      setIsNotificationsOpen(false);
  };
  
  const handleCopyLink = (view: string) => {
      const url = `${window.location.origin}/?view=${view}`;
      navigator.clipboard.writeText(url).then(() => {
          setCopiedLink(view);
          setTimeout(() => setCopiedLink(null), 2000);
      });
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const timeSince = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };


  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-md">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    <span className="text-orange-500">Ka Bwangu Bwangu</span> Admin Dashboard
                </h1>
                <p className="text-gray-500 mt-1">Manage incoming loan applications</p>
            </div>
            <div className="flex items-center gap-4">
                 <div className="relative">
                    <button
                        ref={bellButtonRef}
                        onClick={handleToggleNotifications}
                        className="text-gray-500 hover:text-orange-500 transition h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                        aria-label={`Notifications (${unreadCount} unread)`}
                    >
                        <i className="fa-solid fa-bell text-xl" aria-hidden="true"></i>
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 block h-3 w-3 transform -translate-y-1/4 translate-x-1/4">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                            </span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <div
                            ref={notificationsPanelRef}
                            role="region"
                            aria-labelledby="notifications-title"
                            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border z-50 overflow-hidden animate-fade-in-down"
                        >
                            <h2 id="notifications-title" className="sr-only">New Application Notifications</h2>
                            <div className="p-3 border-b font-bold text-gray-700">Notifications</div>
                            {notifications.length > 0 ? (
                                <div className="max-h-96 overflow-y-auto" role="list">
                                {notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif.appId)}
                                        className="p-3 border-b border-gray-100 hover:bg-orange-50 cursor-pointer"
                                        role="listitem"
                                        tabIndex={0}
                                        aria-label={`View application from ${notif.message.replace('New application from ', '').replace('.', '')}`}
                                    >
                                        <p className={`text-sm ${!notif.read ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                                            {!notif.read && <span className="inline-block h-2 w-2 rounded-full bg-orange-500 mr-2" aria-hidden="true"></span>}
                                            {notif.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{timeSince(notif.timestamp)}</p>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="p-4 text-sm text-gray-500 text-center">No notifications yet.</p>
                            )}
                        </div>
                    )}
                </div>
                <button 
                    onClick={onExitAdmin} 
                    className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                >
                    <i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Exit
                </button>
            </div>
        </header>

        {/* Quick Links Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="p-4 border-b bg-orange-50">
                <h3 className="font-bold text-orange-800 flex items-center gap-2">
                    <i className="fa-solid fa-share-nodes"></i> Quick Links for Clients
                </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                    onClick={() => handleCopyLink('employers')}
                    className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition group relative"
                >
                    <i className="fa-solid fa-building-columns text-2xl text-blue-500 mb-2"></i>
                    <span className="text-sm font-semibold text-gray-700">Eligible Employers</span>
                    {copiedLink === 'employers' && <span className="absolute inset-0 bg-blue-100 flex items-center justify-center text-blue-700 font-bold rounded-lg animate-fade-in"><i className="fa-solid fa-check mr-1"></i> Copied</span>}
                </button>
                 <button 
                    onClick={() => handleCopyLink('check-status')}
                    className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-green-50 hover:border-green-300 transition group relative"
                >
                    <i className="fa-solid fa-magnifying-glass text-2xl text-green-500 mb-2"></i>
                    <span className="text-sm font-semibold text-gray-700">My Loan Status</span>
                    {copiedLink === 'check-status' && <span className="absolute inset-0 bg-green-100 flex items-center justify-center text-green-700 font-bold rounded-lg animate-fade-in"><i className="fa-solid fa-check mr-1"></i> Copied</span>}
                </button>
                 <button 
                    onClick={() => handleCopyLink('calculator')}
                    className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition group relative"
                >
                    <i className="fa-solid fa-calculator text-2xl text-orange-500 mb-2"></i>
                    <span className="text-sm font-semibold text-gray-700">Loan Calculator</span>
                    {copiedLink === 'calculator' && <span className="absolute inset-0 bg-orange-100 flex items-center justify-center text-orange-700 font-bold rounded-lg animate-fade-in"><i className="fa-solid fa-check mr-1"></i> Copied</span>}
                </button>
                 <button 
                    onClick={() => handleCopyLink('contact')}
                    className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition group relative"
                >
                    <i className="fa-solid fa-address-book text-2xl text-purple-500 mb-2"></i>
                    <span className="text-sm font-semibold text-gray-700">Contact Us</span>
                    {copiedLink === 'contact' && <span className="absolute inset-0 bg-purple-100 flex items-center justify-center text-purple-700 font-bold rounded-lg animate-fade-in"><i className="fa-solid fa-check mr-1"></i> Copied</span>}
                </button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-700">All Applications ({filteredApplications.length})</h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <input 
                            type="text"
                            placeholder="Search by name, phone, or NRC..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-full bg-gray-50 focus:ring-2 focus:ring-orange-500"
                            aria-label="Search applications"
                        />
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={filterStatus || ''}
                            onChange={(e) => setFilterStatus(e.target.value === '' ? null : e.target.value)}
                            className="w-full sm:w-40 pl-4 pr-10 py-2 border rounded-full bg-gray-50 focus:ring-2 focus:ring-green-500 appearance-none"
                            aria-label="Filter by status"
                        >
                            <option value="">All Statuses</option>
                            <option value="New">New</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                         <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true"></i>
                    </div>
                </div>
            </div>
            
            {error && (
                 <div className="p-12 text-center text-red-600 bg-red-50">
                    <i className="fa-solid fa-triangle-exclamation fa-4x mb-4 text-red-300" aria-hidden="true"></i>
                    <p className="text-xl font-semibold">An Error Occurred</p>
                    <p>{error}</p>
                </div>
            )}

            {!error && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold text-gray-600">Date Submitted</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-gray-600">Applicant Name</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-gray-600 hidden md:table-cell">Employer</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-gray-600 hidden sm:table-cell">Phone</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-gray-600">Status</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500">
                                        <i className="fa-solid fa-inbox fa-3x mb-4 text-gray-300" aria-hidden="true"></i>
                                        <p>{searchQuery || filterStatus ? 'No applications match your current filters.' : 'No applications received yet.'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredApplications.map((app) => (
                                    <tr 
                                        key={app.id} 
                                        onClick={() => onSelectApplication(app.id!)}
                                        className="hover:bg-orange-50 cursor-pointer transition"
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`View application from ${app.firstName || ''} ${app.surname || ''} with status ${app.status || 'New'}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{`${app.firstName || ''} ${app.surname || ''}`.trim()}</td>
                                        <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{app.employer}</td>
                                        <td className="px-6 py-4 text-gray-600 hidden sm:table-cell">{app.phone}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(app.status)}`}>
                                                {app.status || 'New'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onSelectApplication(app.id!); }} 
                                                className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                                                aria-label={`View application details for ${app.firstName || ''} ${app.surname || ''}`}
                                            >
                                                View
                                            </button>
                                            <button 
                                                onClick={(e) => openDeleteModal(app.id, e)} 
                                                className="text-red-500 hover:text-red-700"
                                                title="Delete Application"
                                                aria-label={`Delete application from ${app.firstName || ''} ${app.surname || ''}`}
                                            >
                                                <i className="fa-solid fa-trash" aria-hidden="true"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
                <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <i className="fa-solid fa-triangle-exclamation text-3xl text-red-600"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Application?</h3>
                    <p className="text-gray-500">
                        Are you sure you want to permanently delete this application? This action cannot be undone.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition shadow-md"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
      )}
      
      <style>{`
        @keyframes fade-in-down { 
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.2s ease-out forwards;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;