import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Hash, Folder } from 'lucide-react';
import { searchApi } from '../../api';
import type { SearchResults } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ tickets: [], users: [], projects: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const allResults = [
    ...results.tickets.map(t => ({ type: 'TICKET' as const, data: t })),
    ...results.users.map(u => ({ type: 'USER' as const, data: u })),
    ...results.projects.map(p => ({ type: 'PROJECT' as const, data: p })),
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ tickets: [], users: [], projects: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults({ tickets: [], users: [], projects: [] });
        return;
      }
      setLoading(true);
      try {
        const { data } = await searchApi.globalSearch(query);
        setResults(data);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allResults.length > 0 && selectedIndex >= 0 && selectedIndex < allResults.length) {
          handleSelect(allResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allResults]);

  const handleSelect = (item: typeof allResults[0]) => {
    if (item.type === 'TICKET') navigate(`/tickets/${item.data.id}`);
    else if (item.type === 'USER') navigate(`/user/${item.data.id}`);
    else if (item.type === 'PROJECT') navigate(`/projects?search=${item.data.key}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-start pt-[15vh]">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-[640px] bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in border border-border">

        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-4 py-4 text-[16px] bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
            placeholder="Search tickets, members, projects... (⌘K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-accent rounded-md transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Results Body */}
        {(query.length >= 2 || loading) && (
          <div className="max-h-[400px] overflow-y-auto p-2">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Searching...</div>
            ) : allResults.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No results found for "{query}"</div>
            ) : (
              <div className="space-y-4 py-2">

                {/* Tickets Group */}
                {results.tickets.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Tickets</div>
                    {results.tickets.map((ticket) => {
                      const idx = allResults.findIndex(r => r.type === 'TICKET' && r.data.id === ticket.id);
                      return (
                        <button
                          key={ticket.id}
                          onClick={() => handleSelect({ type: 'TICKET', data: ticket })}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left ${selectedIndex === idx ? 'bg-accent' : 'hover:bg-accent/50'}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                              <Hash className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-muted-foreground flex-shrink-0">{ticket.ticketNumber}</span>
                                <span className="text-[14px] font-medium text-foreground truncate">{ticket.title}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{ticket.status}</span>
                                <span className="text-[12px] text-muted-foreground truncate">{ticket.project?.name}</span>
                              </div>
                            </div>
                          </div>
                          {ticket.assignedTo && (
                            <img src={ticket.assignedTo.avatar || `https://ui-avatars.com/api/?name=${ticket.assignedTo.fullName}&background=DBEAFE&color=1D4ED8`} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Members Group */}
                {results.users.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Members</div>
                    {results.users.map((user) => {
                      const idx = allResults.findIndex(r => r.type === 'USER' && r.data.id === user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={() => handleSelect({ type: 'USER', data: user })}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left ${selectedIndex === idx ? 'bg-accent' : 'hover:bg-accent/50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=E0E7FF&color=4338CA`} alt="" className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <p className="text-[14px] font-medium text-foreground">{user.fullName}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[12px] text-muted-foreground">
                                <span>{user.designation || user.role}</span>
                                {user.team && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{user.team.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Projects Group */}
                {results.projects.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Projects</div>
                    {results.projects.map((project) => {
                      const idx = allResults.findIndex(r => r.type === 'PROJECT' && r.data.id === project.id);
                      return (
                        <button
                          key={project.id}
                          onClick={() => handleSelect({ type: 'PROJECT', data: project })}
                          className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-left ${selectedIndex === idx ? 'bg-accent' : 'hover:bg-accent/50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
                              <Folder className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-[14px] font-medium text-foreground">{project.name}</p>
                              <p className="text-[12px] font-semibold text-muted-foreground tracking-wider">{project.key}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/50 flex items-center justify-between text-[12px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-sans">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-sans">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-sans">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-sans">esc</kbd>
            <span>to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
