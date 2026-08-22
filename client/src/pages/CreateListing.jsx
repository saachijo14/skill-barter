import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Repeat, MapPin } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [type, setType] = useState('offer');
  const [skillId, setSkillId] = useState('');
  const [description, setDescription] = useState('');
  const [creditRate, setCreditRate] = useState(1);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/skills').then((res) => {
      setSkills(res.data);
      if (res.data.length) setSkillId(res.data[0].id);
    });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false)
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!coords) {
      setError('We need your location to publish this listing. Please allow location access and refresh.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/listings', {
        skillId, type, description, creditRate,
        lat: coords.lat, lng: coords.lng,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
              <Repeat className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">SkillSwap</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/dashboard" className="text-slate-400 hover:text-white transition">Dashboard</Link>
            <Link to="/explore" className="text-cyan-400">Browse Skills</Link>
            <Link to="/transactions" className="text-slate-400 hover:text-white transition">My Swaps</Link>
          </div>
          <span className="bg-purple-500/20 text-purple-300 text-sm px-3 py-1.5 rounded-full">
            {user.timeBalance} Credits
          </span>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8"
        >
          <h1 className="text-xl font-bold text-white mb-1">Create a SkillSwap Listing</h1>
          <p className="text-slate-400 text-sm mb-6">Offer your expertise or request a barter session.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-1.5">Listing Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('offer')}
                  className={`py-2.5 rounded-lg text-sm font-medium transition ${
                    type === 'offer'
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-400 text-white'
                      : 'bg-slate-800/60 text-slate-400 border border-slate-700'
                  }`}
                >
                  I Want to Offer a Skill
                </button>
                <button
                  type="button"
                  onClick={() => setType('request')}
                  className={`py-2.5 rounded-lg text-sm font-medium transition ${
                    type === 'request'
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-400 text-white'
                      : 'bg-slate-800/60 text-slate-400 border border-slate-700'
                  }`}
                >
                  I Want to Request a Skill
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-1.5">Skill</label>
              <select
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              >
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-1.5">Detail Description</label>
              <textarea
                placeholder="Describe what you can share or need, the format of exchange, and your general availability..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-1.5">Credit Valuation (per hour)</label>
              <select
                value={creditRate}
                onChange={(e) => setCreditRate(Number(e.target.value))}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} Credits</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-4 h-4 text-cyan-400" />
              {locating ? 'Detecting your location...' : coords ? 'Location ready' : 'Location unavailable — please allow access'}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-cyan-400 text-white font-medium rounded-lg py-3 transition disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Swap & Earn Credits'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}