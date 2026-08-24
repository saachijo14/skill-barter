import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Repeat, Star } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Chat from '../components/Chat';

export default function TransactionDetail() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

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

  const handleConfirm = async () => {
  try {
    await api.post(`/transactions/${id}`, { action: 'confirm' });
    await refreshUser();
    loadData();
  } catch (err) {
    setError(err.response?.data?.error || 'Could not confirm');
  }
};

const handleComplete = async () => {
  try {
    await api.post(`/transactions/${id}`, { action: 'complete' });
    loadData();
  } catch (err) {
    setError(err.response?.data?.error || 'Could not complete');
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
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    i <= currentStep ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-sm ${i <= currentStep ? 'text-white' : 'text-slate-500'}`}>{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-3 ${i < currentStep ? 'bg-cyan-500' : 'bg-slate-800'}`} />}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
              {transaction.status === 'pending' ? 'Awaiting Confirmation' : transaction.status === 'confirmed' ? 'Swap In Progress' : 'Completed'}
            </span>
            <h1 className="text-xl font-bold text-white mt-2 mb-1">{transaction.skillName}</h1>
            <span className="text-cyan-400 text-sm">{transaction.creditsTransferred} credits</span>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div>
                <span className="text-slate-500 text-xs">SKILL PROVIDER</span>
                <p className="text-white font-medium mt-1">{transaction.providerName}</p>
                </div>
                <div>
                <span className="text-slate-500 text-xs">SKILL REQUESTER</span>
                <p className="text-white font-medium mt-1">{transaction.requesterName}</p>
              </div>
            </div>
            </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-white font-medium">Swap Action Center</h3>
            {transaction.status === 'pending' && isProvider && (
              <button
                onClick={handleConfirm}
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-400 text-white font-medium rounded-lg py-2.5 transition"
              >
                ✓ Confirm & Transfer Credits
              </button>
            )}
            {transaction.status === 'pending' && !isProvider && (
              <p className="text-slate-400 text-sm">Waiting for the provider to confirm this swap.</p>
            )}
            {transaction.status === 'confirmed' && (
            <>
              <p className="text-emerald-400 text-sm">✓ {transaction.creditsTransferred} time-credits transferred.</p>
              {isProvider ? (
              <button
                onClick={handleComplete}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg py-2.5 mt-2 transition"
              >
              Mark Swap as Completed
              </button>
            ) : (
            <p className="text-slate-400 text-sm mt-2">
            Waiting for {transaction.providerName} to mark this swap as completed.
            </p>
            )}
          </>
          )}
            {transaction.status === 'completed' && (
                <p className="text-emerald-400 text-sm">✓ Swap completed and credits transferred.</p>
            )}


            {(transaction.status === 'confirmed' || transaction.status === 'completed') && (
              <button
                onClick={() => setShowChat(!showChat)}
                className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-sm font-medium rounded-lg py-2.5 transition"
              >
                {showChat ? 'Hide Chat' : '💬 Open Swap Chat'}
              </button>
            )}

            {transaction.status !== 'pending' && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-white font-medium text-sm mb-2">Leave a Review</h4>
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
                      className="w-full bg-slate-800 text-white text-sm rounded-lg py-2 disabled:opacity-50"
                    >
                      Submit Review
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {showChat && (
          <div className="mt-6">
            <Chat
              transactionId={id}
              providerName={transaction.providerName}
              requesterName={transaction.requesterName}
              providerId={transaction.providerId}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}