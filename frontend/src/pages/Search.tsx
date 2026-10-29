import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { SearchCommandCenter } from '@/components/search/SearchCommandCenter';
import { SearchProgressModal } from '@/components/search/SearchProgressModal';
import { SearchHistory } from '@/components/search/SearchHistory';
import { SearchResultsSummary } from '@/components/search/SearchResultsSummary';
import { useSearchManager } from '@/hooks/useSearchManager';
import type { SearchRequest } from '@/lib/api/sentimentApi';
import { useToast } from '@/hooks/use-toast';

export default function Search() {
  const { toast } = useToast();
  const {
    searchState,
    searchHistory,
    executeSearch,
    cancelSearch,
    saveSearch,
    removeFromHistory,
    clearHistory,
    resetSearch,
  } = useSearchManager();

  const [showProgress, setShowProgress] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<SearchRequest | null>(null);
  const [view, setView] = useState<'search' | 'results'>('search');

  const handleSearch = (request: SearchRequest) => {
    setCurrentRequest(request);
    setShowProgress(true);
    executeSearch(request);
  };

  const handleSave = (request: SearchRequest) => {
    saveSearch(request);
    toast({ title: 'Search saved', description: 'You can re-run it anytime from your history.' });
  };

  const handleRerun = (request: SearchRequest) => {
    setCurrentRequest(request);
    handleSearch(request);
  };

  // When search completes, switch to results view
  useEffect(() => {
    if (searchState.status === 'complete' && searchState.results) {
      setView('results');
    }
    if (searchState.status === 'error') {
      setShowProgress(false);
      toast({ title: 'Search failed', description: searchState.error, variant: 'destructive' });
    }
  }, [searchState.status]);

  return (
    <Layout title="Search" subtitle="Analyze brand sentiment across platforms">
      <div className="animate-fade-in">
        {view === 'results' && searchState.results && currentRequest ? (
          <SearchResultsSummary
            results={searchState.results}
            request={currentRequest}
            onNewSearch={() => {
              setView('search');
              resetSearch();
            }}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SearchCommandCenter
                onSearch={handleSearch}
                onSave={handleSave}
                isSearching={searchState.status === 'scraping' || searchState.status === 'analyzing'}
                initialRequest={currentRequest || undefined}
              />
            </div>
            <div>
              <SearchHistory
                history={searchHistory}
                onRerun={handleRerun}
                onRemove={removeFromHistory}
                onClear={clearHistory}
              />
            </div>
          </div>
        )}
      </div>

      <SearchProgressModal
        open={showProgress && searchState.status !== 'idle' && searchState.status !== 'error'}
        onClose={() => setShowProgress(false)}
        onCancel={() => { cancelSearch(); setShowProgress(false); }}
        status={searchState.status}
        progress={searchState.progress}
        keywords={currentRequest?.keywords || []}
      />
    </Layout>
  );
}
