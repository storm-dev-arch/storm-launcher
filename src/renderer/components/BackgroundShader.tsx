import React, { useEffect, useRef } from 'react';

interface BackgroundShaderProps {
  theme?: string;
  active?: boolean;
}

export const BackgroundShader: React.FC<BackgroundShaderProps> = ({ theme = 'obsidian', active = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    canvas.width = 400;
    canvas.height = 225;

    const getPalette = () => {
      if (theme === 'light' || theme === 'white') {
        return {
          base: '#f8fafc',
          orbs: [
            { r: 186, g: 230, b: 253, a: 0.55 },
            { r: 224, g: 231, b: 255, a: 0.45 },
            { r: 204, g: 251, b: 241, a: 0.40 },
            { r: 241, g: 245, b: 249, a: 0.60 }
          ]
        };
      }
      return {
        base: '#030305',
        orbs: [
          { r: 48, g: 52, b: 64, a: 0.32 },
          { r: 28, g: 32, b: 40, a: 0.26 },
          { r: 58, g: 62, b: 76, a: 0.22 },
          { r: 22, g: 24, b: 32, a: 0.28 }
        ]
      };
    };

    const render = () => {
      time += 0.0035;
      const w = canvas.width;
      const h = canvas.height;
      const palette = getPalette();

      ctx.fillStyle = palette.base;
      ctx.fillRect(0, 0, w, h);

      const o1 = palette.orbs[0];
      const x1 = w * 0.32 + Math.sin(time * 0.6) * (w * 0.2);
      const y1 = h * 0.35 + Math.cos(time * 0.5) * (h * 0.2);
      const r1 = w * 0.38 + Math.sin(time * 0.35) * 20;

      const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, r1);
      grad1.addColorStop(0, `rgba(${o1.r}, ${o1.g}, ${o1.b}, ${o1.a})`);
      grad1.addColorStop(0.5, `rgba(${o1.r}, ${o1.g}, ${o1.b}, ${o1.a * 0.35})`);
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(x1, y1, r1, 0, Math.PI * 2);
      ctx.fill();

      const o2 = palette.orbs[1];
      const x2 = w * 0.7 + Math.cos(time * 0.55) * (w * 0.22);
      const y2 = h * 0.65 + Math.sin(time * 0.7) * (h * 0.2);
      const r2 = w * 0.4 + Math.cos(time * 0.4) * 25;

      const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, r2);
      grad2.addColorStop(0, `rgba(${o2.r}, ${o2.g}, ${o2.b}, ${o2.a})`);
      grad2.addColorStop(0.5, `rgba(${o2.r}, ${o2.g}, ${o2.b}, ${o2.a * 0.3})`);
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(x2, y2, r2, 0, Math.PI * 2);
      ctx.fill();

      const o3 = palette.orbs[2];
      const x3 = w * 0.5 + Math.sin(time * 0.9 + 1.5) * (w * 0.25);
      const y3 = h * 0.5 + Math.cos(time * 0.75 + 1) * (h * 0.22);
      const r3 = w * 0.32 + Math.sin(time * 0.5) * 15;

      const grad3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, r3);
      grad3.addColorStop(0, `rgba(${o3.r}, ${o3.g}, ${o3.b}, ${o3.a})`);
      grad3.addColorStop(0.6, `rgba(${o3.r}, ${o3.g}, ${o3.b}, ${o3.a * 0.25})`);
      grad3.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad3;
      ctx.beginPath();
      ctx.arc(x3, y3, r3, 0, Math.PI * 2);
      ctx.fill();

      const o4 = palette.orbs[3];
      const x4 = w * 0.2 + Math.cos(time * 0.45 + 2) * (w * 0.15);
      const y4 = h * 0.78 + Math.sin(time * 0.55 + 1.2) * (h * 0.15);
      const r4 = w * 0.35 + Math.cos(time * 0.3) * 20;

      const grad4 = ctx.createRadialGradient(x4, y4, 0, x4, y4, r4);
      grad4.addColorStop(0, `rgba(${o4.r}, ${o4.g}, ${o4.b}, ${o4.a})`);
      grad4.addColorStop(0.55, `rgba(${o4.r}, ${o4.g}, ${o4.b}, ${o4.a * 0.3})`);
      grad4.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad4;
      ctx.beginPath();
      ctx.arc(x4, y4, r4, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, active]);

  if (!active) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          filter: 'blur(28px)',
          transform: 'scale(1.12)',
          opacity: 0.8
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: (theme === 'light' || theme === 'white')
            ? 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.25) 0%, rgba(241,245,249,0.75) 100%)'
            : 'radial-gradient(ellipse at 50% 45%, rgba(4,4,6,0.15) 0%, rgba(3,3,5,0.65) 100%)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};
