import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BarChart3, 
  Users, 
  AlertTriangle, 
  Bell, 
  Settings,
  TrendingUp,
  Zap,
  Globe,
  Search,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { alerts } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Mentions', href: '/mentions', icon: MessageSquare },
  { name: 'Platforms', href: '/platforms', icon: Globe },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Competitors', href: '/competitors', icon: Users },
  { name: 'Complaints', href: '/complaints', icon: AlertTriangle },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const unreadAlerts = alerts.filter(a => !a.read).length;

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out', description: 'You have been successfully logged out.' });
    navigate('/auth');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Zap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">SentimentIQ</h1>
            <p className="text-xs text-sidebar-foreground/60">Brand Intelligence</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                )} />
                {item.name}
                {item.name === 'Alerts' && unreadAlerts > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-sentiment-negative text-xs font-semibold text-white">
                    {unreadAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade Card */}
        <div className="p-4 space-y-3">
          <div className="rounded-xl bg-gradient-to-br from-sidebar-primary/20 to-sidebar-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-sidebar-primary" />
              <span className="text-sm font-medium text-sidebar-foreground">Pro Analytics</span>
            </div>
            <p className="text-xs text-sidebar-foreground/60 mb-3">
              Unlock advanced sentiment predictions and competitor insights.
            </p>
            <button className="w-full rounded-lg bg-sidebar-primary py-2 text-xs font-semibold text-sidebar-primary-foreground transition-colors hover:bg-sidebar-primary/90">
              Upgrade Now
            </button>
          </div>

          {/* User info + sign out */}
          {user && (
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-primary/20">
                <User className="h-4 w-4 text-sidebar-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
