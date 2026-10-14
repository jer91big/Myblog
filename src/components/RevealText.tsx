import { useEffect, useRef, useState } from 'react';
import HalftoneReveal from './HalftoneReveal';
import { createHalftoneCanvas, createTextCanvas } from '../lib/halftoneText';

// 与 HalftoneReveal 的默认值保持一致的网点参数，改这里要同步改下面的 cellSize/angle
const CELL_SIZE = 7;
const ANGLE = 45;
const REVEAL_RADIUS = 140;
const PAPER = '#ffffff';

const supportsWebgl2 = (() => {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
})();

// 触屏没有 hover，WebGL 版永远显不出形，直接用静态网点就好
const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

interface RevealTextProps {
  text: string;
  /** 排版类名（字号、行高、颜色从这里读），例如 "text-gray-600 text-sm" */
  className?: string;
  lines?: number;
}

export const RevealText = ({ text, className = '', lines = 3 }: RevealTextProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const restingRef = useRef<HTMLCanvasElement>(null);
  const hoverableRef = useRef(false);
  const [source, setSource] = useState<{ url: string; ink: string } | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    hoverableRef.current = supportsWebgl2 && canHover();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const measure = measureRef.current;
    if (!host || !measure || !text.trim()) return;

    let alive = true;
    let lastWidth = 0;
    let timer: number | undefined;

    // force 用于宽度没变但必须重画的场合（字体加载完成）
    const render = (force = false) => {
      if (!alive) return;
      // 卡片会被 gsap 加 scale 入场，clientWidth 是布局宽度，不受 transform 影响
      const width = host.clientWidth;
      if (width < 8 || (!force && Math.abs(width - lastWidth) < 1)) return;
      lastWidth = width;

      const style = window.getComputedStyle(measure);
      const fontSize = parseFloat(style.fontSize) || 14;
      const parsedLineHeight = parseFloat(style.lineHeight);
      const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.5;
      const boxHeight = Math.round(lineHeight * lines);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const ink = style.color;

      host.style.height = `${boxHeight}px`;

      const crisp = createTextCanvas({
        text,
        width,
        height: boxHeight,
        font: `${style.fontWeight} ${fontSize}px ${style.fontFamily}`,
        lineHeight,
        color: ink,
        paper: PAPER,
        dpr,
        maxLines: lines,
      });

      const resting = restingRef.current;
      if (resting) {
        const halftone = createHalftoneCanvas(crisp, {
          cellSize: CELL_SIZE,
          angle: ANGLE,
          ink,
          paper: PAPER,
          dpr,
        });
        resting.width = halftone.width;
        resting.height = halftone.height;
        const ctx = resting.getContext('2d');
        if (ctx) ctx.drawImage(halftone, 0, 0);
      }

      setSource({ url: crisp.toDataURL('image/png'), ink });
    };

    // 拖窗口时 ResizeObserver 每帧都触发，而重画要 toDataURL 并重建 WebGL 上下文，
    // 所以延后到停下来再画，中途静态网点会被拉伸，看不出来
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => render(), 120);
    });
    observer.observe(host);
    render(true);
    // 字体没加载完就画的话，落笔的是回退字体
    document.fonts?.ready.then(() => render(true)).catch(() => {});

    return () => {
      alive = false;
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [text, lines]);

  return (
    <div
      ref={hostRef}
      className={`relative overflow-hidden ${className}`}
      style={{ height: lines * 20 }}
      onPointerEnter={() => {
        if (hoverableRef.current) setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <span ref={measureRef} className="sr-only">
        {text}
      </span>
      <canvas ref={restingRef} aria-hidden className="absolute inset-0 h-full w-full" />
      {hovered && source && (
        <div className="absolute inset-0">
          <HalftoneReveal
            src={source.url}
            fit="contain"
            mode="mono"
            cellSize={CELL_SIZE}
            angle={ANGLE}
            inkColor={source.ink}
            paperColor={PAPER}
            revealRadius={REVEAL_RADIUS}
            clickBurst={false}
            intro={false}
          />
        </div>
      )}
    </div>
  );
};
