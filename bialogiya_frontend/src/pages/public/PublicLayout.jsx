import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';

const ThemeContext = createContext(null);
const THEME_KEY = 'abdora-public-theme';

export function usePublicTheme() {
  return useContext(ThemeContext);
}

export default function PublicLayout({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => localStorage.setItem(THEME_KEY, theme), [theme]);
  const dark = theme === 'dark';
  const navClass = ({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`;

  return (
    <ThemeContext.Provider value={{ theme, dark, toggleTheme: () => setTheme((value) => value === 'dark' ? 'light' : 'dark') }}>
      <div className={`public-shell ${dark ? 'theme-dark' : 'theme-light'}`}>
        <header className="public-header">
          <nav className="public-nav">
            <Link to="/" className="public-brand" onClick={() => setMenuOpen(false)}><span className="public-logo">A</span><span>Abdora <b>AI</b></span></Link>
            <div className={`public-nav-links ${menuOpen ? 'open' : ''}`}>
              <NavLink end to="/" className={navClass} onClick={() => setMenuOpen(false)}>Bosh sahifa</NavLink>
              <NavLink to="/services" className={navClass} onClick={() => setMenuOpen(false)}>Xizmatlar</NavLink>
              <NavLink to="/documents" className={navClass} onClick={() => setMenuOpen(false)}>Hujjatlar</NavLink>
              <NavLink to="/contact" className={navClass} onClick={() => setMenuOpen(false)}>Aloqa</NavLink>
              <Link to="/login" className="public-login mobile-login" onClick={() => setMenuOpen(false)}>Kirish</Link>
            </div>
            <div className="public-actions"><button type="button" className="public-icon-button" onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} aria-label={dark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button><Link to="/login" className="public-login">Kirish</Link><button type="button" className="public-icon-button public-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Menyuni ochish">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button></div>
          </nav>
        </header>
        <div className="public-content">{children || <Outlet />}</div>
        <footer className="public-footer"><div><span className="public-brand"><span className="public-logo">A</span><span>Abdora <b>AI</b></span></span><p>AI yordamida o‘qishni osonlashtiramiz.</p></div><div className="public-footer-links"><NavLink to="/">Bosh sahifa</NavLink><NavLink to="/services">Xizmatlar</NavLink><NavLink to="/documents">Hujjatlar</NavLink><NavLink to="/contact">Aloqa</NavLink><span>© 2025 Abdora AI</span></div></footer>
      </div>
    </ThemeContext.Provider>
  );
}
