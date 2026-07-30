import { useTheme } from '../hooks/useTheme';
import './ThemeToggle.css';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isChecked = theme === 'light';

  return (
    <div className="toggle-switch">
      <label className="switch-label">
        <input
          type="checkbox"
          className="checkbox"
          checked={isChecked}
          onChange={toggleTheme}
        />
        <span className="slider" />
      </label>
    </div>
  );
};
