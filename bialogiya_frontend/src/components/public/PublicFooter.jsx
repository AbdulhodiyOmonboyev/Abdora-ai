import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="relative z-10 max-w-6xl mx-auto px-6 py-10 border-t border-black/5 dark:border-white/5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#2B1B10]/40 dark:text-white/40">
        <span>© 2026 Abdora AI</span>
        <div className="flex items-center gap-5">
          <Link to="/xizmatlar" className="hover:text-[#FF7A1A] transition-colors">Xizmatlar</Link>
          <Link to="/hujjatlar" className="hover:text-[#FF7A1A] transition-colors">Hujjatlar</Link>
          <Link to="/aloqa" className="hover:text-[#FF7A1A] transition-colors">Aloqa</Link>
          <Link to="/login" className="hover:text-[#FF7A1A] transition-colors">Tizimga kirish →</Link>
        </div>
      </div>
    </footer>
  );
}
