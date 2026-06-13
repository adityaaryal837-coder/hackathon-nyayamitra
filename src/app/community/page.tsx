'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { dbService, FeedPost, PostComment } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import {
  Users, MessageSquare, Plus, Clock, ChevronUp, ChevronDown,
  Send, AlertTriangle, CheckCircle, Search, Filter, Loader2,
  Share2, Bookmark, Image as ImageIcon, Camera, Trash2, X,
  UserCheck, Flame, FolderOpen, ShieldAlert, Sparkles, LogIn,
  ThumbsUp, ThumbsDown
} from 'lucide-react';

export default function CommunityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State variables
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // Category filter
  const [activeNav, setActiveNav] = useState('all_discussions'); // 'all_discussions' | 'trending_today' | 'my_saved_posts'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'Latest' | 'Most Voted' | 'Trending'>('Latest');

  // Comments mapping (postId -> list of comments)
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Bookmarks & local votes
  const [userVotes, setUserVotes] = useState<Record<string, 'agree' | 'disagree' | null>>({});
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Modal creation states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('General Discussion');
  const [postContent, setPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
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

  // Sync state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedVotes = localStorage.getItem('nyaya_mitra_user_votes');
      if (storedVotes) {
        try { setUserVotes(JSON.parse(storedVotes)); } catch (e) { console.error(e); }
      }
      const storedSaved = localStorage.getItem('nyaya_mitra_saved_posts');
      if (storedSaved) {
        try { setSavedPosts(JSON.parse(storedSaved)); } catch (e) { console.error(e); }
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadFeed();
  }, [user, authLoading, router]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const feedPosts = await dbService.getFeedPosts(false);
      setPosts(feedPosts);

      // Preload comments counts for all posts
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

  // Client-side image compression helper
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75); // 75% quality JPEG
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    // Max 4 images limit
    if (selectedImages.length + files.length > 4) {
      setErrorMsg('You can attach up to 4 images per post.');
      return;
    }

    try {
      const promises = files.map(file => compressImage(file));
      const compressedBase64 = await Promise.all(promises);
      setSelectedImages(prev => [...prev, ...compressedBase64]);
      setErrorMsg('');
    } catch (err) {
      console.error('Error resizing files:', err);
      setErrorMsg('Failed to process image files.');
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, idx) => idx !== index));
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

      let author = user?.full_name || 'Anonymous Member';
      let anonId = '';

      if (isAnonymous) {
        // Generate a unique short code for this post identity
        anonId = Math.random().toString(36).substring(2, 6).toUpperCase();
        author = `Anonymous #${anonId}`;
      }

      await dbService.createFeedPost(
        postTitle.trim(),
        postContent.trim(),
        author,
        postCategory,
        isAnonymous,
        anonId,
        selectedImages
      );

      setSuccessMsg('Your thread has been posted successfully!');
      setPostTitle('');
      setPostContent('');
      setSelectedImages([]);
      setIsAnonymous(false);

      await loadFeed();
      setTimeout(() => {
        setSuccessMsg('');
        setIsModalOpen(false);
      }, 1200);
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

    const newUserVotes = { ...userVotes, [postId]: nextVote };
    setUserVotes(newUserVotes);
    localStorage.setItem('nyaya_mitra_user_votes', JSON.stringify(newUserVotes));

    // Optimistic state update
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

  const toggleSavePost = (postId: string) => {
    const nextSaved = savedPosts.includes(postId)
      ? savedPosts.filter(id => id !== postId)
      : [...savedPosts, postId];
    setSavedPosts(nextSaved);
    localStorage.setItem('nyaya_mitra_saved_posts', JSON.stringify(nextSaved));
  };

  const triggerShare = (postId: string) => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/community#post-${postId}`;
      navigator.clipboard.writeText(shareUrl);
      setShareToast(postId);
      setTimeout(() => setShareToast(null), 2000);
    }
  };

  const toggleComments = async (postId: string) => {
    const isExpanded = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanded }));

    if (isExpanded) {
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

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete your post? This cannot be undone.')) return;
    try {
      await dbService.deleteFeedPost(postId);
      // Remove locally from state
      setPosts(prev => prev.filter(p => p.id !== postId));
      setCommentsMap(prev => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    } catch (e) {
      console.error('Failed to delete post:', e);
    }
  };

  // Sort and Filter Logic
  const processedPosts = React.useMemo(() => {
    let result = [...posts];

    // Navigation Filter
    if (activeNav === 'trending_today') {
      // Sort by likes descending
      result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (activeNav === 'my_saved_posts') {
      // Only bookmarked
      result = result.filter(post => savedPosts.includes(post.id));
    }

    // Category Selector
    if (activeTab !== 'All') {
      result = result.filter(post => post.category === activeTab);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(post =>
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.author_name.toLowerCase().includes(q)
      );
    }

    // Sorting (if not on trending tab which enforces vote sort)
    if (activeNav !== 'trending_today') {
      if (sortBy === 'Latest') {
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sortBy === 'Most Voted') {
        result.sort((a, b) => ((b.likes || 0) - (b.disagree_votes || 0)) - ((a.likes || 0) - (a.disagree_votes || 0)));
      } else if (sortBy === 'Trending') {
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      }
    }

    return result;
  }, [posts, activeTab, activeNav, searchQuery, sortBy, savedPosts]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#EAF6FF] text-[#0B192C]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#D4AF37]" />
          <p className="text-xs font-semibold tracking-wider font-sans uppercase">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#EAF6FF] text-[#0B192C] transition-colors duration-300">
      <Sidebar />

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:p-8 space-y-6 scroll-smooth">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#D4AF37]/25">
          <div>
            <h1 className="font-serif text-3xl font-extrabold text-[#0B192C] flex items-center gap-3">
              <Users className="h-8 w-8 text-[#D4AF37]" />
              Community Forum
            </h1>
            <p className="text-xs font-sans text-[#0B192C]/70 mt-1">
              Crowdsource opinions, explore constitutional provisions, and raise civil discussions.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0B192C] hover:bg-[#0B192C]/90 text-white transition-all shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Create Post
          </button>
        </div>

        {/* Search Bar & Categories Navigation */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-[#D4AF37]/15 shadow-sm">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0B192C]/40" />
            <input
              type="text"
              placeholder="Search community..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D4AF37]/20 bg-[#EAF6FF]/20 text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/35 text-[#0B192C]"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider mr-2">
              <Filter className="h-3.5 w-3.5" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all
                  ${activeTab === cat
                    ? 'bg-[#0B192C] text-white'
                    : 'bg-[#EAF6FF]/40 text-[#0B192C]/80 hover:bg-[#DCEFFF] border border-[#DCEFFF]'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN: NAVIGATION & CATEGORIES */}
          <div className="lg:col-span-3 hidden lg:block space-y-5">

            {/* NAVIGATION PANEL */}
            <div className="bg-white rounded-2xl border border-[#D4AF37]/15 p-4 space-y-4 shadow-sm">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#0B192C]/40 border-b border-[#EAF6FF] pb-2">
                Navigation
              </h3>
              <nav className="flex flex-col gap-1.5">
                <button
                  onClick={() => { setActiveNav('all_discussions'); setActiveTab('All'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all
                    ${activeNav === 'all_discussions'
                      ? 'bg-[#0B192C]/10 text-[#0B192C] border-l-4 border-[#0B192C]'
                      : 'text-[#0B192C]/70 hover:bg-[#EAF6FF]/40 hover:text-[#0B192C]'}`}
                >
                  <Users className="h-4 w-4" />
                  <span>All Discussions</span>
                </button>
                <button
                  onClick={() => setActiveNav('trending_today')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all
                    ${activeNav === 'trending_today'
                      ? 'bg-[#0B192C]/10 text-[#0B192C] border-l-4 border-[#0B192C]'
                      : 'text-[#0B192C]/70 hover:bg-[#EAF6FF]/40 hover:text-[#0B192C]'}`}
                >
                  <Flame className="h-4 w-4" />
                  <span>Trending Today</span>
                </button>
                <button
                  onClick={() => setActiveNav('my_saved_posts')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all
                    ${activeNav === 'my_saved_posts'
                      ? 'bg-[#0B192C]/10 text-[#0B192C] border-l-4 border-[#0B192C]'
                      : 'text-[#0B192C]/70 hover:bg-[#EAF6FF]/40 hover:text-[#0B192C]'}`}
                >
                  <Bookmark className="h-4 w-4" />
                  <span>My Saved Posts</span>
                </button>
              </nav>
            </div>

            {/* TOP CATEGORIES PANEL */}
            <div className="bg-white rounded-2xl border border-[#D4AF37]/15 p-4 space-y-3 shadow-sm">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#0B192C]/40 border-b border-[#EAF6FF] pb-2">
                Top Categories
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {categories.slice(1).map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setActiveTab(cat); setActiveNav('all_discussions'); }}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors
                      ${activeTab === cat
                        ? 'bg-[#0B192C] text-white'
                        : 'bg-[#EAF6FF] text-[#0B192C] hover:bg-[#DCEFFF]'}`}
                  >
                    #{cat.replace(/\s+/g, '')}
                  </button>
                ))}
              </div>
            </div>

            {/* NEED HELP WIDGET */}
            <div className="bg-gradient-to-br from-[#0B192C] to-[#0D2140] rounded-2xl border border-[#D4AF37]/25 p-5 text-white space-y-4 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
              <Sparkles className="h-6 w-6 text-[#D4AF37]" />
              <div>
                <h4 className="font-serif text-sm font-bold tracking-wide">Need Professional Help?</h4>
                <p className="text-[10px] text-[#EAF6FF]/70 mt-1 leading-normal">
                  Connect with verified legal experts in Nepal directly for your legal challenges.
                </p>
              </div>
              <button
                onClick={() => router.push('/lawyers')}
                className="w-full py-2 px-4 bg-[#D4AF37] hover:bg-[#D4AF37]/90 transition-colors text-[#0B192C] text-[10px] uppercase font-bold tracking-wider rounded-xl shadow"
              >
                Find Experts
              </button>
            </div>
          </div>

          {/* MIDDLE COLUMN: MAIN FEED */}
          <div className="lg:col-span-6 space-y-4">

            {/* Sorting Tabs & Create trigger */}
            <div className="flex justify-between items-center bg-white border border-[#D4AF37]/10 p-2.5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-[#0B192C]/60 px-2 uppercase">Sort by:</span>
                {(['Latest', 'Most Voted', 'Trending'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSortBy(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${sortBy === tab
                        ? 'bg-[#EAF6FF] text-[#0B192C] font-bold'
                        : 'text-[#0B192C]/70 hover:bg-[#EAF6FF]/20'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts Feed */}
            {loading ? (
              <div className="flex py-20 items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#D4AF37]" />
                  <p className="text-xs uppercase tracking-widest font-sans font-bold text-[#0B192C]/60">Retrieving posts...</p>
                </div>
              </div>
            ) : processedPosts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#D4AF37]/15 py-16 text-center space-y-4 max-w-lg mx-auto shadow-sm">
                <Users className="h-12 w-12 text-[#D4AF37]/30 mx-auto" />
                <h3 className="text-lg font-bold text-[#0B192C]">No Threads Found</h3>
                <p className="text-xs text-[#0B192C]/70 px-6">
                  Be the first to raise a question or discuss civil and fundamental liberties!
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex px-5 py-2.5 bg-[#0B192C] text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Start a Thread
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {processedPosts.map((post) => {
                  const comments = commentsMap[post.id] || [];
                  const isExpanded = expandedComments[post.id] || false;

                  return (
                    <div
                      key={post.id}
                      id={`post-${post.id}`}
                      className="bg-white p-4 md:p-5 rounded-2xl border border-[#D4AF37]/15 hover:border-[#D4AF37]/35 transition-all shadow-sm flex items-start gap-4 relative overflow-hidden"
                    >
                      {/* VOTE COMPONENT (Left Side) */}
                      <div className="flex flex-col gap-2.5 items-center bg-[#EAF6FF]/35 p-2 rounded-2xl border border-[#DCEFFF] w-[72px] shrink-0 select-none font-sans">
                        <button
                          onClick={() => handleVote(post.id, 'agree')}
                          className={`w-full flex flex-col items-center py-2 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 border
                            ${userVotes[post.id] === 'agree' 
                              ? 'bg-green-600 border-green-600 text-white font-bold shadow-sm' 
                              : 'bg-white hover:bg-green-50 border-[#DCEFFF] text-green-600'}`}
                          title="Agree with this post"
                        >
                          <ThumbsUp className="h-4 w-4 stroke-[2.5]" />
                          <span className="text-[9px] font-bold mt-1 uppercase tracking-wide">Agree</span>
                          <span className="text-xs font-black mt-0.5">{post.likes || 0}</span>
                        </button>

                        <div className="w-8 border-t border-[#DCEFFF]/60"></div>

                        <button
                          onClick={() => handleVote(post.id, 'disagree')}
                          className={`w-full flex flex-col items-center py-2 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 border
                            ${userVotes[post.id] === 'disagree' 
                              ? 'bg-red-500 border-red-500 text-white font-bold shadow-sm' 
                              : 'bg-white hover:bg-red-50 border-[#DCEFFF] text-red-500'}`}
                          title="Disagree with this post"
                        >
                          <ThumbsDown className="h-4 w-4 stroke-[2.5]" />
                          <span className="text-[9px] font-bold mt-1 uppercase tracking-wide">Disagree</span>
                          <span className="text-xs font-black mt-0.5">{post.disagree_votes || 0}</span>
                        </button>
                      </div>

                      {/* CONTENT PANEL (Right Side) */}
                      <div className="flex-1 space-y-3 min-w-0">

                        {/* Author Header */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold font-serif text-[11px] border shadow-sm
                              ${post.anonymous
                                ? 'bg-gray-100 text-gray-500 border-gray-200'
                                : 'bg-[#EAF6FF] text-[#0B192C] border-[#D4AF37]/30'}`}>
                              {post.anonymous ? 'A' : post.author_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-[#0B192C] hover:underline cursor-pointer">
                                {post.author_name}
                              </span>
                              {post.anonymous && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-widest leading-none scale-95 origin-left">
                                  Anonymous
                                </span>
                              )}
                              <span className="text-[10px] text-[#0B192C]/40">
                                • {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Share Toast notifier */}
                            {shareToast === post.id && (
                              <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md animate-fade-in">
                                Link copied!
                              </span>
                            )}

                            {/* Delete button — only visible to the post's author */}
                            {!post.anonymous && user?.full_name === post.author_name && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                title="Delete your post"
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors active:scale-95"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-serif text-[17px] font-bold text-[#0B192C] leading-snug hover:text-[#0B192C]/80 cursor-pointer">
                          {post.title}
                        </h3>

                        {/* Content text */}
                        <p className="text-xs text-[#0B192C]/85 leading-relaxed font-sans whitespace-pre-wrap break-words">
                          {post.content}
                        </p>

                        {/* Image grid (if images present) */}
                        {post.images && post.images.length > 0 && (
                          <div className={`grid gap-2 overflow-hidden rounded-xl mt-3 border border-gray-100
                            ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {post.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Post attachment ${idx + 1}`}
                                className="w-full max-h-72 object-cover bg-gray-50 transition-transform hover:scale-101 duration-300"
                              />
                            ))}
                          </div>
                        )}

                        {/* Bottom Tags and Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D4AF37]/10 mt-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#EAF6FF] px-2 py-1 rounded-md border border-[#DCEFFF]">
                            #{post.category.replace(/\s+/g, '')}
                          </span>

                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#0B192C]/65">
                            <button
                              onClick={() => toggleComments(post.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-[#EAF6FF]/40
                                ${isExpanded ? 'text-[#D4AF37] bg-[#EAF6FF]/30' : ''}`}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{comments.length} Comments</span>
                            </button>

                            <button
                              onClick={() => triggerShare(post.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#EAF6FF]/40 transition-colors"
                              title="Copy post link"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Share</span>
                            </button>

                            <button
                              onClick={() => toggleSavePost(post.id)}
                              className={`p-1.5 rounded-lg transition-colors hover:bg-[#EAF6FF]/40
                                ${savedPosts.includes(post.id) ? 'text-[#D4AF37]' : ''}`}
                              title={savedPosts.includes(post.id) ? 'Saved' : 'Save'}
                            >
                              <Bookmark className="h-4 w-4" fill={savedPosts.includes(post.id) ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>

                        {/* COMMENTS TOGGLED EXPANDED */}
                        {isExpanded && (
                          <div className="mt-4 border-t border-gray-100 pt-4 space-y-3 animate-fade-in">
                            <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider">Comments</h4>

                            {comments.length === 0 ? (
                              <p className="text-[10px] text-[#0B192C]/50 italic py-1 pl-2">
                                No comments posted yet. Start the discussion!
                              </p>
                            ) : (
                              <div className="space-y-2.5 pl-3 border-l-2 border-[#DCEFFF]">
                                {comments.map((comm) => (
                                  <div key={comm.id} className="bg-[#EAF6FF]/20 p-2.5 rounded-xl border border-gray-100 space-y-0.5">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-[#D4AF37]">
                                      <span>{comm.author_name}</span>
                                      <span className="text-[#0B192C]/40">
                                        {new Date(comm.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#0B192C]/85 font-sans leading-relaxed">
                                      {comm.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Comment Box */}
                            <div className="flex items-center gap-2 pt-2">
                              <input
                                type="text"
                                placeholder="Type a comment..."
                                value={newComments[post.id] || ''}
                                onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddComment(post.id);
                                }}
                                className="flex-1 px-3 py-2 rounded-xl border border-[#DCEFFF] bg-[#EAF6FF]/10 text-xs text-[#0B192C] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/25"
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={submittingComment[post.id]}
                                className="p-2 rounded-xl bg-[#0B192C] text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                              >
                                {submittingComment[post.id] ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Send className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: WIDGETS */}
          <div className="lg:col-span-3 hidden lg:block space-y-5">

            {/* STATS PANEL */}
            <div className="bg-white rounded-2xl border border-[#D4AF37]/15 p-4 space-y-4 shadow-sm">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#0B192C]/40 border-b border-[#EAF6FF] pb-2">
                Community Stats
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-[#EAF6FF]/30 p-2.5 rounded-xl border border-[#DCEFFF]">
                  <span className="block text-lg font-black text-[#0B192C]">12.5k</span>
                  <span className="text-[9px] font-bold text-[#0B192C]/50 uppercase tracking-wide">Members</span>
                </div>
                <div className="bg-green-50 p-2.5 rounded-xl border border-green-100">
                  <span className="block text-lg font-black text-green-600">840</span>
                  <span className="text-[9px] font-bold text-green-600/70 uppercase tracking-wide">Online</span>
                </div>
              </div>
            </div>

            {/* FORUM RULES PANEL */}
            <div className="bg-white rounded-2xl border border-[#D4AF37]/15 p-4 space-y-3 shadow-sm">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#0B192C]/40 border-b border-[#EAF6FF] pb-2">
                Forum Rules
              </h3>
              <ol className="text-[11px] space-y-2 text-[#0B192C]/80 font-medium pl-1">
                <li className="flex gap-2">
                  <span className="font-bold text-[#D4AF37]">1.</span>
                  <span>Be respectful and supportive to other members.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-[#D4AF37]">2.</span>
                  <span>No direct solicitation of illegal legal services.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-[#D4AF37]">3.</span>
                  <span>Cite relevant legal sources when citing rules or laws.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-[#D4AF37]">4.</span>
                  <span>Keep topics legal and relevant to Nepali context.</span>
                </li>
              </ol>
            </div>

            {/* TOP CONTRIBUTORS PANEL */}
            <div className="bg-white rounded-2xl border border-[#D4AF37]/15 p-4 space-y-3.5 shadow-sm">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#0B192C]/40 border-b border-[#EAF6FF] pb-2">
                Top Contributors
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#EAF6FF] border border-[#D4AF37]/30 flex items-center justify-center font-bold text-xs text-[#0B192C]">
                    RC
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-[#0B192C] truncate">Dr. R. Pokharel</span>
                    <span className="block text-[8px] text-[#0B192C]/50 uppercase font-semibold">Constitutional Law</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#D4AF37] bg-[#EAF6FF] px-2 py-0.5 rounded border border-[#DCEFFF]">
                    ★ 4.9
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#EAF6FF] border border-[#D4AF37]/30 flex items-center justify-center font-bold text-xs text-[#0B192C]">
                    SS
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-[#0B192C] truncate">Adv. Shreya Sharma</span>
                    <span className="block text-[8px] text-[#0B192C]/50 uppercase font-semibold">Fundamental Rights</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#D4AF37] bg-[#EAF6FF] px-2 py-0.5 rounded border border-[#DCEFFF]">
                    ★ 4.8
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* CREATE POST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0B192C]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#D4AF37]/30 rounded-3xl max-w-xl w-full p-6 space-y-5 relative shadow-2xl overflow-y-auto max-h-[90vh]">

            <div className="flex justify-between items-center border-b border-[#EAF6FF] pb-3">
              <h2 className="font-serif text-xl font-extrabold text-[#0B192C] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#D4AF37]" />
                Publish Thread
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setPostTitle('');
                  setPostContent('');
                  setSelectedImages([]);
                  setIsAnonymous(false);
                  setErrorMsg('');
                }}
                className="text-[#0B192C]/40 hover:text-[#0B192C] text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 p-3.5 bg-green-50 border border-green-200 text-green-600 rounded-xl text-xs font-bold">
                <CheckCircle className="h-4 w-4" />
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 text-red-500 rounded-xl text-xs font-bold">
                <AlertTriangle className="h-4 w-4" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4">

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest block">Thread Title</label>
                <input
                  type="text"
                  placeholder="e.g., Procedure for filing writ petitions under Article 133"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DCEFFF] bg-[#EAF6FF]/10 text-xs text-[#0B192C] focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              {/* Grid (Category & Anonymous Toggle) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest block">Forum Category</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DCEFFF] bg-[#EAF6FF]/10 text-xs text-[#0B192C] focus:outline-none focus:border-[#D4AF37]"
                  >
                    {categories.slice(1).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest block">Privacy Options</label>
                  <div className="flex items-center h-10 px-3 bg-[#EAF6FF]/10 rounded-xl border border-[#DCEFFF]">
                    <label className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-[#0B192C]/80">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded border-[#D4AF37]/35 text-[#0B192C] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span>Post Anonymously</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Content Textarea */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest block">Discussion Details</label>
                <textarea
                  rows={4}
                  placeholder="Elaborate on your question or information. Include code sections, constitutional articles, or context if possible..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DCEFFF] bg-[#EAF6FF]/10 text-xs text-[#0B192C] focus:outline-none focus:border-[#D4AF37] resize-none"
                  required
                />
              </div>

              {/* Photo Upload area */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest block">Stitch Photos (Max 4)</label>

                {/* Previews */}
                {selectedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 p-2 bg-[#EAF6FF]/20 rounded-xl border border-[#DCEFFF]">
                    {selectedImages.map((img, index) => (
                      <div key={index} className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-200">
                        <img src={img} alt="Thumbnail preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSelectedImage(index)}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button Trigger */}
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 px-4 py-2 bg-[#EAF6FF] hover:bg-[#DCEFFF] text-[#0B192C] text-[11px] font-bold uppercase tracking-wider rounded-xl border border-[#DCEFFF] cursor-pointer shadow-sm active:scale-98 transition-transform">
                    <Camera className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span>Attach Photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[9px] text-[#0B192C]/50 flex items-center font-medium">
                    (Resizes and compresses automatically for fast upload)
                  </span>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAF6FF] mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setPostTitle('');
                    setPostContent('');
                    setSelectedImages([]);
                    setIsAnonymous(false);
                    setErrorMsg('');
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-gray-200 text-[#0B192C]/60 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPost}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#0B192C] hover:opacity-90 text-white transition-all shadow disabled:opacity-50"
                >
                  {isCreatingPost ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Post'
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
