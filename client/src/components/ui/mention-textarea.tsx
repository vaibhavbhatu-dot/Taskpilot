import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users } from 'lucide-react';
import { getInitials } from '@/design-system';

export interface MentionMember {
  id: string;
  fullName: string;
  avatar?: string;
}

interface DropdownItem extends MentionMember {
  isAll?: boolean;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange: (mentionedUserIds: string[]) => void;
  members: MentionMember[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const ALL_ITEM: DropdownItem = {
  id: 'ALL',
  fullName: 'all',
  isAll: true,
};

/** Finds the active @mention being typed. Returns null if cursor is not inside a mention. */
function getActiveMention(text: string, cursor: number): { start: number; query: string } | null {
  const textBefore = text.slice(0, cursor);
  const lastAt = textBefore.lastIndexOf('@');
  if (lastAt === -1) return null;

  const afterAt = textBefore.slice(lastAt + 1);
  // A space or newline after @ means the mention is complete — no active trigger
  if (/[\s\n]/.test(afterAt)) return null;

  return { start: lastAt, query: afterAt };
}

export function MentionTextarea({
  value,
  onChange,
  onMentionsChange,
  members,
  placeholder,
  disabled,
  className,
  onKeyDown,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 220 });

  // Track which user IDs have been mentioned in the current value
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);

  // Reset mentions when the text is cleared (e.g. after posting)
  useEffect(() => {
    if (!value) {
      setMentionedIds([]);
      onMentionsChange([]);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the filtered list for the dropdown
  const filteredMembers = members.filter((m) =>
    m.fullName.toLowerCase().includes(query.toLowerCase())
  );
  const showAll = query === '' || 'all'.startsWith(query.toLowerCase());
  const dropdownItems: DropdownItem[] = [
    ...(showAll ? [ALL_ITEM] : []),
    ...filteredMembers,
  ];

  function positionDropdown() {
    const el = textareaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 220),
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newVal = e.target.value;
    const cursor = e.target.selectionStart ?? newVal.length;
    onChange(newVal);

    const mention = getActiveMention(newVal, cursor);
    if (mention) {
      setShowDropdown(true);
      setQuery(mention.query);
      setMentionStart(mention.start);
      setActiveIndex(0);
      positionDropdown();
    } else {
      setShowDropdown(false);
      setQuery('');
      setMentionStart(-1);
    }
  }

  function selectItem(item: DropdownItem) {
    if (mentionStart === -1) return;

    const name = item.isAll ? 'all' : item.fullName.split(' ')[0];
    const before = value.slice(0, mentionStart);
    // Remove the trailing space that was already in the original text to avoid double-space
    const rawAfter = value.slice(mentionStart + 1 + query.length);
    const after = rawAfter.startsWith(' ') ? rawAfter.slice(1) : rawAfter;
    const newVal = `${before}@${name} ${after}`;

    onChange(newVal);

    const newIds = [...new Set([...mentionedIds, item.id])];
    setMentionedIds(newIds);
    onMentionsChange(newIds);

    setShowDropdown(false);
    setQuery('');
    setMentionStart(-1);

    // Restore focus and cursor after inserted mention
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = before.length + 1 + name.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showDropdown && dropdownItems.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, dropdownItems.length - 1));
          return;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          return;
        case 'Enter':
        case 'Tab':
          if (dropdownItems[activeIndex]) {
            e.preventDefault();
            selectItem(dropdownItems[activeIndex]);
            return;
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowDropdown(false);
          return;
      }
    }
    onKeyDown?.(e);
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    function handleOutside(e: MouseEvent) {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        textareaRef.current?.contains(e.target as Node)
      ) return;
      setShowDropdown(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showDropdown]);

  const dropdown = showDropdown && dropdownItems.length > 0
    ? createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            minWidth: `${dropdownPos.width}px`,
            zIndex: 9999,
          }}
          className="bg-card border border-border rounded-lg shadow-lg max-h-[200px] overflow-y-auto"
        >
          {/* @all option */}
          {showAll && (
            <div
              onMouseDown={(e) => { e.preventDefault(); selectItem(ALL_ITEM); }}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-border transition-colors ${
                activeIndex === 0 ? 'bg-muted' : 'hover:bg-muted'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">@all</p>
                <p className="text-xs text-muted-foreground">Notify all assignees</p>
              </div>
            </div>
          )}

          {/* Member list */}
          {filteredMembers.map((member, idx) => {
            const itemIdx = showAll ? idx + 1 : idx;
            return (
              <div
                key={member.id}
                onMouseDown={(e) => { e.preventDefault(); selectItem(member); }}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  itemIdx === activeIndex ? 'bg-muted' : 'hover:bg-muted'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs flex items-center justify-center font-medium flex-shrink-0">
                  {getInitials(member.fullName)}
                </div>
                <span className="text-sm text-foreground">{member.fullName}</span>
              </div>
            );
          })}

          {filteredMembers.length === 0 && !showAll && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No members found</div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      {dropdown}
    </>
  );
}
