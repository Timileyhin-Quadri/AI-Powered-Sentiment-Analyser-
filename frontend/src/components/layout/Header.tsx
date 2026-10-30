import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { alerts } from '@/data/mockData';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const unreadAlerts = alerts.filter(a => !a.read).length;
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // 1. Dispatch custom event for instant in-page execution if already on /search
    window.dispatchEvent(new CustomEvent('sentitrack_header_search', { detail: q }));

    // 2. Navigate to /search with query parameter
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Top Header Search */}
        <form onSubmit={handleHeaderSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brand, topic (press Enter)..."
            className="w-72 pl-9 pr-9 bg-secondary/50 border-0 focus-visible:ring-1"
          />
          {searchQuery.trim() && (
            <button
              type="submit"
              title="Search & Analyze"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] bg-primary text-primary-foreground font-semibold px-1.5 py-0.5 rounded shadow-sm hover:opacity-90 transition-opacity"
            >
              ↵
            </button>
          )}
        </form>

        {/* Date Range */}
        <Button variant="outline" size="sm" className="hidden gap-2 lg:flex">
          <Calendar className="h-4 w-4" />
          Last 7 days
          <ChevronDown className="h-3 w-3" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadAlerts > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sentiment-negative text-[10px] font-semibold text-white">
              {unreadAlerts}
            </span>
          )}
        </Button>

        {/* User */}
        <div className="flex items-center gap-3 border-l border-border pl-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-foreground">Admin User</p>
            <p className="text-xs text-muted-foreground">admin@brand.ng</p>
          </div>
        </div>
      </div>
    </header>
  );
}
