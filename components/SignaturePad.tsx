import React from 'react';

interface SignaturePadProps {
    onSignatureChange: (dataUrl: string) => void;
}

const SignaturePad = ({ onSignatureChange }: SignaturePadProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawing = React.useRef(false);

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
            } else {
                 onSignatureChange('');
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
        className="w-full h-[200px] bg-gray-100 border border-gray-300 rounded-lg cursor-crosshair touch-none"
      />
      <button
        type="button"
        onClick={clearCanvas}
        className="absolute top-2 right-2 bg-gray-600 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-gray-700 transition"
        aria-label="Clear Signature"
      >
        <i className="fa-solid fa-eraser mr-1"></i> Clear
      </button>
    </div>
  );
};

export default SignaturePad;
