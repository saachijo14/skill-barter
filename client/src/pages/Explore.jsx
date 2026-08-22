import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { Repeat, Search, Plus } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

// Fix default marker icons (common Leaflet + bundler quirk)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function Explore() {
  const { user } = useAuth();
  const [coords, setCoords] = useState(null);
  const [radius, setRadius] = useState(10000);
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLoading(false)
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    api
      .get('/listings/search', { params: { lat: coords.lat, lng: coords.lng, radius } })
      .then((res) => setListings(res.data))
      .finally(() => setLoading(false));
  }, [coords, radius]);

  const filtered = listings.filter((l) =>
    l.skill_name.toLowerCase().includes(search.toLowerCase())
  );

  const navigate = useNavigate();

const handleInitiate = async (item) => {
  try {
    const res = await api.post('/transactions', {
      listingId: item.id,
      creditsOffered: item.creditRate,
    });
    navigate(`/transactions/${res.data.id}`);
  } catch (err) {
    alert(err.response?.data?.error || 'Could not initiate swap');
  }
};

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
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
          <div className="flex items-center gap-3">
            <span className="bg-purple-500/20 text-purple-300 text-sm px-3 py-1.5 rounded-full">
              {user.timeBalance} Credits
            </span>
          </div>
        </div>
      </nav>

      {/* Search bar */}
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search skills (e.g. Spanish, React, Marketing...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Search Radius:</span>
          {[5000, 10000, 20000].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-3 py-1.5 rounded-lg transition ${
                radius === r ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {r / 1000} km
            </button>
          ))}
        </div>
        <Link
          to="/create-listing"
          className="bg-gradient-to-r from-purple-500 to-cyan-400 text-white text-sm rounded-lg px-4 py-2 flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Post Listing
        </Link>
      </div>

      {/* Map + list */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 pb-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-xl overflow-hidden border border-slate-800 min-h-[500px]">
          {coords ? (
            <MapContainer center={[coords.lat, coords.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
              />
              <Circle center={[coords.lat, coords.lng]} radius={radius} pathOptions={{ color: '#22d3ee', fillOpacity: 0.05 }} />
              <Marker position={[coords.lat, coords.lng]}>
                <Popup>You are here</Popup>
              </Marker>
              {filtered.map((item) => (
                <Marker key={item.id} position={[item.lat, item.lng]}>
                    <Popup>
                        <strong>{item.skill_name}</strong>
                        <br />
                        {item.provider_name} — {item.creditRate} credits
                        <br />
                        {(item.distance_m / 1000).toFixed(1)} km away
                    </Popup>
                </Marker>
                ))}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm bg-slate-900/50">
              {loading ? 'Loading map...' : 'Location access needed to show the map.'}
            </div>
          )}
        </div>

        {/* Sidebar list */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          <h3 className="text-white font-medium text-sm mb-2">Radar Matches Nearby ({filtered.length})</h3>
          {filtered.map((item) => (
            <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'offer' ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                  {item.type === 'offer' ? 'Offer' : 'Request'}
                </span>
                <span className="text-slate-500 text-xs">{(item.distance_m / 1000).toFixed(1)} km away</span>
              </div>
              <h4 className="text-white font-medium">{item.skill_name}</h4>
              <p className="text-slate-400 text-sm mb-2">{item.provider_name}</p>
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 text-sm">{item.creditRate} hr/credits</span>
                <button
                    onClick={() => handleInitiate(item)}
                    className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition"
                    >
                    Initiate Swap →
                </button>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No listings found in this radius.</p>
          )}
        </div>
      </div>
    </div>
  );
}