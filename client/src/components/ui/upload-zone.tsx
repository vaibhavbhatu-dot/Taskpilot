import { useRef, useState, useCallback } from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ZoneState = 'idle' | 'dragover' | 'error' | 'success';

const DEFAULT_ACCEPT = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string[];
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

const stateStyles: Record<ZoneState, string> = {
  idle:     'border-border bg-background hover:border-primary/50 hover:bg-accent/30',
  dragover: 'border-primary bg-primary/5',
  error:    'border-destructive bg-destructive/5',
  success:  'border-success bg-success/5',
};

const iconColorMap: Record<ZoneState, string> = {
  idle:     'text-muted-foreground',
  dragover: 'text-primary',
  error:    'text-destructive',
  success:  'text-success',
};

export function UploadZone({
  onFileSelect,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 5,
  disabled = false,
  className,
}: UploadZoneProps) {
  const [state, setState] = useState<ZoneState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setError = useCallback((msg: string) => {
    clearTimeout(errorTimer.current);
    setErrorMsg(msg);
    setState('error');
    errorTimer.current = setTimeout(() => setState('idle'), 3000);
  }, []);

  const processFile = useCallback((file: File) => {
    if (!accept.includes(file.type)) {
      setError('Unsupported file type. Please upload a PDF or DOCX.');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }
    clearTimeout(errorTimer.current);
    setFileName(file.name);
    setState('success');
    onFileSelect(file);
  }, [accept, maxSizeMB, onFileSelect, setError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setState('dragover');
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => prev === 'dragover' ? 'idle' : prev);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [disabled, processFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset so same file can be re-selected
    e.target.value = '';
  }, [processFile]);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload file"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center gap-3',
        'rounded-lg border-2 border-dashed px-6 py-10',
        'text-center cursor-pointer transition-colors duration-150',
        stateStyles[state],
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(',')}
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled}
        tabIndex={-1}
      />

      {state === 'success' ? (
        <CheckCircle2 className={cn('w-10 h-10', iconColorMap.success)} />
      ) : state === 'error' ? (
        <AlertCircle className={cn('w-10 h-10', iconColorMap.error)} />
      ) : (
        <Upload className={cn('w-10 h-10', iconColorMap[state])} />
      )}

      <div>
        {state === 'success' ? (
          <>
            <p className="text-sm font-medium text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">File ready</p>
          </>
        ) : state === 'error' ? (
          <>
            <p className="text-sm font-medium text-destructive">Upload failed</p>
            <p className="text-xs text-destructive/80 mt-0.5">{errorMsg}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">
              {state === 'dragover' ? 'Release to upload' : 'Drop your resume here'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF or DOCX up to {maxSizeMB}MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
