import React from 'react';

interface CameraCaptureProps {
    onCapture: (imageDataUrl: string | null) => void;
}

const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('user');
  const [error, setError] = React.useState<string | null>(null);
  const [isFlashing, setIsFlashing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const stopCamera = React.useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  const startCamera = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsCameraOpen(true);

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
              facingMode: facingMode,
              width: { ideal: 1920 }, // Try for higher res
              height: { ideal: 1080 }
          } 
      });
      setStream(mediaStream);
      // Wait a tick for the video element to render in the modal
      setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setError("Could not access camera. Please check permissions.");
      setStream(null);
      setIsCameraOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stream]);

  // Effect to handle component unmount or sudden closures
  React.useEffect(() => {
      return () => {
          if (stream) {
              stream.getTracks().forEach(track => track.stop());
          }
      };
  }, [stream]);

  // Effect to restart camera if facing mode changes while open
  React.useEffect(() => {
      if (isCameraOpen && !isLoading && stream) {
          startCamera();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const switchCamera = () => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setIsFlashing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas to video's actual native resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Mirror if user facing
        if (facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Small delay to let the flash animation play before closing
        setTimeout(() => {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setCapturedImage(dataUrl);
            onCapture(dataUrl);
            setIsFlashing(false);
            stopCamera();
        }, 300);
      }
    }
  };
  
  const retakePhoto = () => {
    setCapturedImage(null);
    onCapture(null);
    startCamera();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">A picture of yourself (Selfie)</label>
       
       {error && (
         <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm flex items-center gap-2">
             <i className="fa-solid fa-triangle-exclamation"></i>
             {error}
         </div>
       )}

       {/* Initial State & Result State Holder */}
       <div className="w-full p-4 border-2 border-gray-300 border-dashed rounded-xl text-center bg-gray-50">
        
        {!capturedImage && (
            <div className="py-6">
                <div className="mx-auto w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <i className="fa-solid fa-camera fa-3x"></i>
                </div>
                <p className="text-gray-500 mb-4 text-sm">Tap below to take a clear photo of your face.</p>
                <button type="button" onClick={startCamera} className="bg-orange-500 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-600 transition duration-300 inline-flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    <i className="fa-solid fa-camera"></i>
                    Open Camera
                </button>
            </div>
        )}

        {capturedImage && (
            <div>
                <div className="relative rounded-lg overflow-hidden shadow-md mx-auto max-w-xs">
                    <img src={capturedImage} alt="Captured selfie" className="w-full h-auto" />
                     <div className="absolute bottom-3 right-3 bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <i className="fa-solid fa-check-circle"></i> Captured
                    </div>
                </div>
                <button type="button" onClick={retakePhoto} className="mt-6 bg-gray-700 text-white font-bold py-2 px-6 rounded-full hover:bg-gray-800 transition duration-300 inline-flex items-center gap-2">
                    <i className="fa-solid fa-arrows-rotate"></i>
                    Retake Photo
                </button>
            </div>
        )}
       </div>

       {/* Full Screen Camera Modal */}
       {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
            {/* Flash Overlay */}
            <div className={`absolute inset-0 bg-white z-[102] pointer-events-none transition-opacity duration-300 ease-out ${isFlashing ? 'opacity-100' : 'opacity-0'}`}></div>

            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-[101]">
                <button type="button" onClick={stopCamera} className="text-white bg-black/40 backdrop-blur-md p-3 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/60 transition">
                    <i className="fa-solid fa-times text-xl"></i>
                </button>
                 <button type="button" onClick={switchCamera} className="text-white bg-black/40 backdrop-blur-md p-3 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/60 transition">
                    <i className="fa-solid fa-rotate text-xl"></i>
                </button>
            </div>

            {/* Main Camera View */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {isLoading && (
                    <div className="text-white flex flex-col items-center gap-3">
                        <i className="fa-solid fa-circle-notch fa-spin fa-3x text-orange-500"></i>
                        <p className="text-lg font-medium">Starting Camera...</p>
                    </div>
                )}
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className={`absolute min-w-full min-h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
                />
                {/* Visual Guide */}
                {!isLoading && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[75%] aspect-[3/4] border-2 border-white/70 rounded-[40%] border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="bg-black/80 backdrop-blur-sm p-8 flex justify-center items-center z-[101] pb-12">
                 <button 
                    type="button" 
                    onClick={capturePhoto} 
                    disabled={isLoading}
                    className="bg-white rounded-full h-20 w-20 flex items-center justify-center p-1.5 shadow-lg transition-transform active:scale-90"
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