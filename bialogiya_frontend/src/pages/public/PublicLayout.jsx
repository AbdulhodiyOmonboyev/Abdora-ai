import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { LogoIcon } from '../../components/ui/Logo';
import { useThemeStore } from '../../store/themeStore';

const ThemeContext = createContext(null);

export function usePublicTheme() {
  return useContext(ThemeContext);
}

export default function PublicLayout({ children }) {
  const { theme, toggle } = useThemeStore();
  const dark = theme === 'dark' || theme === 'amoled';
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.dataset.theme = theme;
  }, [dark, theme]);

  const navClass = ({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`;

  return (
    <ThemeContext.Provider value={{ theme, dark, toggleTheme: toggle }}>
      <div className={`public-shell ${dark ? 'theme-dark dark' : 'theme-light'}`}>
        <header className={`public-header ${scrolled ? 'is-scrolled' : ''}`}>
          <nav className="public-nav">
            <Link to="/" className="public-brand flex items-center gap-3" onClick={() => setMenuOpen(false)}>
              <LogoIcon size={scrolled ? 40 : 46} />
              <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white font-['Space_Grotesk']">
                Abdora
              </span>
            </Link>
            <div className={`public-nav-links ${menuOpen ? 'open' : ''}`}>
              <NavLink end to="/" className={navClass} onClick={() => setMenuOpen(false)}>Bosh sahifa</NavLink>
              <NavLink to="/services" className={navClass} onClick={() => setMenuOpen(false)}>Xizmatlar</NavLink>
              <NavLink to="/documents" className={navClass} onClick={() => setMenuOpen(false)}>Hujjatlar</NavLink>
              <NavLink to="/contact" className={navClass} onClick={() => setMenuOpen(false)}>Aloqa</NavLink>
              <Link to="/login" className="public-login mobile-login" onClick={() => setMenuOpen(false)}>Kirish</Link>
            </div>
            <div className="public-actions">
              <button
                type="button"
                className="public-icon-button"
                onClick={toggle}
                aria-label={dark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}
              >
                {dark ? <Sun size={18} style={{ color: '#F59E0B' }} /> : <Moon size={18} />}
              </button>
              <Link to="/login" className="public-login">Kirish</Link>
              <button
                type="button"
                className="public-icon-button public-menu-button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="Menyuni ochish"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </nav>
        </header>

        <div className="public-content">{children || <Outlet />}</div>

        <footer className="public-footer">
          <div>
            <span className="public-brand flex items-center gap-3">
              <LogoIcon size={38} />
              <span className="font-bold text-base tracking-tight text-gray-900 dark:text-white font-['Space_Grotesk']">
                Abdora
              </span>
            </span>
            <p className="text-gray-600 dark:text-gray-400">Zamonaviy ta'lim va o'quv markazlari boshqaruv platformasi.</p>
          </div>
          <div className="public-footer-links">
            <NavLink to="/">Bosh sahifa</NavLink>
            <NavLink to="/services">Xizmatlar</NavLink>
            <NavLink to="/documents">Hujjatlar</NavLink>
            <NavLink to="/contact">Aloqa</NavLink>
            <span className="text-gray-500 dark:text-gray-500">© 2026 Abdora</span>
          </div>
        </footer>
      </div>
    </ThemeContext.Provider>
  );
}
