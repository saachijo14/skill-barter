import { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Chat({ transactionId, providerName, requesterName, providerId, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(true);
  const [expiresAt, setExpiresAt] = useState(null);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const res = await api.get(`/transactions/${transactionId}/messages`);
      setMessages(res.data.messages);
      setChatOpen(res.data.chatOpen);
      setExpiresAt(res.data.expiresAt);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000); // poll every 4s
    return () => clearInterval(interval);
  }, [transactionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post(`/transactions/${transactionId}/messages`, { content: text });
      setText('');
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not send message');
    }
  };

  const nameFor = (senderId) => (senderId === providerId ? providerName : requesterName);

  const timeLeft = expiresAt ? Math.max(0, new Date(expiresAt) - Date.now()) : 0;
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col h-96">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-white font-medium text-sm">Swap Chat</h3>
          <p className="text-xs text-slate-500">
            {chatOpen ? `Open for ${hoursLeft}h more` : 'Chat window has closed'}
          </p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.length === 0 && (
          <p className="text-slate-600 text-xs text-center py-8">No messages yet — say hello!</p>
        )}
        {messages.map((m) => {
          const isMe = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                {!isMe && <p className="text-xs text-slate-400 mb-0.5">{nameFor(m.senderId)}</p>}
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {chatOpen ? (
        <form onSubmit={send} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          />
          <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-3 transition">
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <p className="text-slate-500 text-xs text-center">This chat has expired.</p>
      )}
    </div>
  );
}