import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = [
  { to: '/', label: 'Bosh sahifa' },
  { to: '/xizmatlar', label: 'Xizmatlar' },
  { to: '/hujjatlar', label: 'Hujjatlar' },
  { to: '/aloqa', label: 'Aloqa' },
];

export default function PublicNav({ dark, setDark }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 abdora-gradient rounded-xl flex items-center justify-center font-bold text-sm text-white abdora-glow">A</div>
          <span className="display-font font-semibold text-lg">Abdora AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-colors ${
                pathname === l.to
                  ? 'text-[#FF7A1A] bg-[#FF7A1A]/10'
                  : 'text-[#2B1B10]/60 dark:text-white/60 hover:text-[#FF7A1A]'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
            className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/15 flex items-center justify-center
              text-[#2B1B10]/70 dark:text-white/70 hover:border-[#FF7A1A]/50 hover:text-[#FF7A1A] transition-colors"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            to="/login"
            className="hidden sm:inline-flex text-sm font-medium text-[#2B1B10]/70 dark:text-white/70 hover:text-[#FF7A1A] transition-colors
              border border-black/10 dark:border-white/15 rounded-xl px-4 py-2 hover:border-[#FF7A1A]/50"
          >
            Kirish
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menyu"
            className="md:hidden w-10 h-10 rounded-xl border border-black/10 dark:border-white/15 flex items-center justify-center text-[#2B1B10]/70 dark:text-white/70"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden mt-3 flex flex-col gap-1 border-t border-black/5 dark:border-white/10 pt-3">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`text-sm font-medium px-3.5 py-2.5 rounded-lg transition-colors ${
                pathname === l.to
                  ? 'text-[#FF7A1A] bg-[#FF7A1A]/10'
                  : 'text-[#2B1B10]/60 dark:text-white/60'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/login" onClick={() => setOpen(false)}
            className="sm:hidden text-sm font-medium text-[#FF7A1A] px-3.5 py-2.5">
            Kirish →
          </Link>
        </div>
      )}
    </nav>
  );
}
