import React, { useState, useEffect, useCallback, useRef } from 'react';
import CommunityNavbar from '../../components/layout/CommunityNavbar.jsx';
import api from '@shared/api/client';
import {
  MessageSquare, Users, ChevronLeft, Send, Trash2, Edit2, Globe, Lock, Loader,
} from 'lucide-react';

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CommunityForum({ user, onNavigate, onLogout }) {
  const [selectedForum, setSelectedForum] = useState(null);

  if (selectedForum) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="forum" />
        <ForumThread user={user} forum={selectedForum} onBack={() => setSelectedForum(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="forum" />
      <ForumList onSelect={setSelectedForum} />
    </div>
  );
}

function ForumList({ onSelect }) {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/forums');
      setForums(Array.isArray(data.forums) ? data.forums : []);
    } catch (err) {
      setError(err.message || 'Could not load forums.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community Forums</h1>
        <p className="mt-1 text-sm text-gray-500">Browse community discussions and join the conversation.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader size={24} className="mr-2 animate-spin" /> Loading forums...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button type="button" onClick={load} className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
            Retry
          </button>
        </div>
      ) : forums.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No forums yet.</p>
          <p className="mt-1 text-sm">Check back soon for community discussions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {forums.map((forum) => (
            <button
              key={forum.id}
              type="button"
              onClick={() => onSelect(forum)}
              className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-green-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
              aria-label={`Open forum: ${forum.title}`}
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    {forum.is_public
                      ? <Globe size={14} className="shrink-0 text-green-600" aria-hidden="true" />
                      : <Lock size={14} className="shrink-0 text-gray-400" aria-hidden="true" />}
                    <h2 className="truncate font-semibold text-gray-900">{forum.title}</h2>
                  </div>
                  {forum.description && <p className="line-clamp-2 text-sm text-gray-500">{forum.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MessageSquare size={12} aria-hidden="true" /> {forum.post_count || 0} posts</span>
                    <span className="flex items-center gap-1"><Users size={12} aria-hidden="true" /> {forum.member_count || 0} members</span>
                    {forum.creator_name && <span>by {forum.creator_name}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

function PostCard({ post, user, editingId, editBody, setEditingId, setEditBody, deleteId, setDeleteId, onEditSave, onDelete }) {
  const isOwn = post.author_id === user?.id;
  const isEditing = editingId === post.id;
  const isDeleting = deleteId === post.id;
  const roleLabel = { council_admin: 'Council Admin', council_staff: 'Staff', community_member: 'Community' }[post.author_role] || post.author_role;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white">
            {(post.author_name || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{post.author_name || 'Community member'}</span>
              {roleLabel && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{roleLabel}</span>}
            </div>
            <span className="text-xs text-gray-400">{timeAgo(post.created_at)}{post.updated_at ? ' (edited)' : ''}</span>
          </div>
        </div>
        {isOwn && (
          <div className="flex shrink-0 items-center gap-1">
            {!isEditing && (
              <button type="button" onClick={() => { setEditingId(post.id); setEditBody(post.body || ''); }} aria-label="Edit post" className="rounded p-1 text-gray-400 hover:text-blue-600">
                <Edit2 size={14} />
              </button>
            )}
            {!isDeleting && (
              <button type="button" onClick={() => setDeleteId(post.id)} aria-label="Delete post" className="rounded p-1 text-gray-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      {isEditing ? (
        <div className="mt-3 space-y-2">
          <label className="sr-only" htmlFor={`edit-post-${post.id}`}>Edit message</label>
          <textarea id={`edit-post-${post.id}`} rows={3} value={editBody} onChange={(event) => setEditBody(event.target.value)} className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm" maxLength={5000} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
            <button type="button" onClick={() => onEditSave(post.id)} className="text-xs font-medium text-green-700 hover:underline">Save</button>
          </div>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{post.body}</p>
      )}
      {isDeleting && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
          <p className="mb-2 font-medium text-red-700">Delete this message?</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setDeleteId(null)} className="text-xs text-gray-600 hover:underline">Cancel</button>
            <button type="button" onClick={() => onDelete(post.id)} className="text-xs font-medium text-red-600 hover:underline">Delete</button>
          </div>
        </div>
      )}
    </article>
  );
}

function ForumThread({ user, forum: initialForum, onBack }) {
  const [forum, setForum] = useState(initialForum);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/forums/${initialForum.id}`);
      setForum(data.forum || initialForum);
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (err) {
      setError(err.message || 'Could not load this forum.');
    } finally {
      setLoading(false);
    }
  }, [initialForum]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!loading && !error) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [posts, loading, error]);

  async function handleSend(event) {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setSendError('');
    try {
      await api.post(`/forums/${forum.id}/posts`, { body: body.trim() });
      setBody('');
      await load();
    } catch (err) {
      setSendError(err.message || 'Could not send your message.');
    } finally {
      setSending(false);
    }
  }

  async function handleEditSave(postId) {
    try {
      await api.patch(`/forums/${forum.id}/posts/${postId}`, { body: editBody.trim() });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message || 'Could not update the message.');
    }
  }

  async function handleDelete(postId) {
    try {
      await api.delete(`/forums/${forum.id}/posts/${postId}`);
      setDeleteId(null);
      await load();
    } catch (err) {
      setError(err.message || 'Could not delete the message.');
    }
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-4xl flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onBack} aria-label="Back to forums" className="mt-0.5 rounded p-1 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              {forum.is_public ? <Globe size={14} className="text-green-600" aria-hidden="true" /> : <Lock size={14} className="text-gray-400" aria-hidden="true" />}
              <h1 className="font-bold text-gray-900">{forum.title}</h1>
            </div>
            {forum.description && <p className="mt-0.5 text-sm text-gray-500">{forum.description}</p>}
            <div className="mt-1 flex gap-3 text-xs text-gray-400">
              <span>{forum.post_count || posts.length} posts</span>
              <span>{forum.member_count || 0} members</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400"><Loader size={20} className="mr-2 animate-spin" /> Loading...</div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p>{error}</p>
            <button type="button" onClick={load} className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">Retry</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center text-gray-400"><MessageSquare size={32} className="mx-auto mb-2 opacity-40" /><p className="text-sm">No messages yet. Be the first to post!</p></div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} user={user} editingId={editingId} editBody={editBody} setEditingId={setEditingId} setEditBody={setEditBody} deleteId={deleteId} setDeleteId={setDeleteId} onEditSave={handleEditSave} onDelete={handleDelete} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {!forum.is_active ? (
        <div className="border-t border-gray-200 bg-gray-100 p-4 text-center text-sm text-gray-500">This forum has been closed.</div>
      ) : (
        <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-4">
          {sendError && <div className="mb-2 text-xs text-red-600">{sendError}</div>}
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="forum-message">Write a message</label>
            <textarea id="forum-message" rows={2} value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend(event); } }} placeholder="Write a message... (Enter to send, Shift+Enter for new line)" className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" maxLength={5000} />
            <button type="submit" disabled={sending || !body.trim()} aria-label="Send message" className="flex items-center rounded-lg bg-green-700 px-4 text-white hover:bg-green-800 disabled:opacity-40">
              {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
