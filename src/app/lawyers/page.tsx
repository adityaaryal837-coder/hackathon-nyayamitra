'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { dbService, Lawyer } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import {
  Briefcase, Star, Search, Filter, Phone, Mail, Award, CheckCircle2,
  XCircle, AlertCircle, Clock, Loader2, MessageCircle, ExternalLink,
  Shield, Users, X, Copy, Check
} from 'lucide-react';

// ── WhatsApp deep-link helper ─────────────────────────────────────────────────
function buildWhatsAppUrl(phone: string, lawyerName: string): string {
  // Strip everything except digits and leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  const greeting = encodeURIComponent(
    `Hello ${lawyerName}, I found you on Nyaya Mitra and would like to request a legal consultation. Could you please share your availability?`
  );
  return `https://wa.me/${cleaned}?text=${greeting}`;
}

// ── Specialization colour map ─────────────────────────────────────────────────
const SPEC_COLORS: Record<string, string> = {
  'Constitutional Law':               'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300   border-blue-200   dark:border-blue-700/40',
  'Fundamental Rights & Civil Law':   'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/40',
  'Criminal Defense & Human Rights':  'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-300    border-red-200    dark:border-red-700/40',
  'Family Law & Gender Rights':       'bg-pink-100   dark:bg-pink-900/30   text-pink-700   dark:text-pink-300   border-pink-200   dark:border-pink-700/40',
};
const DEFAULT_SPEC_COLOR = 'bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-300 border-gold-200 dark:border-gold-700/40';

export default function LawyersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [lawyers, setLawyers]                         = useState<Lawyer[]>([]);
  const [loading, setLoading]                         = useState(true);
  const [searchQuery, setSearchQuery]                 = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [imgErrors, setImgErrors]                     = useState<Record<string, boolean>>({});

  const [selectedLawyerForBooking, setSelectedLawyerForBooking] = useState<Lawyer | null>(null);
  const [transactionId, setTransactionId]             = useState('');
  const [isVerifying, setIsVerifying]                 = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [copiedAmount, setCopiedAmount]               = useState(false);

  const specializations = [
    'All',
    'Constitutional Law',
    'Fundamental Rights & Civil Law',
    'Criminal Defense & Human Rights',
    'Family Law & Gender Rights',
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    loadLawyers();
  }, [user, authLoading, router]);

  const loadLawyers = async () => {
    try {
      setLoading(true);
      const data = await dbService.getLawyers();
      setLawyers(data);
    } catch (e) {
      console.error('Error fetching lawyers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedBooking = () => {
    if (!selectedLawyerForBooking) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationSuccess(true);
      setTimeout(() => {
        const refMsg = transactionId ? ` (Ref: ${transactionId})` : '';
        const greeting = encodeURIComponent(
          `Hello ${selectedLawyerForBooking.name}, I have completed the payment of Rs. ${selectedLawyerForBooking.ticket_price || 500} for our consultation${refMsg}. Please confirm my appointment.`
        );
        const cleanedPhone = selectedLawyerForBooking.phone ? selectedLawyerForBooking.phone.replace(/[^\d+]/g, '') : '';
        const url = `https://wa.me/${cleanedPhone}?text=${greeting}`;
        window.open(url, '_blank');
        setSelectedLawyerForBooking(null);
      }, 1000);
    }, 1500);
  };

  const handleCopyAmount = (amount: number) => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSpec  = selectedSpecialization === 'All' || lawyer.specialization === selectedSpecialization;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      lawyer.name.toLowerCase().includes(q) ||
      lawyer.specialization.toLowerCase().includes(q) ||
      (lawyer.bio && lawyer.bio.toLowerCase().includes(q));
    return matchesSpec && matchesSearch;
  });

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-50 dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <Clock className="h-10 w-10 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Checking Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-50 dark:bg-legal-navy-dark transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth">

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-legal-gold/15 pb-6">
          <div>
            <h1 className="font-serif text-3xl font-extrabold text-legal-navy dark:text-brand-50 flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-legal-gold" />
              Verified Lawyers Directory
            </h1>
            <p className="text-xs font-sans text-legal-navy/60 dark:text-brand-200/60 mt-1">
              Connect directly with qualified legal practitioners for accurate constitutional counsel.
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-legal-navy/40 border border-brand-200 dark:border-brand-800/40 rounded-2xl shadow-sm">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-xs font-bold text-legal-navy dark:text-brand-50">{lawyers.filter(l => l.is_available).length} Available</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-legal-navy/40 border border-brand-200 dark:border-brand-800/40 rounded-2xl shadow-sm">
              <Users className="h-4 w-4 text-legal-gold" />
              <span className="text-xs font-bold text-legal-navy dark:text-brand-50">{lawyers.length} Advocates</span>
            </div>
          </div>
        </div>

        {/* ── AI Warning Callout ────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4 shadow-sm max-w-4xl">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 flex-shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-sans text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Verify with Legal Professionals
            </h4>
            <p className="text-xs font-sans text-legal-navy/80 dark:text-brand-200/80 leading-relaxed">
              While <strong>Nyaya Mitra AI</strong> offers direct answers referencing the Constitution of Nepal,
              automated models can occasionally hallucinate or miss contextual intricacies. For high-stakes representation
              or legal documents, consult these certified Advocates directly.
            </p>
          </div>
        </div>

        {/* ── Search & Filter ───────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-legal-navy/30 p-4 rounded-2xl border border-legal-gold/10 shadow-sm">
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-navy/40 dark:text-brand-300/40" />
            <input
              type="text"
              placeholder="Search by name, specialization, bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/15 bg-brand-50/50 dark:bg-legal-navy/20 text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-brand-50 placeholder:text-legal-navy/40 dark:placeholder:text-brand-300/40"
            />
          </div>

          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="flex items-center gap-1 text-[11px] font-bold text-legal-gold uppercase tracking-wider mr-2 shrink-0">
              <Filter className="h-3.5 w-3.5" /> Specialties:
            </span>
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialization(spec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer
                  ${selectedSpecialization === spec
                    ? 'bg-legal-gold text-legal-navy-dark shadow-md'
                    : 'bg-legal-gold/10 text-legal-gold border border-legal-gold/20 hover:bg-legal-gold/25'}`}
              >
                {spec === 'All' ? 'All' : spec.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Lawyers Grid ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex py-20 items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-legal-gold" />
              <p className="text-xs uppercase tracking-widest font-sans font-bold text-legal-navy/60 dark:text-brand-300/60">
                Loading directory...
              </p>
            </div>
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="bg-white dark:bg-legal-navy/40 rounded-2xl border border-legal-gold/15 py-16 text-center space-y-4 max-w-md mx-auto shadow-sm">
            <Briefcase className="h-10 w-10 text-legal-gold/30 mx-auto" />
            <h3 className="text-base font-bold text-legal-navy dark:text-brand-50">No Advocates Found</h3>
            <p className="text-xs text-legal-navy/50 dark:text-brand-300/50 px-6">
              No registered lawyers match your search query. Try broadening your filter tags or search terms.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
            {filteredLawyers.map((lawyer) => {
              const whatsappUrl    = lawyer.phone ? buildWhatsAppUrl(lawyer.phone, lawyer.name) : null;
              const specColorClass = SPEC_COLORS[lawyer.specialization] ?? DEFAULT_SPEC_COLOR;
              const hasImgError    = imgErrors[lawyer.id];

              return (
                <div
                  key={lawyer.id}
                  className="bg-white dark:bg-legal-navy/40 p-6 rounded-3xl border border-legal-gold/15 hover:border-legal-gold/40 transition-all flex flex-col justify-between space-y-5 shadow-sm hover:shadow-lg relative overflow-hidden group"
                >
                  {/* Subtle background glow accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-legal-gold/[0.03] to-transparent rounded-3xl pointer-events-none" />

                  <div className="space-y-4 relative">

                    {/* ── Avatar Row ────────────────────────────────── */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">

                        {/* Profile Photo */}
                        <div className="relative h-[72px] w-[72px] rounded-2xl overflow-hidden border-2 border-legal-gold/30 shadow-md flex-shrink-0 bg-legal-gold/10 group-hover:border-legal-gold/60 transition-all">
                          {lawyer.avatar_url && !hasImgError ? (
                            <Image
                              src={lawyer.avatar_url}
                              alt={`Photo of ${lawyer.name}`}
                              fill
                              className="object-cover object-top"
                              onError={() => setImgErrors(prev => ({ ...prev, [lawyer.id]: true }))}
                            />
                          ) : (
                            /* Fallback initials avatar */
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-legal-gold/20 to-legal-gold/5 text-legal-gold font-serif font-bold text-2xl">
                              {lawyer.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Name & Specialization */}
                        <div className="min-w-0">
                          <h3 className="font-serif text-base font-bold text-legal-navy dark:text-brand-50 leading-tight line-clamp-2">
                            {lawyer.name}
                          </h3>
                          <span className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${specColorClass}`}>
                            {lawyer.specialization}
                          </span>
                        </div>
                      </div>

                      {/* Availability badge */}
                      <span className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border
                        ${lawyer.is_available
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700/40'
                          : 'bg-red-50  dark:bg-red-900/20  text-red-500  dark:text-red-400  border-red-200  dark:border-red-700/40'}`}
                      >
                        {lawyer.is_available
                          ? <><CheckCircle2 className="h-3 w-3" /> Available</>
                          : <><XCircle className="h-3 w-3" /> Busy</>
                        }
                      </span>
                    </div>

                    {/* ── Bio ───────────────────────────────────────── */}
                    <p className="text-xs text-legal-navy/70 dark:text-brand-200/70 leading-relaxed font-sans min-h-[48px] line-clamp-3">
                      {lawyer.bio || 'Verified legal consultant specializing in rights violations, constitutional issues, and civil litigation representation.'}
                    </p>

                    {/* ── Stats & Price Grid ────────────────────────── */}
                    <div className="grid grid-cols-3 gap-2 bg-brand-50/60 dark:bg-legal-navy-dark/40 p-3 rounded-2xl border border-brand-100 dark:border-brand-800/30 text-xs font-sans">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-legal-navy/40 dark:text-brand-300/40 block">
                          Experience
                        </span>
                        <span className="font-semibold text-legal-navy dark:text-brand-50 flex items-center gap-1 text-[11px] whitespace-nowrap">
                          <Award className="h-3.5 w-3.5 text-legal-gold flex-shrink-0" />
                          {lawyer.experience_years} Yrs
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-legal-navy/40 dark:text-brand-300/40 block">
                          Rating
                        </span>
                        <span className="font-semibold text-legal-navy dark:text-brand-50 flex items-center gap-1 text-[11px] whitespace-nowrap">
                          <Star className="h-3.5 w-3.5 text-legal-gold fill-legal-gold flex-shrink-0" />
                          {lawyer.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-legal-navy/40 dark:text-brand-300/40 block">
                          Fee (NPR)
                        </span>
                        <span className="font-semibold text-legal-gold flex items-center gap-1 text-[11px] font-mono whitespace-nowrap">
                          Rs. {lawyer.ticket_price || 500}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Contact Footer ─────────────────────────────── */}
                  <div className="border-t border-legal-gold/10 pt-4 flex flex-col gap-3 relative">

                    {/* Contact details */}
                    <div className="flex flex-col gap-1 text-[11px] text-legal-navy/55 dark:text-brand-300/55">
                      {lawyer.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-legal-gold" />
                          {lawyer.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-legal-gold" />
                        {lawyer.email}
                      </span>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex gap-2">

                      {/* WhatsApp Consult Button — primary CTA */}
                      {whatsappUrl ? (
                        <button
                          onClick={() => {
                            if (lawyer.is_available) {
                              setSelectedLawyerForBooking(lawyer);
                              setTransactionId('');
                              setIsVerifying(false);
                              setVerificationSuccess(false);
                            }
                          }}
                          aria-label={`Chat with ${lawyer.name} on WhatsApp`}
                          className={`
                            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl
                            text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer
                            ${lawyer.is_available
                              ? 'bg-[#25D366] hover:bg-[#22c35e] text-white shadow-green-200 dark:shadow-green-900/30 hover:shadow-md active:scale-95'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700 pointer-events-none'
                            }
                          `}
                          disabled={!lawyer.is_available}
                        >
                          {/* WhatsApp SVG icon */}
                          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          {lawyer.is_available ? 'Chat on WhatsApp' : 'Advocate Busy'}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700 cursor-not-allowed"
                        >
                          <MessageCircle className="h-4 w-4" />
                          No Contact Listed
                        </button>
                      )}

                      {/* Email shortcut */}
                      <a
                        href={`mailto:${lawyer.email}?subject=Legal Consultation Request from Nyaya Mitra`}
                        title="Send an email"
                        className="p-2.5 rounded-2xl bg-brand-100 dark:bg-brand-900/30 hover:bg-brand-200 dark:hover:bg-brand-800/40 text-legal-navy/60 dark:text-brand-200/60 border border-brand-200 dark:border-brand-800/40 transition-all"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <p className="text-[11px] text-legal-navy/40 dark:text-brand-300/40 font-sans max-w-4xl pb-4">
          ⚠️ All advocates listed are independent practitioners. Nyaya Mitra does not mediate, supervise, or guarantee services. Always verify bar registration before engaging.
        </p>

      </main>

      {/* ── Consultation Booking & QR Payment Modal ────────────────── */}
      {selectedLawyerForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0c1827] border-2 border-legal-gold/25 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh] transition-all duration-300">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-legal-navy to-legal-navy/90 dark:from-[#0d1a2a] dark:to-[#0f2139] p-5 text-white border-b border-legal-gold/20 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-legal-gold/20 rounded-xl">
                  <Briefcase className="h-5 w-5 text-legal-gold animate-pulse" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold tracking-tight text-white font-sans">Book Consultation</h2>
                  <p className="text-[10px] text-brand-200/60 font-sans uppercase tracking-wider">Secure Payment Verification</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLawyerForBooking(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Lawyer Banner */}
              <div className="bg-brand-50/50 dark:bg-legal-navy/30 p-4 rounded-2xl border border-legal-gold/10 flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-legal-gold/30 flex-shrink-0 bg-legal-gold/10">
                  {selectedLawyerForBooking.avatar_url && !imgErrors[selectedLawyerForBooking.id] ? (
                    <Image
                      src={selectedLawyerForBooking.avatar_url}
                      alt={selectedLawyerForBooking.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-legal-gold/20 to-legal-gold/5 text-legal-gold font-serif font-bold text-lg">
                      {selectedLawyerForBooking.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-sm font-bold text-legal-navy dark:text-brand-50 leading-tight">
                    {selectedLawyerForBooking.name}
                  </h4>
                  <p className="text-[11px] text-legal-gold font-semibold uppercase mt-0.5 tracking-wider font-sans">
                    {selectedLawyerForBooking.specialization}
                  </p>
                </div>
              </div>

              {/* Price Details Callout */}
              <div className="bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border border-legal-gold/20 p-3.5 rounded-2xl flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-legal-navy/40 dark:text-brand-300/40 block font-sans">
                    Consultation Ticket Rate
                  </span>
                  <span className="text-xl font-extrabold text-legal-navy dark:text-brand-50 font-mono tracking-tight">
                    Rs. {selectedLawyerForBooking.ticket_price || 500} <span className="text-xs font-sans font-medium text-legal-navy/60 dark:text-brand-300/60">NPR</span>
                  </span>
                </div>
                <button
                  onClick={() => handleCopyAmount(selectedLawyerForBooking.ticket_price || 500)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-legal-navy/40 border border-legal-gold/20 text-xs font-semibold text-legal-navy dark:text-brand-50 hover:bg-brand-50 dark:hover:bg-legal-navy-dark transition-all cursor-pointer font-sans"
                >
                  {copiedAmount ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-500 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-legal-gold" />
                      <span>Copy Fee</span>
                    </>
                  )}
                </button>
              </div>

              {/* QR Code Scan Section */}
              <div className="text-center space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-legal-navy/60 dark:text-brand-300/60 block font-sans">
                  Scan to Pay (Fonepay/eSewa/Khalti)
                </span>
                
                {/* QR Code frame with golden border glow */}
                <div className="relative mx-auto w-48 h-48 bg-white p-3 rounded-2xl border-2 border-legal-gold/30 shadow-lg flex items-center justify-center overflow-hidden hover:border-legal-gold transition-all duration-300 group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-legal-gold/5 to-transparent pointer-events-none" />
                  <Image
                    src={selectedLawyerForBooking.qr_code_url || '/image/dummy_qr.png'}
                    alt={`Merchant payment QR code for ${selectedLawyerForBooking.name}`}
                    width={172}
                    height={172}
                    className="object-contain"
                  />
                </div>

                <div className="flex justify-center gap-1.5 text-[9px] font-bold text-legal-navy/40 dark:text-brand-300/40 uppercase font-sans">
                  <span>Fonepay</span>
                  <span>•</span>
                  <span>eSewa</span>
                  <span>•</span>
                  <span>Khalti</span>
                  <span>•</span>
                  <span>IPS Pay</span>
                </div>
              </div>

              {/* Steps/Instructions */}
              <div className="bg-brand-50/30 dark:bg-legal-navy/20 p-4 rounded-2xl border border-legal-gold/10 space-y-2">
                <h5 className="text-[11px] font-bold uppercase text-legal-gold tracking-wide font-sans">Instructions:</h5>
                <ol className="list-decimal pl-4 text-xs text-legal-navy/75 dark:text-brand-200/75 space-y-1.5 font-sans">
                  <li>Open your preferred digital wallet or mobile banking app.</li>
                  <li>Scan the merchant QR code above and transfer exactly <strong className="text-legal-navy dark:text-brand-50">Rs. {selectedLawyerForBooking.ticket_price || 500}</strong>.</li>
                  <li>After completion, enter the Reference/Transaction ID below to verify and finalize scheduling.</li>
                </ol>
              </div>

              {/* Input for Reference ID */}
              <div className="space-y-1.5 font-sans">
                <label className="text-[11px] font-bold uppercase tracking-wider text-legal-navy/60 dark:text-brand-300/60">
                  Transaction / Reference ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN-9842610A"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/25 bg-brand-50/20 dark:bg-legal-navy/30 text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-brand-50 placeholder:text-legal-navy/30 dark:placeholder:text-brand-300/30 font-mono tracking-wide"
                />
                <p className="text-[10px] text-amber-500/80 font-sans italic mt-1 leading-normal">
                  * Note: Real-time API validation is mocked for testing. Any transaction code will simulate verification.
                </p>
              </div>

            </div>

            {/* Modal Footer / Action Button */}
            <div className="bg-brand-50/40 dark:bg-legal-navy/30 p-4 border-t border-legal-gold/15">
              {isVerifying ? (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-legal-navy dark:bg-legal-gold text-white dark:text-legal-navy-dark font-bold text-xs uppercase tracking-widest cursor-not-allowed opacity-75 animate-pulse font-sans"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Payment...
                </button>
              ) : verificationSuccess ? (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white font-bold text-xs uppercase tracking-widest cursor-not-allowed font-sans"
                >
                  <Check className="h-4 w-4" />
                  Payment Confirmed! Redirecting...
                </button>
              ) : (
                <button
                  onClick={handleProceedBooking}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366] hover:bg-[#22c35e] text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 cursor-pointer shadow-green-900/10 hover:shadow-lg font-sans"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Verify & Chat on WhatsApp
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
