import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Repeat, Star, Clock, MessageCircle } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Chat from '../components/Chat';

const CANCEL_WINDOW_MS = 15 * 60 * 1000;

export default function TransactionDetail() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadData = async () => {
    try {
      const all = await api.get('/transactions/mine');
      const found = all.data.find((t) => t.id === id);
      setTransaction(found);
      await refreshUser();
      if (found && (found.status === 'confirmed' || found.status === 'completed')) {
        const reviewRes = await api.get('/reviews', { params: { transactionId: id } });
        const myReview = reviewRes.data.find((r) => r.reviewerId === user.id);
        setReview(myReview || null);
      }
    } catch (err) {
      setError('Could not load transaction');
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (action) => {
    try {
      await api.post(`/transactions/${id}`, { action });
      await refreshUser();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || `Could not ${action}`);
    }
  };

  const handleReview = async () => {
    try {
      await api.post('/reviews', { transactionId: id, rating, comment });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit review');
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;
  if (!transaction) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Transaction not found.</div>;

  const isProvider = transaction.providerId === user.id;
  const steps = ['pending', 'confirmed', 'completed'];
  const currentStep = steps.indexOf(transaction.status);
  const cancelled = transaction.status === 'cancelled';

  const completedAtMs = transaction.completedAt ? new Date(transaction.completedAt).getTime() : null;
  const cancelMsLeft = completedAtMs ? CANCEL_WINDOW_MS - (now - completedAtMs) : 0;
  const canCancel = transaction.status === 'completed' && cancelMsLeft > 0;
  const cancelMinutes = Math.max(0, Math.ceil(cancelMsLeft / 60000));

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
              <Repeat className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">SkillSwap</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/dashboard" className="text-slate-400 hover:text-white transition">Dashboard</Link>
            <Link to="/explore" className="text-slate-400 hover:text-white transition">Browse Skills</Link>
            <Link to="/transactions" className="text-cyan-400">My Swaps</Link>
          </div>
          <span className="bg-purple-500/20 text-purple-300 text-sm px-3 py-1.5 rounded-full">
            {user.timeBalance} Credits
          </span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}

        {/* Progress steps */}
        <div className="flex items-center mb-6">
          {['Requested', 'Confirmed', 'Completed'].map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border ${
                  cancelled
                  ? 'border-slate-700 text-slate-600'
                  : i <= currentStep
                  ? 'bg-cyan-500 border-cyan-500 text-white'
                  : 'border-slate-700 text-slate-500'
                   }`}
                >
                  {i <= currentStep && !cancelled ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${i <= currentStep && !cancelled ? 'text-white' : 'text-slate-500'}`}>{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-3 ${i < currentStep && !cancelled ? 'bg-cyan-500' : 'bg-slate-800'}`} />}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  cancelled ? 'bg-red-500/20 text-red-300' :
                  transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                  transaction.status === 'confirmed' ? 'bg-purple-500/20 text-purple-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {cancelled ? 'Cancelled' : transaction.status === 'pending' ? 'Awaiting Confirmation' : transaction.status === 'confirmed' ? 'Offer Exchange In Progress' : 'Completed'}
                </span>
                <span className="text-cyan-400 text-sm bg-cyan-500/10 px-3 py-1 rounded-lg">{transaction.creditsTransferred} hr/credits</span>
              </div>
              <h1 className="text-xl font-bold text-white mt-1 mb-4">{transaction.skillName}</h1>

              <div className="pt-4 border-t border-slate-800">
                <span className="text-slate-500 text-xs">SWAP DETAILS</span>
                <p className="text-slate-300 text-sm mt-1">
                  {isProvider ? transaction.requesterName : transaction.providerName} and you agreed to exchange {transaction.creditsTransferred} time-credits for this session.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <span className="text-slate-500 text-xs">SKILL PROVIDER</span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-medium">
                    {transaction.providerName?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-white font-medium">{transaction.providerName}</p>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <span className="text-slate-500 text-xs">SKILL REQUESTER</span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-medium">
                    {transaction.requesterName?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-white font-medium">{transaction.requesterName}</p>
                </div>
              </div>
            </div>

            {showChat && (
              <Chat
                transactionId={id}
                providerName={transaction.providerName}
                requesterName={transaction.requesterName}
                providerId={transaction.providerId}
                onClose={() => setShowChat(false)}
              />
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-3">
              <h3 className="text-white font-medium mb-1">Swap Action Center</h3>

              {transaction.status === 'pending' && isProvider && (
                <button
                  onClick={() => runAction('confirm')}
                  className="w-full bg-gradient-to-r from-purple-500 to-cyan-400 text-white font-medium rounded-lg py-2.5 transition"
                >
                  ✓ Confirm & Transfer Credits
                </button>
              )}
              {transaction.status === 'pending' && !isProvider && (
                <p className="text-slate-400 text-sm">Waiting for {transaction.providerName} to confirm.</p>
              )}

              {!cancelled && transaction.status !== 'pending' && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-emerald-400 text-sm">
                  <Clock className="w-4 h-4" />
                  {transaction.creditsTransferred} time-credits {transaction.status === 'completed' ? 'transferred' : 'locked in escrow'}.
                </div>
              )}

              {transaction.status === 'confirmed' && isProvider && (
              <button
              onClick={() => runAction('complete')}
              className="w-full bg-gradient-to-r from-purple-500 to-cyan-400 text-white font-medium rounded-lg py-2.5 transition"
              >
              ✓ Certify Swap Completion
              </button>
              )}
              {transaction.status === 'confirmed' && !isProvider && (
                <p className="text-slate-400 text-sm">Waiting for {transaction.providerName} to certify completion.</p>
              )}

              {transaction.status === 'completed' && (
               <p className="text-emerald-400 text-sm">✓ Swap completed and credits transferred.</p>
              )}

              {canCancel && (
              <button
                onClick={() => runAction('cancel')}
                className="w-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-sm font-medium rounded-lg py-2.5 transition"
              >
              Cancel Barter Agreement ({cancelMinutes}m left)
              </button>
              )}

              {cancelled && (
                <p className="text-red-400 text-sm">This swap was cancelled and credits were refunded.</p>
              )}

              {(transaction.status === 'confirmed' || transaction.status === 'completed') && (
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-sm font-medium rounded-lg py-2.5 transition"
                >
                  <MessageCircle className="w-4 h-4" /> {showChat ? 'Hide Chat' : 'Open Swap Chat'}
                </button>
              )}
            </div>

            {transaction.status !== 'pending' && !cancelled && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h4 className="text-white font-medium text-sm mb-1">Leave a Review</h4>
                <p className="text-slate-500 text-xs mb-3">Certified swappers get +0.2 bonus reputation.</p>
                {review ? (
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`w-4 h-4 ${n <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    <p className="text-slate-400 text-sm">{review.comment}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          onClick={() => setRating(n)}
                          className={`w-5 h-5 cursor-pointer ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
                        />
                      ))}
                    </div>
                    <textarea
                      placeholder="Write feedback..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition resize-none mb-2"
                    />
                    <button
                      onClick={handleReview}
                      disabled={!rating}
                      className="w-full bg-slate-800 text-cyan-300 text-sm rounded-lg py-2 disabled:opacity-50"
                    >
                      Submit Swap Certified Review
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}