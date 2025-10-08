import React, { useEffect, useRef, useState, useCallback } from 'react';
// MediaPipe FaceMesh (you need to install packages):
// npm install @mediapipe/face_mesh @mediapipe/camera_utils @mediapipe/drawing_utils
import { FaceMesh } from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';

const TryOn = ({ onBack }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [category, setCategory] = useState('necklace');
  const [budget, setBudget] = useState(30000);
  const [style, setStyle] = useState('minimal');
  const [error, setError] = useState(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const landmarksRef = useRef(null);
  const necklaceImgRef = useRef(null);
  const earringImgRef = useRef(null);
  // Ring feature temporarily disabled (no Hands dependency)

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch (e) {}
      cameraRef.current = null;
    }
    if (videoRef.current) {
      try { videoRef.current.pause(); } catch (e) {}
      videoRef.current.srcObject = null;
    }
    if (stream) {
      try { stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    }
    setStream(null);
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
      if (!videoRef.current) return;
      videoRef.current.srcObject = s;
      await videoRef.current.play();
      setStream(s);

      // Initialize FaceMesh once
      if (!faceMeshRef.current) {
        const fm = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        fm.onResults((results) => {
          // Save landmarks for draw loop
          landmarksRef.current = results.multiFaceLandmarks && results.multiFaceLandmarks[0] ? results.multiFaceLandmarks[0] : null;
        });
        faceMeshRef.current = fm;
      }

      // Hands disabled

      // Camera helper to feed frames to FaceMesh
      if (!cameraRef.current) {
        cameraRef.current = new cam.Camera(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
            // Hands disabled
          },
          width: 640,
          height: 480,
        });
      }
      cameraRef.current.start();

    } catch (e) {
      setError('Camera access denied or unavailable. You can upload a photo instead.');
    }
  };

  // (Optional) Could preload category-specific overlays here if you add more assets.

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const drawFromVideo = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Overlay basics using landmarks (if available)
    const lm = landmarksRef.current;
    if (lm && lm.length > 0) {
      // Helper to convert normalized -> pixels
      const toPx = (p) => ({ x: p.x * canvas.width, y: p.y * canvas.height });
      // Landmark indices (FaceMesh): chin: 152, left ear area ~ 234, right ear area ~ 454
      const chin = toPx(lm[152] || lm[1]);
      const leftEar = toPx(lm[234] || lm[132] || lm[93]);
      const rightEar = toPx(lm[454] || lm[361] || lm[323]);

      // Scale factor from face width (distance between ears)
      const dx = (leftEar.x - rightEar.x);
      const dy = (leftEar.y - rightEar.y);
      const faceWidth = Math.hypot(dx, dy) || 200;

      // Draw overlays by category
      if (category === 'necklace') {
        const img = necklaceImgRef.current;
        const width = faceWidth * 1.2;
        const height = width * 0.5;
        const x = chin.x - width / 2;
        const y = chin.y + height * 0.05; // slightly below chin
        if (img && img.complete) {
          ctx.drawImage(img, x, y, width, height);
        } else {
          // Fallback visual
          ctx.strokeStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(chin.x, chin.y + height * 0.2, width * 0.45, Math.PI, 2 * Math.PI);
          ctx.stroke();
        }
      } else if (category === 'earrings') {
        const img = earringImgRef.current;
        const size = faceWidth * 0.18;
        const drawEarring = (pt) => {
          const x = pt.x - size / 2;
          const y = pt.y - size / 2;
          if (img && img.complete) {
            ctx.drawImage(img, x, y, size, size);
          } else {
            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, size / 3, 0, 2 * Math.PI);
            ctx.fill();
          }
        };
        drawEarring(leftEar);
        drawEarring(rightEar);
      }
    }
    // Ring drawing disabled
    requestAnimationFrame(drawFromVideo);
  }, [category]);

  useEffect(() => {
    let raf;
    const videoEl = videoRef.current;
    if (videoEl && stream) {
      const onLoaded = () => {
        raf = requestAnimationFrame(drawFromVideo);
      };
      videoEl.addEventListener('loadedmetadata', onLoaded);
      return () => {
        videoEl.removeEventListener('loadedmetadata', onLoaded);
        if (raf) cancelAnimationFrame(raf);
      };
    }
  }, [stream, drawFromVideo]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6 text-pink-600">Try-On</h2>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded">
            <option value="necklace">Necklace</option>
            <option value="earrings">Earrings</option>
            {/* Ring disabled until Hands is added back */}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Style</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full p-2 border rounded">
            <option value="minimal">Minimal</option>
            <option value="bold">Bold</option>
            <option value="traditional">Traditional</option>
            <option value="modern">Modern</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Budget: ₹{budget.toLocaleString()}</label>
          <input type="range" min="1000" max="100000" step="1000" value={budget} onChange={(e) => setBudget(parseFloat(e.target.value))} className="w-full" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {!stream ? (
          <button onClick={startCamera} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded">Start Camera</button>
        ) : (
          <button onClick={stopCamera} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Stop Camera</button>
        )}
        <label className="bg-white border border-pink-600 text-pink-600 hover:bg-pink-50 font-bold py-2 px-4 rounded cursor-pointer">
          Upload Photo
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
        <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Back</button>
      </div>

      {/* Preload simple overlay assets */}
      <img ref={necklaceImgRef} alt="necklace" src="/overlays/necklace/sample.svg" className="hidden" onError={(e)=>{e.currentTarget.src='';}} />
      <img ref={earringImgRef} alt="earring" src="/overlays/earrings/sample.svg" className="hidden" onError={(e)=>{e.currentTarget.src='';}} />
      {/* Ring asset preload removed */}

      {/* Hidden video used as source for canvas */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Output canvas */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden flex items-center justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>

      <p className="text-sm text-gray-500 mt-4">Phase 2: We will overlay jewelry PNGs at detected facial/hand landmarks for realistic try-on.</p>
    </div>
  );
};

export default TryOn;
