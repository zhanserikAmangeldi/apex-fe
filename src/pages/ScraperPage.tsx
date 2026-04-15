import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebScraper } from '../components/WebScraper';
import { ScrapedContentList } from '../components/ScrapedContentList';
import { ContentSearch } from '../components/ContentSearch';
import { Ellipse } from '../components/ui/Ellipse';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../hooks/UseAuth';
import './ScraperPage.css';

export const ScraperPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'scrape' | 'content' | 'search'>('scrape');

  return (
    <div className="min-h-screen bg-[#0F0F0F] relative overflow-hidden">
      <Ellipse className="w-96 h-96 top-0 right-0" gradient="linear-gradient(180deg, #530061 0%, #0D0A30 100%)" />
      <Ellipse className="w-72 h-72 bottom-20 left-10" gradient="linear-gradient(180deg, #190061 0%, #0A1B30 100%)" />
      <Ellipse className="w-52 h-52 top-1/3 left-1/3" gradient="linear-gradient(180deg, #61004B 0%, #220A30 100%)" />

      <header className="relative z-10 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-black/20">
        <div className="flex items-center gap-4">
          <Logo onClick={() => navigate('/')} />
          <div className="h-8 w-px bg-white/20" />
          <div>
            <h1 className="text-white font-semibold text-lg">Content Scraper</h1>
            <p className="text-white/60 text-xs">Save & Organize Web Content</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/documents')}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
          >
            Documents
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
          >
            <span className="text-white text-sm">{user?.display_name || user?.username}</span>
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 backdrop-blur-sm mb-6">
            <span className="text-white font-semibold">Web Content Manager</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-semibold text-white mb-4">
            Save & Learn<br />from the Web
          </h2>
        </div>

                <div className="flex gap-4 mb-8">
          <button
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'scrape'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            onClick={() => setActiveTab('scrape')}
          >
            Scrape Content
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'content'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            onClick={() => setActiveTab('content')}
          >
            Saved Content
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'search'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'scrape' && <WebScraper />}
          {activeTab === 'content' && <ScrapedContentList />}
          {activeTab === 'search' && <ContentSearch />}
        </div>
      </main>
    </div>
  );
};
