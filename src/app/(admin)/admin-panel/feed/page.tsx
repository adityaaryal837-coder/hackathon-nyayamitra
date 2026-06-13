'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { dbService, FeedPost, PostComment, Profile } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, Users, Trash2, CheckCircle, XCircle, Search, Filter,
  Loader2, MessageSquare, Ban, Unlock, AlertTriangle, Clock, Eye, Flag
} from 'lucide-react';

export default function AdminFeedManager() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Mode/Tab state
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');

  // Posts State
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postSearch, setPostSearch] = useState('');
  const [filterFlaggedOnly, setFilterFlaggedOnly] = useState(false);

  // Users State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Selected Post for Comments Moderation
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [postComments, setPostComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // General Toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadPosts();
    loadProfiles();
  }, [user, authLoading, router]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      const data = await dbService.getFeedPosts(true); // Include flagged
      setPosts(data);
    } catch (e) {
      console.error('Error loading posts:', e);
      showToast('Failed to load posts', 'error');
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const data = await dbService.getAllProfiles();
      setProfiles(data);
    } catch (e) {
      console.error('Error loading profiles:', e);
      showToast('Failed to load user accounts', 'error');
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleToggleFlag = async (postId: string, currentFlagged: boolean) => {
    try {
      const updated = await dbService.flagFeedPost(postId, !currentFlagged);
      if (updated) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, flagged: !currentFlagged } : p));
        showToast(currentFlagged ? 'Post approved and unflagged' : 'Post flagged as inappropriate');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update post flag status', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this post? This cannot be undone.')) return;
    try {
      const ok = await dbService.deleteFeedPost(postId);
      if (ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        showToast('Post permanently deleted');
        if (selectedPost?.id === postId) {
          setSelectedPost(null);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete post', 'error');
    }
  };

  const handleOpenComments = async (post: FeedPost) => {
    setSelectedPost(post);
    setLoadingComments(true);
    try {
      const comments = await dbService.getPostComments(post.id);
      setPostComments(comments);
    } catch (e) {
      console.error(e);
      showToast('Failed to load comments', 'error');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this comment?')) return;
    try {
      const ok = await dbService.deletePostComment(commentId);
      if (ok) {
        setPostComments(prev => prev.filter(c => c.id !== commentId));
        showToast('Comment permanently deleted');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete comment', 'error');
    }
  };

  const handleToggleBlockUser = async (userId: string, currentBlocked: boolean) => {
    const action = currentBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} this user? ${!currentBlocked ? 'They will be locked out of the Nyaya Mitra portal.' : 'They will regain portal access.'}`)) return;
    try {
      const ok = await dbService.blockUser(userId, !currentBlocked);
      if (ok) {
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_blocked: !currentBlocked } : p));
        showToast(`User successfully ${action}ed`);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update user block status', 'error');
    }
  };

  // Filters
  const filteredPosts = posts.filter(post => {
    const matchesSearch =
      post.title.toLowerCase().includes(postSearch.toLowerCase()) ||
      post.content.toLowerCase().includes(postSearch.toLowerCase()) ||
      post.author_name.toLowerCase().includes(postSearch.toLowerCase());
    const matchesFlagged = !filterFlaggedOnly || post.flagged;
    return matchesSearch && matchesFlagged;
  });

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch =
      profile.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      profile.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchesSearch;
  });

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-50 dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <Clock className="h-10 w-10 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Checking Admin Privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-50 dark:bg-legal-navy-dark transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth relative">
        
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-lg flex items-center gap-2 animate-fadeIn
            ${toast.type === 'error' 
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' 
              : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'}`}>
            {toast.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <span className="text-xs font-bold font-sans">{toast.message}</span>
          </div>
        )}

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-legal-gold/15 pb-6">
          <div>
            <h1 className="font-serif text-3xl font-extrabold text-legal-navy dark:text-brand-50 flex items-center gap-3">
              <Users className="h-8 w-8 text-legal-gold" />
              Community Moderation CMS
            </h1>
            <p className="text-xs font-sans text-legal-navy/60 dark:text-brand-200/60 mt-1">
              Enforce guidelines, manage inappropriate posts, moderate comments, and suspend member accounts.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-wider font-sans">
            <ShieldAlert className="h-4 w-4" />
            Admin Mode
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex border-b border-legal-gold/15 pb-px">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 border-b-2 font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer
              ${activeTab === 'posts'
                ? 'border-legal-gold text-legal-navy dark:text-brand-50'
                : 'border-transparent text-legal-navy/40 dark:text-brand-200/40 hover:text-legal-navy dark:hover:text-brand-50'}`}
          >
            Moderate Discussions ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 border-b-2 font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer
              ${activeTab === 'users'
                ? 'border-legal-gold text-legal-navy dark:text-brand-50'
                : 'border-transparent text-legal-navy/40 dark:text-brand-200/40 hover:text-legal-navy dark:hover:text-brand-50'}`}
          >
            Manage Accounts ({profiles.length})
          </button>
        </div>

        {/* ── MODERATE POSTS SECTION ───────────────────────────────────── */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            
            {/* Filters bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-legal-navy/30 p-4 rounded-2xl border border-legal-gold/10 shadow-sm">
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-navy/40 dark:text-brand-300/40" />
                <input
                  type="text"
                  placeholder="Search discussions by title or author..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/15 bg-brand-50/50 dark:bg-legal-navy/20 text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-brand-50 placeholder:text-legal-navy/40 dark:placeholder:text-brand-300/40"
                />
              </div>

              <div className="flex gap-2 items-center w-full md:w-auto">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-legal-navy dark:text-brand-50">
                  <input
                    type="checkbox"
                    checked={filterFlaggedOnly}
                    onChange={(e) => setFilterFlaggedOnly(e.target.checked)}
                    className="rounded border-legal-gold/30 text-legal-navy focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Show Guidelines Flagged Only</span>
                </label>
              </div>
            </div>

            {/* Posts Grid */}
            {loadingPosts ? (
              <div className="flex py-20 items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-legal-gold" />
                  <p className="text-xs uppercase tracking-widest font-sans font-bold text-legal-navy/60 dark:text-brand-300/60">
                    Loading community posts...
                  </p>
                </div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-legal-navy/40 rounded-2xl border border-legal-gold/15 py-16 text-center space-y-4 max-w-md mx-auto shadow-sm">
                <ShieldAlert className="h-10 w-10 text-legal-gold/30 mx-auto" />
                <h3 className="text-base font-bold text-legal-navy dark:text-brand-50">No Inappropriate Posts Found</h3>
                <p className="text-xs text-legal-navy/50 dark:text-brand-300/50 px-6">
                  {filterFlaggedOnly ? 'All forum posts are currently cleared of content flags.' : 'No community posts match your search query.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map(post => (
                  <div
                    key={post.id}
                    className={`bg-white dark:bg-legal-navy/40 p-5 rounded-2xl border flex flex-col md:flex-row gap-5 items-start justify-between shadow-sm hover:shadow-md transition-all
                      ${post.flagged ? 'border-red-500/35 bg-red-500/[0.02]' : 'border-legal-gold/15'}`}
                  >
                    <div className="space-y-3 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold font-sans uppercase tracking-wider bg-brand-100 dark:bg-brand-900/30 text-legal-navy dark:text-brand-300 border border-brand-200 dark:border-brand-800/40">
                          {post.category}
                        </span>
                        {post.flagged && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-sans uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                            <ShieldAlert className="h-3 w-3" /> guidelines flagged
                          </span>
                        )}
                        <span className="text-[10px] text-legal-navy/40 dark:text-brand-300/40">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-serif text-base font-bold text-legal-navy dark:text-brand-50">{post.title}</h3>
                      <p className="text-xs text-legal-navy/75 dark:text-brand-200/75 leading-relaxed line-clamp-3">{post.content}</p>
                      
                      <div className="flex items-center gap-3 text-[10px] text-legal-navy/50 dark:text-brand-300/50 font-sans">
                        <span>Posted by: <strong className="text-legal-navy dark:text-brand-50">{post.author_name}</strong></span>
                        <span>•</span>
                        <span>Agrees: <strong>{post.likes || 0}</strong></span>
                        <span>•</span>
                        <span>Disagrees: <strong>{post.disagree_votes || 0}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 md:items-end">
                      <button
                        onClick={() => handleOpenComments(post)}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-legal-gold/20 hover:border-legal-gold text-legal-navy dark:text-brand-50 hover:bg-brand-50 dark:hover:bg-legal-navy/30 cursor-pointer transition-all"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-legal-gold" />
                        <span>Comments</span>
                      </button>

                      <button
                        onClick={() => handleToggleFlag(post.id, post.flagged)}
                        className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all
                          ${post.flagged
                            ? 'bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20'}`}
                      >
                        {post.flagged ? <CheckCircle className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />}
                        <span>{post.flagged ? 'Approve' : 'Flag Post'}</span>
                      </button>

                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-500 hover:bg-red-600 text-white cursor-pointer transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MANAGE ACCOUNTS SECTION ─────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            {/* Search Box */}
            <div className="flex bg-white dark:bg-legal-navy/30 p-4 rounded-2xl border border-legal-gold/10 shadow-sm max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-navy/40 dark:text-brand-300/40" />
                <input
                  type="text"
                  placeholder="Search accounts by full name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/15 bg-brand-50/50 dark:bg-legal-navy/20 text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-brand-50 placeholder:text-legal-navy/40 dark:placeholder:text-brand-300/40"
                />
              </div>
            </div>

            {/* Users Accounts Table */}
            {loadingProfiles ? (
              <div className="flex py-20 items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-legal-gold" />
                  <p className="text-xs uppercase tracking-widest font-sans font-bold text-legal-navy/60 dark:text-brand-300/60">
                    Loading database profiles...
                  </p>
                </div>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="bg-white dark:bg-legal-navy/40 rounded-2xl border border-legal-gold/15 py-16 text-center space-y-4 max-w-md mx-auto shadow-sm">
                <Users className="h-10 w-10 text-legal-gold/30 mx-auto" />
                <h3 className="text-base font-bold text-legal-navy dark:text-brand-50">No Accounts Found</h3>
                <p className="text-xs text-legal-navy/50 dark:text-brand-300/50 px-6">
                  No registered users match your search query.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-legal-navy/40 rounded-2xl border border-legal-gold/15 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans border-collapse">
                    <thead>
                      <tr className="bg-brand-100/50 dark:bg-legal-navy/60 border-b border-legal-gold/10 text-legal-navy dark:text-brand-200 font-bold uppercase tracking-wider">
                        <th className="p-4">Profile Name</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4">System Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-legal-gold/10">
                      {filteredProfiles.map(profile => (
                        <tr
                          key={profile.id}
                          className={`hover:bg-brand-50/30 dark:hover:bg-legal-navy/20 transition-colors
                            ${profile.is_blocked ? 'bg-red-500/[0.01]' : ''}`}
                        >
                          <td className="p-4 font-bold text-legal-navy dark:text-brand-50 flex items-center gap-2">
                            <div className="h-7 w-7 rounded-xl bg-legal-gold/10 border border-legal-gold/30 flex items-center justify-center text-legal-gold font-serif font-bold">
                              {profile.full_name.charAt(0)}
                            </div>
                            {profile.full_name}
                          </td>
                          <td className="p-4 text-legal-navy/70 dark:text-brand-200/70 font-medium">{profile.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                              ${profile.role === 'admin' 
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                              {profile.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                              ${profile.is_blocked 
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                              {profile.is_blocked ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {profile.role === 'admin' ? (
                              <span className="text-[10px] text-legal-navy/30 dark:text-brand-300/30 italic font-semibold">Protected</span>
                            ) : (
                              <button
                                onClick={() => handleToggleBlockUser(profile.id, !!profile.is_blocked)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all
                                  ${profile.is_blocked
                                    ? 'bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20'
                                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20'}`}
                              >
                                {profile.is_blocked ? <Unlock className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                                <span>{profile.is_blocked ? 'Unblock' : 'Block User'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── COMMENTS MODERATION MODAL / DRAWER ─────────────────────── */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#0c1827] border-2 border-legal-gold/25 rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-legal-navy to-legal-navy/90 dark:from-[#0d1a2a] dark:to-[#0f2139] p-5 text-white border-b border-legal-gold/20 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-legal-gold/20 rounded-xl">
                  <MessageSquare className="h-5 w-5 text-legal-gold" />
                </div>
                <div>
                  <h2 className="font-serif text-base font-bold tracking-tight text-white">Moderate Comments</h2>
                  <p className="text-[10px] text-brand-200/60 font-sans uppercase tracking-wider">Comments list for the thread</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-white/60 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-all cursor-pointer font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Post Context Info */}
            <div className="bg-brand-50/50 dark:bg-legal-navy/30 p-4 border-b border-legal-gold/10 space-y-1">
              <span className="text-[9px] font-bold text-legal-gold uppercase tracking-wider">Discussion Context</span>
              <h4 className="font-serif text-sm font-bold text-legal-navy dark:text-brand-50 truncate">{selectedPost.title}</h4>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingComments ? (
                <div className="flex py-10 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-legal-gold" />
                </div>
              ) : postComments.length === 0 ? (
                <div className="text-center py-12 space-y-2 text-legal-navy/40 dark:text-brand-300/40">
                  <MessageSquare className="h-8 w-8 mx-auto text-legal-gold/30" />
                  <p className="text-xs font-semibold">No comments posted under this thread yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {postComments.map(comment => (
                    <div
                      key={comment.id}
                      className="bg-brand-50/30 dark:bg-legal-navy/20 p-3.5 rounded-2xl border border-legal-gold/10 flex gap-4 items-start justify-between"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-legal-gold">
                          <span>{comment.author_name}</span>
                          <span className="text-legal-navy/40 dark:text-brand-300/40 font-medium font-sans">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-legal-navy/85 dark:text-brand-200/85 font-sans leading-relaxed">{comment.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all cursor-pointer border border-red-500/20"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-brand-50/40 dark:bg-legal-navy/30 p-4 border-t border-legal-gold/15 flex justify-end">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 bg-legal-navy dark:bg-legal-gold hover:opacity-95 text-white dark:text-legal-navy-dark font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all"
              >
                Close Editor
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
