import React, { useEffect, useRef, useState } from 'react';
import { EqualizerPreset } from '../types';
import { Sparkles, Activity } from 'lucide-react';

interface VisualizerProps {
  isPlaying: boolean;
  preset: EqualizerPreset;
  genre: string;
  volume: number;
}

export default function Visualizer({ isPlaying, preset, genre, volume }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [style, setStyle] = useState<'bars' | 'wave'>('wave');
  const animationRef = useRef<number | null>(null);

  // Keep track of internal wave phases
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = (rect?.width || 300) * window.devicePixelRatio;
      canvas.height = (rect?.height || 120) * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Dynamic factors based on preset and genre
    let speedFactor = 0.05;
    let amplitudeFactor = 1.0;
    let barCount = 30;

    if (preset === 'bass') {
      amplitudeFactor = 1.6;
      speedFactor = 0.08;
    } else if (preset === 'chill') {
      amplitudeFactor = 0.7;
      speedFactor = 0.03;
    } else if (preset === 'vocal') {
      amplitudeFactor = 1.0;
      speedFactor = 0.05;
    } else if (preset === 'classic') {
      amplitudeFactor = 0.8;
      speedFactor = 0.02;
    }

    if (genre === 'Ambient') {
      speedFactor *= 0.8;
      amplitudeFactor *= 0.9;
    }

    // High fidelity render loop
    const render = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      // Clear with elegant translucent black for trailing motion blur
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
      ctx.fillRect(0, 0, w, h);

      if (isPlaying) {
        phaseRef.current += speedFactor;
      }

      const p = phaseRef.current;

      if (style === 'wave') {
        // Draw multiple overlapping sine waves for a liquid glassmorphic look
        const numWaves = 4;
        const colors = [
          'rgba(99, 102, 241, 0.5)',  // Indigo
          'rgba(168, 85, 247, 0.4)',  // Purple
          'rgba(236, 72, 153, 0.3)',  // Pink
          'rgba(59, 130, 246, 0.2)',  // Blue
        ];

        for (let i = 0; i < numWaves; i++) {
          ctx.beginPath();
          ctx.lineWidth = i === 0 ? 3 : 1.5;
          ctx.strokeStyle = colors[i];

          const wavePhase = p + (i * Math.PI) / 4;
          const frequency = 0.01 + (i * 0.005);
          // Scale amplitude by play state and volume
          const currentAmp = (isPlaying ? 25 : 2) * amplitudeFactor * (volume * 0.7 + 0.3) * (1 - i * 0.15);

          for (let x = 0; x <= w; x += 2) {
            // Apply standard Gaussian envelope so ends of wave flatten to 0
            const envelope = Math.sin((x / w) * Math.PI);
            const y = (h / 2) + Math.sin(x * frequency + wavePhase) * currentAmp * envelope;
            
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      } else {
        // Draw responsive frequency-like bars
        const spacing = 4;
        const barWidth = (w - (barCount - 1) * spacing) / barCount;
        
        for (let i = 0; i < barCount; i++) {
          // Compute bar height based on sine waves with varying frequency per bar
          const noise = Math.sin(i * 0.3 + p) * Math.cos(i * 0.15 - p * 0.5);
          const rawHeight = isPlaying ? Math.abs(noise) * (h * 0.7) : 4;
          
          // Boost certain bands based on presets
          let heightMult = amplitudeFactor;
          if (preset === 'bass' && i < 8) heightMult *= 1.5; // low frequency boost
          if (preset === 'vocal' && i > 10 && i < 22) heightMult *= 1.4; // mid frequency boost
          
          const finalHeight = Math.max(4, rawHeight * heightMult * (volume * 0.8 + 0.2));
          const x = i * (barWidth + spacing);
          const y = h - finalHeight;

          // Grandient for bars
          const grad = ctx.createLinearGradient(x, y, x, h);
          grad.addColorStop(0, '#a855f7'); // Purple
          grad.addColorStop(0.5, '#6366f1'); // Indigo
          grad.addColorStop(1, '#3b82f6'); // Blue

          ctx.fillStyle = grad;
          
          // Draw rounded bar
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, finalHeight, [2, 2, 0, 0]);
          } else {
            ctx.rect(x, y, barWidth, finalHeight);
          }
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, preset, genre, volume, style]);

  return (
    <div className="w-full bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 border border-slate-800/60 shadow-xl" id="visualizer-container">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium tracking-wide">
          <Activity className="w-3.5 h-3.5 animate-pulse text-purple-400" />
          <span>ESPECTRO DE ÁUDIO ({genre})</span>
        </div>
        <div className="flex bg-slate-900/60 p-0.5 rounded-lg border border-slate-800">
          <button
            id="btn-vis-wave"
            onClick={() => setStyle('wave')}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
              style === 'wave'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Onda
          </button>
          <button
            id="btn-vis-bars"
            onClick={() => setStyle('bars')}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
              style === 'bars'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Frequências
          </button>
        </div>
      </div>
      <div className="h-28 w-full overflow-hidden rounded-xl relative bg-slate-950/80 border border-slate-900 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block" />
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-[1px]">
            <Sparkles className="w-5 h-5 text-indigo-400/40 animate-pulse mb-1" />
            <span className="text-[10px] text-slate-500 font-medium tracking-wider">REPRODUÇÃO PAUSADA</span>
          </div>
        )}
      </div>
    </div>
  );
}
