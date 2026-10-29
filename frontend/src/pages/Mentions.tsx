import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { MentionCard } from '@/components/mentions/MentionCard';
import { MentionFilters } from '@/components/mentions/MentionFilters';
import { sentimentPosts } from '@/data/mockData';
import { Platform, Sentiment } from '@/types';

export default function Mentions() {
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment | 'all'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    return sentimentPosts.filter((post) => {
      const matchesSentiment = selectedSentiment === 'all' || post.sentiment === selectedSentiment;
      const matchesPlatform = selectedPlatform === 'all' || post.platform === selectedPlatform;
      const matchesSearch = searchQuery === '' || 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSentiment && matchesPlatform && matchesSearch;
    });
  }, [selectedSentiment, selectedPlatform, searchQuery]);

  return (
    <Layout title="Mentions" subtitle="Track and analyze all brand mentions">
      <div className="space-y-6 animate-fade-in">
        <MentionFilters
          selectedSentiment={selectedSentiment}
          onSentimentChange={setSelectedSentiment}
          selectedPlatform={selectedPlatform}
          onPlatformChange={setSelectedPlatform}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredPosts.length}</span> mentions
          </p>
        </div>

        {/* Mentions Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredPosts.map((post) => (
            <MentionCard key={post.id} post={post} />
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16">
            <p className="text-lg font-medium text-foreground">No mentions found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
