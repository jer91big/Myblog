import { useRef, useEffect, useCallback } from 'react';

interface LineWavesProps {
  width?: number;
  height?: number;
  speed?: number;
  innerLineCount?: number;
  outerLineCount?: number;
  warpIntensity?: number;
  rotation?: number;
  edgeFadeWidth?: number;
  colorCycleSpeed?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  enableMouseInteraction?: boolean;
  mouseInfluence?: number;
}

export const LineWaves = ({
  width,
  height,
  speed = 0.3,
  innerLineCount = 32,
  outerLineCount = 36,
  warpIntensity = 1,
  rotation = -45,
  edgeFadeWidth = 0,
  colorCycleSpeed = 1,
  brightness = 0.2,
  color1 = '#ffffff',
  color2 = '#ffffff',
  color3 = '#ffffff',
  enableMouseInteraction = true,
  mouseInfluence = 2,
}: LineWavesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const colors = [color1, color2, color3];
      ctx.clearRect(0, 0, w, h);

      // Convert rotation to radians
      const rad = (rotation * Math.PI) / 180;

      // Helper to rotate point
      const rotate = (x: number, y: number, cx: number, cy: number) => {
        const dx = x - cx;
        const dy = y - cy;
        return {
          x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
          y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
        };
      };

      const drawLines = (count: number, lineColor: string, isOuter: boolean) => {
        const cx = w / 2;
        const cy = h / 2;
        const spacing = isOuter ? (Math.min(w, h) * 0.55) / count : (Math.min(w, h) * 0.4) / count;

        ctx.strokeStyle = lineColor;
        ctx.globalAlpha = brightness;

        for (let i = 0; i < count; i++) {
          const baseOffset = isOuter ? -((count / 2) * spacing) + i * spacing + (Math.min(w, h) * 0.15) : -((count / 2) * spacing) + i * spacing;

          ctx.beginPath();

          const steps = 80;
          const lineLength = w * 2;

          for (let s = 0; s <= steps; s++) {
            const progress = s / steps;
            const px = -w * 0.5 + lineLength * progress;
            const py = baseOffset;

            // Warp effect using sine waves
            const phase = t * speed + i * 0.3;
            const mouseX = mouseRef.current.x - 0.5;
            const mouseY = mouseRef.current.y - 0.5;

            const warpX =
              Math.sin(phase + progress * 4) * 20 * warpIntensity +
              Math.cos(phase * 0.7 + progress * 3) * 15 * warpIntensity +
              mouseX * mouseInfluence * 50 * progress;

            const warpY =
              Math.cos(phase + progress * 3.5) * 20 * warpIntensity +
              Math.sin(phase * 1.3 + progress * 2.5) * 10 * warpIntensity +
              mouseY * mouseInfluence * 50 * (1 - Math.abs(progress - 0.5) * 2);

            // Edge fade
            let alpha = 1;
            if (edgeFadeWidth > 0) {
              const distFromEdge = Math.min(progress, 1 - progress);
              if (distFromEdge < edgeFadeWidth) {
                alpha = distFromEdge / edgeFadeWidth;
              }
            }

            const rp = rotate(px + warpX, py + warpY, cx, cy);

            if (s === 0) {
              ctx.moveTo(rp.x, rp.y);
            } else {
              ctx.lineTo(rp.x, rp.y);
            }
          }

          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      };

      // Color cycling
      const colorIndex = Math.floor((t * colorCycleSpeed) % colors.length);
      const nextIndex = (colorIndex + 1) % colors.length;
      const blend = (t * colorCycleSpeed) % 1;

      const blendColors = (c1: string, c2: string, ratio: number): string => {
        const parse = (c: string) => {
          const h = c.replace('#', '');
          return {
            r: parseInt(h.slice(0, 2), 16),
            g: parseInt(h.slice(2, 4), 16),
            b: parseInt(h.slice(4, 6), 16),
          };
        };
        const a = parse(c1);
        const b = parse(c2);
        const r = Math.round(a.r + (b.r - a.r) * ratio);
        const g = Math.round(a.g + (b.g - a.g) * ratio);
        const bl = Math.round(a.b + (b.b - a.b) * ratio);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
      };

      const currentColor = blendColors(colors[colorIndex], colors[nextIndex], blend);

      drawLines(innerLineCount, currentColor, false);
      drawLines(outerLineCount, currentColor, true);
    },
    [speed, innerLineCount, outerLineCount, warpIntensity, rotation, edgeFadeWidth, colorCycleSpeed, brightness, color1, color2, color3, mouseInfluence]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    const w = width ?? parent?.clientWidth ?? window.innerWidth;
    const h = height ?? parent?.clientHeight ?? 500;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const animate = (timestamp: number) => {
      timeRef.current += 0.016;
      draw(ctx, w, h, timeRef.current);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    const handleResize = () => {
      const nw = width ?? parent?.clientWidth ?? window.innerWidth;
      const nh = height ?? parent?.clientHeight ?? 500;
      canvas.width = nw * dpr;
      canvas.height = nh * dpr;
      canvas.style.width = `${nw}px`;
      canvas.style.height = `${nh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    if (enableMouseInteraction) {
      window.addEventListener('mousemove', handleMouse);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height, enableMouseInteraction, draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};
