import React, { useEffect, useRef } from 'react';

export const DigitalShredder = ({ rect, onComplete }: { rect: DOMRect; onComplete: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Expand canvas to full viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    // Increase count for a more "dense" dematerialization
    const particleCount = 1500; 

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: rect.left + Math.random() * rect.width,
        y: rect.top + Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 6, // Initial horizontal burst
        vy: (Math.random() - 0.5) * 4, // Initial vertical pop
        gravity: 0.2,
        color: Math.random() > 0.3 ? '#3b82f6' : '#ffffff', // Mix of blue and white shards
        size: Math.random() * 2 + 1,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01
      });
    }

    let animationFrame: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let stillActive = false;

      particles.forEach(p => {
        if (p.alpha > 0) {
          stillActive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity; // Gravity pull
          p.alpha -= p.decay; // Individual particle fading

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      });

      if (stillActive) {
        animationFrame = requestAnimationFrame(render);
      } else {
        onComplete();
      }
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [rect, onComplete]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-[9999] pointer-events-none" 
      style={{ filter: 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5))' }}
    />
  );
};