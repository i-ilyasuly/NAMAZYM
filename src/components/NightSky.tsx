import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
  twinkleSpeed: number;
  isConstellation?: boolean;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
  thickness: number;
  fadeSpeed: number;
}

const NightSky: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initStars();
    };

    const stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];

    // Moon phase calculation
    const getMoonPhase = () => {
      const lunarCycle = 29.530588853;
      const knownNewMoon = new Date('2024-02-09T23:00:00Z');
      const now = new Date();
      const age = ((now.getTime() - knownNewMoon.getTime()) / 86400000) % lunarCycle;
      return age / lunarCycle; // 0 to 1
    };

    const moonPhase = getMoonPhase();

    const initStars = () => {
      stars.length = 0;
      const starCount = Math.floor((width * height) / 3000);

      // Constellation: Jeti Qaraqshy (Big Dipper) - More accurate relative positions
      const jetiQaraqshy = [
        { x: 0.15, y: 0.45, size: 2.2 }, // Dubhe
        { x: 0.16, y: 0.52, size: 2.0 }, // Merak
        { x: 0.25, y: 0.54, size: 1.9 }, // Phecda
        { x: 0.26, y: 0.47, size: 1.8 }, // Megrez
        { x: 0.35, y: 0.44, size: 2.0 }, // Alioth
        { x: 0.42, y: 0.40, size: 1.9 }, // Mizar
        { x: 0.48, y: 0.42, size: 1.8 }  // Alkaid
      ];

      // Constellation: Temirqazyq (Polaris)
      const temirqazyq = [{ x: 0.5, y: 0.15, size: 2.8 }];

      const starColors = [
        'rgba(255, 255, 255, ', // White
        'rgba(230, 240, 255, ', // Blue-ish
        'rgba(255, 250, 230, ', // Yellow-ish
        'rgba(255, 240, 240, ', // Red-ish
      ];

      // Add constellation stars
      jetiQaraqshy.forEach(p => {
        stars.push({
          x: p.x * width,
          y: p.y * height,
          size: p.size,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.004 + Math.random() * 0.004,
          isConstellation: true,
          color: starColors[0]
        });
      });

      temirqazyq.forEach(p => {
        stars.push({
          x: p.x * width,
          y: p.y * height,
          size: p.size,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.002,
          isConstellation: true,
          color: starColors[0]
        });
      });

      // Add random stars
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.0 + 0.2,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.005 + Math.random() * 0.02,
          color: starColors[Math.floor(Math.random() * starColors.length)]
        });
      }
    };

    const createShootingStar = () => {
      const distanceFactor = Math.random();
      const isFar = distanceFactor < 0.7;

      shootingStars.push({
        x: width * 0.2 + Math.random() * width * 0.8,
        y: Math.random() * height * 0.4,
        length: isFar ? (Math.random() * 30 + 15) : (Math.random() * 100 + 60),
        speed: isFar ? (Math.random() * 6 + 4) : (Math.random() * 20 + 12),
        opacity: isFar ? (Math.random() * 0.3 + 0.2) : 0.8,
        angle: Math.PI * 0.75 + (Math.random() * Math.PI / 12),
        thickness: isFar ? 0.8 : 1.5,
        fadeSpeed: isFar ? 0.005 : 0.012
      });
    };

    const drawMoon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, phase: number) => {
      // Moon glow
      const glow = ctx.createRadialGradient(x, y, radius, x, y, radius * 4);
      glow.addColorStop(0, 'rgba(255, 255, 240, 0.15)');
      glow.addColorStop(1, 'rgba(255, 255, 240, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
      ctx.fill();

      // Earthshine (faint light on the dark part)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw the illuminated part
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();

      // Base moon color
      ctx.fillStyle = '#f5f3ce';
      
      // Calculate the terminator
      // phase 0: new, 0.25: first quarter, 0.5: full, 0.75: last quarter
      const angle = phase * Math.PI * 2;
      const isWaxing = phase <= 0.5;
      
      ctx.beginPath();
      if (isWaxing) {
        // Draw right half
        ctx.arc(x, y, radius, -Math.PI / 2, Math.PI / 2, false);
        // Draw the terminator arc
        const curveX = radius * Math.cos(angle);
        ctx.ellipse(x, y, Math.abs(curveX), radius, 0, Math.PI / 2, -Math.PI / 2, phase > 0.25);
      } else {
        // Draw left half
        ctx.arc(x, y, radius, Math.PI / 2, -Math.PI / 2, false);
        // Draw the terminator arc
        const curveX = radius * Math.cos(angle);
        ctx.ellipse(x, y, Math.abs(curveX), radius, 0, -Math.PI / 2, Math.PI / 2, phase > 0.75);
      }
      ctx.fill();

      // Add craters (simple noise/dots)
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      const seed = 123; // Fixed seed for craters
      for (let i = 0; i < 15; i++) {
        const cx = x + (Math.sin(i * 13 + seed) * radius * 0.7);
        const cy = y + (Math.cos(i * 17 + seed) * radius * 0.7);
        const cr = Math.random() * (radius * 0.2) + 2;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    let lastTime = 0;
    const draw = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      // Deep space background
      ctx.fillStyle = '#000105';
      ctx.fillRect(0, 0, width, height);

      // Faint galactic glow
      const galacticGrad = ctx.createRadialGradient(
        width * 0.7, height * 0.3, 0,
        width * 0.7, height * 0.3, width * 0.8
      );
      galacticGrad.addColorStop(0, 'rgba(15, 20, 45, 0.3)');
      galacticGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = galacticGrad;
      ctx.fillRect(0, 0, width, height);

      // Realistic slow movement (Earth rotation simulation)
      const moveSpeed = 0.00005; // Even slower for realism
      const moveX = time * moveSpeed;

      // Draw stars
      stars.forEach((star) => {
        let x = (star.x + moveX) % width;
        let y = star.y;

        const twinkle = (
          Math.sin(time * star.twinkleSpeed + star.phase) * 0.5 +
          Math.sin(time * star.twinkleSpeed * 2.1 + star.phase * 1.2) * 0.3 +
          Math.sin(time * star.twinkleSpeed * 0.5 + star.phase * 0.8) * 0.2
        );
        const opacity = (twinkle + 1) / 2 * 0.5 + 0.5;
        
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${opacity})`;
        ctx.fill();

        if (star.isConstellation) {
          const glowSize = star.size * 2.5;
          const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
          glowGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.25})`);
          glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(x, y, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Moon (moves with stars)
      const moonX = (width * 0.75 + moveX) % width;
      const moonY = height * 0.2;
      drawMoon(ctx, moonX, moonY, 35, moonPhase);

      // Draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.opacity -= ss.fadeSpeed;

        if (ss.opacity <= 0 || ss.x < -100 || ss.x > width + 100 || ss.y > height + 100) {
          shootingStars.splice(i, 1);
          continue;
        }

        const grad = ctx.createLinearGradient(
          ss.x, ss.y, 
          ss.x - Math.cos(ss.angle) * ss.length, 
          ss.y - Math.sin(ss.angle) * ss.length
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = ss.thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - Math.cos(ss.angle) * ss.length, ss.y - Math.sin(ss.angle) * ss.length);
        ctx.stroke();
      }

      if (Math.random() < 0.0008) {
        createShootingStar();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-50 pointer-events-none"
    />
  );
};

export default NightSky;
