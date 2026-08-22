import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Repeat, Package, Clock, TrendingUp, MapPin, Plus, Radar } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [listings, setListings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [listingsRes, transactionsRes] = await Promise.all([
          api.get('/listings/mine'),
          api.get('/transactions/mine'),
        ]);
        setListings(listingsRes.data);
        setTransactions(transactionsRes.data);

        // Try to load nearby listings if we have geolocation permission
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const res = await api.get('/listings/search', {
            params: { lat: pos.coords.latitude, lng: pos.coords.longitude, radius: 16000 },
          });
          setNearby(res.data.slice(0, 3));
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const earnedCredits = transactions
    .filter((t) => t.providerId === user.id && t.status !== 'pending')
    .reduce((sum, t) => sum + t.creditsTransferred, 0);

    const navigate = useNavigate();
const handleInitiate = async (item) => {
  try {
    const res = await api.post('/transactions', { listingId: item.id, creditsOffered: item.creditRate });
    navigate(`/transactions/${res.data.id}`);
  } catch (err) {
    alert(err.response?.data?.error || 'Could not initiate swap');
  }
};

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav bar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
              <Repeat className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">SkillSwap</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/dashboard" className="text-cyan-400">Dashboard</Link>
            <Link to="/explore" className="text-slate-400 hover:text-white transition">Browse Skills</Link>
            <Link to="/transactions" className="text-slate-400 hover:text-white transition">My Swaps</Link>
            <span className="text-slate-600">Community Wallet</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-purple-500/20 text-purple-300 text-sm px-3 py-1.5 rounded-full">
              {user.timeBalance} Credits
            </span>
            <button
              onClick={logout}
              className="w-8 h-8 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center hover:bg-slate-600 transition"
              title="Log out"
            >
              {user.name?.[0]?.toUpperCase()}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard icon={<Package className="w-4 h-4" />} label="Active Listings" value={`${listings.length} Active`} sub="Your posted swaps" />
          <StatCard icon={<Clock className="w-4 h-4" />} label="Pending Barter Swaps" value={`${pendingCount} Pending`} sub="Awaiting confirmation" />
          <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Time-Credits Earned" value={`${earnedCredits} Credits`} sub="From completed swaps" />
        </div>

        {/* Activity header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold">Local Skill Exchange Activity</h2>
            <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Live Radar Match
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/explore" className="text-sm text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 hover:border-cyan-500/50 transition flex items-center gap-1.5">
              <Radar className="w-4 h-4" /> Find Skills Nearby
            </Link>
            <Link to="/create-listing" className="text-sm bg-gradient-to-r from-purple-500 to-cyan-400 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Post a Listing
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Nearby listings feed */}
          <div className="md:col-span-2 space-y-3">
            {loading && <p className="text-slate-500 text-sm">Loading nearby activity...</p>}
            {!loading && nearby.length === 0 && (
              <p className="text-slate-500 text-sm border border-slate-800 rounded-xl p-6 text-center">
                No nearby listings yet — be the first to post one, or check back soon.
              </p>
            )}
            {nearby.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -2 }}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'offer' ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                    {item.type === 'offer' ? 'Offer' : 'Request'}
                  </span>
                  <span className="text-slate-500 text-xs ml-2">{(item.distance_m / 1000).toFixed(1)} km away</span>
                  <h3 className="text-white font-medium mt-1">{item.skill_name}</h3>
                  <p className="text-slate-400 text-sm">{item.provider_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-cyan-400 text-sm font-medium block mb-2">{item.creditRate} hr/credits</span>
                  <button onClick={() => handleInitiate(item)} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg">
                    Initiate Swap →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Community radar sidebar */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <h3 className="text-white font-medium mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" /> Community Radar
            </h3>
            <p className="text-slate-500 text-xs mb-4">Members matching your requests nearby.</p>
            <div className="bg-slate-950 rounded-lg h-40 flex items-center justify-center border border-slate-800 mb-3">
              <span className="text-slate-600 text-xs">Radar preview</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Swappers Online</span>
              <span className="text-white">{nearby.length} Local</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs">{label}</span>
        <span className="text-slate-500">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-500 text-xs mt-1">{sub}</div>
    </div>
  );
}