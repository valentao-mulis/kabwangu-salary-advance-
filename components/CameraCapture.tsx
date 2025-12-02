import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraCaptureProps {
    onCapture: (blob: Blob | null) => void;
    title: string;
    guideType?: 'nrc';
}

const CameraCapture = ({ onCapture, title, guideType }: CameraCaptureProps) => {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [error, setError] = useState<string | null>(null);
    const [isFlashing, setIsFlashing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    useEffect(() => {
        const startCamera = async () => {
            if (isCameraOpen) {
                setIsLoading(true);
                setError(null);
                stopCamera(); // Stop any existing stream before starting a new one

                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode,
                            width: { ideal: 1920 },
                            height: { ideal: 1080 }
                        }
                    });
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        // The 'loadeddata' event is often more reliable
                        videoRef.current.onloadeddata = () => {
                             videoRef.current?.play().catch(e => console.error("Video play failed:", e));
                             setIsLoading(false);
                        };
                    }
                } catch (err) {
                    console.error("Camera access error:", err);
                    let errorMessage = "Could not access camera. Please check permissions.";
                    if (err instanceof DOMException) {
                        if (err.name === 'NotAllowedError') errorMessage = "Camera access denied. Please allow permissions in your browser settings.";
                        else if (err.name === 'NotFoundError') errorMessage = "No camera found on this device.";
                    }
                    setError(errorMessage);
                    setIsCameraOpen(false);
                    setIsLoading(false);
                }
            } else {
                stopCamera();
            }
        };

        startCamera();

        // Cleanup on component unmount
        return () => {
            stopCamera();
        };
    }, [isCameraOpen, facingMode, stopCamera]);

    // Focus trap for accessibility
    useEffect(() => {
        if (isCameraOpen && modalRef.current) {
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
                    setIsCameraOpen(false);
                }
            };

            firstElement?.focus();
            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isCameraOpen]);


    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            setIsFlashing(true);
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                if (facingMode === 'user') {
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                }
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                setTimeout(() => {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const objectUrl = URL.createObjectURL(blob);
                            setCapturedImage(objectUrl);
                            onCapture(blob);
                        }
                        setIsFlashing(false);
                        setIsCameraOpen(false);
                    }, 'image/jpeg', 0.9);
                }, 150);
            }
        }
    };

    const retakePhoto = () => {
        if (capturedImage) URL.revokeObjectURL(capturedImage);
        setCapturedImage(null);
        onCapture(null);
        setError(null);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            setError(null);
            const objectUrl = URL.createObjectURL(file);
            setCapturedImage(objectUrl);
            onCapture(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <i className="fa-solid fa-id-card text-orange-500" aria-hidden="true"></i>
                {title}
            </h3>
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                    {error}
                </div>
            )}
            <div className="w-full p-4 border-2 border-gray-300 border-dashed rounded-xl text-center bg-gray-50">
                {!capturedImage ? (
                    <div className="py-6">
                        <div className="mx-auto w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <i className="fa-solid fa-camera fa-3x" aria-hidden="true"></i>
                        </div>
                        <p className="text-gray-500 mb-4 text-sm">Provide a clear photo of your {title.toLowerCase()}.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button type="button" onClick={() => setIsCameraOpen(true)} className="bg-orange-500 text-white font-bold py-3 px-6 rounded-full hover:bg-orange-600 transition duration-300 inline-flex items-center gap-2 shadow-md">
                                <i className="fa-solid fa-camera" aria-hidden="true"></i>
                                Open Camera
                            </button>
                            <button type="button" onClick={handleUploadClick} className="bg-gray-600 text-white font-bold py-3 px-6 rounded-full hover:bg-gray-700 transition duration-300 inline-flex items-center gap-2 shadow-md">
                                <i className="fa-solid fa-upload" aria-hidden="true"></i>
                                Upload Photo
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="relative rounded-lg overflow-hidden shadow-md mx-auto max-w-xs">
                            <img src={capturedImage} alt={`Captured ${title}`} className="w-full h-auto" />
                            <div className="absolute bottom-3 right-3 bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <i className="fa-solid fa-check-circle" aria-hidden="true"></i> Provided
                            </div>
                        </div>
                        <button type="button" onClick={retakePhoto} className="mt-6 bg-gray-700 text-white font-bold py-2 px-6 rounded-full hover:bg-gray-800 transition duration-300 inline-flex items-center gap-2">
                            <i className="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
                            Change Photo
                        </button>
                    </div>
                )}
            </div>

            {isCameraOpen && (
                <div
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="camera-modal-title"
                    className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in"
                >
                    <h3 id="camera-modal-title" className="sr-only">Camera View</h3>
                    <div className={`absolute inset-0 bg-white z-[102] pointer-events-none transition-opacity duration-300 ease-out ${isFlashing ? 'opacity-100' : 'opacity-0'}`}></div>
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-[101]">
                        <button type="button" onClick={() => setIsCameraOpen(false)} aria-label="Close camera" className="text-white bg-black/40 backdrop-blur-md p-3 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/60 transition">
                            <i className="fa-solid fa-times text-xl" aria-hidden="true"></i>
                        </button>
                        <button type="button" onClick={switchCamera} aria-label="Switch camera" className="text-white bg-black/40 backdrop-blur-md p-3 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/60 transition">
                            <i className="fa-solid fa-rotate text-xl" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                        {isLoading && (
                            <div className="text-white flex flex-col items-center gap-3 z-10">
                                <i className="fa-solid fa-circle-notch fa-spin fa-3x text-orange-500" aria-hidden="true"></i>
                                <p className="text-lg font-medium">Starting Camera...</p>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            className={`absolute w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${isLoading ? 'hidden' : ''}`}
                            aria-label="Live camera feed"
                        />
                        {!isLoading && guideType === 'nrc' && (
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 text-center">
                                <div className="absolute top-10 md:top-20 text-white bg-black/50 p-3 rounded-lg">
                                    <h4 className="font-bold text-lg">Position NRC inside the frame</h4>
                                    <p className="text-sm">Ensure the image is clear and all text is readable.</p>
                                </div>
                                <div
                                    className="w-[90%] max-w-md aspect-[1.586] rounded-2xl border-2 border-dashed border-white/80"
                                    style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)' }}
                                ></div>
                            </div>
                        )}
                    </div>
                    <div className="bg-black/80 backdrop-blur-sm p-8 flex justify-center items-center z-[101] pb-12">
                        <button
                            type="button"
                            onClick={capturePhoto}
                            disabled={isLoading}
                            className="bg-white rounded-full h-20 w-20 flex items-center justify-center p-1.5 shadow-lg transition-transform active:scale-90"
                            aria-label="Capture photo"
                        >
                            <div className="w-full h-full rounded-full border-[3px] border-gray-800 bg-white hover:bg-gray-100 transition"></div>
                        </button>
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden"></canvas>
            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default CameraCapture;
