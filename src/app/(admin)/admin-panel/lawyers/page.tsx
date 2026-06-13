'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { dbService, Lawyer } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { 
  Briefcase, Star, Plus, Edit2, Trash2, ShieldAlert, 
  CheckCircle2, XCircle, Phone, Mail, Award, Clock,
  Upload, X, Check, AlertCircle, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLawyersDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLawyer, setEditingLawyer] = useState<Lawyer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('Constitutional Law');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [rating, setRating] = useState<number>(5.0);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [ticketPrice, setTicketPrice] = useState<number>(500);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    // Check if the user is admin
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadLawyers();
  }, [user, authLoading, router]);

  const loadLawyers = async () => {
    try {
      setLoading(true);
      const data = await dbService.getLawyers();
      setLawyers(data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to fetch lawyers.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingLawyer(null);
    setName('');
    setEmail('');
    setPhone('');
    setSpecialization('Constitutional Law');
    setExperienceYears(5);
    setRating(5.0);
    setBio('');
    setAvatarUrl('');
    setTicketPrice(500);
    setQrCodeUrl('');
    setIsAvailable(true);
    setSuccessMsg('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (lawyer: Lawyer) => {
    setEditingLawyer(lawyer);
    setName(lawyer.name);
    setEmail(lawyer.email);
    setPhone(lawyer.phone || '');
    setSpecialization(lawyer.specialization);
    setExperienceYears(lawyer.experience_years);
    setRating(lawyer.rating);
    setBio(lawyer.bio || '');
    setAvatarUrl(lawyer.avatar_url || '');
    setTicketPrice(lawyer.ticket_price || 500);
    setQrCodeUrl(lawyer.qr_code_url || '');
    setIsAvailable(lawyer.is_available);
    setSuccessMsg('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setErrorMsg('');
      const publicUrl = await dbService.uploadLawyerAvatar(file);
      setAvatarUrl(publicUrl);
      setSuccessMsg('Avatar uploaded successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingQr(true);
      setErrorMsg('');
      const publicUrl = await dbService.uploadLawyerAvatar(file); // reuse file upload logic
      setQrCodeUrl(publicUrl);
      setSuccessMsg('Payment QR uploaded successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to upload QR code. Please try again.');
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload: Partial<Lawyer> = {
        name,
        email,
        phone,
        specialization,
        experience_years: Number(experienceYears),
        rating: Number(rating),
        bio,
        avatar_url: avatarUrl,
        ticket_price: Number(ticketPrice),
        qr_code_url: qrCodeUrl || '/image/dummy_qr.png',
        is_available: isAvailable
      };

      if (editingLawyer) {
        await dbService.updateLawyer(editingLawyer.id, payload);
        setSuccessMsg(`Advocate profile updated successfully!`);
      } else {
        await dbService.createLawyer(payload);
        setSuccessMsg(`Advocate profile created successfully!`);
      }

      setIsModalOpen(false);
      await loadLawyers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while saving the profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this Advocate profile?')) return;

    try {
      setActionLoading(true);
      await dbService.deleteLawyer(id);
      setSuccessMsg('Advocate profile removed.');
      await loadLawyers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete advocate.');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-legal-bone-light dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <Clock className="h-10 w-10 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Loading Database Registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-legal-gold/15 pb-6">
          <div>
            <h1 className="font-serif text-3xl font-extrabold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-legal-gold" />
              Manage Verified Lawyers
            </h1>
            <p className="text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60 mt-1">
              Add, update, or remove legal consultants in the system registry.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-wider font-sans">
              <ShieldAlert className="h-4 w-4" />
              Admin Access
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark font-sans text-xs font-bold uppercase tracking-wider shadow-sm hover:scale-102 transition-transform cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Lawyer
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {successMsg && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm font-semibold rounded-2xl flex items-center gap-2 max-w-4xl shadow-sm animate-fade-in">
            <Check className="h-5 w-5 flex-shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-semibold rounded-2xl flex items-center gap-2 max-w-4xl shadow-sm animate-fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Desktop Data Grid */}
        <div className="hidden lg:block glass-panel-light dark:glass-panel-dark rounded-3xl border border-legal-gold/15 overflow-x-auto shadow-glass">
          <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
            <thead>
              <tr className="border-b border-legal-gold/10 bg-legal-navy/5 dark:bg-legal-bone/5 text-legal-navy/60 dark:text-legal-bone/60 font-bold uppercase tracking-wider">
                <th className="p-5 font-sans">Advocate</th>
                <th className="p-5 font-sans">Specialization</th>
                <th className="p-5 font-sans">Experience</th>
                <th className="p-5 font-sans">Rating</th>
                <th className="p-5 font-sans">Rate (NPR)</th>
                <th className="p-5 font-sans">Contact info</th>
                <th className="p-5 font-sans text-center">Status</th>
                <th className="p-5 font-sans text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-legal-gold/5 text-legal-navy dark:text-legal-bone-light font-semibold">
              {lawyers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-legal-navy/40 dark:text-legal-bone/40">
                    No registered legal consultants found. Click 'Add Lawyer' to create one.
                  </td>
                </tr>
              ) : (
                lawyers.map((lawyer) => (
                  <tr key={lawyer.id} className="hover:bg-legal-gold/[0.02] transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 rounded-xl overflow-hidden border border-legal-gold/20 flex-shrink-0 bg-legal-gold/5 flex items-center justify-center font-serif text-legal-gold font-bold text-base">
                          {lawyer.avatar_url ? (
                            <Image 
                              src={lawyer.avatar_url} 
                              alt={lawyer.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            lawyer.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="font-serif text-sm font-bold text-legal-navy dark:text-legal-bone-light">{lawyer.name}</h4>
                          <p className="text-[10px] text-legal-navy/50 dark:text-legal-bone/50 max-w-xs truncate">{lawyer.bio || 'No bio listed'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-2.5 py-1 rounded-lg bg-legal-gold/10 text-legal-gold-dark dark:text-legal-gold border border-legal-gold/15">
                        {lawyer.specialization}
                      </span>
                    </td>
                    <td className="p-5 font-sans">
                      <span className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-legal-gold/60" />
                        {lawyer.experience_years} Years
                      </span>
                    </td>
                    <td className="p-5 font-sans">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-legal-gold fill-legal-gold" />
                        {Number(lawyer.rating).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-5 font-sans text-legal-gold font-bold">
                      Rs. {lawyer.ticket_price || 500}
                    </td>
                    <td className="p-5 font-sans">
                      <div className="flex flex-col gap-0.5 text-[10px] text-legal-navy/70 dark:text-legal-bone/70">
                        {lawyer.phone && (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-legal-gold" /> {lawyer.phone}</span>
                        )}
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-legal-gold" /> {lawyer.email}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border
                        ${lawyer.is_available 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}
                      >
                        {lawyer.is_available ? 'Available' : 'Busy'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(lawyer)}
                          title="Edit advocate details"
                          className="p-2 rounded-xl bg-brand-100 hover:bg-brand-200 dark:bg-brand-900/30 dark:hover:bg-brand-800/40 text-legal-navy/70 dark:text-brand-100 border border-brand-200 dark:border-brand-800/40 transition-all cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(lawyer.id)}
                          title="Delete advocate"
                          className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-500 border border-red-500/20 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet cards list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:hidden max-w-4xl">
          {lawyers.length === 0 ? (
            <div className="col-span-2 text-center py-10 glass-panel-light dark:glass-panel-dark rounded-3xl border border-legal-gold/15 text-xs text-legal-navy/40 dark:text-legal-bone/40">
              No registered legal consultants found.
            </div>
          ) : (
            lawyers.map((lawyer) => (
              <div 
                key={lawyer.id}
                className="glass-panel-light dark:glass-panel-dark p-6 rounded-3xl border border-legal-gold/15 flex flex-col justify-between gap-4 relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-legal-gold/20 flex-shrink-0 bg-legal-gold/5 flex items-center justify-center font-serif text-legal-gold font-bold text-base">
                        {lawyer.avatar_url ? (
                          <Image src={lawyer.avatar_url} alt={lawyer.name} fill className="object-cover" />
                        ) : (
                          lawyer.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-legal-navy dark:text-legal-bone-light leading-tight">{lawyer.name}</h4>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-legal-gold/10 text-legal-gold text-[9px] uppercase font-bold tracking-wider">
                          {lawyer.specialization}
                        </span>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border
                      ${lawyer.is_available ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                    >
                      {lawyer.is_available ? 'Available' : 'Busy'}
                    </span>
                  </div>

                  <p className="text-xs text-legal-navy/60 dark:text-legal-bone/60 leading-relaxed line-clamp-2">{lawyer.bio}</p>

                  <div className="grid grid-cols-3 gap-2 bg-legal-navy/5 dark:bg-legal-bone/5 p-3 rounded-2xl text-[10px] font-bold font-sans">
                    <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5 text-legal-gold" /> {lawyer.experience_years} Yrs Exp</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-legal-gold fill-legal-gold" /> {Number(lawyer.rating).toFixed(1)}</span>
                    <span className="flex items-center gap-1 text-legal-gold">Rs. {lawyer.ticket_price || 500}</span>
                  </div>
                </div>

                <div className="border-t border-legal-gold/10 pt-3 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center text-[10px] text-legal-navy/60 dark:text-legal-bone/60">
                  <div className="flex flex-col gap-0.5">
                    {lawyer.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lawyer.phone}</span>}
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lawyer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                    <button
                      onClick={() => openEditModal(lawyer)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-brand-100 hover:bg-brand-200 dark:bg-brand-900/30 text-legal-navy/80 dark:text-brand-100 border border-brand-200 dark:border-brand-800/40 font-sans font-bold uppercase text-[9px] tracking-wider transition-all"
                    >
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(lawyer.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-500 border border-red-500/20 font-sans font-bold uppercase text-[9px] tracking-wider transition-all"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: Add/Edit Lawyer */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-white dark:bg-legal-navy p-6 rounded-3xl border border-legal-gold/20 shadow-glass-dark space-y-6 max-h-[90vh] overflow-y-auto relative animate-scale-up">
              
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-5 top-5 p-2 rounded-xl text-legal-navy/40 dark:text-legal-bone/40 hover:bg-legal-navy/5 dark:hover:bg-legal-bone/5 border border-transparent transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 border-b border-legal-gold/10 pb-4">
                <Sparkles className="h-6 w-6 text-legal-gold" />
                <h2 className="font-serif text-xl font-bold text-legal-navy dark:text-legal-bone-light">
                  {editingLawyer ? 'Edit Advocate Profile' : 'Register New Advocate'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* File Upload Blocks (Avatar & QR code) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-legal-navy/5 dark:bg-legal-bone/5 border border-legal-gold/10">
                    <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-legal-gold/20 flex items-center justify-center bg-legal-gold/5 font-serif text-legal-gold font-bold text-lg flex-shrink-0">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="Avatar Preview" fill className="object-cover" />
                      ) : (
                        name ? name.charAt(0) : 'A'
                      )}
                    </div>
                    <div className="space-y-1 text-left min-w-0">
                      <h4 className="text-[10px] font-bold text-legal-navy dark:text-legal-bone-light uppercase tracking-wider">Avatar Image</h4>
                      
                      <div className="flex gap-1.5">
                        <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark font-sans text-[9px] font-bold uppercase tracking-wider cursor-pointer shadow-sm hover:scale-102 transition-transform">
                          <Upload className="h-3 w-3" />
                          {uploadingImage ? '...' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>
                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('')}
                            className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/5 font-sans text-[9px] font-bold uppercase tracking-wider"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment QR Upload */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-legal-navy/5 dark:bg-legal-bone/5 border border-legal-gold/10">
                    <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-legal-gold/20 flex items-center justify-center bg-legal-gold/5 font-serif text-legal-gold font-bold text-lg flex-shrink-0">
                      {qrCodeUrl ? (
                        <Image src={qrCodeUrl} alt="QR Preview" fill className="object-cover" />
                      ) : (
                        'QR'
                      )}
                    </div>
                    <div className="space-y-1 text-left min-w-0">
                      <h4 className="text-[10px] font-bold text-legal-navy dark:text-legal-bone-light uppercase tracking-wider">Payment QR</h4>
                      
                      <div className="flex gap-1.5">
                        <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark font-sans text-[9px] font-bold uppercase tracking-wider cursor-pointer shadow-sm hover:scale-102 transition-transform">
                          <Upload className="h-3 w-3" />
                          {uploadingQr ? '...' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrUpload}
                            disabled={uploadingQr}
                            className="hidden"
                          />
                        </label>
                        {qrCodeUrl && (
                          <button
                            type="button"
                            onClick={() => setQrCodeUrl('')}
                            className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/5 font-sans text-[9px] font-bold uppercase tracking-wider"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Advocate Aditya Aryal"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-xs font-semibold focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. adityaaryal837@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-xs font-semibold focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Phone Number (WhatsApp format)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +9779851012345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-xs font-semibold focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Specialization
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-xs font-semibold focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                    >
                      <option value="Constitutional Law">Constitutional Law</option>
                      <option value="Fundamental Rights & Civil Law">Fundamental Rights & Civil Law</option>
                      <option value="Criminal Defense & Human Rights">Criminal Defense & Human Rights</option>
                      <option value="Family Law & Gender Rights">Family Law & Gender Rights</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-xs font-semibold focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Client Rating (0.0 to 5.0)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={5}
                      step={0.05}
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-xs font-semibold focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Consultation Rate (NPR)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={50}
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-xs font-semibold focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                    Brief Bio & Court Achievements
                  </label>
                  <textarea
                    placeholder="Describe their court records, focus areas, and history representing cases under the Nepal Constitution..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-xs font-medium focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone leading-relaxed"
                  />
                </div>

                {/* Available toggle switch */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-legal-navy/5 dark:bg-legal-bone/5 border border-legal-gold/10">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-legal-navy dark:text-legal-bone-light uppercase tracking-wider flex items-center gap-1.5">
                      {isAvailable ? (
                        <><CheckCircle2 className="h-4 w-4 text-green-500" /> Active Registry Availability</>
                      ) : (
                        <><XCircle className="h-4 w-4 text-red-500" /> Currently Busy / Unavailable</>
                      )}
                    </h4>
                    <p className="text-[10px] text-legal-navy/40 dark:text-legal-bone/40">Unavailable advocates will be greyed out in the search directory.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvailable(!isAvailable)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                      ${isAvailable ? 'bg-legal-gold' : 'bg-gray-300 dark:bg-gray-700'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 justify-end pt-2 border-t border-legal-gold/10">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-legal-gold/25 text-legal-gold text-xs font-bold uppercase tracking-wider hover:bg-legal-gold/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || uploadingImage || uploadingQr}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark text-xs font-bold uppercase tracking-wider hover:scale-102 transition-transform shadow-sm flex items-center gap-2"
                  >
                    {actionLoading && <Clock className="h-4 w-4 animate-spin" />}
                    {editingLawyer ? 'Update Profile' : 'Create Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
