import { useState, useImperativeHandle, forwardRef, KeyboardEvent, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface KeywordInputHandle {
  /** Flushes pending text into keywords. Returns the pending text (or empty string). */
  flush: () => string;
}

interface KeywordInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  onPendingTextChange?: (pending: string) => void;
  onSubmit?: () => void;
  maxKeywords?: number;
  maxLength?: number;
}

export const KeywordInput = forwardRef<KeywordInputHandle, KeywordInputProps>(function KeywordInput(
  { keywords, onChange, onPendingTextChange, onSubmit, maxKeywords = 5, maxLength = 100 },
  ref
) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    onPendingTextChange?.(inputValue);
  }, [inputValue, onPendingTextChange]);

  const addKeyword = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || keywords.includes(trimmed) || keywords.length >= maxKeywords) {
      setInputValue('');
      return;
    }
    if (trimmed.length > maxLength) return;
    onChange([...keywords, trimmed]);
    setInputValue('');
  };

  const removeKeyword = (keyword: string) => {
    onChange(keywords.filter((k) => k !== keyword));
  };

  useImperativeHandle(ref, () => ({
    flush: () => {
      const val = inputValue.trim();
      if (val && !keywords.includes(val) && keywords.length < maxKeywords) {
        addKeyword(val);
      }
      return val;
    },
  }));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val) {
        addKeyword(val);
        // Trigger search immediately on Enter!
        if (onSubmit) {
          setTimeout(() => onSubmit(), 10);
        }
      } else if (keywords.length > 0 && onSubmit) {
        // If text is empty but keywords exist, trigger search
        onSubmit();
      }
    }
    if (e.key === ',') {
      e.preventDefault();
      addKeyword(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && keywords.length > 0) {
      removeKeyword(keywords[keywords.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
        {keywords.map((keyword) => (
          <Badge key={keyword} variant="secondary" className="gap-1 py-1 pl-3 pr-1.5 text-sm">
            {keyword}
            <button
              type="button"
              onClick={() => removeKeyword(keyword)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <div className="flex items-center flex-1 min-w-[220px] gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) {
                addKeyword(inputValue);
              }
            }}
            placeholder={keywords.length === 0 ? 'Enter brand name (e.g. chowdeck, GTBank, MTN)...' : 'Add another keyword...'}
            className="flex-1 border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
            maxLength={maxLength}
          />
          {inputValue.trim() && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7 px-2 text-xs gap-1 shrink-0"
              onClick={() => {
                addKeyword(inputValue);
              }}
            >
              <Plus className="h-3 w-3" /> Add
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Enter</kbd> to search immediately • {keywords.length}/{maxKeywords} keywords</span>
        {inputValue && <span>{inputValue.length}/{maxLength} characters</span>}
      </div>
    </div>
  );
});
