import { useState } from 'react';
import { Plus, ListFilter, Trash2 } from 'lucide-react';

export type FilterField = 'status' | 'priority' | 'type' | 'assignedToId' | 'teamId' | 'sprintId';
export type FilterOperator = 'equals' | 'not_equals';

export interface FilterRow {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

interface FilterBuilderProps {
  filters: FilterRow[];
  onChange: (filters: FilterRow[]) => void;
  users: { id: string; fullName: string }[];
  teams: { id: string; name: string }[];
  sprints: { id: string; name: string }[];
  onApply: () => void;
  onClear: () => void;
}

const FIELDS: { value: FilterField; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'type', label: 'Type' },
  { value: 'assignedToId', label: 'Assignee' },
  { value: 'teamId', label: 'Team' },
  { value: 'sprintId', label: 'Sprint' },
];

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
];

import { TICKET_STATUSES, getStatusLabel } from '../../constants/ticketStatus';

const STATUS_OPTIONS = TICKET_STATUSES;
const PRIORITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const TYPE_OPTIONS = ['BUG', 'FEATURE', 'TASK', 'IMPROVEMENT'];

export function FilterBuilder({ filters, onChange, users, teams, sprints, onApply, onClear }: FilterBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const addFilterRow = () => {
    onChange([
      ...filters,
      { id: Math.random().toString(36).substr(2, 9), field: 'status', operator: 'equals', value: '' }
    ]);
  };

  const updateFilter = (id: string, updates: Partial<FilterRow>) => {
    onChange(filters.map(f => (f.id === id ? { ...f, ...updates, ...(updates.field ? { value: '' } : {}) } : f)));
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter(f => f.id !== id));
  };

  const renderValueInput = (row: FilterRow) => {
    switch (row.field) {
      case 'status':
        return (
          <select value={row.value} onChange={(e) => updateFilter(row.id, { value: e.target.value })} className="input h-9 text-[13px] w-48">
            <option value="">Select status...</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
        );
      case 'priority':
        return (
          <select value={row.value} onChange={(e) => updateFilter(row.id, { value: e.target.value })} className="input h-9 text-[13px] w-48">
            <option value="">Select priority...</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        );
      case 'type':
        return (
          <select value={row.value} onChange={(e) => updateFilter(row.id, { value: e.target.value })} className="input h-9 text-[13px] w-48">
            <option value="">Select type...</option>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        );
      case 'assignedToId':
        return (
          <select value={row.value} onChange={(e) => updateFilter(row.id, { value: e.target.value })} className="input h-9 text-[13px] w-48">
            <option value="">Select user...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
        );
      case 'teamId':
        return (
          <select value={row.value} onChange={(e) => updateFilter(row.id, { value: e.target.value })} className="input h-9 text-[13px] w-48">
            <option value="">Select team...</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        );
      case 'sprintId':
        return (
          <select value={row.value} onChange={(e) => updateFilter(row.id, { value: e.target.value })} className="input h-9 text-[13px] w-48">
            <option value="">Select sprint...</option>
            {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all duration-200">
      {/* Header (Toggle) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-muted-foreground" />
          <span className="text-[14px] font-medium text-foreground">Advanced Filters</span>
          {filters.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[11px] font-bold">
              {filters.length}
            </span>
          )}
        </div>
        <span className="text-muted-foreground text-[13px]">{isExpanded ? 'Collapse' : 'Expand'}</span>
      </button>

      {/* Builder Body */}
      {isExpanded && (
        <div className="px-4 py-4 border-t border-border bg-muted/50">
          {filters.length === 0 ? (
            <p className="text-[13px] text-muted-foreground italic mb-3">No filters applied.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {filters.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <select
                    value={row.field}
                    onChange={(e) => updateFilter(row.id, { field: e.target.value as FilterField })}
                    className="input h-9 text-[13px] w-40"
                  >
                    {FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>

                  <select
                    value={row.operator}
                    onChange={(e) => updateFilter(row.id, { operator: e.target.value as FilterOperator })}
                    className="input h-9 text-[13px] w-28"
                  >
                    {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>

                  {renderValueInput(row)}

                  <button
                    onClick={() => removeFilter(row.id)}
                    className="p-2 ml-1 text-muted-foreground hover:text-red-500 hover:bg-card rounded-md transition-colors border border-transparent hover:border-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border mt-4">
            <button
              onClick={addFilterRow}
              className="flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary"
            >
              <Plus className="w-4 h-4" /> Add Rule
            </button>
            <div className="flex items-center gap-3">
              {filters.length > 0 && (
                <button
                  onClick={() => { onClear(); onChange([]); }}
                  className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onApply}
                className="px-4 py-1.5 bg-foreground hover:bg-foreground/90 text-background text-[13px] font-medium rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
