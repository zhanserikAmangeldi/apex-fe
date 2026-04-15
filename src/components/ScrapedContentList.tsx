import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scraperApi, type ScrapedContent } from '../services/scraperApi';
import { aiApi } from '../services/aiApi';
import { httpClient } from '../services/httpClient';
import { useAuth } from '../hooks/UseAuth';
import { useVaults } from '../hooks/useVaults';
import { useToast } from '../hooks/useToast';
import { GlassCard } from './ui/GlassCard';
import { GradientButton } from './ui/Button';
import { ToastContainer } from './ui/Toast';

export const ScrapedContentList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { vaults } = useVaults();
  const toast = useToast();
  const [contents, setContents] = useState<ScrapedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [showVaultSelector, setShowVaultSelector] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState('');
  const [contentForNotes, setContentForNotes] = useState<any>(null);
  const [notesTitle, setNotesTitle] = useState('');

  useEffect(() => {
    loadContents();
  }, [user]);

  useEffect(() => {
    if (vaults && vaults.length > 0 && !selectedVaultId) {
      setSelectedVaultId(vaults[0].id);
    }
  }, [vaults]);

  const loadContents = async () => {
    if (!user?.id) return;

    try {
      const data = await scraperApi.getUserContent(user.id);
      setContents(data);
    } catch (err) {
      console.error('Ошибка загрузки контента:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewContent = async (contentId: string) => {
    try {
      const content = await scraperApi.getContent(contentId);
      setSelectedContent(content);
    } catch (err) {
      console.error('Ошибка загрузки контента:', err);
    }
  };

  const handleCreateNotes = async (content: any) => {
    if (!content || !content.id) return;
    
    try {
      console.log('handleCreateNotes called with content:', content);
      // Load full content first
      const fullContent = await scraperApi.getContent(content.id);
      console.log('Full content loaded:', fullContent);
      setContentForNotes(fullContent);
      setNotesTitle(fullContent?.title || content?.title || 'Untitled Notes');
      setShowVaultSelector(true);
    } catch (err) {
      console.error('Error loading content:', err);
      toast.error('Failed to load content', 'Please try again');
    }
  };

  const handleGenerateNotes = async () => {
    if (!contentForNotes || !selectedVaultId || !notesTitle.trim()) return;

    console.log('handleGenerateNotes called with:', {
      contentForNotes,
      selectedVaultId,
      notesTitle,
      url: contentForNotes?.url,
      urlType: typeof contentForNotes?.url
    });

    const toastId = toast.loading('Generating AI notes...', 'This may take a moment');
    setShowVaultSelector(false);

    try {
      // 1. Generate AI notes
      toast.updateToast(toastId, 'loading', 'Analyzing content...', 'Creating summary and key points');
      const aiNotes = await aiApi.createStudyNotes({
        content: contentForNotes?.content || '',
        title: contentForNotes?.title || 'Untitled',
        vaultId: selectedVaultId,
      });

      console.log('AI notes generated:', aiNotes);

      // 2. Create document with content
      toast.updateToast(toastId, 'loading', 'Creating document...', 'Saving to your vault');
      
      // Ensure title has .md extension
      const finalTitle = notesTitle.endsWith('.md') ? notesTitle : `${notesTitle}.md`;
      
      console.log('Creating final document with:', {
        vaultId: selectedVaultId,
        title: finalTitle,
        contentLength: formatNotesContent(contentForNotes, aiNotes).length
      });
      
      const document = await httpClient.post(`editor-service/api/v1/documents`, {
        vaultId: selectedVaultId,
        title: finalTitle,
        content: formatNotesContent(contentForNotes, aiNotes),
      });

      console.log('Document created:', document);

      toast.updateToast(toastId, 'success', 'Notes created!', 'Document saved successfully');
      
      // Reload contents to show updated data
      loadContents();
      setContentForNotes(null);
      setNotesTitle('');
    } catch (err: any) {
      console.error('Error generating notes:', err);
      toast.updateToast(
        toastId,
        'error',
        'Failed to generate notes',
        err.message || 'Please try again'
      );
    }
  };

  const formatNotesContent = (content: any, aiNotes: any) => {
    if (!content) return '';
    
    let formatted = `# ${content.title || 'Untitled'}\n\n`;
    
    // Only add source link if URL exists and is not empty
    if (content.url && content.url.trim() && content.url !== '#') {
      formatted += `**Source:** [${content.url}](${content.url})\n\n`;
    }
    
    formatted += `---\n\n`;
    
    if (aiNotes?.summary) {
      formatted += `## AI Summary\n\n${aiNotes.summary}\n\n`;
    }
    
    if (aiNotes?.key_points && aiNotes.key_points.length > 0) {
      formatted += `## Key Points\n\n`;
      aiNotes.key_points.forEach((point: string) => {
        formatted += `- ${point}\n`;
      });
      formatted += '\n';
    }
    
    if (aiNotes?.notes) {
      formatted += `## Study Notes\n\n${aiNotes.notes}`;
    }
    
    return formatted;
  };

  const handleOpenDocument = (documentId: string) => {
    navigate(`/document/${documentId}`);
  };

  if (loading) {
    return (
      <GlassCard>
        <div className="p-12 text-center text-white/60">
          <div className="animate-pulse">Loading your content...</div>
        </div>
      </GlassCard>
    );
  }

  if (contents.length === 0) {
    return (
      <GlassCard>
        <div className="p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-white text-xl font-semibold mb-2">No saved content yet</h3>
          <p className="text-white/60">Start scraping web pages to build your knowledge base</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contents.map((content) => (
          <div key={content.id} className="group">
            <GlassCard>
              <div className="space-y-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-lg">
                    {content.domain}
                  </span>
                </div>
                
                <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {content.title || 'Untitled'}
                </h3>
                
                <p className="text-white/60 text-sm mb-4 line-clamp-2">
                  {content.url}
                </p>
                
                <div className="flex items-center justify-between text-xs text-white/50 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{new Date(content.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewContent(content.id)}
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleCreateNotes(content)}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 text-white text-sm transition-all"
                  >
                    Notes
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>

      {/* Vault Selector Modal */}
      {showVaultSelector && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowVaultSelector(false);
            setNotesTitle('');
          }}
        >
          <div onClick={e => e.stopPropagation()} className="max-w-md w-full">
            <GlassCard>
              <div className="space-y-6">
                <h3 className="text-white text-xl font-semibold">Generate AI Notes</h3>
                <p className="text-white/60 text-sm">
                  Choose a vault and name for your study notes
                </p>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Note Title</label>
                  <input
                    type="text"
                    value={notesTitle}
                    onChange={(e) => setNotesTitle(e.target.value)}
                    placeholder="Enter a title for your notes"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Vault</label>
                  <select
                    value={selectedVaultId}
                    onChange={(e) => setSelectedVaultId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    {vaults?.map(vault => (
                      <option key={vault.id} value={vault.id} className="bg-gray-900">
                        {vault.icon} {vault.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowVaultSelector(false);
                      setNotesTitle('');
                    }}
                    className="flex-1 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <GradientButton
                    variant="blue"
                    onClick={handleGenerateNotes}
                    disabled={!notesTitle.trim()}
                    className="flex-1"
                  >
                    Generate
                  </GradientButton>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Content View Modal */}
      {selectedContent && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedContent(null)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <GlassCard>
              <div className="max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-black/40 backdrop-blur-md border-b border-white/10 p-6 z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-3xl font-semibold text-white mb-2">{selectedContent?.title || 'Untitled'}</h2>
                      <a 
                        href={selectedContent?.url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                      >
                        {selectedContent?.url || 'No URL'} ↗
                      </a>
                    </div>
                    <button 
                      onClick={() => setSelectedContent(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex gap-4">
                    {selectedContent?.document_id && (
                      <GradientButton
                        variant="blue"
                        onClick={() => handleOpenDocument(selectedContent.document_id)}
                      >
                        Open Document
                      </GradientButton>
                    )}
                    <button
                      onClick={() => handleCreateNotes(selectedContent)}
                      className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
                    >
                      Generate AI Notes
                    </button>
                    <button
                      onClick={() => window.open(selectedContent?.url || '#', '_blank')}
                      className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
                    >
                      Open Original
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {selectedContent?.ai_summary && (
                    <div className="mb-4 p-4 rounded-xl bg-purple-500/20 border border-purple-500/30">
                      <h3 className="text-purple-300 font-semibold mb-2">AI Summary</h3>
                      <p className="text-white/80 leading-relaxed">{selectedContent.ai_summary}</p>
                    </div>
                  )}

                  {selectedContent?.ai_key_points && selectedContent.ai_key_points.length > 0 && (
                    <div className="mb-4 p-4 rounded-xl bg-blue-500/20 border border-blue-500/30">
                      <h3 className="text-blue-300 font-semibold mb-2">Key Points</h3>
                      <ul className="space-y-2">
                        {selectedContent.ai_key_points.map((point: string, idx: number) => (
                          <li key={idx} className="text-white/80 flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="prose prose-invert max-w-none">
                    <div className="text-white/80 leading-relaxed whitespace-pre-wrap">
                      {selectedContent?.content || 'No content available'}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </>
  );
};
