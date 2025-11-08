import React from 'react';
import AdminChatbot from './AdminChatbot';

interface AdminViewProps {
    data: any;
    onBack?: () => void;
}

const AdminView = ({ data, onBack }: AdminViewProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editableData, setEditableData] = React.useState(data);
  const [saveMessage, setSaveMessage] = React.useState<{text: string, type: 'success'|'error'} | null>(null);
  const [errors, setErrors] = React.useState<{[key: string]: string}>({});

  // Update local state when data prop changes (e.g. when switching between apps)
  React.useEffect(() => {
      setEditableData(data);
      setIsEditing(false);
      setSaveMessage(null);
      setErrors({});
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableData((prev: any) => ({ ...prev, [name]: value }));
    // Clear error for this field when edited
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  const validate = () => {
      const newErrors: {[key: string]: string} = {};
      
      if (!editableData.fullNames?.trim()) newErrors.fullNames = "Full Name is required.";
      
      if (!editableData.nrc?.trim()) {
          newErrors.nrc = "NRC is required.";
      } else {
           // Basic loosely strict check: at least 9 digits, allows typical separators like / or -
           const nrcDigits = editableData.nrc.replace(/\D/g, '');
           if (nrcDigits.length < 9) newErrors.nrc = "Invalid NRC format (too short).";
      }

      if (!editableData.phone?.trim()) {
          newErrors.phone = "Phone is required.";
      } else {
          // Must have at least 10 digits
          if (editableData.phone.replace(/\D/g,'').length < 10) newErrors.phone = "Phone must have at least 10 digits.";
      }

      if (!editableData.email?.trim()) {
           newErrors.email = "Email is required.";
      } else if (!/\S+@\S+\.\S+/.test(editableData.email)) {
           newErrors.email = "Invalid email address format.";
      }

      if (!editableData.employer?.trim()) newErrors.employer = "Employer is required.";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
      if (!validate()) {
          setSaveMessage({ text: "Please fix validation errors before saving.", type: 'error' });
          // Clear error message after 3 seconds
          setTimeout(() => setSaveMessage((prev) => prev?.type === 'error' ? null : prev), 3000);
          return;
      }

      try {
          // 1. Get existing applications from local storage
          const existingData = localStorage.getItem('xtenda_applications');
          if (existingData) {
              let applications = JSON.parse(existingData);
              
              // 2. Find index of current application
              const index = applications.findIndex((app: any) => app.id === editableData.id);
              
              if (index !== -1) {
                  // 3. Update the application in the array
                  applications[index] = editableData;
                  
                  // 4. Save back to local storage
                  localStorage.setItem('xtenda_applications', JSON.stringify(applications));
                  
                  setIsEditing(false);
                  setSaveMessage({ text: "Application updated successfully.", type: 'success' });
                  
                  // Clear success message after 3 seconds
                  setTimeout(() => setSaveMessage(null), 3000);
              } else {
                  throw new Error("Application not found in storage.");
              }
          } else {
               throw new Error("No local storage data found.");
          }
      } catch (error) {
          console.error("Failed to save application:", error);
          setSaveMessage({ text: "Failed to save changes. Please try again.", type: 'error' });
      }
  };
  
  const handleCancel = () => {
    setEditableData(data); // Revert to original data
    setIsEditing(false);
    setSaveMessage(null);
    setErrors({});
  };

  const renderField = (label: string, fieldName: string, type = 'text') => {
    const value = editableData[fieldName];
    const error = errors[fieldName];
    let content;

    if (isEditing && type !== 'readonly') {
        if (type === 'radio') {
            content = (
                <div className="flex gap-4 mt-1">
                    <label className="flex items-center"><input type="radio" name={fieldName} value="Permanent" onChange={handleInputChange} checked={value === 'Permanent'} className="mr-2 h-4 w-4"/>Permanent</label>
                    <label className="flex items-center"><input type="radio" name={fieldName} value="Contract" onChange={handleInputChange} checked={value === 'Contract'} className="mr-2 h-4 w-4"/>Contract</label>
                </div>
            );
        } else if (type === 'checkbox') {
            content = (
                <input
                    type="checkbox"
                    name={fieldName}
                    checked={!!value}
                    onChange={(e) => setEditableData((prev: any) => ({...prev, [fieldName]: e.target.checked }))}
                    className="h-5 w-5 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
            );
        } else {
            content = (
                <>
                    <input
                        type={type}
                        name={fieldName}
                        value={value || ''}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </>
            );
        }
    } else {
        content = value ? (typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value) : <span className="text-gray-400">Not provided</span>;
    }

    return (
        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-start">
            <dt className="text-sm font-medium text-gray-500 pt-2">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{content}</dd>
        </div>
    );
  };

  const handleDownloadCSV = () => {
    const headers = ['Field', 'Value'];
    const rows = Object.entries(editableData).map(([key, value]) => {
      let formattedValue;
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      if (typeof value === 'boolean') formattedValue = value ? 'Yes' : 'No';
      else if (typeof value === 'string' && value.startsWith('data:')) formattedValue = 'File Data (See Admin Panel)';
      else formattedValue = `"${String(value || '').replace(/"/g, '""')}"`;
      return [formattedKey, formattedValue];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const safeFileName = (editableData.fullNames || 'submission').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("download", `application_${safeFileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
      switch(status?.toLowerCase()) {
          case 'approved': return 'bg-green-100 text-green-800 border-green-200';
          case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
          case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case 'reviewing': return 'bg-blue-100 text-blue-800 border-blue-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200'; // New or unknown
      }
  };

  return (
    <div className="min-h-screen bg-gray-200 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white shadow-md p-4 rounded-t-lg border-b-4 border-orange-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
                {onBack && (
                    <button onClick={onBack} className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-gray-200 transition shrink-0" title="Back to Dashboard">
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                        Application Review
                      </h1>
                      {/* Status Badge / Editor */}
                      {isEditing ? (
                          <select 
                              name="status" 
                              value={editableData.status || 'New'} 
                              onChange={handleInputChange}
                              className="text-sm font-bold p-1 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500"
                          >
                              <option value="New">New</option>
                              <option value="Pending">Pending</option>
                              <option value="Reviewing">Reviewing</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                          </select>
                      ) : (
                          <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getStatusColor(editableData.status || 'New')}`}>
                              {editableData.status || 'New'}
                          </span>
                      )}
                  </div>
                  <p className="text-sm text-gray-500">Applicant: <span className="font-semibold text-gray-700">{editableData.fullNames || 'N/A'}</span></p>
                </div>
            </div>
             <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="bg-green-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-700 transition duration-300 flex items-center gap-2 text-sm">
                            <i className="fa-solid fa-save"></i>Save
                        </button>
                        <button onClick={handleCancel} className="bg-gray-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-gray-600 transition duration-300 flex items-center gap-2 text-sm">
                            <i className="fa-solid fa-times"></i>Cancel
                        </button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center gap-2 text-sm">
                        <i className="fa-solid fa-pencil"></i>Edit
                    </button>
                )}
                 <button onClick={handleDownloadCSV} className="bg-gray-700 text-white font-bold py-2 px-3 rounded-lg hover:bg-gray-800 transition duration-300 flex items-center gap-2 text-sm">
                  <i className="fa-solid fa-download"></i>CSV
                </button>
            </div>
        </header>
        
        <div className="bg-red-700 text-white text-center p-2 font-bold text-sm flex justify-between items-center px-4">
            <span>CONFIDENTIAL CLIENT DATA</span>
            {saveMessage && (
                <span className={`text-xs px-2 py-0.5 rounded ${saveMessage.type === 'success' ? 'bg-green-500' : 'bg-red-900'} animate-pulse`}>
                    {saveMessage.text}
                </span>
            )}
        </div>

        <main className="bg-white rounded-b-lg shadow-lg p-6 md:p-8 space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Personal Details</h2>
              <dl className="divide-y divide-gray-200">
                  {renderField("Date of Application", "dateOfApplication", "date")}
                  {renderField("Full Names", "fullNames")}
                  {renderField("NRC", "nrc")}
                  {renderField("Employee Number", "employeeNumber")}
                  {renderField("Employer", "employer")}
                  {renderField("Phone", "phone", "tel")}
                  {renderField("Email", "email", "email")}
                  {renderField("Employment Address", "employmentAddress")}
                  {renderField("Employment Terms", "employmentTerms", "radio")}
              </dl>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">A Picture of Yourself</h2>
              <div className="mt-4">{editableData.selfie ? <div className="border rounded-lg p-2 inline-block bg-gray-50 shadow-inner"><img src={editableData.selfie} alt="Client Selfie" className="max-w-sm w-full" /></div> : <p className="text-gray-500">No selfie was provided.</p>}</div>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">NCD Verification Document</h2>
              <div className="mt-4">{editableData.ncdVerification ? <a href={editableData.ncdVerification} download={`NCD_Verification_${editableData.fullNames?.replace(/\s/g, '_') || 'applicant'}.pdf`} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center gap-2 w-max"><i className="fa-solid fa-file-pdf"></i>Download PDF</a> : <p className="text-gray-500">No NCD Verification document was uploaded.</p>}</div>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Next of Kin Details</h2>
               <dl className="divide-y divide-gray-200">
                  {renderField("Full Names", "kinFullNames")}
                  {renderField("NRC", "kinNrc")}
                  {renderField("Relationship", "kinRelationship")}
                  {renderField("Phone", "kinPhone", "tel")}
                  {renderField("Residential Address", "kinResidentialAddress")}
              </dl>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Salary Bank Details</h2>
              <dl className="divide-y divide-gray-200">
                  {renderField("Bank Name", "bankName")}
                  {renderField("Branch Name", "branchName")}
                  {renderField("Account Number", "accountNumber")}
                  {renderField("Account Names", "accountNames")}
              </dl>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Declaration & Signature</h2>
              <dl className="divide-y divide-gray-200">{renderField('Agreed to Terms', 'declarationAgreed', 'checkbox')}</dl>
              <div className="mt-4"><p className="text-sm font-medium text-gray-500 mb-2">Client Signature:</p>{editableData.signature ? <div className="border rounded-lg p-2 inline-block bg-gray-50 shadow-inner"><img src={editableData.signature} alt="Client Signature" className="max-w-xs" /></div> : <p className="text-red-500 font-bold">No signature was provided.</p>}</div>
            </section>
        </main>
      </div>
      <AdminChatbot applicationData={editableData} />
    </div>
  );
};

export default AdminView;