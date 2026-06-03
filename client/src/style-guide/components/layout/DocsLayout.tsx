import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Moon, Sun, Menu } from 'lucide-react';
import { DocsSidebar } from './DocsSidebar';
import { DocsRightNav } from './DocsRightNav';

const STORAGE_KEY = 'sg-dark-mode';

function readDark() { return localStorage.getItem(STORAGE_KEY) === 'dark'; }

export function DocsLayout() {
  const [dark,        setDark]        = useState<boolean>(readDark);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  // Remove dark class when leaving style guide
  useEffect(() => {
    return () => { document.documentElement.classList.remove('dark'); };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden flex items-center justify-between px-4 h-12 border-b border-border bg-card sticky top-0 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-[14px] font-bold text-foreground">TaskPilot DS</span>
        <button
          onClick={() => setDark(d => !d)}
          aria-label="Toggle dark mode"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full z-50 lg:hidden shadow-xl">
            <DocsSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* ── Main 3-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — desktop only */}
        <div className="hidden lg:flex flex-col h-screen sticky top-0 overflow-y-auto">
          <DocsSidebar />
          {/* Dark mode toggle at bottom */}
          <div className="px-3 py-3 border-t border-border">
            <button
              onClick={() => setDark(d => !d)}
              aria-label="Toggle dark mode"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {dark
                ? <><Sun className="w-4 h-4" /> Light mode</>
                : <><Moon className="w-4 h-4" /> Dark mode</>
              }
            </button>
          </div>
        </div>

        {/* Center content */}
        <main
          id="docs-content"
          className="flex-1 min-w-0 overflow-y-auto"
        >
          <div className="max-w-3xl mx-auto px-6 lg:px-10 py-10">
            <Outlet />
          </div>
        </main>

        {/* Right nav — desktop only */}
        <div className="hidden lg:block px-6 py-10">
          <DocsRightNav />
        </div>

      </div>
    </div>
  );
}
