import { useState, useRef } from 'react';
import { Search, ChevronDown, ChevronUp, Bookmark, Twitter, Instagram, Facebook, Linkedin, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { KeywordInput, type KeywordInputHandle } from './KeywordInput';
import type { SearchRequest } from '@/lib/api/sentimentApi';
import type { Platform } from '@/types';

interface SearchCommandCenterProps {
  onSearch: (request: SearchRequest) => void;
  onSave: (request: SearchRequest) => void;
  isSearching: boolean;
  initialRequest?: Partial<SearchRequest>;
}

const platforms: { value: Platform; label: string; icon: React.ElementType; colorClass: string }[] = [
  { value: 'twitter', label: 'Twitter/X', icon: Twitter, colorClass: 'text-platform-twitter' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, colorClass: 'text-platform-instagram' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, colorClass: 'text-platform-facebook' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, colorClass: 'text-platform-linkedin' },
];

export function SearchCommandCenter({ onSearch, onSave, isSearching, initialRequest }: SearchCommandCenterProps) {
  const keywordRef = useRef<KeywordInputHandle>(null);
  const [keywords, setKeywords] = useState<string[]>(initialRequest?.keywords || []);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(
    initialRequest?.platforms || ['twitter', 'instagram', 'facebook', 'linkedin']
  );
  const [maxPosts, setMaxPosts] = useState(initialRequest?.maxPosts || 30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includeComments, setIncludeComments] = useState(true);
  const [includeRetweets, setIncludeRetweets] = useState(true);
  const [language, setLanguage] = useState('en');

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const selectAll = () => setSelectedPlatforms(['twitter', 'instagram', 'facebook', 'linkedin']);

  const buildRequest = (): SearchRequest => ({
    keywords,
    maxPosts,
    platforms: selectedPlatforms,
    includeComments,
    includeRetweets,
    language,
  });

  const handleSearch = () => {
    // Flush any pending typed text into keywords
    const pending = keywordRef.current?.flush() || '';
    const effectiveKeywords = pending && !keywords.includes(pending)
      ? [...keywords, pending]
      : keywords;
    if (effectiveKeywords.length === 0 || selectedPlatforms.length === 0) return;
    onSearch({
      keywords: effectiveKeywords,
      maxPosts,
      platforms: selectedPlatforms,
      includeComments,
      includeRetweets,
      language,
    });
  };

  const totalEstimate = selectedPlatforms.length * maxPosts;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Search className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Search Command Center</h2>
          <p className="text-sm text-muted-foreground">Analyze sentiment across social media platforms</p>
        </div>
      </div>

      {/* Keyword Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Keywords</Label>
        <KeywordInput ref={keywordRef} keywords={keywords} onChange={setKeywords} />
      </div>

      {/* Platform Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Platforms</Label>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>
            Select All
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {platforms.map((p) => {
            const selected = selectedPlatforms.includes(p.value);
            const Icon = p.icon;
            return (
              <button
                key={p.value}
                onClick={() => togglePlatform(p.value)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-3 transition-all',
                  selected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-background hover:border-muted-foreground/30'
                )}
              >
                <Checkbox checked={selected} className="pointer-events-none" />
                <Icon className={cn('h-4 w-4', p.colorClass)} />
                <span className="text-sm font-medium text-foreground">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Per Platform */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Posts per platform</Label>
          <span className="text-sm font-semibold text-foreground">{maxPosts}</span>
        </div>
        <Slider value={[maxPosts]} onValueChange={([v]) => setMaxPosts(v)} min={10} max={100} step={5} />
        <p className="text-xs text-muted-foreground">
          Estimated total: <span className="font-medium text-foreground">{totalEstimate} posts</span> across {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Advanced Options */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Advanced Options
        </button>
        {showAdvanced && (
          <div className="mt-4 space-y-4 rounded-lg border border-border bg-secondary/30 p-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pcm">Nigerian Pidgin</SelectItem>
                    <SelectItem value="yo">Yoruba</SelectItem>
                    <SelectItem value="ig">Igbo</SelectItem>
                    <SelectItem value="ha">Hausa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Include retweets/reposts</Label>
                <Switch checked={includeRetweets} onCheckedChange={setIncludeRetweets} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Include comment analysis</Label>
                <Switch checked={includeComments} onCheckedChange={setIncludeComments} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="flex-1 gap-2"
          size="lg"
          onClick={handleSearch}
          disabled={isSearching || keywords.length === 0 || selectedPlatforms.length === 0}
        >
          <Zap className="h-4 w-4" />
          {isSearching ? 'Analyzing...' : 'Start Analysis'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => onSave(buildRequest())}
          disabled={keywords.length === 0}
          className="gap-2"
        >
          <Bookmark className="h-4 w-4" />
          Save Search
        </Button>
      </div>
    </div>
  );
}
