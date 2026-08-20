import { useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** 自动清理 GSAP 动画的 hook */
export function useGsapContext(callback: (ctx: gsap.Context) => void, deps: unknown[] = []) {
  useEffect(() => {
    const ctx = gsap.context(callback);
    return () => ctx.revert();
  }, deps);
}

/** ScrollTrigger stagger 入场动画 */
export function useScrollStagger<T extends HTMLElement>(
  selector: string,
  options: {
    y?: number;
    opacity?: number;
    scale?: number;
    stagger?: number;
    duration?: number;
    ease?: string;
    start?: string;
  } = {},
  deps: unknown[] = [],
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const {
      y = 50,
      opacity = 0,
      scale = 1,
      stagger = 0.1,
      duration = 0.7,
      ease = 'power2.out',
      start = 'top 85%',
    } = options;

    const elements = containerRef.current.querySelectorAll(selector);
    if (!elements.length) return;

    gsap.set(elements, { y, opacity, scale });

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start,
      onEnter: () => {
        gsap.to(elements, {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger,
          duration,
          ease,
        });
      },
      once: true,
    });

    return () => trigger.kill();
  }, deps);

  return containerRef;
}

/** 单元素 ScrollTrigger 入场 */
export function useScrollReveal<T extends HTMLElement>(
  options: {
    y?: number;
    x?: number;
    opacity?: number;
    scale?: number;
    rotation?: number;
    duration?: number;
    ease?: string;
    start?: string;
    delay?: number;
  } = {},
  deps: unknown[] = [],
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const {
      y = 40,
      x = 0,
      opacity = 0,
      scale = 1,
      rotation = 0,
      duration = 0.7,
      ease = 'power2.out',
      start = 'top 85%',
      delay = 0,
    } = options;

    gsap.set(ref.current, { y, x, opacity, scale, rotation });

    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start,
      onEnter: () => {
        gsap.to(ref.current, {
          y: 0,
          x: 0,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration,
          ease,
          delay,
        });
      },
      once: true,
    });

    return () => trigger.kill();
  }, deps);

  return ref;
}

/** 文字逐字拆分动画（不依赖 GSAP SplitText 插件） */
export function useSplitTextReveal<T extends HTMLElement>(
  options: {
    stagger?: number;
    duration?: number;
    ease?: string;
    y?: number;
    delay?: number;
  } = {},
  deps: unknown[] = [],
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const {
      stagger = 0.03,
      duration = 0.6,
      ease = 'back.out(1.7)',
      y = 60,
      delay = 0,
    } = options;

    const el = ref.current;
    const text = el.textContent || '';
    el.innerHTML = '';

    // 逐字拆分
    const chars = text.split('');
    chars.forEach((char) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? ' ' : char;
      span.style.display = 'inline-block';
      span.className = 'gsap-char';
      el.appendChild(span);
    });

    const charEls = el.querySelectorAll('.gsap-char');
    gsap.set(charEls, { y, opacity: 0, rotateX: -90 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(charEls, {
          y: 0,
          opacity: 1,
          rotateX: 0,
          stagger,
          duration,
          ease,
          delay,
        });
      },
      once: true,
    });

    return () => {
      trigger.kill();
      el.textContent = text;
    };
  }, deps);

  return ref;
}

export { gsap, ScrollTrigger };
