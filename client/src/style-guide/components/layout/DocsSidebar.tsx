import { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight, Search, X, Moon, Sun } from 'lucide-react';
import { Badge } from '@/design-system';
import { navGroups, type NavGroup } from '../../data/navItems';

interface DocsSidebarProps {
  onClose?:       () => void;
  dark?:          boolean;
  onToggleDark?:  () => void;
}

export function DocsSidebar({ onClose, dark, onToggleDark }: DocsSidebarProps) {
  const [query,    setQuery]    = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    foundations: true,
    components:  true,
    product:     true,
  });

  const filtered = useMemo<NavGroup[]>(() => {
    if (!query.trim()) return navGroups;
    const q = query.toLowerCase();
    return navGroups
      .map(g => ({ ...g, items: g.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [query]);

  function toggle(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const linkBase =
    'flex items-center h-8 px-3 rounded-md text-[13px] font-medium transition-colors w-full text-left';
  const linkActive =
    'border-l-2 border-primary bg-primary/10 text-primary pl-[10px]';
  const linkInactive =
    'text-muted-foreground hover:bg-muted hover:text-foreground';

  return (
    <aside className="flex flex-col h-full bg-card border-r border-border w-[220px] flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-foreground tracking-tight">TaskPilot DS</span>
          <Badge variant="secondary" size="sm">v1.0</Badge>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full h-8 pl-8 pr-3 text-[13px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {filtered.map(group => {
          const isOpen = query.trim() ? true : (expanded[group.id] ?? true);
          return (
            <div key={group.id}>
              <button
                onClick={() => toggle(group.id)}
                className="flex items-center justify-between w-full px-2 py-1.5 mb-1"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </span>
                {isOpen
                  ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                }
              </button>

              {isOpen && (
                <ul className="space-y-0.5">
                  {group.items.map(item => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `${linkBase} ${isActive ? linkActive : linkInactive}`
                        }
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-2 py-4 text-[12px] text-muted-foreground text-center">
            No results for "{query}"
          </p>
        )}
      </nav>

      {/* Bottom: dark mode toggle — always pinned */}
      {onToggleDark && (
        <div className="flex-shrink-0 px-3 py-3 border-t border-border">
          <button
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {dark
              ? <><Sun className="w-4 h-4" /> Light mode</>
              : <><Moon className="w-4 h-4" /> Dark mode</>
            }
          </button>
        </div>
      )}
    </aside>
  );
}
