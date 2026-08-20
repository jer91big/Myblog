import { useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';
import { gsap } from '../hooks/useGsap';
import './ThemeToggle.css';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const sliderRef = useRef<HTMLSpanElement>(null);

  const handleChange = () => {
    toggleTheme();
    // 切换时图标旋转动画
    if (sliderRef.current) {
      gsap.fromTo(sliderRef.current, { rotate: 0 }, {
        rotate: 360,
        duration: 0.5,
        ease: 'back.out(1.7)',
        clearProps: 'rotation',
      });
    }
  };

  return (
    <div className="toggle-switch">
      <label className="switch-label">
        <input
          type="checkbox"
          className="checkbox"
          checked={!isDark}
          onChange={handleChange}
        />
        <span ref={sliderRef} className="slider">
          <span className="slider-icon slider-icon-sun">
            <Sun className="w-3.5 h-3.5" />
          </span>
          <span className="slider-icon slider-icon-moon">
            <Moon className="w-3.5 h-3.5" />
          </span>
        </span>
      </label>
    </div>
  );
};
