import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Building2, Hash, Bell, Shield, Plug, Trash2, Plus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const [twitterTestStatus, setTwitterTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [twitterTestMessage, setTwitterTestMessage] = useState('');

  const keywords = ['#GTBank', '#GTBankApp', '@GTBank', 'Guaranty Trust', 'customer service'];
  const competitors = ['Access Bank', 'First Bank', 'UBA', 'Zenith Bank'];

  const testTwitterConnection = async () => {
    setTwitterTestStatus('testing');
    setTwitterTestMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('fetch-twitter', {
        body: { keyword: 'test', maxResults: 10 },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setTwitterTestStatus('success');
      setTwitterTestMessage(`Connected! Fetched ${data?.posts?.length || 0} tweets.`);
    } catch (err) {
      setTwitterTestStatus('error');
      setTwitterTestMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <Layout title="Settings" subtitle="Configure your brand monitoring preferences">
      <div className="max-w-4xl space-y-8 animate-fade-in">
        {/* Brand Profile */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Brand Profile</h3>
              <p className="text-sm text-muted-foreground">Your brand's basic information</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input id="brandName" defaultValue="GTBank" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" defaultValue="Banking & Finance" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" defaultValue="https://gtbank.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Primary Region</Label>
              <Input id="region" defaultValue="Nigeria" />
            </div>
          </div>
        </section>

        {/* Keywords & Hashtags */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Keywords & Hashtags</h3>
                <p className="text-sm text-muted-foreground">Terms we're tracking for your brand</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Keyword
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="group flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm"
              >
                {keyword}
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-sentiment-negative" />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Competitor Tracking */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Competitor Tracking</h3>
                <p className="text-sm text-muted-foreground">Brands you're comparing against</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Competitor
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {competitors.map((competitor) => (
              <span
                key={competitor}
                className="group flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm"
              >
                {competitor}
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-sentiment-negative" />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Alert Preferences */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Alert Preferences</h3>
              <p className="text-sm text-muted-foreground">Configure when and how you receive alerts</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Sentiment Drop Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when sentiment drops below threshold</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Viral Post Alerts</p>
                <p className="text-sm text-muted-foreground">Alert when a post gets high engagement</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">High Volume Alerts</p>
                <p className="text-sm text-muted-foreground">Notify on unusual mention volume spikes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive daily digest emails</p>
              </div>
              <Switch />
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Plug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">API Integrations</h3>
              <p className="text-sm text-muted-foreground">Connect external services</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-platform-twitter/10 flex items-center justify-center">
                    <span className="text-xl">𝕏</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Twitter/X API</p>
                    <div className="flex items-center gap-1.5">
                      {twitterTestStatus === 'success' ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-sentiment-positive" />
                          <p className="text-sm text-muted-foreground">Connected</p>
                        </>
                      ) : twitterTestStatus === 'error' ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-sentiment-negative" />
                          <p className="text-sm text-muted-foreground">Error</p>
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">Not tested</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testTwitterConnection}
                  disabled={twitterTestStatus === 'testing'}
                >
                  {twitterTestStatus === 'testing' ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Testing...</>
                  ) : 'Test Connection'}
                </Button>
              </div>
              {twitterTestStatus === 'success' && (
                <div className="flex items-center gap-2 rounded-lg bg-sentiment-positive/10 p-2 text-xs">
                  <CheckCircle className="h-4 w-4 text-sentiment-positive" />
                  <span className="text-foreground">{twitterTestMessage}</span>
                </div>
              )}
              {twitterTestStatus === 'error' && (
                <div className="flex items-start gap-2 rounded-lg bg-sentiment-negative/10 p-2 text-xs">
                  <XCircle className="h-4 w-4 text-sentiment-negative mt-0.5 shrink-0" />
                  <span className="text-foreground">{twitterTestMessage}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-platform-instagram/10 flex items-center justify-center">
                  <span className="text-xl">📷</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Instagram API</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-platform-facebook/10 flex items-center justify-center">
                  <span className="text-xl">📘</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Facebook API</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-platform-linkedin/10 flex items-center justify-center">
                  <span className="text-xl">in</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">LinkedIn API</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-sentiment-positive" />
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="px-8">Save Changes</Button>
        </div>
      </div>
    </Layout>
  );
}
