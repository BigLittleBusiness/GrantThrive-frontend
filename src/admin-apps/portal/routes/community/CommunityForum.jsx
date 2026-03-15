import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getToken } from '@grantthrive/auth';
import {
  MessageSquare, Plus, Users, ChevronLeft, Send,
  Trash2, Edit2, Pin, X, LogIn, LogOut, Lock, Globe, Loader
} from 'lucide-react';

const API = '/api';

function apiFetch(path, opts = {}) {
  const token = getToken();
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  }).then(async (r) => {
    const json = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
    return json;
  });
}

const STAFF_ROLES = ['council_admin', 'council_staff'];

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function CommunityForum({ user }) {
  const [selectedForum, setSelectedForum] = useState(null);
  if (selectedForum) {
    return <ForumThread user={user} forum={selectedForum} onBack={() => setSelectedForum(null)} />;
  }
  return <ForumList user={user} onSelect={setSelectedForum} />;
}

function ForumList({ user, onSelect }) {
  const [forums, setForums]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [createForm, setCreateForm]   = useState({ title: '', description: '', is_public: true });
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');
  const isStaff = STAFF_ROLES.includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await apiFetch('/forums'); setForums(data.forums || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleJoinLeave(e, forum) {
    e.stopPropagation();
    try {
      if (forum.is_member) { await apiFetch(`/forums/${forum.id}/join`, { method: 'DELETE' }); }
      else { await apiFetch(`/forums/${forum.id}/join`, { method: 'POST' }); }
      load();
    } catch (err) { alert(err.message); }
  }

  async function handleCreate(e) {
    e.preventDefault(); setCreating(true); setCreateError('');
    try {
      await apiFetch('/forums', { method: 'POST', body: JSON.stringify(createForm) });
      setShowCreate(false); setCreateForm({ title: '', description: '', is_public: true }); load();
    } catch (err) { setCreateError(err.message); }
    finally { setCreating(false); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Forums</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isStaff ? 'Create forums and communicate with community members.' : 'Browse forums and join the conversation.'}
          </p>
        </div>
        {isStaff && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> New Forum
          </button>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Create New Forum</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {createError && (
              <div className="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{createError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Forum Title *</label>
                <input type="text" required maxLength={200} value={createForm.title}
                  onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Grant Application Help" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="What is this forum about?" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_public" checked={createForm.is_public}
                  onChange={e => setCreateForm(f => ({ ...f, is_public: e.target.checked }))} className="rounded" />
                <label htmlFor="is_public" className="text-sm text-gray-700">Public — visible to community members</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Forum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader size={24} className="animate-spin mr-2" /> Loading forums...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">{error}</div>
      ) : forums.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No forums yet.</p>
          {isStaff && <p className="text-sm mt-1">Create the first forum to start the conversation.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {forums.map(forum => (
            <div key={forum.id} onClick={() => onSelect(forum)}
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-green-400 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {forum.is_public
                      ? <Globe size={14} className="text-green-600 flex-shrink-0" />
                      : <Lock size={14} className="text-gray-400 flex-shrink-0" />}
                    <h3 className="font-semibold text-gray-900 truncate">{forum.title}</h3>
                    {forum.is_member && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">Joined</span>
                    )}
                  </div>
                  {forum.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{forum.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {forum.post_count} posts</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {forum.member_count} members</span>
                    <span>by {forum.creator_name}</span>
                  </div>
                </div>
                {isStaff && (
                  <button onClick={e => handleJoinLeave(e, forum)}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      forum.is_member
                        ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        : 'border-green-600 text-green-700 hover:bg-green-50'
                    }`}>
                    {forum.is_member ? <><LogOut size={12} /> Leave</> : <><LogIn size={12} /> Join</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, user, isAdmin, editingId, editBody, setEditingId, setEditBody, deleteId, setDeleteId, onEditSave, onDelete, onPin, pinned = false }) {
  const isOwn      = post.author_id === user?.id;
  const canEdit    = isOwn;
  const canDel     = isOwn || isAdmin;
  const canPin     = isAdmin;
  const isEditing  = editingId === post.id;
  const isDeleting = deleteId  === post.id;
  const roleLabel  = { council_admin: 'Council Admin', council_staff: 'Staff', community_member: 'Community' }[post.author_role] || post.author_role;

  return (
    <div className={`bg-white rounded-xl border p-4 ${pinned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {(post.author_name || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-gray-900">{post.author_name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                post.author_role === 'council_admin' ? 'bg-purple-100 text-purple-700' :
                post.author_role === 'council_staff' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>{roleLabel}</span>
              {pinned && <span className="flex items-center gap-1 text-xs text-yellow-700"><Pin size={10} /> Pinned</span>}
            </div>
            <span className="text-xs text-gray-400">{timeAgo(post.created_at)}{post.updated_at ? ' (edited)' : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {canPin && (
            <button onClick={() => onPin(post)} title={post.is_pinned ? 'Unpin' : 'Pin'}
              className="p-1 text-gray-400 hover:text-yellow-600 rounded"><Pin size={14} /></button>
          )}
          {canEdit && !isEditing && (
            <button onClick={() => { setEditingId(post.id); setEditBody(post.body); }}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"><Edit2 size={14} /></button>
          )}
          {canDel && !isDeleting && (
            <button onClick={() => setDeleteId(post.id)}
              className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14} /></button>
          )}
        </div>
      </div>
      {isEditing ? (
        <div className="mt-3 space-y-2">
          <textarea rows={3} value={editBody} onChange={e => setEditBody(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" maxLength={5000} />
          <div className="flex gap-2">
            <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
            <button onClick={() => onEditSave(post.id)} className="text-xs text-green-700 font-medium hover:underline">Save</button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{post.body}</p>
      )}
      {isDeleting && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
          <p className="text-red-700 font-medium mb-2">Delete this message?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="text-gray-600 hover:underline text-xs">Cancel</button>
            <button onClick={() => onDelete(post.id)} className="text-red-600 font-medium hover:underline text-xs">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ForumThread({ user, forum: initialForum, onBack }) {
  const [forum, setForum]         = useState(initialForum);
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [body, setBody]           = useState('');
  const [sending, setSending]     = useState(false);
  const [sendError, setSendError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody]   = useState('');
  const [deleteId, setDeleteId]   = useState(null);
  const bottomRef = useRef(null);
  const isAdmin = user?.role === 'council_admin';

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await apiFetch(`/forums/${initialForum.id}`);
      setForum(data.forum); setPosts(data.posts || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [initialForum.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [posts, loading]);

  async function handleSend(e) {
    e.preventDefault(); if (!body.trim()) return;
    setSending(true); setSendError('');
    try {
      await apiFetch(`/forums/${forum.id}/posts`, { method: 'POST', body: JSON.stringify({ body }) });
      setBody(''); load();
    } catch (err) { setSendError(err.message); }
    finally { setSending(false); }
  }

  async function handleEditSave(postId) {
    try {
      await apiFetch(`/forums/${forum.id}/posts/${postId}`, { method: 'PATCH', body: JSON.stringify({ body: editBody }) });
      setEditingId(null); load();
    } catch (err) { alert(err.message); }
  }

  async function handleDelete(postId) {
    try {
      await apiFetch(`/forums/${forum.id}/posts/${postId}`, { method: 'DELETE' });
      setDeleteId(null); load();
    } catch (err) { alert(err.message); }
  }

  async function handlePin(post) {
    try {
      await apiFetch(`/forums/${forum.id}/posts/${post.id}`, { method: 'PATCH', body: JSON.stringify({ is_pinned: !post.is_pinned }) });
      load();
    } catch (err) { alert(err.message); }
  }

  async function handleCloseForum() {
    if (!window.confirm('Close this forum? It will no longer accept new posts.')) return;
    try { await apiFetch(`/forums/${forum.id}`, { method: 'DELETE' }); onBack(); }
    catch (err) { alert(err.message); }
  }

  const pinnedPosts  = posts.filter(p => p.is_pinned);
  const regularPosts = posts.filter(p => !p.is_pinned);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="p-4 border-b border-gray-200 bg-white flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="mt-0.5 text-gray-400 hover:text-gray-700"><ChevronLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-2">
              {forum.is_public ? <Globe size={14} className="text-green-600" /> : <Lock size={14} className="text-gray-400" />}
              <h2 className="font-bold text-gray-900">{forum.title}</h2>
            </div>
            {forum.description && <p className="text-sm text-gray-500 mt-0.5">{forum.description}</p>}
            <div className="flex gap-3 text-xs text-gray-400 mt-1">
              <span>{forum.post_count} posts</span>
              <span>{forum.member_count} members</span>
            </div>
          </div>
        </div>
        {(isAdmin || forum.created_by === user?.id) && forum.is_active && (
          <button onClick={handleCloseForum} className="text-xs text-red-600 hover:underline flex-shrink-0">Close forum</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader size={20} className="animate-spin mr-2" /> Loading...
          </div>
        ) : error ? (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No messages yet. Be the first to post!</p>
          </div>
        ) : (
          <>
            {pinnedPosts.map(post => (
              <PostCard key={post.id} post={post} user={user} isAdmin={isAdmin}
                editingId={editingId} editBody={editBody} setEditingId={setEditingId} setEditBody={setEditBody}
                deleteId={deleteId} setDeleteId={setDeleteId}
                onEditSave={handleEditSave} onDelete={handleDelete} onPin={handlePin} pinned />
            ))}
            {regularPosts.map(post => (
              <PostCard key={post.id} post={post} user={user} isAdmin={isAdmin}
                editingId={editingId} editBody={editBody} setEditingId={setEditingId} setEditBody={setEditBody}
                deleteId={deleteId} setDeleteId={setDeleteId}
                onEditSave={handleEditSave} onDelete={handleDelete} onPin={handlePin} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {!forum.is_active ? (
        <div className="p-4 border-t border-gray-200 bg-gray-100 text-center text-sm text-gray-500">
          This forum has been closed.
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
          {sendError && <div className="mb-2 text-xs text-red-600">{sendError}</div>}
          <div className="flex gap-2">
            <textarea rows={2} value={body} onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              placeholder="Write a message... (Enter to send, Shift+Enter for new line)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              maxLength={5000} />
            <button type="submit" disabled={sending || !body.trim()}
              className="bg-green-700 hover:bg-green-800 text-white px-4 rounded-lg disabled:opacity-40 flex items-center gap-1">
              {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
