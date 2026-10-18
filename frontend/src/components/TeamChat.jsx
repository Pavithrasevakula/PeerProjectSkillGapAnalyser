import { useState, useEffect, useRef } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth.jsx';
import { sendChatMessage } from '../api';

function formatMessageTime(value) {
  const date = value?.toDate?.() || (value instanceof Date ? value : null);
  return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending…';
}

export default function TeamChat({ projectId, canAccess = true }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!canAccess) return undefined;

    const messagesQuery = query(
      collection(db, 'projects', projectId, 'channels', 'general', 'messages'),
      orderBy('timestamp', 'desc'),
      limit(50),
    );

    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(snapshot.docs.map((message) => ({ id: message.id, ...message.data() })).reverse());
        setError('');
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      (snapshotError) => {
        console.error('Team chat subscription error:', snapshotError);
        setError('Team chat is unavailable right now.');
      },
    );
  }, [projectId, canAccess]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = newMessage.trim();
    if (!text || sending || !user) return;

    setSending(true);
    setError('');
    try {
      await sendChatMessage({ projectId, channelId: 'general', text });
      setNewMessage('');
    } catch (sendError) {
      console.error('Send message error:', sendError);
      setError('Your message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="card p-5">
        <h3 className="text-lg font-semibold text-neutral-800">Team Chat</h3>
        <p className="text-sm text-neutral-500 mt-2">Team chat is available after you join this project.</p>
      </div>
    );
  }

  return (
    <div className="card p-5 flex flex-col h-[500px]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center" aria-hidden="true">
          <svg className="w-5 h-5 text-sage-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-800">Team Chat</h3>
          <p className="text-xs text-neutral-500" aria-live="polite">{messages.length} messages</p>
        </div>
      </div>

      {error && <div className="bg-error-50 border border-error-200 text-error-700 rounded-lg px-3 py-2 text-xs mb-3" role="alert">{error}</div>}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2" role="log" aria-live="polite" aria-label="Team chat messages">
        {messages.length === 0 && !error && (
          <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-100">
            <p className="text-neutral-500 text-sm">No messages yet</p>
            <p className="text-neutral-400 text-xs mt-1">Start the conversation!</p>
          </div>
        )}

        {messages.map((message) => {
          const isOwn = message.senderId === user?.uid;
          return (
            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isOwn ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-800 border border-neutral-200'} rounded-xl px-4 py-2.5 shadow-sm`}>
                {!isOwn && <div className="text-xs font-semibold mb-1.5 text-neutral-600">{message.senderName || 'Team member'}</div>}
                <div className="text-sm leading-relaxed break-words">{message.text}</div>
                <div className={`text-xs mt-1.5 ${isOwn ? 'text-primary-200' : 'text-neutral-500'}`}>{formatMessageTime(message.timestamp)}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 pt-3 border-t border-neutral-100">
        <label htmlFor="team-chat-message" className="sr-only">Message</label>
        <input
          id="team-chat-message"
          type="text"
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          placeholder="Type your message..."
          maxLength={2000}
          className="input flex-1"
          disabled={sending}
        />
        <button type="submit" disabled={!newMessage.trim() || sending} aria-label={sending ? 'Sending message' : 'Send message'} className="btn-primary h-11 flex items-center justify-center flex-shrink-0 px-3">
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
