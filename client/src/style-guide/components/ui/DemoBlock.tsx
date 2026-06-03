import { useState } from 'react';
import { Code, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface DemoBlockProps {
  title?: string;
  code: string;
  children: React.ReactNode;
}

export function DemoBlock({ title, code, children }: DemoBlockProps) {
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied]         = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-border bg-muted/30">
          <span className="text-[12px] font-medium text-muted-foreground">{title}</span>
        </div>
      )}

      {/* Preview */}
      <div className="bg-card p-6">
        {children}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/20">
        <button
          onClick={() => setShowSource(v => !v)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Code className="w-3.5 h-3.5" />
          {showSource ? 'Hide source' : 'Show source'}
          {showSource
            ? <ChevronUp className="w-3 h-3" />
            : <ChevronDown className="w-3 h-3" />
          }
        </button>
      </div>

      {/* Source */}
      {showSource && (
        <div className="relative border-t border-border">
          <pre className="bg-muted p-4 overflow-x-auto text-[13px] font-mono text-foreground leading-relaxed">
            <code>{code.trim()}</code>
          </pre>
          <button
            onClick={handleCopy}
            title="Copy code"
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied
              ? <><Check className="w-3 h-3 text-green-500" /> Copied</>
              : <><Copy className="w-3 h-3" /> Copy</>
            }
          </button>
        </div>
      )}
    </div>
  );
}
