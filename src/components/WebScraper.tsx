import React, { useState, useEffect } from 'react';
import { scraperApi, type ScrapeRequest } from '../services/scraperApi';
import { useAuth } from '../hooks/UseAuth';
import { useVaults } from '../hooks/useVaults';
import { GlassCard } from './ui/GlassCard';
import { GradientButton } from './ui/Button';

export const WebScraper: React.FC = () => {
  const { user } = useAuth();
  const { vaults } = useVaults();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [options, setOptions] = useState({
    vaultId: '',
    createDocument: true,
    generateAiNotes: true,
    periodic: false,
    intervalHours: 24,
  });

  // Set default vault when vaults load
  useEffect(() => {
    if (vaults && vaults.length > 0 && !options.vaultId) {
      setOptions(prev => ({ ...prev, vaultId: vaults[0].id }));
    }
  }, [vaults]);

  const handleScrape = async () => {
    if (!url || !user?.id) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const request: ScrapeRequest = {
        user_id: user.id,
        url: url,
        vault_id: options.createDocument ? options.vaultId : undefined,
        create_document: options.createDocument,
        generate_ai_notes: options.generateAiNotes,
        periodic: options.periodic,
        interval_hours: options.periodic ? options.intervalHours : undefined,
      };

      const response = await scraperApi.scrapeUrl(request);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.detail || 'Ошибка при скрейпинге');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Scrape Web Content</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={options.createDocument}
                onChange={(e) => setOptions({ ...options, createDocument: e.target.checked })}
                className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500/50"
              />
              <span className="text-white/80 group-hover:text-white transition-colors">
                Create document in vault
              </span>
            </label>

            {options.createDocument && vaults && vaults.length > 0 && (
              <div className="ml-8">
                <label className="block text-white/60 text-sm mb-2">Select Vault</label>
                <select
                  value={options.vaultId}
                  onChange={(e) => setOptions({ ...options, vaultId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                >
                  {vaults.map(vault => (
                    <option key={vault.id} value={vault.id} className="bg-gray-900">
                      {vault.icon} {vault.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={options.generateAiNotes}
                onChange={(e) => setOptions({ ...options, generateAiNotes: e.target.checked })}
                className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500/50"
              />
              <span className="text-white/80 group-hover:text-white transition-colors">
                Generate AI summary & notes
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={options.periodic}
                onChange={(e) => setOptions({ ...options, periodic: e.target.checked })}
                className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500/50"
              />
              <span className="text-white/80 group-hover:text-white transition-colors">
                Periodic scraping (auto-update)
              </span>
            </label>

            {options.periodic && (
              <div className="ml-8 mt-2">
                <label className="block text-white/60 text-sm mb-2">Update interval (hours)</label>
                <input
                  type="number"
                  value={options.intervalHours}
                  onChange={(e) => setOptions({ ...options, intervalHours: parseInt(e.target.value) || 24 })}
                  min="1"
                  className="w-32 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            )}
          </div>

          <GradientButton
            variant="blue"
            onClick={handleScrape}
            disabled={loading || !url}
            className="w-full"
          >
            {loading ? 'Scraping...' : 'Scrape Content'}
          </GradientButton>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30">
              <h3 className="text-green-300 font-semibold mb-2">Success!</h3>
              <div className="space-y-2 text-sm">
                <p className="text-white/80"><span className="text-white/60">ID:</span> {result.content_id}</p>
                {result.title && <p className="text-white/80"><span className="text-white/60">Title:</span> {result.title}</p>}
                {result.document_id && (
                  <p className="text-white/80">
                    <span className="text-white/60">Document created:</span> {result.document_id}
                  </p>
                )}
              </div>
            </div>

            {result.ai_summary && (
              <div className="p-4 rounded-xl bg-purple-500/20 border border-purple-500/30">
                <h4 className="text-purple-300 font-semibold mb-2">AI Summary</h4>
                <p className="text-white/80 text-sm leading-relaxed">{result.ai_summary}</p>
              </div>
            )}

            {result.content_preview && (
              <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30">
                <h4 className="text-blue-300 font-semibold mb-2">Content Preview</h4>
                <p className="text-white/70 text-sm leading-relaxed line-clamp-3">{result.content_preview}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
