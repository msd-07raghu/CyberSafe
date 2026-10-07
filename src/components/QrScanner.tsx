import { useState, useRef, useEffect, useCallback } from 'react';
import { QrCode, Upload, Camera, X, Loader2, AlertCircle, ShieldCheck, CheckCircle2, CameraOff } from 'lucide-react';
import jsQR from 'jsqr';

type ScanState = 'idle' | 'decoding' | 'success' | 'error' | 'not-url';

type DecodedResult = {
  text: string;
  isUrl: boolean;
};

export default function QrScanner({
  onAnalyze,
}: {
  onAnalyze: (url: string) => void;
}) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [decoded, setDecoded] = useState<DecodedResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraUnsupported, setCameraUnsupported] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const isUrlText = (text: string): boolean => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    if (/^https?:\/\//i.test(trimmed)) return true;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return true;
    try {
      new URL('http://' + trimmed);
      return /\.[a-z]{2,}/i.test(trimmed);
    } catch {
      return false;
    }
  };

  const processImageData = (data: ImageData): boolean => {
    const code = jsQR(data.data, data.width, data.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (code && code.data) {
      const text = code.data.trim();
      const isUrl = isUrlText(text);
      setDecoded({ text, isUrl });
      setScanState(isUrl ? 'success' : 'not-url');
      stopCamera();
      return true;
    }
    return false;
  };

  const scanCameraFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      scanFrameRef.current = requestAnimationFrame(scanCameraFrame);
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) {
      scanFrameRef.current = requestAnimationFrame(scanCameraFrame);
      return;
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);

    if (!processImageData(imageData)) {
      scanFrameRef.current = requestAnimationFrame(scanCameraFrame);
    }
  }, [stopCamera]);

  const startCamera = async () => {
    setScanState('decoding');
    setErrorMsg('');
    setDecoded(null);
    setCameraUnsupported(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraUnsupported(true);
      setScanState('idle');
      setErrorMsg('Camera access is not supported in this browser. Try uploading an image instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      scanFrameRef.current = requestAnimationFrame(scanCameraFrame);
    } catch (err) {
      const e = err as DOMException;
      setCameraActive(false);
      setScanState('idle');
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setErrorMsg('Camera permission was denied. You can upload a QR image instead.');
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera was found on this device. Try uploading a QR image instead.');
      } else {
        setErrorMsg('Could not access the camera. Try uploading a QR image instead.');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanState('decoding');
    setErrorMsg('');
    setDecoded(null);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1000;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        setScanState('error');
        setErrorMsg('Could not process the image. Try a different image.');
        URL.revokeObjectURL(url);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      URL.revokeObjectURL(url);

      const found = processImageData(imageData);
      if (!found) {
        setScanState('error');
        setErrorMsg('No QR code was found in this image. Make sure the image is clear and the QR code is fully visible.');
      }
    };

    img.onerror = () => {
      setScanState('error');
      setErrorMsg('Could not load this image file. Try a different image (PNG, JPG, or similar).');
      URL.revokeObjectURL(url);
    };

    img.src = url;
    // Reset file input so the same file can be selected again
    e.target.value = '';
  };

  const handleCancel = () => {
    stopCamera();
    setScanState('idle');
    setDecoded(null);
    setErrorMsg('');
  };

  const handleAnalyzeDecoded = () => {
    if (decoded?.isUrl) {
      onAnalyze(decoded.text);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <QrCode size={18} className="text-cyan-400" />
        <h2 className="text-sm font-semibold text-white">Scan QR Code</h2>
      </div>

      {/* Privacy note */}
      <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-slate-950/60 border border-slate-800 px-4 py-3">
        <ShieldCheck size={16} className="text-cyan-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          QR images are decoded on this device. CyberSafe analyzes the decoded text without opening the destination.
        </p>
      </div>

      {/* Idle state — choice buttons */}
      {scanState === 'idle' && !decoded && (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={startCamera}
              className="flex flex-col items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 transition-colors group"
            >
              <div className="w-11 h-11 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                <Camera size={22} className="text-cyan-400" />
              </div>
              <span className="text-sm font-medium text-slate-200">Use camera</span>
              <span className="text-xs text-slate-500">Scan with your device camera</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 transition-colors group"
            >
              <div className="w-11 h-11 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                <Upload size={22} className="text-cyan-400" />
              </div>
              <span className="text-sm font-medium text-slate-200">Upload image</span>
              <span className="text-xs text-slate-500">Choose a QR image file</span>
            </button>
          </div>
          {cameraUnsupported && (
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3">
              <CameraOff size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">{errorMsg}</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Decoding / camera scanning state */}
      {scanState === 'decoding' && (
        <div className="space-y-4">
          {cameraActive && (
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-auto max-h-72 object-contain"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-cyan-400/60 rounded-xl shadow-lg shadow-cyan-500/20" />
              </div>
              <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-cyan-300 bg-slate-950/60 py-1">
                Point your camera at a QR code…
              </p>
            </div>
          )}
          {!cameraActive && (
            <div className="flex flex-col items-center py-6">
              <Loader2 size={32} className="text-cyan-400 animate-spin mb-3" />
              <p className="text-sm text-slate-400">Decoding QR image…</p>
            </div>
          )}
          <button
            onClick={handleCancel}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} />
            Cancel
          </button>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Error state */}
      {scanState === 'error' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            <p className="text-sm text-slate-300 text-center max-w-xs">{errorMsg}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={startCamera}
              className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={16} />
              Try camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              Upload image
            </button>
          </div>
          <button
            onClick={handleCancel}
            className="w-full text-slate-500 hover:text-slate-300 text-xs transition-colors"
          >
            Dismiss
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Success — decoded URL */}
      {scanState === 'success' && decoded && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-emerald-400 mb-3">QR code decoded</p>
            <div className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3">
              <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Decoded URL</p>
              <p className="text-sm text-slate-200 break-all font-mono leading-relaxed">
                {decoded.text}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAnalyzeDecoded}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} />
              Analyze decoded URL
            </button>
            <button
              onClick={handleCancel}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <X size={16} />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Not a URL */}
      {scanState === 'not-url' && decoded && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-2">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
              <AlertCircle size={24} className="text-amber-400" />
            </div>
            <p className="text-sm font-medium text-amber-400 mb-1">Decoded — but not a URL</p>
            <p className="text-xs text-slate-400 mb-3 text-center max-w-xs">
              The QR code contains text that is not a web link. CyberSafe only analyzes URLs, so this content cannot be assessed for link safety.
            </p>
            <div className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3">
              <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Decoded text</p>
              <p className="text-sm text-slate-200 break-all font-mono leading-relaxed max-h-32 overflow-y-auto">
                {decoded.text}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} />
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
