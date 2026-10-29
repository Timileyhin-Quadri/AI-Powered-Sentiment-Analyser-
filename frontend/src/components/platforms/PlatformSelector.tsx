import { Twitter, Instagram, Facebook, Linkedin, CheckSquare, Square } from 'lucide-react';
import { Platform } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onSelectionChange: (platforms: Platform[]) => void;
  showStatus?: boolean;
}

const platformConfig: {
  value: Platform;
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}[] = [
  { value: 'twitter', label: 'Twitter/X', icon: Twitter, colorClass: 'text-platform-twitter', bgClass: 'bg-platform-twitter/10' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, colorClass: 'text-platform-instagram', bgClass: 'bg-platform-instagram/10' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, colorClass: 'text-platform-facebook', bgClass: 'bg-platform-facebook/10' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, colorClass: 'text-platform-linkedin', bgClass: 'bg-platform-linkedin/10' },
];

export function PlatformSelector({ selectedPlatforms, onSelectionChange, showStatus = false }: PlatformSelectorProps) {
  const allSelected = selectedPlatforms.length === platformConfig.length;

  const toggleAll = () => {
    onSelectionChange(allSelected ? [] : platformConfig.map(p => p.value));
  };

  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      onSelectionChange(selectedPlatforms.filter(p => p !== platform));
    } else {
      onSelectionChange([...selectedPlatforms, platform]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Platforms</span>
        <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7">
          {allSelected ? 'Deselect All' : 'Select All'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {platformConfig.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.value);
          const Icon = platform.icon;
          return (
            <button
              key={platform.value}
              onClick={() => togglePlatform(platform.value)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-muted-foreground/30"
              )}
            >
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", platform.bgClass)}>
                <Icon className={cn("h-5 w-5", platform.colorClass)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{platform.label}</p>
                {showStatus && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-sentiment-positive" : "bg-muted-foreground/40")} />
                    <span className="text-xs text-muted-foreground">{isSelected ? 'Active' : 'Inactive'}</span>
                  </div>
                )}
              </div>
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
