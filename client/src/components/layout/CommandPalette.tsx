import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, User, X } from 'lucide-react';
import { useUIStore } from '../../stores';
import { searchApi } from '../../api';
import type { SearchResults } from '../../types';

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ tickets: [], users: [], projects: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setResults({ tickets: [], users: [], projects: [] });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ tickets: [], users: [], projects: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await searchApi.globalSearch(query);
        setResults(data);
      } catch {
        setResults({ tickets: [], users: [], projects: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!commandPaletteOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    setCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 
                      animate-slide-up overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets, people..."
            className="flex-1 text-sm outline-none bg-transparent text-text-primary 
                       placeholder:text-text-muted"
            onKeyDown={(e) => e.key === 'Escape' && setCommandPaletteOpen(false)}
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <p className="text-sm text-text-muted text-center py-4">Searching...</p>
          )}

          {!loading && query.length >= 2 && results.tickets.length === 0 && results.users.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">No results found</p>
          )}

          {results.tickets.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted px-2 py-1.5 uppercase tracking-wider">
                Tickets
              </p>
              {results.tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => handleSelect(`/tickets/${ticket.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 
                            text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-text-secondary font-mono">{ticket.ticketNumber}</span>
                    <p className="text-sm text-text-primary truncate">{ticket.title}</p>
                  </div>
                  <span className={`ticket-status-${ticket.status.toLowerCase().replace('_', '-')}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.users.length > 0 && (
            <div className={results.tickets.length > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
              <p className="text-xs font-medium text-text-muted px-2 py-1.5 uppercase tracking-wider">
                People
              </p>
              {results.users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelect(`/user/${u.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 
                            text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{u.fullName}</p>
                    <p className="text-xs text-text-secondary">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!query && (
            <div className="text-center py-6">
              <Search className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Type to search tickets and people</p>
              <p className="text-xs text-text-muted mt-1">Press ESC to close</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
