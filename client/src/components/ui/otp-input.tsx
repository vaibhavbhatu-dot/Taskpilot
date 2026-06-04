import { useRef, useEffect, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  error = false,
  disabled = false,
  autoFocus = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  function focusAt(index: number) {
    inputRefs.current[Math.max(0, Math.min(index, length - 1))]?.focus();
  }

  function handleChange(index: number, char: string) {
    const digit = char.replace(/\D/g, '').slice(-1);
    if (!digit) return;

    const next = digits.map((d, i) => (i === index ? digit : d));
    onChange(next.join(''));

    if (index < length - 1) focusAt(index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = digits.map((d, i) => (i === index ? '' : d));
        onChange(next.join(''));
      } else {
        focusAt(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight') {
      focusAt(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const next = Array.from({ length }, (_, i) => pasted[i] ?? '');
    onChange(next.join(''));

    const nextFocus = Math.min(pasted.length, length - 1);
    focusAt(nextFocus);
  }

  return (
    <div className="flex gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'w-12 h-14 text-center text-2xl font-semibold',
            'border rounded-lg outline-none',
            'transition-all duration-150',
            'border-[#E2E8F0] bg-white',
            'focus:border-[#2563EB] focus:ring-2',
            'focus:ring-[#2563EB]/20',
            error && 'border-[#EF4444] ring-2 ring-[#EF4444]/20',
            disabled && 'opacity-50 cursor-not-allowed bg-[#F8FAFC]'
          )}
        />
      ))}
    </div>
  );
}
