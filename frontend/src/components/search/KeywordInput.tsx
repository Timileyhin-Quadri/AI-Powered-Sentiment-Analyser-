import { useState, useImperativeHandle, forwardRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface KeywordInputHandle {
  /** Flushes pending text into keywords. Returns the pending text (or empty string). */
  flush: () => string;
}

interface KeywordInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  maxKeywords?: number;
  maxLength?: number;
}

export const KeywordInput = forwardRef<KeywordInputHandle, KeywordInputProps>(function KeywordInput({ keywords, onChange, maxKeywords = 5, maxLength = 100 }, ref) {
  const [inputValue, setInputValue] = useState('');

  const addKeyword = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || keywords.includes(trimmed) || keywords.length >= maxKeywords) return;
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
      if (val) addKeyword(inputValue);
      return val;
    },
  }));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
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
          <Badge key={keyword} variant="secondary" className="gap-1 py-1 pl-3 pr-1.5">
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
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={keywords.length === 0 ? 'Enter brand name, product, or keyword...' : 'Add another keyword...'}
          className="flex-1 border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0 min-w-[200px]"
          maxLength={maxLength}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Press Enter or comma to add • {keywords.length}/{maxKeywords} keywords</span>
        {inputValue && <span>{inputValue.length}/{maxLength} characters</span>}
      </div>
    </div>
  );
});
