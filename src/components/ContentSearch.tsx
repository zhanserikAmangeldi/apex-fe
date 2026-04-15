import React, { useState } from 'react';
import { scraperApi, type SearchResult } from '../services/scraperApi';
import { useAuth } from '../hooks/UseAuth';
import { GlassCard } from './ui/GlassCard';
import { GradientButton } from './ui/Button';

export const ContentSearch: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query || !user?.id) return;

    setLoading(true);
    try {
      const data = await scraperApi.searchContent(query, user.id);
      setResults(data);
    } catch (err) {
      console.error('Ошибка поиска:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Vector Search</h2>
        <p className="text-white/60">Search by meaning, not just keywords. Powered by AI embeddings.</p>
        
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search your saved content..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
          <GradientButton
            variant="blue"
            onClick={handleSearch}
            disabled={loading || !query}
          >
            {loading ? 'Searching...' : 'Search'}
          </GradientButton>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <p className="text-white/60 text-sm mb-4">Found {results.length} results</p>
            {results.map((result) => (
              <div 
                key={result.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-semibold text-lg group-hover:text-purple-300 transition-colors flex-1">
                    {result.title || 'Untitled'}
                  </h3>
                  <div className="ml-4 px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30">
                    <span className="text-green-300 text-xs font-medium">
                      {(result.similarity * 100).toFixed(0)}% match
                    </span>
                  </div>
                </div>
                
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-sm mb-3 block transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {result.url} ↗
                </a>

                {result.ai_summary && (
                  <p className="text-white/70 text-sm mb-3 leading-relaxed">
                    {result.ai_summary}
                  </p>
                )}

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Matched text:</p>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {result.matched_text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-white text-lg font-semibold mb-2">No results found</h3>
            <p className="text-white/60">Try different keywords or scrape more content</p>
          </div>
        )}

        {!query && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-white text-lg font-semibold mb-2">Semantic Search</h3>
            <p className="text-white/60 max-w-md mx-auto">
              Enter a query to search through your saved content. The AI will find relevant matches based on meaning, not just exact words.
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
