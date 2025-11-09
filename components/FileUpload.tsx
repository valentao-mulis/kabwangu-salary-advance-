import React from 'react';

interface FileUploadProps {
    label: string;
    fileType: string;
    onFileSelect: (file: File | null) => void;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FileUpload = ({ label, fileType, onFileSelect }: FileUploadProps) => {
  const [fileName, setFileName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
      setError(null);

      // 1. Validate Size
      if (file.size > MAX_FILE_SIZE_BYTES) {
          setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
          setFileName('');
          onFileSelect(null);
          return;
      }

      // 2. Validate Type (basic check based on the 'fileType' prop)
      // fileType is something like 'application/pdf' or 'image/*'
      const acceptedTypes = fileType.split(',').map(t => t.trim());
      const isTypeValid = acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
              // Handle wildcards like 'image/*'
              const baseType = type.split('/')[0];
              return file.type.startsWith(baseType + '/');
          }
          return file.type === type;
      });

      if (!isTypeValid && fileType !== '*') {
           setError(`Invalid file type. Please upload ${fileType === 'application/pdf' ? 'a PDF' : 'an image'}.`);
           setFileName('');
           onFileSelect(null);
           return;
      }

      // Valid
      setFileName(file.name);
      onFileSelect(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        validateAndSetFile(file);
    } else {
      setFileName('');
      onFileSelect(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      const file = e.dataTransfer.files?.[0];
      if (file) {
          validateAndSetFile(file);
      }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors duration-200 ${isDragging ? 'border-orange-500 bg-orange-50' : (error ? 'border-red-300 bg-red-50' : 'border-gray-300')}`}
      >
        <div className="space-y-1 text-center">
          {error ? (
               <i className="fa-solid fa-triangle-exclamation mx-auto h-12 w-12 text-red-500 text-3xl pt-2"></i>
          ) : (
               <i className={`fa-solid ${fileName ? 'fa-file-circle-check text-green-500' : 'fa-cloud-arrow-up text-gray-400'} mx-auto h-12 w-12 text-3xl pt-2`}></i>
          )}
          
          <div className="flex text-sm text-gray-600 flex-col">
            <button
              type="button"
              onClick={handleButtonClick}
              className="relative cursor-pointer bg-transparent rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none"
            >
              <span>Upload a file</span>
              <input ref={fileInputRef} type="file" accept={fileType} className="sr-only" onChange={handleFileChange} />
            </button>
            <p className="pl-1 mt-1">or drag and drop</p>
          </div>
          
          {error ? (
              <p className="text-sm text-red-600 font-semibold">{error}</p>
          ) : fileName ? (
            <p className="text-sm text-green-600 font-semibold break-all">{fileName}</p>
          ) : (
             <p className="text-xs text-gray-500">
                 {fileType === 'application/pdf' ? 'PDF only' : 'Images (JPG, PNG)'} up to {MAX_FILE_SIZE_MB}MB
             </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;