import React from 'react';
import { firestore } from '../firebaseConfig';
import FileUpload from './FileUpload';
import CameraCapture from './CameraCapture';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const RemoteUpload = () => {
    const [sessionData, setSessionData] = React.useState<{ id: string; type: 'payslip' | 'selfie' } | null>(null);
    const [status, setStatus] = React.useState<'idle' | 'uploading' | 'success' | 'error' | 'not_found'>('idle');
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session');
        const uploadType = params.get('type') as 'payslip' | 'selfie';

        if (sessionId && (uploadType === 'payslip' || uploadType === 'selfie')) {
            const docRef = doc(firestore, 'file-transfers', sessionId);
            getDoc(docRef).then(docSnap => {
                if (docSnap.exists()) {
                    if (docSnap.data()?.status === 'completed') {
                        setStatus('error');
                        setError('This upload link has already been used.');
                    } else {
                        setSessionData({ id: sessionId, type: uploadType });
                    }
                } else {
                    setStatus('not_found');
                }
            });
        } else {
            setStatus('not_found');
        }
    }, []);

    // This component now sends a data URL to Firestore, as it's the simplest way to transfer
    // from a remote device. The main form will convert it back to a blob.
    const handleUpload = async (fileOrBlob: File | Blob | null) => {
        if (!fileOrBlob || !sessionData) return;

        setStatus('uploading');
        try {
            const dataUrl = await convertBlobToDataUrl(fileOrBlob);
            const compressedDataUrl = await compressDataUrl(dataUrl);
            const docRef = doc(firestore, 'file-transfers', sessionData.id);
            await updateDoc(docRef, {
                fileData: compressedDataUrl,
                fileName: fileOrBlob instanceof File ? fileOrBlob.name : 'capture.jpg',
                status: 'completed',
            });
            setStatus('success');
        } catch (err) {
            console.error('Failed to upload file:', err);
            setError('There was a problem sending the file. Please try again.');
            setStatus('error');
        }
    };
    
    const convertBlobToDataUrl = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
    };

    const compressDataUrl = (dataUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!dataUrl.startsWith('data:image')) {
                resolve(dataUrl); // Don't compress non-images like PDFs
                return;
            }

            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject('Could not get canvas context');
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8)); 
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    };

    const renderContent = () => {
        if (status === 'not_found') {
            return (
                <div className="text-center p-8">
                    <i className="fa-solid fa-link-slash text-5xl text-red-400 mb-4"></i>
                    <h2 className="text-2xl font-bold text-gray-800">Invalid Link</h2>
                    <p className="text-gray-600 mt-2">This file upload link is either invalid or has expired. Please generate a new one from the application form.</p>
                </div>
            );
        }

        if (status === 'success') {
            return (
                <div className="text-center p-8">
                    <i className="fa-solid fa-circle-check text-5xl text-green-500 mb-4"></i>
                    <h2 className="text-2xl font-bold text-gray-800">File Sent!</h2>
                    <p className="text-gray-600 mt-2">You can now close this window and return to your original device.</p>
                </div>
            );
        }

        if (status === 'uploading') {
            return (
                 <div className="text-center p-8">
                    <i className="fa-solid fa-circle-notch fa-spin text-5xl text-orange-500 mb-4"></i>
                    <h2 className="text-2xl font-bold text-gray-800">Sending File...</h2>
                    <p className="text-gray-600 mt-2">Please keep this window open.</p>
                </div>
            );
        }

        if (status === 'error') {
             return (
                <div className="text-center p-8">
                    <i className="fa-solid fa-triangle-exclamation text-5xl text-red-400 mb-4"></i>
                    <h2 className="text-2xl font-bold text-gray-800">An Error Occurred</h2>
                    <p className="text-gray-600 mt-2">{error || 'Something went wrong.'}</p>
                     <button onClick={() => window.location.reload()} className="mt-6 bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">Try Again</button>
                </div>
            );
        }

        if (sessionData?.type === 'payslip') {
            return <FileUpload label="Upload Payslip" fileType="application/pdf,image/*" onFileSelect={handleUpload} />;
        }
        
        if (sessionData?.type === 'selfie') {
            return <CameraCapture onCapture={handleUpload} title="Take Photo" />;
        }

        return (
             <div className="text-center p-8">
                <i className="fa-solid fa-spinner fa-spin text-5xl text-gray-400 mb-4"></i>
                <p className="text-gray-600 mt-2">Loading...</p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 to-green-100 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 md:p-10">
                <div className="flex items-center gap-2 mb-6">
                     <h1 className="text-2xl font-bold text-gray-800">
                        <span className="text-orange-500">Ka Bwangu Bwangu</span> 
                        <span className="text-green-600"> File Upload</span>
                    </h1>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default RemoteUpload;