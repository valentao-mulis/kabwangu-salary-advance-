import React from 'react';
import { firestore } from '../firebaseConfig';
import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

declare var QRCode: any;

interface FileUploadProps {
    label: string;
    fileType: string;
    onFileSelect: (file: File | null) => void;
}

const MAX_FILE_SIZE_MB = 0.5; // Reduced to 500KB to stay well under Firestore's 1MB doc limit.
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const RemoteUploadModal = ({ sessionId, onClose }: { sessionId: string; onClose: () => void; }) => {
    const qrCodeRef = React.useRef<HTMLDivElement>(null);
    const modalRef = React.useRef<HTMLDivElement>(null);
    const uploadUrl = `${window.location.origin}/upload?session=${sessionId}&type=payslip`;

    React.useEffect(() => {
        if (qrCodeRef.current && typeof QRCode !== 'undefined') {
            qrCodeRef.current.innerHTML = ''; // Clear previous QR code
            new QRCode(qrCodeRef.current, {
                text: uploadUrl,
                width: 192,
                height: 192,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, [uploadUrl]);

    // Focus trap for accessibility
    React.useEffect(() => {
        if (modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) { // Shift+Tab
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            e.preventDefault();
                        }
                    } else { // Tab
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            e.preventDefault();
                        }
                    }
                } else if (e.key === 'Escape') {
                    onClose();
                }
            };

            firstElement?.focus();
            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [onClose]);
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(uploadUrl).then(() => {
            alert('Link copied to clipboard!');
        });
    };

    return (
        <div 
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="remote-upload-title"
            className="fixed inset-0 z-[101] bg-black/60 flex items-center justify-center p-4 animate-modal-fade" 
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative text-center" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 text-gray-400 hover:text-gray-800">
                    <i className="fa-solid fa-times text-2xl" aria-hidden="true"></i>
                </button>
                <h3 id="remote-upload-title" className="text-2xl font-bold text-gray-800 mb-2">Upload From Another Device</h3>
                <p className="text-gray-600 mb-6">Scan this QR code with your other device's camera to upload the file.</p>
                <div ref={qrCodeRef} className="flex justify-center mb-6 p-4 border rounded-lg bg-gray-50"></div>
                <p className="text-gray-500 text-sm mb-4">Or use this link:</p>
                <div className="flex items-center gap-2">
                    <input type="text" readOnly value={uploadUrl} aria-label="Remote upload link" className="w-full p-2 border rounded bg-gray-100 text-sm" />
                    <button onClick={handleCopyLink} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700">Copy</button>
                </div>
                <p className="text-xs text-gray-400 mt-6">Listening for upload... this window will close automatically.</p>
            </div>
        </div>
    );
};

const FileUpload = ({ label, fileType, onFileSelect }: FileUploadProps) => {
  const [fileName, setFileName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [uploadSessionId, setUploadSessionId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const unsubscribeRef = React.useRef<Unsubscribe | null>(null);

  const dataURLtoFile = (dataurl: string, filename: string): File | null => {
      try {
        let arr = dataurl.split(','),
            mimeMatch = arr[0].match(/:(.*?);/),
            mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream',
            bstr = atob(arr[1]), 
            n = bstr.length, 
            u8arr = new Uint8Array(n);
            
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new File([u8arr], filename, {type:mime});
      } catch (e) {
        console.error("Error converting Data URL to File:", e);
        return null;
      }
  }

  const validateAndProcessFile = (file: File | null) => {
      if (!file) return;

      setIsProcessing(true);
      setError(null);

      // 1. Validate Size
      if (file.size > MAX_FILE_SIZE_BYTES) {
          setError(`File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
          setFileName('');
          onFileSelect(null);
          setIsProcessing(false);
          return;
      }

      // 2. Validate Type
      const acceptedTypes = fileType.split(',').map(t => t.trim());
      const isTypeValid = acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
              const baseType = type.split('/')[0];
              return file.type.startsWith(baseType + '/');
          }
          return file.type === type;
      });

      if (!isTypeValid && fileType !== '*') {
           setError(`Invalid file type.`);
           setFileName('');
           onFileSelect(null);
           setIsProcessing(false);
           return;
      }

      // Valid, notify parent
      setTimeout(() => {
        setFileName(file.name);
        onFileSelect(file);
        setIsProcessing(false);
      }, 500);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        validateAndProcessFile(file);
    }
  };
  
  const handleRemoteUpload = async () => {
    const sessionId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setUploadSessionId(sessionId);
    
    const sessionDocRef = doc(firestore, 'file-transfers', sessionId);
    await setDoc(sessionDocRef, { status: 'pending', createdAt: new Date() });

    setIsModalOpen(true);
    
    unsubscribeRef.current = onSnapshot(sessionDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data()?.status === 'completed') {
        const fileDataUrl = docSnap.data()?.fileData;
        if (fileDataUrl) {
           const file = dataURLtoFile(fileDataUrl, docSnap.data()?.fileName || 'remote-upload.jpg');
           validateAndProcessFile(file);
           closeModal();
        }
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setUploadSessionId(null);
    if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (isProcessing) return;
      
      const file = e.dataTransfer.files?.[0];
      if (file) {
          validateAndProcessFile(file);
      }
  };

  const handleButtonClick = () => {
    if (!isProcessing) fileInputRef.current?.click();
  };

  return (
    <div>
      <span className="sr-only" aria-live="polite">
        {error ? `Error: ${error}` : (fileName ? `File ${label} selected: ${fileName}` : `File ${label} not selected.`)}
      </span>
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-3 mb-6">
          <i className="fa-solid fa-file-invoice-dollar text-orange-500" aria-hidden="true"></i>
          {label}
      </h3>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-all duration-200 relative overflow-hidden ${isDragging ? 'border-orange-500 bg-orange-50' : (error ? 'border-red-300 bg-red-50' : 'border-gray-300')}`}
      >
        {isProcessing ? (
            <div className="w-full flex flex-col items-center justify-center py-4 space-y-3">
                 <i className="fa-solid fa-circle-notch fa-spin text-2xl text-orange-500" aria-hidden="true"></i>
                 <p className="text-sm text-orange-600 font-bold">Processing...</p>
            </div>
        ) : (
            <div className="space-y-1 text-center">
            {error ? (
                <i className="fa-solid fa-triangle-exclamation mx-auto h-12 w-12 text-red-500 text-3xl pt-2" aria-hidden="true"></i>
            ) : (
                <i className={`fa-solid ${fileName ? 'fa-file-circle-check text-green-500' : 'fa-cloud-arrow-up text-gray-400'} mx-auto h-12 w-12 text-3xl pt-2 transition-colors duration-300`} aria-hidden="true"></i>
            )}
            
            <div className="flex text-sm text-gray-600 flex-col">
                <button
                type="button"
                onClick={handleButtonClick}
                className="relative cursor-pointer bg-transparent rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none"
                >
                <span>{fileName ? 'Change file' : 'Upload a file'}</span>
                <input ref={fileInputRef} type="file" accept={fileType} className="sr-only" onChange={handleFileChange} />
                </button>
                {!fileName && <p className="pl-1 mt-1">or drag and drop</p>}
            </div>
            
            {error ? (
                <p className="text-sm text-red-600 font-semibold">{error}</p>
            ) : fileName ? (
                <p className="text-sm text-green-600 font-semibold break-all">{fileName}</p>
            ) : (
                <p className="text-xs text-gray-500">
                    {fileType.includes('pdf') ? 'PDF or Images' : 'Supported files'} up to {MAX_FILE_SIZE_MB}MB
                </p>
            )}
            </div>
        )}
      </div>
      <div className="text-center mt-3">
        <button type="button" onClick={handleRemoteUpload} className="text-sm text-gray-500 hover:text-orange-600 font-medium p-1">
          <i className="fa-solid fa-qrcode mr-1" aria-hidden="true"></i>
          Upload from another device
        </button>
      </div>
      {isModalOpen && uploadSessionId && <RemoteUploadModal sessionId={uploadSessionId} onClose={closeModal} />}
    </div>
  );
};

export default FileUpload;