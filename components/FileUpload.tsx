import React from 'react';

interface FileUploadProps {
    label: string;
    fileType: string;
    onFileSelect: (file: File | null) => void;
}

const FileUpload = ({ label, fileType, onFileSelect }: FileUploadProps) => {
  const [fileName, setFileName] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    } else {
      setFileName('');
      onFileSelect(null);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          <i className="fa-solid fa-cloud-arrow-up mx-auto h-12 w-12 text-gray-400"></i>
          <div className="flex text-sm text-gray-600">
            <button
              type="button"
              onClick={handleButtonClick}
              className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none"
            >
              <span>Upload a file</span>
              <input ref={fileInputRef} type="file" accept={fileType} className="sr-only" onChange={handleFileChange} />
            </button>
            <p className="pl-1">or drag and drop</p>
          </div>
          {fileName ? (
            <p className="text-xs text-green-600 font-semibold">{fileName}</p>
          ) : (
             <p className="text-xs text-gray-500">{fileType === 'application/pdf' ? 'PDF only' : 'Images only'}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
