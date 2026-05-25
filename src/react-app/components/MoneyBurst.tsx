import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

export interface MoneyBurstHandle {
  burst: () => void;
}

interface MoneyBurstProps {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

const COLORS = ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#86efac'];
const SPRITE_SIZES = [20, 24, 28, 32];

interface Sprite {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  sprite: Sprite;
  opacity: number;
  fadeSpeed: number;
  active: boolean;
}

const MoneyBurst = forwardRef<MoneyBurstHandle, MoneyBurstProps>(function MoneyBurst({ buttonRef }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const spriteCacheRef = useRef<Sprite[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const poolRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const dimensionsRef = useRef({ width: 0, height: 0, centerX: 0, centerY: 0 });
  
  const [showControls] = useState(false); // Easter egg disabled
  const [intensity, setIntensity] = useState(1);

  // Pre-render sprite cache
  const preRenderSprites = useCallback(() => {
    if (spriteCacheRef.current.length > 0) return;
    
    COLORS.forEach((color) => {
      SPRITE_SIZES.forEach((size) => {
        const sCanvas = document.createElement('canvas');
        const sCtx = sCanvas.getContext('2d');
        if (!sCtx) return;
        
        const padding = 10;
        sCanvas.width = size + padding * 2;
        sCanvas.height = size + padding * 2;
        
        sCtx.fillStyle = color;
        sCtx.font = `bold ${size}px serif`;
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.shadowBlur = 3;
        sCtx.shadowColor = color;
        sCtx.fillText('$', sCanvas.width / 2, sCanvas.height / 2);
        
        spriteCacheRef.current.push({
          canvas: sCanvas,
          width: sCanvas.width,
          height: sCanvas.height
        });
      });
    });
  }, []);

  // Update canvas dimensions and button position
  const updateDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    // Get button center position relative to container
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      dimensionsRef.current = {
        width: rect.width,
        height: rect.height,
        centerX: buttonRect.left - containerRect.left + buttonRect.width / 2,
        centerY: buttonRect.top - containerRect.top + buttonRect.height / 2
      };
    } else {
      dimensionsRef.current = {
        width: rect.width,
        height: rect.height,
        centerX: rect.width / 2,
        centerY: rect.height / 2
      };
    }
  }, [buttonRef]);

  // Create a new particle
  const createParticle = useCallback((isBurst: boolean): Particle => {
    const { centerX, centerY } = dimensionsRef.current;
    const angle = Math.random() * Math.PI * 2;
    const speed = isBurst ? (Math.random() * 2.4 + 1.2) : (Math.random() * 1.2 + 0.6);
    
    return {
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed * 0.7,
      vy: Math.sin(angle) * speed * 1.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      sprite: spriteCacheRef.current[Math.floor(Math.random() * spriteCacheRef.current.length)],
      opacity: 0.8,
      fadeSpeed: Math.random() * 0.008 + 0.004,
      active: true
    };
  }, []);

  // Get particle from pool or create new
  const getParticle = useCallback((isBurst: boolean): Particle => {
    if (poolRef.current.length > 0) {
      const p = poolRef.current.pop()!;
      const newP = createParticle(isBurst);
      Object.assign(p, newP);
      return p;
    }
    return createParticle(isBurst);
  }, [createParticle]);

  // Spawn particles based on intensity
  const spawn = useCallback(() => {
    if (Math.random() < (intensity * 0.1) * 0.5) {
      particlesRef.current.push(getParticle(false));
    }
  }, [intensity, getParticle]);

  // Create burst effect
  const createBurst = useCallback(() => {
    for (let i = 0; i < 40; i++) {
      particlesRef.current.push(getParticle(true));
    }
  }, [getParticle]);

  // Expose burst method to parent
  useImperativeHandle(ref, () => ({
    burst: createBurst
  }), [createBurst]);

  // Animation loop
  useEffect(() => {
    preRenderSprites();
    updateDimensions();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 16.67;
      lastTimeRef.current = now;

      const { width, height } = dimensionsRef.current;

      // Transparent trail effect
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.globalCompositeOperation = 'source-over';

      // spawn(); // Disabled - only trigger on button hover

      // Update and draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        
        // Update
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;
        p.opacity -= p.fadeSpeed * dt;
        p.vx *= Math.pow(0.985, dt);
        p.vy *= Math.pow(0.985, dt);
        
        if (p.opacity <= 0) {
          p.active = false;
          poolRef.current.push(particlesRef.current.splice(i, 1)[0]);
          continue;
        }

        // Draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.drawImage(p.sprite.canvas, -p.sprite.width / 2, -p.sprite.height / 2);
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [preRenderSprites, updateDimensions, spawn]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => updateDimensions();
    window.addEventListener('resize', handleResize);
    
    // Also update when button might have moved (after initial render)
    const interval = setInterval(updateDimensions, 500);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, [updateDimensions]);

  // Easter egg timer - show controls after 30 seconds (DISABLED)
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setShowControls(true);
  //   }, 30000);
  //   
  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <>
      {/* Canvas container - positioned absolutely behind button */}
      <div 
        ref={containerRef}
        className="absolute inset-0 pointer-events-none hidden md:block"
        style={{ zIndex: 0 }}
      >
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: 'transparent' }}
        />
      </div>

      {/* Easter egg controls - only on desktop, fade in after 30 seconds */}
      <div 
        className={`fixed right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-6 transition-all duration-1000 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: 9999 }}
      >
        <button 
          onClick={createBurst}
          title="Burst"
          className="bg-black hover:bg-zinc-800 border border-zinc-800 text-white font-bold w-14 h-14 rounded-full transition-all active:scale-90 shadow-2xl flex items-center justify-center text-2xl"
        >
          💵
        </button>
        
        <div className="flex flex-col items-center gap-4 text-xs">
          <span className="text-zinc-400 font-semibold tracking-wide whitespace-nowrap">$ Savings</span>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={intensity}
            onChange={(e) => setIntensity(parseInt(e.target.value))}
            className="h-28 accent-green-500"
            style={{
              writingMode: 'vertical-lr',
              direction: 'rtl'
            }}
          />
        </div>
      </div>
    </>
  );
});

export default MoneyBurst;
