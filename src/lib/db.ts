import { createClient } from '@supabase/supabase-js';

// Types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  is_blocked?: boolean;
  created_at: string;
}

export interface Case {
  id: string;
  user_id: string | null; // null for anonymous
  title: string;
  description: string;
  category: string;
  anonymous: boolean;
  status: 'Submitted' | 'Under Review' | 'Evidence Review' | 'Assigned' | 'Resolved';
  urgency: 'Low' | 'Medium' | 'High';
  readiness_score: number;
  action_plan: string[];
  created_at: string;
}

export interface Evidence {
  id: string;
  case_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_at: string;
}

export interface CaseUpdate {
  id: string;
  case_id: string;
  status: string;
  note: string;
  created_at: string;
}

export interface FeedPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  likes: number; // Agree votes
  disagree_votes: number; // Disagree votes
  category: string;
  flagged: boolean;
  created_at: string;
  anonymous: boolean;
  anonymous_id?: string;
  images?: string[];
}

export interface PostComment {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface Lawyer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  experience_years: number;
  bio?: string;
  rating: number;
  avatar_url?: string;
  is_available: boolean;
  ticket_price: number;
  qr_code_url?: string;
  created_at: string;
}


export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AdminNote {
  id: string;
  case_id: string;
  note: string;
  created_at: string;
}

// Initialise Supabase Client if env variables exist
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== 'your_supabase_project_url_here' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your_supabase_anon_key_here';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// LocalStorage Database Engine (strictly for session caching)
class LocalStorageDB {
  getCurrentUser(): Profile | null {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem('nyaya_mitra_session');
    if (!session) return null;
    try {
      const profile = JSON.parse(session) as Profile;
      // Basic validation: must have id and email
      if (!profile || !profile.id || !profile.email) {
        localStorage.removeItem('nyaya_mitra_session');
        return null;
      }
      return profile;
    } catch {
      localStorage.removeItem('nyaya_mitra_session');
      return null;
    }
  }

  setCurrentUser(profile: Profile | null): void {
    if (typeof window !== 'undefined') {
      if (profile) {
        localStorage.setItem('nyaya_mitra_session', JSON.stringify(profile));
      } else {
        localStorage.removeItem('nyaya_mitra_session');
      }
    }
  }
}

export const localDB = new LocalStorageDB();

// ==========================================
// MOCK DATA & FALLBACK STORAGE FOR COMMUNITY & LAWYERS
// ==========================================

const DEFAULT_POSTS: FeedPost[] = [
  {
    id: 'mock-p1',
    title: 'How can we claim compensation for arbitrary detention under Article 20?',
    content: 'I want to ask what the exact procedure is to claim compensation if someone is arbitrarily detained by law enforcement. Article 20, Clause (9) guarantees the right to compensation, but which court handles this and what is the typical timeline for processing?',
    author_name: 'Aayush Shrestha',
    likes: 12,
    disagree_votes: 1,
    category: 'Constitutional Remedies',
    flagged: false,
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    anonymous: false,
    anonymous_id: '',
    images: []
  },
  {
    id: 'mock-p2',
    title: 'Right to Free Legal Aid for Indigent Persons (Article 20 Clause 10)',
    content: 'Is free legal aid actively accessible in rural areas of Nepal, or is it mostly restricted to district headquarters? Under Article 20(10), every indigent person has the right to free legal aid. What are your experiences seeking a state-appointed defense lawyer?',
    author_name: 'Prerna Adhikari',
    likes: 8,
    disagree_votes: 0,
    category: 'Fundamental Rights',
    flagged: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    anonymous: false,
    anonymous_id: '',
    images: []
  },
  {
    id: 'mock-p3',
    title: 'Seeking Legal Guidance on Land Dispute in Kavre district',
    content: 'Our ancestral land was encroached by local authorities without prior notice or compensation. Does Article 25 (Right to Property) protect us from this? We want to know if anyone has successfully challenged local government land acquisition without compensation in Nepal.',
    author_name: 'Hari Prasad Devkota',
    likes: 15,
    disagree_votes: 2,
    category: 'Civil Rights',
    flagged: false,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(), // 1.5 days ago
    anonymous: false,
    anonymous_id: '',
    images: []
  }
];

const DEFAULT_COMMENTS: Record<string, PostComment[]> = {
  'mock-p1': [
    {
      id: 'mock-c1',
      post_id: 'mock-p1',
      author_name: 'Advocate Shreya Sharma',
      content: 'Namaste Aayush. You need to file a writ petition under Article 46 / Article 133 of the Constitution in the High Court or Supreme Court. The court will determine if there was a violation of your fundamental right and direct the government to pay compensation as prescribed by the Tort/Compensation Act.',
      created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
    }
  ],
  'mock-p2': [
    {
      id: 'mock-c2',
      post_id: 'mock-p2',
      author_name: 'Advocate Nabin Bahadur Thapa',
      content: 'Usually, you can contact the District Bar Association or the court registrar to assign a legal aid lawyer. In practice, there is a lack of awareness, but the service is free for qualified indigent individuals.',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString()
    }
  ]
};

const MOCK_LAWYERS: Lawyer[] = [
  {
    id: 'l1',
    name: 'Senior Advocate Dr. Ram Chandra Pokharel',
    email: 'rc.pokharel@nepallegal.org',
    phone: '+9779851012345',
    specialization: 'Constitutional Law',
    experience_years: 25,
    bio: 'Expert in constitutional remedies, administrative law, and human rights advocacy with over two decades of litigation in the Supreme Court of Nepal.',
    rating: 4.95,
    avatar_url: '/image/lawyer_ram_chandra.png',
    is_available: true,
    ticket_price: 1000,
    qr_code_url: '/image/dummy_qr.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'l2',
    name: 'Advocate Shreya Sharma',
    email: 'shreya.sharma@nyayafirm.com',
    phone: '+9779851023948',
    specialization: 'Fundamental Rights & Civil Law',
    experience_years: 8,
    bio: 'Dedicated attorney specializing in constitutional protection, civil liberty disputes, and marginalized group legal representation.',
    rating: 4.80,
    avatar_url: '/image/lawyer_shreya_sharma.png',
    is_available: true,
    ticket_price: 500,
    qr_code_url: '/image/dummy_qr.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'l3',
    name: 'Advocate Nabin Bahadur Thapa',
    email: 'nabin.thapa@legalchambers.com',
    phone: '+9779841394850',
    specialization: 'Criminal Defense & Human Rights',
    experience_years: 15,
    bio: 'Experienced defense attorney focusing on civil liberties, constitutional rights under arrest, and fair trial procedures.',
    rating: 4.90,
    avatar_url: '/image/lawyer_nabin_thapa.png',
    is_available: false,
    ticket_price: 800,
    qr_code_url: '/image/dummy_qr.png',
    created_at: new Date().toISOString()
  },
  {
    id: 'l4',
    name: 'Advocate Deepa Karki',
    email: 'deepa.karki@nyayafocus.org.np',
    phone: '+9779818475839',
    specialization: 'Family Law & Gender Rights',
    experience_years: 10,
    bio: 'Activist and legal practitioner specializing in gender justice, family law reforms, domestic disputes, and rights protections under the Constitution.',
    rating: 4.85,
    avatar_url: '/image/lawyer_deepa_karki.png',
    is_available: true,
    ticket_price: 500,
    qr_code_url: '/image/dummy_qr.png',
    created_at: new Date().toISOString()
  }
];

const getLocalLawyers = (): Lawyer[] => {
  if (typeof window === 'undefined') return MOCK_LAWYERS;
  const local = localStorage.getItem('nyaya_mitra_lawyers');
  if (!local) {
    localStorage.setItem('nyaya_mitra_lawyers', JSON.stringify(MOCK_LAWYERS));
    return MOCK_LAWYERS;
  }
  try {
    return JSON.parse(local);
  } catch {
    return MOCK_LAWYERS;
  }
};

const saveLocalLawyers = (lawyers: Lawyer[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nyaya_mitra_lawyers', JSON.stringify(lawyers));
  }
};


const getLocalPosts = (): FeedPost[] => {
  if (typeof window === 'undefined') return [];
  const local = localStorage.getItem('nyaya_mitra_posts');
  if (!local) {
    localStorage.setItem('nyaya_mitra_posts', JSON.stringify(DEFAULT_POSTS));
    return DEFAULT_POSTS;
  }
  try {
    return JSON.parse(local);
  } catch {
    return DEFAULT_POSTS;
  }
};

const saveLocalPosts = (posts: FeedPost[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nyaya_mitra_posts', JSON.stringify(posts));
  }
};

const getLocalComments = (postId: string): PostComment[] => {
  if (typeof window === 'undefined') return [];
  const local = localStorage.getItem(`nyaya_mitra_comments_${postId}`);
  if (!local) {
    const defaults = DEFAULT_COMMENTS[postId] || [];
    localStorage.setItem(`nyaya_mitra_comments_${postId}`, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(local);
  } catch {
    return DEFAULT_COMMENTS[postId] || [];
  }
};

const saveLocalComments = (postId: string, comments: PostComment[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`nyaya_mitra_comments_${postId}`, JSON.stringify(comments));
  }
};

function base64ToBlob(base64: string): Blob {
  let contentType = 'image/jpeg';
  let base64Data = base64;
  if (base64.includes(';base64,')) {
    const parts = base64.split(';base64,');
    contentType = parts[0].split(':')[1];
    base64Data = parts[1];
  }

  const raw = typeof window !== 'undefined'
    ? window.atob(base64Data)
    : Buffer.from(base64Data, 'base64').toString('binary');
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

// Database Operations Layer (Supabase only)
export const dbService = {
  // Admin Check
  async checkAdminStatus(): Promise<{ isAuthenticated: boolean; isAdmin: boolean }> {
    if (!supabase) {
      return { isAuthenticated: false, isAdmin: false };
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        return { isAuthenticated: false, isAdmin: false };
      }
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (error || !profile) {
        return { isAuthenticated: true, isAdmin: false };
      }
      return {
        isAuthenticated: true,
        isAdmin: profile.role === 'admin'
      };
    } catch (e) {
      return { isAuthenticated: false, isAdmin: false };
    }
  },

  // Profiles
  async getProfile(userId: string): Promise<Profile | null> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  },

  // Cases
  async getCases(userId: string): Promise<Case[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async getAllCases(): Promise<Case[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async getCaseById(caseId: string): Promise<Case | null> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
    if (error) return null;
    return data;
  },

  async createCase(caseData: Partial<Case>): Promise<Case> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const payload = {
      user_id: caseData.user_id || null,
      title: caseData.title || 'Untitled Case',
      description: caseData.description || '',
      category: caseData.category || 'General',
      anonymous: caseData.anonymous ?? false,
      status: 'Submitted',
      urgency: caseData.urgency || 'Low',
      readiness_score: caseData.readiness_score || 20,
      action_plan: caseData.action_plan || [],
    };

    const { data, error } = await supabase
      .from('cases')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    // Log status in updates
    await this.addCaseUpdate(data.id, 'Submitted', 'Incident reported securely via system dispatcher.');

    return data;
  },

  async updateCaseStatus(caseId: string, status: Case['status']): Promise<Case | null> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('cases')
      .update({ status })
      .eq('id', caseId)
      .select()
      .single();
    if (error) return null;

    // Add timeline log update
    await this.addCaseUpdate(caseId, status, `Timeline status modified to ${status}.`);

    // Notify User
    if (data.user_id) {
      await this.createNotification(
        data.user_id,
        'Case Status Update',
        `Your case "${data.title.slice(0, 20)}..." has progressed to "${status}".`
      );
    }

    return data;
  },

  // Upload actual file to Supabase Storage (evidence-vault)
  async uploadFileToStorage(caseId: string, file: File): Promise<string> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const fileExt = file.name.split('.').pop();
    const filePath = `${caseId}/${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('evidence-vault')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('evidence-vault')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  },

  // Evidence
  async getEvidenceForCase(caseId: string): Promise<Evidence[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('case_id', caseId);
    if (error) return [];
    return data || [];
  },

  async uploadEvidence(caseId: string, fileName: string, fileType: string, fileSize: number, fileUrl: string): Promise<Evidence> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('evidence')
      .insert({
        case_id: caseId,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        file_url: fileUrl,
      })
      .select()
      .single();
    if (error) throw error;

    // Adjust readiness score in Supabase
    const caseObj = await this.getCaseById(caseId);
    if (caseObj) {
      const newScore = Math.min(100, caseObj.readiness_score + 15);
      await supabase.from('cases').update({ readiness_score: newScore }).eq('id', caseId);
    }

    return data;
  },

  // Case Updates
  async getCaseUpdates(caseId: string): Promise<CaseUpdate[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('case_updates')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async addCaseUpdate(caseId: string, status: string, note: string): Promise<CaseUpdate> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('case_updates')
      .insert({
        case_id: caseId,
        status,
        note
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Feed Posts
  async getFeedPosts(includeFlagged = false): Promise<FeedPost[]> {
    if (!supabase) return getLocalPosts();
    try {
      let query = supabase.from('feed_posts').select('*');
      if (!includeFlagged) {
        query = query.eq('flagged', false);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error || !data) {
        return getLocalPosts();
      }
      return data.map(post => ({
        ...post,
        disagree_votes: post.disagree_votes || 0,
        anonymous: post.anonymous || false,
        anonymous_id: post.anonymous_id || '',
        images: post.images || []
      }));
    } catch (e) {
      console.warn('Supabase query failed, falling back to local posts:', e);
      return getLocalPosts();
    }
  },

  async createFeedPost(
    title: string,
    content: string,
    authorName: string,
    category: string,
    anonymous = false,
    anonymousId = '',
    images: string[] = []
  ): Promise<FeedPost> {
    const localPosts = getLocalPosts();
    const newPostId = Math.random().toString(36).substring(2, 9);
    const newPost: FeedPost = {
      id: newPostId,
      title,
      content,
      author_name: authorName,
      likes: 0,
      disagree_votes: 0,
      category,
      flagged: false,
      created_at: new Date().toISOString(),
      anonymous,
      anonymous_id: anonymousId,
      images
    };

    if (!supabase) {
      const updated = [newPost, ...localPosts];
      saveLocalPosts(updated);
      return newPost;
    }

    try {
      // Upload images to Supabase Storage and get their public URLs
      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const base64Str = images[i];
        if (base64Str.startsWith('data:image/')) {
          const blob = base64ToBlob(base64Str);
          const fileExt = blob.type.split('/')[1] || 'jpg';
          const filePath = `post-${newPostId}-${i}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('community-posts')
            .upload(filePath, blob, {
              contentType: blob.type,
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading community post image:', uploadError);
            throw uploadError;
          }

          const { data: publicUrlData } = supabase.storage
            .from('community-posts')
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            imageUrls.push(publicUrlData.publicUrl);
          }
        } else {
          imageUrls.push(base64Str);
        }
      }

      const { data, error } = await supabase
        .from('feed_posts')
        .insert({
          title,
          content,
          author_name: authorName,
          category,
          likes: 0,
          disagree_votes: 0,
          flagged: false,
          anonymous,
          anonymous_id: anonymousId,
          images: imageUrls
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to insert post');
      }
      return {
        ...data,
        disagree_votes: data.disagree_votes || 0,
        anonymous: data.anonymous || false,
        anonymous_id: data.anonymous_id || '',
        images: data.images || []
      };
    } catch (e) {
      console.warn('Supabase insert failed, saving post locally:', e);
      const updated = [newPost, ...localPosts];
      saveLocalPosts(updated);
      return newPost;
    }
  },

  async likeFeedPost(postId: string): Promise<FeedPost | null> {
    return this.voteFeedPost(postId, 'agree');
  },

  async voteFeedPost(postId: string, voteType: 'agree' | 'disagree'): Promise<FeedPost | null> {
    const localPosts = getLocalPosts();
    const postIdx = localPosts.findIndex(p => p.id === postId);
    let updatedLocalPost: FeedPost | null = null;

    if (postIdx !== -1) {
      const posts = [...localPosts];
      const post = posts[postIdx];
      if (voteType === 'agree') {
        post.likes = (post.likes || 0) + 1;
      } else {
        post.disagree_votes = (post.disagree_votes || 0) + 1;
      }
      posts[postIdx] = post;
      saveLocalPosts(posts);
      updatedLocalPost = post;
    }

    if (!supabase) {
      return updatedLocalPost;
    }

    try {
      const { data: post, error: getError } = await supabase
        .from('feed_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (getError || !post) {
        return updatedLocalPost;
      }

      const updateData: any = {};
      if (voteType === 'agree') {
        updateData.likes = (post.likes || 0) + 1;
      } else {
        updateData.disagree_votes = (post.disagree_votes || 0) + 1;
      }

      const { data, error } = await supabase
        .from('feed_posts')
        .update(updateData)
        .eq('id', postId)
        .select()
        .single();

      if (error || !data) {
        return updatedLocalPost;
      }

      return {
        ...data,
        disagree_votes: data.disagree_votes || 0
      };
    } catch (e) {
      console.warn('Supabase vote failed, fallback to local post:', e);
      return updatedLocalPost;
    }
  },

  async adjustFeedPostVotes(postId: string, likesDiff: number, disagreeDiff: number): Promise<FeedPost | null> {
    const localPosts = getLocalPosts();
    const postIdx = localPosts.findIndex(p => p.id === postId);
    let updatedLocalPost: FeedPost | null = null;

    if (postIdx !== -1) {
      const posts = [...localPosts];
      const post = posts[postIdx];
      post.likes = Math.max(0, (post.likes || 0) + likesDiff);
      post.disagree_votes = Math.max(0, (post.disagree_votes || 0) + disagreeDiff);
      posts[postIdx] = post;
      saveLocalPosts(posts);
      updatedLocalPost = post;
    }

    if (!supabase) {
      return updatedLocalPost;
    }

    try {
      const { data: post, error: getError } = await supabase
        .from('feed_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (getError || !post) {
        return updatedLocalPost;
      }

      const { data, error } = await supabase
        .from('feed_posts')
        .update({
          likes: Math.max(0, (post.likes || 0) + likesDiff),
          disagree_votes: Math.max(0, (post.disagree_votes || 0) + disagreeDiff)
        })
        .eq('id', postId)
        .select()
        .single();

      if (error || !data) {
        return updatedLocalPost;
      }

      return {
        ...data,
        disagree_votes: data.disagree_votes || 0
      };
    } catch (e) {
      console.warn('Supabase adjust votes failed, fallback to local post:', e);
      return updatedLocalPost;
    }
  },

  async flagFeedPost(postId: string, flagged: boolean): Promise<FeedPost | null> {
    const localPosts = getLocalPosts();
    const postIdx = localPosts.findIndex(p => p.id === postId);
    let updatedLocalPost: FeedPost | null = null;
    if (postIdx !== -1) {
      const posts = [...localPosts];
      posts[postIdx].flagged = flagged;
      saveLocalPosts(posts);
      updatedLocalPost = posts[postIdx];
    }

    if (!supabase) return updatedLocalPost;
    try {
      const { data, error } = await supabase
        .from('feed_posts')
        .update({ flagged })
        .eq('id', postId)
        .select()
        .single();
      if (error || !data) return updatedLocalPost;
      return {
        ...data,
        disagree_votes: data.disagree_votes || 0
      };
    } catch (e) {
      return updatedLocalPost;
    }
  },

  async deleteFeedPost(postId: string): Promise<boolean> {
    const localPosts = getLocalPosts();
    const updated = localPosts.filter(p => p.id !== postId);
    saveLocalPosts(updated);

    if (!supabase) return true;
    try {
      const { error } = await supabase
        .from('feed_posts')
        .delete()
        .eq('id', postId);
      return !error;
    } catch {
      return true;
    }
  },

  async deletePostComment(commentId: string): Promise<boolean> {
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nyaya_mitra_comments_')) {
          const commentsRaw = localStorage.getItem(key);
          if (commentsRaw) {
            try {
              const comments = JSON.parse(commentsRaw) as PostComment[];
              if (comments.some(c => c.id === commentId)) {
                const updated = comments.filter(c => c.id !== commentId);
                localStorage.setItem(key, JSON.stringify(updated));
                break;
              }
            } catch {}
          }
        }
      }
    }

    if (!supabase) return true;
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);
      return !error;
    } catch {
      return false;
    }
  },

  async getAllProfiles(): Promise<Profile[]> {
    if (!supabase) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('nyaya_mitra_profiles_mock') : null;
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
      const defaultMock: Profile[] = [
        { id: 'mock-u1', email: 'aayush@nepallegal.org', full_name: 'Aayush Shrestha', role: 'user', is_blocked: false, created_at: new Date().toISOString() },
        { id: 'mock-u2', email: 'prerna@nyayafirm.com', full_name: 'Prerna Adhikari', role: 'user', is_blocked: false, created_at: new Date().toISOString() },
        { id: 'mock-u3', email: 'hari@gmail.com', full_name: 'Hari Prasad Devkota', role: 'user', is_blocked: false, created_at: new Date().toISOString() },
        { id: 'mock-admin', email: 'admin@nyayamitra.org.np', full_name: 'System Admin', role: 'admin', is_blocked: false, created_at: new Date().toISOString() }
      ];
      if (typeof window !== 'undefined') {
        localStorage.setItem('nyaya_mitra_profiles_mock', JSON.stringify(defaultMock));
      }
      return defaultMock;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  async blockUser(userId: string, blocked: boolean): Promise<boolean> {
    if (!supabase) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('nyaya_mitra_profiles_mock') : null;
      if (stored) {
        try {
          const profiles = JSON.parse(stored) as Profile[];
          const updated = profiles.map(p => p.id === userId ? { ...p, is_blocked: blocked } : p);
          localStorage.setItem('nyaya_mitra_profiles_mock', JSON.stringify(updated));
        } catch {}
      }
      return true;
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: blocked })
        .eq('id', userId);
      return !error;
    } catch {
      return false;
    }
  },

  // Comments
  async getPostComments(postId: string): Promise<PostComment[]> {
    if (!supabase) return getLocalComments(postId);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error || !data) {
        return getLocalComments(postId);
      }
      return data;
    } catch (e) {
      console.warn('Supabase comment query failed, falling back to local:', e);
      return getLocalComments(postId);
    }
  },

  async createPostComment(postId: string, authorName: string, content: string): Promise<PostComment> {
    const localComments = getLocalComments(postId);
    const newComment: PostComment = {
      id: Math.random().toString(36).substring(2, 9),
      post_id: postId,
      author_name: authorName,
      content,
      created_at: new Date().toISOString()
    };

    if (!supabase) {
      const updated = [...localComments, newComment];
      saveLocalComments(postId, updated);
      return newComment;
    }

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          author_name: authorName,
          content
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to insert comment');
      }
      return data;
    } catch (e) {
      console.warn('Supabase comment insert failed, saving locally:', e);
      const updated = [...localComments, newComment];
      saveLocalComments(postId, updated);
      return newComment;
    }
  },

  // Lawyers
  async getLawyers(): Promise<Lawyer[]> {
    if (!supabase) return getLocalLawyers();
    try {
      const { data, error } = await supabase
        .from('lawyers')
        .select('*')
        .order('name', { ascending: true });
      if (error || !data || data.length === 0) {
        return getLocalLawyers();
      }
      return data;
    } catch (e) {
      console.warn('Supabase lawyers query failed, falling back to local lawyers:', e);
      return getLocalLawyers();
    }
  },

  async createLawyer(lawyerData: Partial<Lawyer>): Promise<Lawyer> {
    const localLawyers = getLocalLawyers();
    const newLawyer: Lawyer = {
      id: Math.random().toString(36).substring(2, 9),
      name: lawyerData.name || 'Anonymous Advocate',
      email: lawyerData.email || '',
      phone: lawyerData.phone || '',
      specialization: lawyerData.specialization || 'Constitutional Law',
      experience_years: lawyerData.experience_years || 0,
      bio: lawyerData.bio || '',
      rating: lawyerData.rating || 5.00,
      avatar_url: lawyerData.avatar_url || '',
      is_available: lawyerData.is_available ?? true,
      ticket_price: lawyerData.ticket_price || 500,
      qr_code_url: lawyerData.qr_code_url || '/image/dummy_qr.png',
      created_at: new Date().toISOString()
    };

    if (!supabase) {
      const updated = [newLawyer, ...localLawyers];
      saveLocalLawyers(updated);
      return newLawyer;
    }

    try {
      const { data, error } = await supabase
        .from('lawyers')
        .insert({
          name: newLawyer.name,
          email: newLawyer.email,
          phone: newLawyer.phone,
          specialization: newLawyer.specialization,
          experience_years: newLawyer.experience_years,
          bio: newLawyer.bio,
          rating: newLawyer.rating,
          avatar_url: newLawyer.avatar_url,
          is_available: newLawyer.is_available,
          ticket_price: newLawyer.ticket_price,
          qr_code_url: newLawyer.qr_code_url,
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to insert lawyer');
      }
      return data;
    } catch (e) {
      console.warn('Supabase createLawyer failed, saving locally:', e);
      const updated = [newLawyer, ...localLawyers];
      saveLocalLawyers(updated);
      return newLawyer;
    }
  },

  async updateLawyer(id: string, lawyerData: Partial<Lawyer>): Promise<Lawyer> {
    const localLawyers = getLocalLawyers();
    const index = localLawyers.findIndex(l => l.id === id);
    let updatedLocalLawyer: Lawyer | null = null;

    if (index !== -1) {
      const updated = [...localLawyers];
      updated[index] = {
        ...updated[index],
        ...lawyerData
      };
      saveLocalLawyers(updated);
      updatedLocalLawyer = updated[index];
    }

    if (!supabase) {
      if (!updatedLocalLawyer) throw new Error('Lawyer not found');
      return updatedLocalLawyer;
    }

    try {
      const isUuid = id.length === 36 && id.includes('-');
      if (!isUuid) {
        return updatedLocalLawyer || { id, ...lawyerData } as Lawyer;
      }

      const { data, error } = await supabase
        .from('lawyers')
        .update({
          name: lawyerData.name,
          email: lawyerData.email,
          phone: lawyerData.phone,
          specialization: lawyerData.specialization,
          experience_years: lawyerData.experience_years,
          bio: lawyerData.bio,
          rating: lawyerData.rating,
          avatar_url: lawyerData.avatar_url,
          is_available: lawyerData.is_available,
          ticket_price: lawyerData.ticket_price,
          qr_code_url: lawyerData.qr_code_url,
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to update lawyer');
      }
      return data;
    } catch (e) {
      console.warn('Supabase updateLawyer failed, fallback to local update:', e);
      if (!updatedLocalLawyer) throw new Error('Lawyer not found');
      return updatedLocalLawyer;
    }
  },

  async deleteLawyer(id: string): Promise<boolean> {
    const localLawyers = getLocalLawyers();
    const updated = localLawyers.filter(l => l.id !== id);
    saveLocalLawyers(updated);

    if (!supabase) return true;

    try {
      const isUuid = id.length === 36 && id.includes('-');
      if (!isUuid) {
        return true;
      }

      const { error } = await supabase
        .from('lawyers')
        .delete()
        .eq('id', id);

      return !error;
    } catch {
      return true;
    }
  },

  async uploadLawyerAvatar(file: File): Promise<string> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from('lawyer-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      if (!error) {
        const { data: publicUrlData } = supabase.storage
          .from('lawyer-avatars')
          .getPublicUrl(filePath);
        return publicUrlData.publicUrl;
      }
    } catch {}

    const { data, error } = await supabase.storage
      .from('community-posts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage
      .from('community-posts')
      .getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  },

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async createNotification(userId: string, title: string, message: string): Promise<Notification> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        read: false
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markNotificationRead(notifId: string): Promise<boolean> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId);
    return !error;
  },

  // Admin Notes
  async getAdminNotes(caseId: string): Promise<AdminNote[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('admin_notes')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async addAdminNote(caseId: string, note: string): Promise<AdminNote> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('admin_notes')
      .insert({
        case_id: caseId,
        note
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
