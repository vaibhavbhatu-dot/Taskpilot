import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, ArrowRight, Trash2 } from 'lucide-react';
import { ticketsApi, sprintsApi } from '../api';
import type { Ticket, Sprint } from '../types';

export function BacklogPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [ticketRes, sprintRes] = await Promise.all([
        ticketsApi.list({ status: 'BACKLOG', limit: '200' }),
        sprintsApi.list({ status: 'PLANNED' }),
      ]);
      setTickets(ticketRes.data.tickets);
      setSprints(sprintRes.data.filter((s: Sprint) => s.status !== 'COMPLETED'));
    } catch (error) {
      console.error('Failed to load backlog:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === tickets.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tickets.map((t) => t.id)));
    }
  }

  async function handleAddToSprint(sprintId: string) {
    if (selected.size === 0) return;
    try {
      await sprintsApi.addTickets(sprintId, Array.from(selected));
      setSelected(new Set());
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add tickets to sprint');
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} ticket(s)?`)) return;
    try {
      await Promise.all(Array.from(selected).map((id) => ticketsApi.delete(id)));
      setSelected(new Set());
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Backlog</h1>
          <p className="text-sm text-text-secondary mt-0.5">{tickets.length} unplanned tickets</p>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="card p-3 flex items-center gap-3 bg-primary-50 border-primary-200 animate-fade-in">
          <span className="text-sm font-medium text-primary-700">{selected.size} selected</span>
          <div className="flex-1" />
          {sprints.length > 0 && (
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-text-muted" />
              <select
                onChange={(e) => e.target.value && handleAddToSprint(e.target.value)}
                className="select w-auto text-sm h-8"
                defaultValue=""
              >
                <option value="">Add to Sprint...</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={handleBulkDelete} className="btn-danger btn-sm">
            <Trash2 className="w-3 h-3 mr-1" /> Delete
          </button>
        </div>
      )}

      {/* Tickets */}
      {tickets.length === 0 ? (
        <div className="card p-12 text-center">
          <Inbox className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">Backlog is empty</p>
          <p className="text-sm text-text-muted mt-1">All tickets are assigned to sprints</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === tickets.length && tickets.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Ticket</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Title</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Priority</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(ticket.id)}
                      onChange={() => toggleSelect(ticket.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-text-secondary">{ticket.ticketNumber}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="text-sm font-medium text-text-primary hover:text-primary-600 text-left"
                    >
                      {ticket.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-gray text-xs">{ticket.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium priority-${ticket.priority.toLowerCase()}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{ticket.storyPoints || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
