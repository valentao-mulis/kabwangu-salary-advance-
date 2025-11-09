import React from 'react';

interface SignaturePadProps {
    onSignatureChange: (dataUrl: string) => void;
}

const SignaturePad = ({ onSignatureChange }: SignaturePadProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawing = React.useRef(false);
  const [isSigned, setIsSigned] = React.useState(false);

  const getCanvasContext = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const clearCanvas = React.useCallback(() => {
    const ctx = getCanvasContext();
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSignatureChange('');
      setIsSigned(false);
    }
  }, [getCanvasContext, onSignatureChange]);

  const handleDrawEnd = React.useCallback(() => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
        const context = canvas.getContext('2d');
        if(context) {
            const pixelBuffer = new Uint32Array(
              context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
            );
            const isEmpty = !pixelBuffer.some(color => color !== 0);
            if (!isEmpty) {
                 onSignatureChange(canvas.toDataURL('image/png'));
                 setIsSigned(true);
            } else {
                 onSignatureChange('');
                 setIsSigned(false);
            }
        }
    }
  }, [onSignatureChange]);

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
  }, [getCanvasContext, handleDrawEnd]);


  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className={`w-full h-[200px] rounded-lg cursor-crosshair touch-none transition-all duration-300 border-2 ${isSigned ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300 border-dashed'}`}
      />
      
      {/* Status Badge */}
      <div className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all duration-300 ${isSigned ? 'bg-green-500 text-white opacity-100' : 'opacity-0'}`}>
          <i className="fa-solid fa-check-circle"></i> Signed
      </div>

      {/* Clear Button */}
      <button
        type="button"
        onClick={clearCanvas}
        className={`absolute top-3 right-3 text-xs font-bold py-1.5 px-3 rounded-md transition duration-200 shadow-sm flex items-center gap-1 ${isSigned ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
        aria-label="Clear Signature"
      >
        <i className="fa-solid fa-eraser"></i> Clear
      </button>
    </div>
  );
};

export default SignaturePad;