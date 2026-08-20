import { useEffect, useState, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { gsap } from '../hooks/useGsap';

export const BackToTop = () => {
  const [visible, setVisible] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const updateVisibility = () => {
      const shouldShow = window.scrollY > 480;
      if (shouldShow !== visible) {
        setVisible(shouldShow);
      }
    };
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, [visible]);

  // 入场动画
  useEffect(() => {
    if (!visible || !btnRef.current) return;

    if (!hasAnimated.current) {
      gsap.from(btnRef.current, {
        y: 40,
        opacity: 0,
        scale: 0.5,
        duration: 0.5,
        ease: 'back.out(2)',
      });
      hasAnimated.current = true;
    } else {
      gsap.to(btnRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [visible]);

  const handleClick = () => {
    if (btnRef.current) {
      gsap.to(btnRef.current, {
        y: -10,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      ref={btnRef}
      type="button"
      className="back-to-top"
      onClick={handleClick}
      onMouseEnter={() => {
        if (btnRef.current) {
          gsap.to(btnRef.current, {
            y: -3,
            scale: 1.08,
            duration: 0.3,
            ease: 'back.out(2)',
          });
        }
      }}
      onMouseLeave={() => {
        if (btnRef.current) {
          gsap.to(btnRef.current, {
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
        }
      }}
      aria-label="返回页面顶部"
      title="返回顶部"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};
