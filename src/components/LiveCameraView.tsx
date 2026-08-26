import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Camera, 
  Upload, 
  ShieldCheck, 
  Eye, 
  Layers, 
  Scan, 
  Activity, 
  Sliders, 
  Play, 
  Pause,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ProductItem } from '../types';

interface LiveCameraViewProps {
  products: ProductItem[];
  onShelfLevelChange?: (productId: string, newPct: number) => void;
}

export const LiveCameraView: React.FC<LiveCameraViewProps> = ({
  products,
  onShelfLevelChange,
}) => {
  const [selectedFeed, setSelectedFeed] = useState<'ESP32_SHELF' | 'QUEUE_CCTV' | 'AISLE_OVERHEAD' | 'WEBCAM' | 'UPLOAD'>('ESP32_SHELF');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showPrivacyBlur, setShowPrivacyBlur] = useState(true);
  const [showRoiPolygons, setShowRoiPolygons] = useState(true);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webCamStreamRef = useRef<MediaStream | null>(null);

  // WebCam handling
  useEffect(() => {
    if (selectedFeed === 'WEBCAM') {
      navigator.mediaDevices?.getUserMedia({ video: { width: 640, height: 480 } })
        .then((stream) => {
          webCamStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.warn('WebCam access declined or unavailable, falling back to simulated stream', err);
        });
    } else {
      if (webCamStreamRef.current) {
        webCamStreamRef.current.getTracks().forEach((track) => track.stop());
        webCamStreamRef.current = null;
      }
    }

    return () => {
      if (webCamStreamRef.current) {
        webCamStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedFeed]);

  // Synthetic Edge CV Bounding Box Render Loop on Canvas
  useEffect(() => {
    let animId: number;
    let t = 0;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      t += 0.03;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Draw background stream simulator
      ctx.fillStyle = '#0f172a'; // Deep slate camera feed background
      ctx.fillRect(0, 0, w, h);

      if (selectedFeed === 'ESP32_SHELF') {
        // Draw simulated retail shelves
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(40, 60, w - 80, h - 120);

        // Shelf tiers
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(40, 160);
        ctx.lineTo(w - 40, 160);
        ctx.moveTo(40, 260);
        ctx.lineTo(w - 40, 260);
        ctx.moveTo(40, 360);
        ctx.lineTo(w - 40, 360);
        ctx.stroke();

        // Shelf Items Simulation
        const coke = products.find((p) => p.sku === 'BEV-COKE-500');
        const cokePct = coke ? coke.visibleAvailabilityPct : 20;

        // Tier 2: Coke Zero ROI
        const cokeCols = Math.round((cokePct / 100) * 12);
        for (let i = 0; i < 12; i++) {
          if (i < cokeCols) {
            ctx.fillStyle = '#ef4444'; // Coke red
            ctx.fillRect(70 + i * 40, 185, 24, 70);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(75 + i * 40, 205, 14, 10);
          } else {
            // Empty slot outline
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(70 + i * 40, 185, 24, 70);
            ctx.setLineDash([]);
          }
        }

        // Tier 1: Dairy items
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(80 + i * 65, 85, 35, 70);
        }

        // ROI Polygons
        if (showRoiPolygons) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(55, 175, w - 110, 85);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.fillRect(55, 175, w - 110, 85);

          ctx.fillStyle = '#60a5fa';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('ROI_01: SHELF_BAY_AISLE_1_BEV', 60, 170);
        }

        // YOLO Detection Bounding Boxes
        if (showBoundingBoxes) {
          ctx.strokeStyle = cokePct < 30 ? '#ef4444' : '#10b981';
          ctx.lineWidth = 2;
          ctx.strokeRect(60, 180, 500, 78);

          ctx.fillStyle = cokePct < 30 ? '#ef4444' : '#10b981';
          ctx.fillRect(60, 160, 180, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`Visible Facing: ${cokePct}% (${cokePct < 30 ? 'LOW' : 'NORMAL'})`, 65, 174);
        }

      } else if (selectedFeed === 'QUEUE_CCTV') {
        // Queue Lane graphics
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(30, 50, w - 60, h - 100);

        // Counter desks
        ctx.fillStyle = '#334155';
        ctx.fillRect(60, 100, 120, 200); // Counter 1
        ctx.fillRect(60, 320, 120, 120); // Counter 2 (closed)

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('COUNTER 1 (OPEN)', 65, 90);
        ctx.fillText('COUNTER 2 (CLOSED)', 65, 310);

        // Queue stanchions
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(220, 120);
        ctx.lineTo(580, 120);
        ctx.moveTo(220, 240);
        ctx.lineTo(580, 240);
        ctx.stroke();

        // Animated people in Counter 1 queue
        const peopleCount = 7;
        for (let i = 0; i < peopleCount; i++) {
          const px = 240 + i * 45 + Math.sin(t + i) * 2;
          const py = 180 + Math.cos(t * 0.8 + i) * 2;

          // Person body
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fill();

          // Privacy Blur over face/head
          if (showPrivacyBlur) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.beginPath();
            ctx.arc(px, py - 4, 10, 0, Math.PI * 2);
            ctx.fill();
          }

          if (showBoundingBoxes) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px - 18, py - 20, 36, 40);

            ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
            ctx.fillRect(px - 18, py - 32, 70, 12);
            ctx.fillStyle = '#ffffff';
            ctx.font = '9px sans-serif';
            ctx.fillText(`Person 00${i + 1}`, px - 16, py - 23);
          }
        }

        // ROI Queue Polygon
        if (showRoiPolygons) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(210, 110, 380, 140);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
          ctx.fillRect(210, 110, 380, 140);

          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('ROI_QUEUE_LANE_1 (Count: 7 | Congestion: High)', 215, 105);
        }
      } else if (selectedFeed === 'AISLE_OVERHEAD') {
        // Top-down Aisle overview
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(40, 40, w - 80, h - 80);

        // Aisle Racks
        ctx.fillStyle = '#334155';
        ctx.fillRect(100, 40, 80, h - 80);
        ctx.fillRect(260, 40, 80, h - 80);
        ctx.fillRect(420, 40, 80, h - 80);

        // Moving shoppers
        for (let i = 0; i < 5; i++) {
          const sy = 80 + ((t * 40 + i * 80) % (h - 140));
          const sx = 200 + (i % 2 === 0 ? 0 : 160);

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(sx, sy, 12, 0, Math.PI * 2);
          ctx.fill();

          if (showBoundingBoxes) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(sx - 15, sy - 15, 30, 30);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText(`Track-${100 + i}`, sx - 15, sy - 18);
          }
        }
      }

      // Edge Watermark & FPS
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 240, 24);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`EDGE YOLOv8n • 24.2 FPS • 640x480`, 16, 26);
    };

    if (isPlaying) {
      renderLoop();
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedFeed, isPlaying, showBoundingBoxes, showPrivacyBlur, showRoiPolygons, products]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
      setSelectedFeed('UPLOAD');
    }
  };

  const cokeProduct = products.find((p) => p.sku === 'BEV-COKE-500');

  return (
    <div className="space-y-5">
      {/* Top Feed Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              Live Edge Vision &amp; Camera Feed
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Local OpenCV + YOLOv8n inference pipeline • Anonymous tracking &amp; zero raw video persistence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Feed Switchers */}
          <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              onClick={() => setSelectedFeed('ESP32_SHELF')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedFeed === 'ESP32_SHELF' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ESP32 Shelf Cam
            </button>
            <button
              onClick={() => setSelectedFeed('QUEUE_CCTV')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedFeed === 'QUEUE_CCTV' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Checkout Queue
            </button>
            <button
              onClick={() => setSelectedFeed('AISLE_OVERHEAD')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedFeed === 'AISLE_OVERHEAD' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Overhead Aisle
            </button>
            <button
              onClick={() => setSelectedFeed('WEBCAM')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedFeed === 'WEBCAM' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Local WebCam
            </button>
          </div>

          {/* Upload Button */}
          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload Clip</span>
            <input type="file" accept="video/*,image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Main Video Screen & Side Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Live Canvas View (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-xs relative">
          {/* Header stream status */}
          <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-slate-200 text-xs font-bold">
                {selectedFeed === 'ESP32_SHELF'
                  ? 'CAM_01: ESP32-CAM (Aisle 1 Cold Shelf Bay)'
                  : selectedFeed === 'QUEUE_CCTV'
                  ? 'CAM_02: CCTV Overhead (Counters 1 & 2)'
                  : selectedFeed === 'AISLE_OVERHEAD'
                  ? 'CAM_03: Aisle 2 Footfall Tracker'
                  : selectedFeed === 'WEBCAM'
                  ? 'LOCAL_WEBCAM: Device Stream'
                  : 'USER_UPLOADED: Footage Stream'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">MJPEG RTSP</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">YOLOv8 Edge</span>
            </div>
          </div>

          {/* Canvas container */}
          <div className="relative aspect-video flex items-center justify-center bg-black">
            {selectedFeed === 'WEBCAM' ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : selectedFeed === 'UPLOAD' && uploadedVideoUrl ? (
              <video src={uploadedVideoUrl} autoPlay loop playsInline muted className="w-full h-full object-cover" />
            ) : (
              <canvas ref={canvasRef} width={640} height={360} className="w-full h-full object-contain" />
            )}
          </div>

          {/* Bottom Feed Overlay Controls */}
          <div className="bg-slate-900/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-800">
            <div className="flex items-center space-x-4 text-slate-300 text-[11px]">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center space-x-1 text-slate-200 hover:text-white cursor-pointer font-bold uppercase tracking-wider"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Resume'}</span>
              </button>

              <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBoundingBoxes}
                  onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>YOLO Boxes</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showRoiPolygons}
                  onChange={(e) => setShowRoiPolygons(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>ROI Zones</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPrivacyBlur}
                  onChange={(e) => setShowPrivacyBlur(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Privacy Blur</span>
              </label>
            </div>

            <div className="flex items-center space-x-1 text-emerald-400 text-[10px] font-mono font-bold tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ZERO CLOUD VIDEO RETENTION</span>
            </div>
          </div>
        </div>

        {/* Edge CV Intelligence Sidebar (1 Column) */}
        <div className="space-y-4">
          {/* Key Difference Highlight Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-blue-600 text-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-bold uppercase tracking-wider text-[11px] mb-1">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span>Visible Shelf vs Recorded Stock</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Camera only detects <strong>front-facing product lines</strong>. The core innovation cross-references optical facings with inventory records to derive zero-hallucination store actions.
            </p>
          </div>

          {/* Real-time Shelf Level Slider Tester */}
          {cokeProduct && onShelfLevelChange && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">Interactive Camera Tester</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider ${
                  cokeProduct.visibleAvailabilityPct < 30 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {cokeProduct.visibleAvailabilityPct}% Facing
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-medium flex justify-between">
                  <span>Simulate Shelf Level (Coca-Cola Zero):</span>
                  <span className="font-mono text-slate-800 font-bold">{cokeProduct.visibleAvailabilityPct}%</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={cokeProduct.visibleAvailabilityPct}
                  onChange={(e) => onShelfLevelChange(cokeProduct.id, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">POS Inventory:</span>
                  <p className="font-bold text-slate-800 font-mono">{cokeProduct.recordedInventoryUnits} units</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Backroom:</span>
                  <p className="font-bold text-slate-800 font-mono">{cokeProduct.backroomStockUnits} units</p>
                </div>
              </div>
            </div>
          )}

          {/* Camera Telemetry KPIs */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5 text-xs">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Edge Telemetry</span>
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 text-[11px]">Inference Latency:</span>
                <span className="font-mono font-bold text-slate-800 text-[11px]">14.2 ms (CPU/NPU)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 text-[11px]">Tracking Model:</span>
                <span className="font-mono font-bold text-slate-800 text-[11px]">ByteTrack v1.2</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 text-[11px]">Active Monitored ROIs:</span>
                <span className="font-mono font-bold text-slate-800 text-[11px]">8 Zones</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 text-[11px]">Privacy Status:</span>
                <span className="font-bold text-emerald-700 text-[11px]">Zero Faces Retained</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
