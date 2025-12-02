import React from 'react';

interface SignaturePadProps {
    onSignatureChange: (blob: Blob | null) => void;
    'aria-labelledby'?: string;
}

const SignaturePad = ({ onSignatureChange, 'aria-labelledby': ariaLabelledBy }: SignaturePadProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isDrawing = React.useRef(false);
  const [isSigned, setIsSigned] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const getCanvasContext = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d', { willReadFrequently: true });
  }, []);

  const clearSignature = React.useCallback(() => {
    const ctx = getCanvasContext();
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    setPreviewUrl(null);
    onSignatureChange(null);
    setIsSigned(false);
  }, [getCanvasContext, onSignatureChange, previewUrl]);

  const handleDrawEnd = React.useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const canvas = canvasRef.current;
    const ctx = getCanvasContext();

    if (canvas && ctx) {
        const pixelBuffer = new Uint32Array(
          ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
        const isEmpty = !pixelBuffer.some(color => color !== 0);

        if (!isEmpty) {
             canvas.toBlob((blob) => {
                 onSignatureChange(blob);
                 setIsSigned(true);
             }, 'image/png');
        } else if (!previewUrl) {
             onSignatureChange(null);
             setIsSigned(false);
        }
    }
  }, [onSignatureChange, previewUrl, getCanvasContext]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
        if (canvas.parentElement) {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = 200;
        }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const ctx = getCanvasContext();
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
    }

    const getCoords = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        if (e instanceof TouchEvent && e.touches.length > 0) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        if (e instanceof MouseEvent) {
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
        return {x: 0, y: 0};
    }

    const startDrawing = (e: MouseEvent | TouchEvent) => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setIsSigned(false);
            onSignatureChange(null);
        }

        e.preventDefault();
        const ctx = getCanvasContext();
        if (!ctx) return;
        isDrawing.current = true;
        const { x, y } = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing.current) return;
        e.preventDefault();
        const ctx = getCanvasContext();
        if (!ctx) return;
        const { x, y } = getCoords(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', handleDrawEnd);
    canvas.addEventListener('mouseleave', handleDrawEnd);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', handleDrawEnd);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', handleDrawEnd);
      canvas.removeEventListener('mouseleave', handleDrawEnd);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', handleDrawEnd);
    };
  }, [getCanvasContext, handleDrawEnd, onSignatureChange, previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (PNG, JPG, etc.).');
            return;
        }

        clearSignature();

        const newPreviewUrl = URL.createObjectURL(file);
        setPreviewUrl(newPreviewUrl);
        setIsSigned(true);
        onSignatureChange(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };


  return (
    <div className="relative w-full">
      <span className="sr-only" aria-live="polite">
        {isSigned ? 'Signature has been provided.' : 'Signature area is empty. Please sign or upload a signature.'}
      </span>
      <div
        className={`relative w-full h-[200px] rounded-lg transition-all duration-300 border-2 ${isSigned ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300 border-dashed'}`}
        aria-labelledby={ariaLabelledBy}
      >
        {previewUrl ? (
            <img src={previewUrl} alt="Signature Preview" className="w-full h-full object-contain p-2" />
        ) : (
             <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
                tabIndex={0}
                aria-label="Signature drawing area. Use your mouse, touch, or stylus to sign. Alternatively, use the 'Upload' button to provide an image of your signature."
             />
        )}
      </div>
      
      <div className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all duration-300 ${isSigned ? 'bg-green-500 text-white opacity-100' : 'opacity-0'}`} aria-hidden="true">
          <i className="fa-solid fa-check-circle"></i> Signed
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2">
          {!isSigned && (
             <button
                type="button"
                onClick={handleUploadClick}
                className="text-xs font-bold py-1.5 px-3 rounded-md transition duration-200 shadow-sm flex items-center gap-1 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                aria-label="Upload Signature File"
            >
                <i className="fa-solid fa-upload" aria-hidden="true"></i> Upload
            </button>
          )}
          <button
            type="button"
            onClick={clearSignature}
            className={`text-xs font-bold py-1.5 px-3 rounded-md transition duration-200 shadow-sm flex items-center gap-1 ${isSigned ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            aria-label="Clear Signature"
          >
            <i className="fa-solid fa-eraser" aria-hidden="true"></i> Clear
          </button>
      </div>
       <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" className="hidden" />
    </div>
  );
};

export default SignaturePad;
