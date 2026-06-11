'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { dbService, FeedPost, PostComment } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { 
  Users, MessageSquare, Plus, Clock, ThumbsUp, ThumbsDown, 
  Send, AlertTriangle, CheckCircle, Search, Filter, Loader2 
} from 'lucide-react';

export default function CommunityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // State variables
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Comments mapping (postId -> list of comments)
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  
  // User votes registry: [postId]: 'agree' | 'disagree' | null
  const [userVotes, setUserVotes] = useState<Record<string, 'agree' | 'disagree' | null>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nyaya_mitra_user_votes');
      if (stored) {
        try {
          setUserVotes(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);
  
  // Post modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('General Discussion');
  const [postContent, setPostContent] = useState('');
  const [postAuthor, setPostAuthor] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Categories definition
  const categories = [
    'All', 
    'Constitutional Remedies', 
    'Fundamental Rights', 
    'Civil Rights', 
    'Criminal Justice', 
    'General Discussion'
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setPostAuthor(user.full_name || 'Anonymous Member');
    loadFeed();
  }, [user, authLoading, router]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const feedPosts = await dbService.getFeedPosts(false);
      setPosts(feedPosts);
      
      // Auto-load comments count or preload comments for all posts
      const initialComments: Record<string, PostComment[]> = {};
      for (const post of feedPosts) {
        const comments = await dbService.getPostComments(post.id);
        initialComments[post.id] = comments;
      }
      setCommentsMap(initialComments);
    } catch (e) {
      console.error('Error loading feed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      setErrorMsg('Please fill out all fields.');
      return;
    }

    try {
      setIsCreatingPost(true);
      setErrorMsg('');
      const author = postAuthor.trim() || 'Anonymous Member';
      await dbService.createFeedPost(postTitle, postContent, author, postCategory);
      setSuccessMsg('Your post has been published to the community board!');
      setPostTitle('');
      setPostContent('');
      
      // Reload feed and close modal
      await loadFeed();
      setTimeout(() => {
        setSuccessMsg('');
        setIsModalOpen(false);
      }, 1500);
    } catch (err) {
      setErrorMsg('Failed to publish post. Please try again.');
      console.error(err);
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleVote = async (postId: string, voteType: 'agree' | 'disagree') => {
    const currentVote = userVotes[postId] || null;
    let likesDiff = 0;
    let disagreeDiff = 0;
    let nextVote: 'agree' | 'disagree' | null = null;

    if (currentVote === voteType) {
      // Undo vote
      if (voteType === 'agree') likesDiff = -1;
      else disagreeDiff = -1;
      nextVote = null;
    } else {
      // Cast new vote or switch vote
      if (voteType === 'agree') {
        likesDiff = 1;
        if (currentVote === 'disagree') disagreeDiff = -1;
      } else {
        disagreeDiff = 1;
        if (currentVote === 'agree') likesDiff = -1;
      }
      nextVote = voteType;
    }

    // Save vote status locally
    const newUserVotes = { ...userVotes, [postId]: nextVote };
    setUserVotes(newUserVotes);
    localStorage.setItem('nyaya_mitra_user_votes', JSON.stringify(newUserVotes));

    // Optimistic UI update
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: Math.max(0, post.likes + likesDiff),
            disagree_votes: Math.max(0, post.disagree_votes + disagreeDiff)
          };
        }
        return post;
      })
    );

    try {
      await dbService.adjustFeedPostVotes(postId, likesDiff, disagreeDiff);
    } catch (e) {
      console.error('Error saving vote:', e);
    }
  };

  const toggleComments = async (postId: string) => {
    const isExpanded = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanded }));
    
    if (isExpanded) {
      // Reload comments for this specific post
      try {
        const comments = await dbService.getPostComments(postId);
        setCommentsMap(prev => ({ ...prev, [postId]: comments }));
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = newComments[postId] || '';
    if (!text.trim()) return;

    try {
      setSubmittingComment(prev => ({ ...prev, [postId]: true }));
      const author = user?.full_name || 'Anonymous Contributor';
      const comment = await dbService.createPostComment(postId, author, text);
      
      // Update local state
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment]
      }));
      setNewComments(prev => ({ ...prev, [postId]: '' }));
    } catch (e) {
      console.error('Error adding comment:', e);
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeTab === 'All' || post.category === activeTab;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-legal-bone-light dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <Clock className="h-10 w-10 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-legal-gold/15 pb-6">
          <div>
            <h1 className="font-serif text-3xl font-extrabold text-legal-navy dark:text-legal-bone-light flex items-center gap-3">
              <Users className="h-8 w-8 text-legal-gold" />
              Community Forum
            </h1>
            <p className="text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60 mt-1">
              Discuss constitutional provisions, raise questions, and crowdsource community insights on legal remedies.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-gold-glow hover:scale-102 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create New Post
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-legal-navy-dark/10 dark:bg-legal-navy-dark/40 p-4 rounded-2xl border border-legal-gold/10">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-navy/40 dark:text-legal-bone/40" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/15 bg-legal-bone-light dark:bg-legal-navy/20 text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone-light"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="flex items-center gap-1 text-[11px] font-bold text-legal-gold uppercase tracking-wider mr-2">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer
                  ${activeTab === cat 
                    ? 'bg-legal-gold text-legal-navy-dark shadow-md' 
                    : 'bg-legal-gold/10 text-legal-gold border border-legal-gold/20 hover:bg-legal-gold/25'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Feed Posts */}
        {loading ? (
          <div className="flex py-20 items-center justify-center text-legal-gold">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-legal-gold" />
              <p className="text-xs uppercase tracking-widest font-sans font-bold">Retrieving posts...</p>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="glass-panel-light dark:glass-panel-dark rounded-2xl border border-legal-gold/15 py-20 text-center space-y-4 max-w-lg mx-auto">
            <Users className="h-12 w-12 text-legal-gold/30 mx-auto" />
            <h3 className="text-lg font-bold text-legal-navy dark:text-legal-bone-light">No Posts Found</h3>
            <p className="text-xs text-legal-navy/60 dark:text-legal-bone/60 px-6">
              Be the first to start a conversation! Ask a question or share knowledge about Nepal's legal structure.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex px-5 py-2.5 bg-legal-navy dark:bg-legal-bone text-legal-bone-light dark:text-legal-navy rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Start a Thread
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => {
              const comments = commentsMap[post.id] || [];
              const isExpanded = expandedComments[post.id] || false;
              
              return (
                <div 
                  key={post.id} 
                  className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 hover:border-legal-gold/25 transition-all shadow-glass relative overflow-hidden"
                >
                  {/* Category Badge & Date */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans uppercase tracking-wider bg-legal-gold/15 text-legal-gold border border-legal-gold/20">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-legal-navy/50 dark:text-legal-bone/50 font-semibold">
                      <Clock className="h-3.5 w-3.5 text-legal-gold" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <h3 className="font-serif text-xl font-extrabold text-legal-navy dark:text-legal-bone-light mb-2">
                    {post.title}
                  </h3>
                  <p className="text-[11px] font-sans text-legal-gold font-bold mb-4">
                    Posted by: <span className="text-legal-navy/70 dark:text-legal-bone/70 font-semibold">{post.author_name}</span>
                  </p>

                  {/* Content */}
                  <p className="text-xs text-legal-navy/80 dark:text-legal-bone/80 leading-relaxed font-sans mb-6 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Action Bar (Voting & Comments Count) */}
                  <div className="flex items-center justify-between border-t border-legal-gold/10 pt-4 mt-4">
                    {/* Voting Agreement */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleVote(post.id, 'agree')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider cursor-pointer border
                          ${userVotes[post.id] === 'agree' 
                            ? 'bg-green-500 text-white border-green-500' 
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20'}`}
                        title="I agree with this post"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>Agree ({post.likes || 0})</span>
                      </button>

                      <button
                        onClick={() => handleVote(post.id, 'disagree')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider cursor-pointer border
                          ${userVotes[post.id] === 'disagree' 
                            ? 'bg-red-500 text-white border-red-500' 
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20'}`}
                        title="I disagree with this post"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        <span>Disagree ({post.disagree_votes || 0})</span>
                      </button>
                    </div>

                    {/* Comments Toggle */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer
                        ${isExpanded 
                          ? 'bg-legal-gold text-legal-navy-dark border-legal-gold' 
                          : 'bg-legal-gold/10 text-legal-gold border-legal-gold/25 hover:bg-legal-gold/20'}`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Comments ({comments.length})</span>
                    </button>
                  </div>

                  {/* Expanded Comments Section */}
                  {isExpanded && (
                    <div className="mt-6 border-t border-legal-gold/10 pt-6 space-y-4 animate-fade-in">
                      <h4 className="text-xs font-bold text-legal-gold font-sans uppercase tracking-wider">Comments</h4>
                      
                      {comments.length === 0 ? (
                        <p className="text-[11px] text-legal-navy/40 dark:text-legal-bone/40 py-2 italic">
                          No comments yet. Share your legal perspective!
                        </p>
                      ) : (
                        <div className="space-y-3 pl-3 border-l-2 border-legal-gold/20">
                          {comments.map((comm) => (
                            <div key={comm.id} className="bg-legal-navy-dark/10 dark:bg-legal-navy/10 p-3 rounded-xl border border-legal-gold/5 space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-sans font-bold text-legal-gold">
                                <span>{comm.author_name}</span>
                                <span className="font-semibold text-legal-navy/40 dark:text-legal-bone/40">
                                  {new Date(comm.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs font-sans text-legal-navy/80 dark:text-legal-bone/80 leading-relaxed">
                                {comm.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Input */}
                      <div className="flex items-center gap-2 mt-4">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={newComments[post.id] || ''}
                          onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-legal-gold/15 bg-legal-bone-light dark:bg-legal-navy/20 text-xs text-legal-navy dark:text-legal-bone-light focus:outline-none focus:border-legal-gold"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={submittingComment[post.id]}
                          className="p-2.5 rounded-xl bg-legal-gold text-legal-navy-dark hover:scale-102 transition-transform disabled:opacity-50 cursor-pointer"
                        >
                          {submittingComment[post.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CREATE POST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-legal-bone-light dark:bg-legal-navy-dark border border-legal-gold/30 rounded-2xl max-w-xl w-full p-6 md:p-8 space-y-6 relative shadow-2xl">
            <div className="flex justify-between items-center border-b border-legal-gold/10 pb-4">
              <h2 className="font-serif text-2xl font-extrabold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                <Users className="h-6 w-6 text-legal-gold" />
                Publish Thread
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-legal-navy/40 dark:text-legal-bone/40 hover:text-legal-gold text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-xs font-semibold">
                <CheckCircle className="h-4 w-4" />
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
                <AlertTriangle className="h-4 w-4" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-legal-gold uppercase tracking-wider">Post Title</label>
                <input
                  type="text"
                  placeholder="e.g., Understanding Habeas Corpus remedies in Nepal"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-legal-gold/15 bg-legal-bone-light dark:bg-legal-navy/20 text-sm text-legal-navy dark:text-legal-bone-light focus:outline-none focus:border-legal-gold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-legal-gold uppercase tracking-wider">Category</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-legal-gold/15 bg-legal-bone-light dark:bg-legal-navy/20 text-sm text-legal-navy dark:text-legal-bone-light focus:outline-none focus:border-legal-gold"
                  >
                    {categories.slice(1).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-legal-gold uppercase tracking-wider">Author Identity</label>
                  <input
                    type="text"
                    value={postAuthor}
                    onChange={(e) => setPostAuthor(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-legal-gold/15 bg-legal-bone-light dark:bg-legal-navy/20 text-sm text-legal-navy dark:text-legal-bone-light focus:outline-none focus:border-legal-gold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-legal-gold uppercase tracking-wider">Content</label>
                <textarea
                  rows={5}
                  placeholder="Describe your legal issue, question or information detail. Provide links or article numbers if possible."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-legal-gold/15 bg-legal-bone-light dark:bg-legal-navy/20 text-sm text-legal-navy dark:text-legal-bone-light focus:outline-none focus:border-legal-gold resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-legal-gold/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-legal-gold/20 text-legal-gold hover:bg-legal-gold/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPost}
                  className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-gold-glow hover:scale-102 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingPost ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Thread'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
