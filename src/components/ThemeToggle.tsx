import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="toggle-switch">
      <label className="switch-label">
        <input
          type="checkbox"
          className="checkbox"
          checked={!isDark}
          onChange={toggleTheme}
        />
        <span className="slider">
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
