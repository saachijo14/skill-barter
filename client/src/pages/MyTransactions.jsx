import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Repeat } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function MyTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    api.get('/transactions/mine').then((res) => setTransactions(res.data));
  }, []);

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

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-white mb-6">My Swaps</h1>
        <div className="space-y-3">
          {transactions.map((t) => (
            <Link
              key={t.id}
              to={`/transactions/${t.id}`}
              className="block bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-cyan-500/50 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      t.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : t.status === 'confirmed'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {t.status}
                  </span>
                  <p className="text-white font-medium mt-1">Swap #{t.id.slice(0, 8)}</p>
                </div>
                <span className="text-cyan-400 text-sm">{t.creditsTransferred} credits</span>
              </div>
            </Link>
          ))}
          {transactions.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No swaps yet — explore nearby listings to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
}