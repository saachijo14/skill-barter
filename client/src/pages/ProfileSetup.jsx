import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, X } from 'lucide-react';
import api from '../lib/api';

export default function ProfileSetup() {
  const [city, setCity] = useState('');
  const [coords, setCoords] = useState(null);
  const [bio, setBio] = useState('');
  const [offerSkills, setOfferSkills] = useState(['React / Frontend', 'Node.js API']);
  const [wantSkills, setWantSkills] = useState(['Spanish Conversation']);
  const [offerInput, setOfferInput] = useState('');
  const [wantInput, setWantInput] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError('Could not detect location. You can still type your city manually.');
        setLocating(false);
      }
    );
  };

  const addTag = (list, setList, input, setInput) => {
    if (input.trim()) {
      setList([...list, input.trim()]);
      setInput('');
    }
  };

  const removeTag = (list, setList, index) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    setError('');
    if (!coords) {
      setError('Please detect your location first, or click "Skip for now" below.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/profile/location', { lat: coords.lat, lng: coords.lng, bio });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-white">Set Up Your Swapper Profile</h1>
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">Step 1 of 1</span>
        </div>
        <p className="text-slate-400 text-sm mb-4">Help community members discover your capabilities.</p>
        <div className="h-1 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full mb-6" />

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-1.5">City & Location</label>
              <input
                type="text"
                placeholder="Oakland, California"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />
            </div>

            <button
              onClick={detectLocation}
              type="button"
              className="w-full border border-slate-700 rounded-lg py-8 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-cyan-500/50 transition"
            >
              <MapPin className={`w-6 h-6 ${coords ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="text-xs">
                {locating ? 'Detecting...' : coords ? 'GPS Precision Match Mode Active' : 'Click to detect GPS location'}
              </span>
            </button>

            <div>
              <label className="block text-slate-300 text-sm mb-1.5">Swapper Bio</label>
              <textarea
                placeholder="Full stack engineer looking to swap React tutoring for Spanish speech practice. Available weekday evenings."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition resize-none"
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-1.5">Skills You Can Offer</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {offerSkills.map((skill, i) => (
                  <span key={i} className="flex items-center gap-1 bg-purple-500/20 text-purple-300 text-xs px-3 py-1.5 rounded-full">
                    {skill}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(offerSkills, setOfferSkills, i)} />
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="+ Type to add skill..."
                value={offerInput}
                onChange={(e) => setOfferInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(offerSkills, setOfferSkills, offerInput, setOfferInput))}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-1.5">Skills You Want to Learn / Barter For</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {wantSkills.map((skill, i) => (
                  <span key={i} className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1.5 rounded-full">
                    {skill}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(wantSkills, setWantSkills, i)} />
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="+ Add request tag..."
                value={wantInput}
                onChange={(e) => setWantInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(wantSkills, setWantSkills, wantInput, setWantInput))}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
          <button onClick={() => navigate('/dashboard')} className="text-slate-500 text-sm hover:text-slate-300">
            Skip for now, explore listings first.
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFinish}
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-cyan-400 text-white font-medium rounded-lg py-2.5 px-6 flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : '→ Finish Setup & Enter Dashboard'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}