import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ellipse } from '../components/ui/Ellipse';
import { Logo } from '../components/ui/Logo';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/Button';
import { useAuth } from '../hooks/UseAuth';
import { aiApi } from '../services/aiApi';
import type {
    FlashcardData,
    QuizQuestion,
    QuizSubmitResponse,
    ProgressDashboardResponse,
    StreakResponse,
    ForecastDay,
    MixedQuizQuestion,
    ReadingItem,
} from '../services/aiApi';

type Tab = 'flashcards' | 'quiz' | 'reading' | 'progress';

export const StudyPage: React.FC = () => {
    const { vaultId } = useParams<{ vaultId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('flashcards');

    if (!vaultId) return null;

    const tabs: { key: Tab; label: string; }[] = [
        { key: 'flashcards', label: 'Flashcards'},
        { key: 'quiz', label: 'Quiz'},
        { key: 'reading', label: 'Reading'},
        { key: 'progress', label: 'Progress'},
    ];

    return (
        <div className="min-h-screen bg-[#0F0F0F] relative overflow-hidden">
            <Ellipse className="w-96 h-96 top-0 right-0" gradient="linear-gradient(180deg, #530061 0%, #0D0A30 100%)" />
            <Ellipse className="w-72 h-72 bottom-20 left-10" gradient="linear-gradient(180deg, #190061 0%, #0A1B30 100%)" />

            <header className="relative z-10 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-black/20">
                <div className="flex items-center gap-4">
                    <Logo onClick={() => navigate('/dashboard')} />
                    <div className="h-8 w-px bg-white/20" />
                    <h1 className="text-white font-semibold text-lg">Study Mode</h1>
                </div>
                <button
                    onClick={() => navigate(`/workspace/${vaultId}`)}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
                >
                    ← Back to Workspace
                </button>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
                {/* Streak banner */}
                <StreakBanner vaultId={vaultId} />

                {/* Tab bar */}
                <div className="flex gap-2 mb-8">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                                activeTab === t.key
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'flashcards' && <FlashcardsTab vaultId={vaultId} />}
                {activeTab === 'quiz' && <QuizTab vaultId={vaultId} />}
                {activeTab === 'reading' && <ReadingTab vaultId={vaultId} />}
                {activeTab === 'progress' && <ProgressTab vaultId={vaultId} />}
            </main>
        </div>
    );
};


/* ─── Flashcards Tab ─── */

const FlashcardsTab: React.FC<{ vaultId: string }> = ({ vaultId }) => {
    const [cards, setCards] = useState<FlashcardData[]>([]);
    const [dueCount, setDueCount] = useState(0);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(false);
    const [generating, setGenerating] = useState(false);

    const loadCards = useCallback(async () => {
        setLoading(true);
        try {
            const res = await aiApi.getFlashcards(vaultId, true);
            setCards(res.cards);
            setDueCount(res.due);
            setCurrentIdx(0);
            setFlipped(false);
        } catch (e) {
            console.error('Failed to load flashcards:', e);
        } finally {
            setLoading(false);
        }
    }, [vaultId]);

    useEffect(() => { loadCards(); }, [loadCards]);

    const handleGenerateAll = async () => {
        setGenerating(true);
        try {
            const res = await aiApi.generateFlashcardsForVault(vaultId);
            alert(
                `Generated ${res.total_cards} flashcards from ${res.documents_processed} documents` +
                (res.documents_skipped > 0 ? ` (${res.documents_skipped} skipped — already have cards or empty)` : ''),
            );
            await loadCards();
        } catch (e: any) {
            alert('Failed to generate: ' + (e.message || e));
        } finally {
            setGenerating(false);
        }
    };

    const handleReview = async (quality: number) => {
        if (reviewing || !cards[currentIdx]) return;
        setReviewing(true);
        try {
            await aiApi.reviewFlashcard(cards[currentIdx].id, quality);
            if (currentIdx < cards.length - 1) {
                setCurrentIdx(i => i + 1);
                setFlipped(false);
            } else {
                await loadCards();
            }
        } finally {
            setReviewing(false);
        }
    };

    if (loading) {
        return <div className="text-center py-20 text-white/60">Loading flashcards...</div>;
    }

    if (cards.length === 0) {
        return (
            <GlassCard>
                <div className="text-center py-16">
                    <h3 className="text-white text-xl font-semibold mb-2">
                        {dueCount === 0 ? 'All caught up!' : 'No flashcards yet'}
                    </h3>
                    <p className="text-white/60 text-sm mb-6">
                        Generate flashcards from all your indexed notes in this workspace.
                    </p>
                    <GradientButton onClick={handleGenerateAll} disabled={generating}>
                        {generating ? 'Generating from all notes...' : '🚀 Generate for Entire Workspace'}
                    </GradientButton>
                </div>
            </GlassCard>
        );
    }

    const card = cards[currentIdx];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-white/60 text-sm">
                    Card {currentIdx + 1} of {cards.length} · {dueCount} due
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleGenerateAll}
                        disabled={generating}
                        className="px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs transition-all disabled:opacity-50"
                    >
                        {generating ? 'Generating...' : '+ Generate from all notes'}
                    </button>
                    <div className="w-48 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                            style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Card */}
            <div
                onClick={() => setFlipped(f => !f)}
                className="cursor-pointer select-none"
            >
                <GlassCard>
                    <div className="min-h-[250px] flex flex-col items-center justify-center p-8 text-center">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-4">
                            {flipped ? 'Answer' : 'Question'} · click to flip
                        </p>
                        <p className="text-white text-xl font-medium leading-relaxed">
                            {flipped ? card.back : card.front}
                        </p>
                    </div>
                </GlassCard>
            </div>

            {/* Quality buttons (show after flip) */}
            {flipped && (
                <div className="flex gap-3 justify-center">
                    {[
                        { q: 0, label: 'Blackout', color: 'bg-red-500/80' },
                        { q: 1, label: 'Wrong', color: 'bg-red-400/60' },
                        { q: 2, label: 'Hard', color: 'bg-orange-400/60' },
                        { q: 3, label: 'OK', color: 'bg-yellow-400/60' },
                        { q: 4, label: 'Good', color: 'bg-green-400/60' },
                        { q: 5, label: 'Easy', color: 'bg-green-500/80' },
                    ].map(btn => (
                        <button
                            key={btn.q}
                            onClick={() => handleReview(btn.q)}
                            disabled={reviewing}
                            className={`px-4 py-3 rounded-xl ${btn.color} text-white text-sm font-medium
                                hover:scale-105 transition-all disabled:opacity-50`}
                        >
                            <span className="block text-lg">{btn.q}</span>
                            <span className="block text-xs opacity-80">{btn.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


/* ─── Quiz Tab ─── */

const QuizTab: React.FC<{ vaultId: string }> = ({ vaultId }) => {
    const [mode, setMode] = useState<'classic' | 'mixed'>('mixed');
    const [questions, setQuestions] = useState<(QuizQuestion | MixedQuizQuestion)[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);
    const [fillAnswer, setFillAnswer] = useState('');
    const [answers, setAnswers] = useState<{ document_id: string; question: string; question_type: string; correct: boolean }[]>([]);
    const [result, setResult] = useState<QuizSubmitResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [answered, setAnswered] = useState(false);

    const startQuiz = useCallback(async (quizMode: 'classic' | 'mixed' = mode) => {
        setGenerating(true);
        setError(null);
        try {
            let qs: (QuizQuestion | MixedQuizQuestion)[] = [];
            if (quizMode === 'mixed') {
                const res = await aiApi.generateMixedQuiz(vaultId, 10);
                qs = res.questions;
            } else {
                const res = await aiApi.generateQuiz(vaultId, 10);
                qs = res.questions.map(q => ({ ...q, question_type: 'multiple_choice' as const }));
            }
            if (qs.length === 0) {
                setError('No questions could be generated.');
                return;
            }
            setQuestions(qs);
            setCurrentIdx(0);
            resetAnswerState();
            setAnswers([]);
            setResult(null);
        } catch (e: any) {
            setError(e?.body?.detail || e?.message || 'Failed to generate quiz');
        } finally {
            setGenerating(false);
        }
    }, [vaultId, mode]);

    const resetAnswerState = () => {
        setSelected(null);
        setTfAnswer(null);
        setFillAnswer('');
        setAnswered(false);
    };

    const handleMCAnswer = (optionIdx: number) => {
        if (answered) return;
        setSelected(optionIdx);
        setAnswered(true);
        const q = questions[currentIdx] as MixedQuizQuestion;
        const isCorrect = q.options![optionIdx].is_correct;
        setAnswers(prev => [...prev, {
            document_id: q.document_id, question: q.question,
            question_type: 'multiple_choice', correct: isCorrect,
        }]);
    };

    const handleTFAnswer = (answer: boolean) => {
        if (answered) return;
        setTfAnswer(answer);
        setAnswered(true);
        const q = questions[currentIdx] as MixedQuizQuestion;
        const isCorrect = answer === q.is_true;
        setAnswers(prev => [...prev, {
            document_id: q.document_id, question: q.question,
            question_type: 'true_false', correct: isCorrect,
        }]);
    };

    const handleFillSubmit = () => {
        if (answered || !fillAnswer.trim()) return;
        setAnswered(true);
        const q = questions[currentIdx] as MixedQuizQuestion;
        const isCorrect = fillAnswer.trim().toLowerCase() === (q.answer || '').toLowerCase();
        setAnswers(prev => [...prev, {
            document_id: q.document_id, question: q.question,
            question_type: 'fill_blank', correct: isCorrect,
        }]);
    };

    const nextQuestion = async () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(i => i + 1);
            resetAnswerState();
        } else {
            setLoading(true);
            try {
                const res = mode === 'mixed'
                    ? await aiApi.submitMixedQuiz(vaultId, answers)
                    : await aiApi.submitQuiz(vaultId, answers.map(a => ({
                        document_id: a.document_id, question: a.question, correct: a.correct,
                    })));
                setResult(res);
            } catch (e) {
                console.error('Failed to submit quiz:', e);
            } finally {
                setLoading(false);
            }
        }
    };

    // Start screen
    if (questions.length === 0 && !result) {
        return (
            <GlassCard>
                <div className="text-center py-16">
                    <h3 className="text-white text-xl font-semibold mb-2">Test Your Knowledge</h3>
                    <p className="text-white/60 text-sm mb-4">
                        Generate a quiz from your indexed notes.
                    </p>
                    {generating ? (
                        <div className="flex items-center justify-center gap-3 py-4">
                            <div className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                            <span className="text-white/60 text-sm">Generating questions...</span>
                        </div>
                    ) : (
                        <div className="flex justify-center gap-3 mb-6">
                            <button
                                onClick={() => { setMode('mixed'); startQuiz('mixed'); }}
                                className="px-6 py-3 rounded-lg text-sm transition-all bg-white/10 text-white/80 hover:bg-white/20"
                            >
                                Mixed (MC + T/F + Fill)
                            </button>
                            <button
                                onClick={() => { setMode('classic'); startQuiz('classic'); }}
                                className="px-6 py-3 rounded-lg text-sm transition-all bg-white/10 text-white/80 hover:bg-white/20"
                            >
                                Classic (MC only)
                            </button>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 mx-auto max-w-md p-4 rounded-xl bg-red-500/20 border border-red-500/30">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}
                </div>
            </GlassCard>
        );
    }

    // Results screen
    if (result) {
        const pct = Math.round(result.accuracy * 100);
        return (
            <GlassCard>
                <div className="text-center py-12 space-y-6">
                    <p className="text-5xl">{pct >= 75 ? '🏆' : pct >= 50 ? '👍' : '📚'}</p>
                    <h3 className="text-white text-2xl font-semibold">Quiz Complete!</h3>
                    <div className="flex justify-center gap-8">
                        <Stat label="Score" value={`${pct}%`} />
                        <Stat label="Correct" value={`${result.correct}/${result.total}`} />
                        <Stat label="XP Earned" value={`+${result.xp_earned}`} />
                    </div>
                    <div className="flex gap-4 justify-center pt-4">
                        <GradientButton onClick={() => { setQuestions([]); setResult(null); }}>Try Again</GradientButton>
                    </div>
                </div>
            </GlassCard>
        );
    }

    // Question screen
    const q = questions[currentIdx] as MixedQuizQuestion;
    const qType = (q as any).question_type || 'multiple_choice';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <p className="text-white/60 text-sm">
                        Question {currentIdx + 1} of {questions.length}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50">
                        {qType === 'true_false' ? 'True / False' : qType === 'fill_blank' ? 'Fill in the Blank' : 'Multiple Choice'}
                    </span>
                </div>
                <div className="w-48 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            <GlassCard>
                <div className="p-6 space-y-6">
                    <h3 className="text-white text-lg font-medium">{q.question}</h3>

                    {/* Multiple Choice */}
                    {qType === 'multiple_choice' && q.options && (
                        <div className="grid gap-3">
                            {q.options.map((opt, i) => {
                                let style = 'bg-white/10 hover:bg-white/20 border-white/20';
                                if (answered) {
                                    if (opt.is_correct) {
                                        style = 'bg-green-500/30 border-green-400';
                                    } else if (i === selected && !opt.is_correct) {
                                        style = 'bg-red-500/30 border-red-400';
                                    } else {
                                        style = 'bg-white/5 border-white/10 opacity-60';
                                    }
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleMCAnswer(i)}
                                        disabled={answered}
                                        className={`w-full text-left px-5 py-4 rounded-xl border ${style} text-white text-sm transition-all`}
                                    >
                                        <span className="font-medium mr-3 text-white/50">{String.fromCharCode(65 + i)}.</span>
                                        {opt.text}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* True / False */}
                    {qType === 'true_false' && (
                        <div className="flex gap-4 justify-center">
                            {[true, false].map(val => {
                                let style = 'bg-white/10 hover:bg-white/20 border-white/20';
                                if (answered) {
                                    if (val === q.is_true) {
                                        style = 'bg-green-500/30 border-green-400';
                                    } else if (val === tfAnswer && val !== q.is_true) {
                                        style = 'bg-red-500/30 border-red-400';
                                    } else {
                                        style = 'bg-white/5 border-white/10 opacity-60';
                                    }
                                }
                                return (
                                    <button
                                        key={String(val)}
                                        onClick={() => handleTFAnswer(val)}
                                        disabled={answered}
                                        className={`flex-1 px-8 py-5 rounded-xl border ${style} text-white text-lg font-medium transition-all`}
                                    >
                                        {val ? '✅ True' : '❌ False'}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Fill in the Blank */}
                    {qType === 'fill_blank' && (
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={fillAnswer}
                                    onChange={e => setFillAnswer(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleFillSubmit()}
                                    disabled={answered}
                                    placeholder="Type your answer..."
                                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm
                                        focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-60"
                                />
                                {!answered && (
                                    <GradientButton onClick={handleFillSubmit} disabled={!fillAnswer.trim()}>
                                        Check
                                    </GradientButton>
                                )}
                            </div>
                            {answered && (
                                <div className={`p-3 rounded-xl ${
                                    fillAnswer.trim().toLowerCase() === (q.answer || '').toLowerCase()
                                        ? 'bg-green-500/20 text-green-300'
                                        : 'bg-red-500/20 text-red-300'
                                }`}>
                                    {fillAnswer.trim().toLowerCase() === (q.answer || '').toLowerCase()
                                        ? '✅ Correct!'
                                        : `❌ The answer was: ${q.answer}`}
                                </div>
                            )}
                        </div>
                    )}

                    {answered && (
                        <div className="flex justify-end">
                            <GradientButton onClick={nextQuestion} disabled={loading}>
                                {currentIdx < questions.length - 1 ? 'Next →' : 'Finish'}
                            </GradientButton>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <p className="text-white text-2xl font-bold">{value}</p>
        <p className="text-white/50 text-xs">{label}</p>
    </div>
);


/* ─── Progress Tab ─── */

const ProgressTab: React.FC<{ vaultId: string }> = ({ vaultId }) => {
    const [data, setData] = useState<ProgressDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await aiApi.getProgressDashboard(vaultId);
                setData(res);
            } catch (e) {
                console.error('Failed to load progress:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [vaultId]);

    if (loading) {
        return <div className="text-center py-20 text-white/60">Loading progress...</div>;
    }

    if (!data || data.topic_progress.length === 0) {
        return (
            <GlassCard>
                <div className="text-center py-16">
                    <p className="text-4xl mb-4">📊</p>
                    <h3 className="text-white text-xl font-semibold mb-2">No Data Yet</h3>
                    <p className="text-white/60 text-sm">
                        Complete some quizzes and flashcard reviews to see your progress.
                    </p>
                </div>
            </GlassCard>
        );
    }

    const maxAccuracy = Math.max(...data.topic_progress.map(t => t.accuracy), 0.01);

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total XP" value={data.total_xp.toString()} />
                <SummaryCard label="Reviews" value={data.total_reviews.toString()} />
                <SummaryCard label="Cards Due" value={data.cards_due.toString()} />
                <SummaryCard
                    label="Avg Accuracy"
                    value={`${Math.round(
                        (data.topic_progress.reduce((s, t) => s + t.accuracy, 0) /
                            data.topic_progress.length) * 100
                    )}%`}
                />
            </div>

            {/* Topic accuracy bars */}
            <GlassCard>
                <div className="p-6">
                    <h3 className="text-white font-semibold mb-6">Accuracy by Topic</h3>
                    <div className="space-y-4">
                        {data.topic_progress.map(tp => {
                            const pct = Math.round(tp.accuracy * 100);
                            const color =
                                tp.status === 'strong'
                                    ? 'from-green-400 to-green-600'
                                    : tp.status === 'review'
                                    ? 'from-yellow-400 to-orange-500'
                                    : 'from-red-400 to-red-600';
                            return (
                                <div key={tp.topic}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-white text-sm truncate max-w-[60%]">
                                            {tp.topic}
                                        </span>
                                        <span className="text-white/60 text-xs">
                                            {pct}% · {tp.xp} XP · {tp.attempts} attempts
                                        </span>
                                    </div>
                                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </GlassCard>

            {/* Adaptive recommendations */}
            {data.recommendations.length > 0 && (
                <GlassCard>
                    <div className="p-6">
                        <h3 className="text-white font-semibold mb-4">
                            Recommended for Review
                        </h3>
                        <div className="space-y-4">
                            {data.recommendations.map(rec => (
                                <div key={rec.topic} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-red-400 text-sm font-medium">
                                            {rec.topic}
                                        </span>
                                        <span className="text-white/40 text-xs">
                                            {Math.round(rec.accuracy * 100)}% accuracy
                                        </span>
                                    </div>
                                    <p className="text-white/50 text-xs mb-2">Related notes to study:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {rec.related_notes.map(note => (
                                            <span
                                                key={note.document_id}
                                                className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs"
                                            >
                                                {note.title}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            )}
        </div>
    );
};

const SummaryCard: React.FC<{ label: string; value: string }> = ({
    label,
    value,
}) => (
    <GlassCard>
        <div className="p-4 text-center">
            <p className="text-white text-xl font-bold">{value}</p>
            <p className="text-white/50 text-xs">{label}</p>
        </div>
    </GlassCard>
);


/* ─── Streak Banner ─── */

const StreakBanner: React.FC<{ vaultId: string }> = ({ vaultId }) => {
    const [streak, setStreak] = useState<StreakResponse | null>(null);
    const [forecast, setForecast] = useState<ForecastDay[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const [s, f] = await Promise.all([
                    aiApi.getStreak(vaultId),
                    aiApi.getForecast(vaultId),
                ]);
                setStreak(s);
                setForecast(f.forecast);
            } catch (e) {
                console.error('Failed to load streak/forecast:', e);
            }
        })();
    }, [vaultId]);

    if (!streak) return null;

    const maxCards = Math.max(...forecast.map(d => d.cards_due), 1);

    return (
        <div className="mb-6 flex items-stretch gap-4">
            {/* Streak card */}
            <div className="w-2/5">
                <GlassCard className="h-full">
                    <div className="p-4 flex items-center gap-4 h-full">
                    <span className="text-4xl">{streak.current_streak > 0 ? '🔥' : '❄️'}</span>
                    <div>
                        <p className="text-white text-2xl font-bold">{streak.current_streak} day{streak.current_streak !== 1 ? 's' : ''}</p>
                        <p className="text-white/50 text-xs">
                            {streak.today_done ? 'Done today' : '⏳ Study today to keep streak'}
                        </p>
                        <p className="text-white/30 text-xs">Best: {streak.longest_streak}d · Total: {streak.total_study_days}d</p>
                    </div>
                </div>
                </GlassCard>
            </div>

            {/* 7-day forecast */}
            {forecast.length > 0 && (
                <div className="w-3/5">
                    <GlassCard className="h-full">
                        <div className="p-5 h-full flex flex-col">
                            <p className="text-white/50 text-xs font-medium tracking-wide uppercase mb-4">7-day forecast</p>
                            <div className="flex items-end gap-4 flex-1">
                                {forecast.map((d, i) => {
                                    const barH = Math.max((d.cards_due / maxCards) * 96, 3);
                                    const isToday = i === 0;
                                    return (
                                        <div key={d.date} className="flex flex-col items-center flex-1 gap-1">
                                            {d.cards_due > 0 && (
                                                <span className="text-white/60 text-[10px] font-medium leading-none">{d.cards_due}</span>
                                            )}
                                            <div
                                                className={`w-full max-w-[28px] mx-auto rounded-sm transition-all ${
                                                    isToday
                                                        ? 'bg-gradient-to-t from-pink-500 to-purple-400'
                                                        : 'bg-gradient-to-t from-purple-500/60 to-pink-400/40'
                                                }`}
                                                style={{ height: `${barH}px`, minHeight: '3px' }}
                                            />
                                            <span className={`text-[10px] leading-none ${isToday ? 'text-white/70 font-semibold' : 'text-white/30'}`}>
                                                {new Date(d.date).toLocaleDateString('en', { weekday: 'narrow' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};


/* ─── Reading Tab ─── */

const ReadingTab: React.FC<{ vaultId: string }> = ({ vaultId }) => {
    const navigate = useNavigate();
    const [items, setItems] = useState<ReadingItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await aiApi.getReadingList(vaultId);
            setItems(res.items);
        } catch (e) {
            console.error('Failed to load reading list:', e);
        } finally {
            setLoading(false);
        }
    }, [vaultId]);

    useEffect(() => { loadItems(); }, [loadItems]);

    const handleMarkRead = async (documentId: string) => {
        try {
            await aiApi.markAsRead(documentId);
            setItems(prev => prev.filter(i => i.document_id !== documentId));
        } catch (e) {
            console.error('Failed to mark as read:', e);
        }
    };

    const reasonLabel = (reason: string) => {
        switch (reason) {
            case 'due': return { text: 'Due for review', color: 'text-yellow-400 bg-yellow-400/20' };
            case 'low_accuracy': return { text: 'Low quiz accuracy', color: 'text-red-400 bg-red-400/20' };
            case 'never_read': return { text: 'Never reviewed', color: 'text-blue-400 bg-blue-400/20' };
            default: return { text: reason, color: 'text-white/60 bg-white/10' };
        }
    };

    if (loading) {
        return <div className="text-center py-20 text-white/60">Loading reading list...</div>;
    }

    if (items.length === 0) {
        return (
            <GlassCard>
                <div className="text-center py-16">
                    <p className="text-4xl mb-4">📚</p>
                    <h3 className="text-white text-xl font-semibold mb-2">All caught up!</h3>
                    <p className="text-white/60 text-sm">No notes due for re-reading right now.</p>
                </div>
            </GlassCard>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-white/50 text-sm mb-2">{items.length} notes to review</p>
            {items.map(item => {
                const badge = reasonLabel(item.reason);
                return (
                    <GlassCard key={item.document_id}>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{item.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${badge.color}`}>
                                        {badge.text}
                                    </span>
                                    {item.last_read_at && (
                                        <span className="text-white/30 text-xs">
                                            Last read: {new Date(item.last_read_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                                <button
                                    onClick={() => navigate(`/workspace/${vaultId}?doc=${item.document_id}`)}
                                    className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm transition-all"
                                >
                                    Open & Read
                                </button>
                                <button
                                    onClick={() => handleMarkRead(item.document_id)}
                                    className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm transition-all"
                                >
                                    ✓ Mark Read
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                );
            })}
        </div>
    );
};
