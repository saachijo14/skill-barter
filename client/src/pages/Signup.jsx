import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Repeat, Zap } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError('You must agree to the Time-Credit Barter Agreement to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      login(res.data.user, res.data.token);
      navigate('/profile-setup');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient-glow blobs */}
      <div className="absolute left-[10%] top-1/3 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="absolute right-[10%] bottom-1/4 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
            <Repeat className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">SkillSwap</span>
        </div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-1 text-center"
        >
          Join the network
        </motion.h1>
        <p className="text-slate-400 text-center text-sm mb-8">
          Trade skills instantly with time credits.
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg p-3 mb-4"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="Sarah Jenkins"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="sarah@design.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1.5">Password</label>
            <input
              type="password"
              placeholder="Create robust password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
          </div>

          <label className="flex items-start gap-2 text-slate-400 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-slate-600 bg-slate-800 accent-cyan-500"
            />
            I agree to the SkillSwap Time-Credit Barter Agreement and Community Guidelines.
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-400 hover:opacity-90 text-white font-medium rounded-lg py-3 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Get 5 Free Time Credits'}
          </motion.button>
        </form>

        <div className="flex items-start gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mt-4">
          <Zap className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <p className="text-cyan-400 text-xs">
            Auto-login enabled. Instantly browse nearby listings upon registration.
          </p>
        </div>

        <p className="text-slate-400 text-center mt-6 text-sm">
          Already exchanging?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}