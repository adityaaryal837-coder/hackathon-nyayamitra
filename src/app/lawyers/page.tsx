'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { dbService, Lawyer } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { 
  Briefcase, Star, Search, Filter, Phone, Mail, Award, CheckCircle2, 
  XCircle, Calendar, MessageSquare, AlertCircle, Clock, Loader2, Send 
} from 'lucide-react';

export default function LawyersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // State variables
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  
  // Consultation modal state
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultTitle, setConsultTitle] = useState('');
  const [consultMessage, setConsultMessage] = useState('');
  const [isSubmittingConsult, setIsSubmittingConsult] = useState(false);
  const [consultSuccess, setConsultSuccess] = useState(false);

  // Specializations defined
  const specializations = [
    'All',
    'Constitutional Law',
    'Fundamental Rights & Civil Law',
    'Criminal Defense & Human Rights',
    'Family Law & Gender Rights'
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
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
      console.error('Error fetching lawyers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConsultModal = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setIsConsultModalOpen(true);
    setConsultSuccess(false);
    setConsultTitle('');
    setConsultMessage('');
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLawyer || !consultTitle.trim() || !consultMessage.trim()) return;

    try {
      setIsSubmittingConsult(true);
      
      // Simulate booking & send notification in the user's dashboard
      if (user) {
        await dbService.createNotification(
          user.id,
          'Consultation Requested',
          `Your consultation request regarding "${consultTitle}" has been sent to ${selectedLawyer.name}. They will contact you shortly.`
        );
      }
      
      setConsultSuccess(true);
      setTimeout(() => {
        setIsConsultModalOpen(false);
        setConsultSuccess(false);
      }, 2000);
    } catch (e) {
      console.error('Error scheduling consultation:', e);
    } finally {
      setIsSubmittingConsult(false);
    }
  };

  // Filter lawyers list
  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSpec = selectedSpecialization === 'All' || lawyer.specialization === selectedSpecialization;
    const matchesSearch = lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lawyer.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (lawyer.bio && lawyer.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSpec && matchesSearch;
  });

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-legal-bone-light dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <Clock className="h-10 w-10 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Checking Credentials...</p>
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
              <Briefcase className="h-8 w-8 text-legal-gold" />
              Verified Lawyers Directory
            </h1>
            <p className="text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60 mt-1">
              Connect directly with qualified legal practitioners for highly accurate constitutional counsel and legal representation.
            </p>
          </div>
        </div>

        {/* AI Hallucination Warning Callout */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4 shadow-glass max-w-4xl">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 flex-shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-sans text-amber-500 uppercase tracking-wider">
              Verify with Legal Professionals
            </h4>
            <p className="text-xs font-sans text-legal-navy/80 dark:text-legal-bone/80 leading-relaxed">
              While <strong>Nyaya Mitra AI</strong> offers direct answers referencing the Constitution of Nepal, automated models can occasionally hallucinate or miss contextual intricacies. If you require legal documents or high-stakes representation, please consult these certified Advocates.
            </p>
          </div>
        </div>

        {/* Filter and Search Section */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-legal-navy-dark/10 dark:bg-legal-navy-dark/40 p-4 rounded-2xl border border-legal-gold/10">
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-navy/40 dark:text-legal-bone/40" />
            <input
              type="text"
              placeholder="Search by name, specialization, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/15 bg-legal-bone-light dark:bg-legal-navy/20 text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone-light"
            />
          </div>

          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="flex items-center gap-1 text-[11px] font-bold text-legal-gold uppercase tracking-wider mr-2">
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
                {spec.split(' ')[0]} {/* Shorten name for responsive view */}
              </button>
            ))}
          </div>
        </div>

        {/* Lawyers Grid */}
        {loading ? (
          <div className="flex py-20 items-center justify-center text-legal-gold">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-legal-gold" />
              <p className="text-xs uppercase tracking-widest font-sans font-bold">Loading directory...</p>
            </div>
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="glass-panel-light dark:glass-panel-dark rounded-2xl border border-legal-gold/15 py-16 text-center space-y-4 max-w-md mx-auto">
            <Briefcase className="h-10 w-10 text-legal-gold/30 mx-auto" />
            <h3 className="text-base font-bold text-legal-navy dark:text-legal-bone-light">No Advocates Found</h3>
            <p className="text-xs text-legal-navy/50 dark:text-legal-bone/50 px-6">
              No registered lawyers match your search query. Try broadening your filter tags or search terms.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
            {filteredLawyers.map((lawyer) => (
              <div 
                key={lawyer.id} 
                className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 hover:border-legal-gold/25 transition-all flex flex-col justify-between space-y-6 shadow-glass relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Avatar & Availability Block */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-legal-gold/10 border border-legal-gold/25 flex items-center justify-center text-legal-gold font-serif font-bold text-lg">
                        {lawyer.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light">
                          {lawyer.name}
                        </h3>
                        <p className="text-[11px] font-sans text-legal-gold font-semibold uppercase tracking-wider">
                          {lawyer.specialization}
                        </p>
                      </div>
                    </div>

                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border
                      ${lawyer.is_available 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                        : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                    >
                      {lawyer.is_available ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {lawyer.is_available ? 'Available' : 'Busy'}
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed font-sans min-h-[48px]">
                    {lawyer.bio || 'Verified legal consultant specializing in rights violations, constitutional issues, and civil litigation representation.'}
                  </p>

                  {/* Rating & Stats */}
                  <div className="grid grid-cols-2 gap-4 bg-legal-navy-dark/5 dark:bg-legal-navy/20 p-3.5 rounded-xl border border-legal-gold/5 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-legal-navy/40 dark:text-legal-bone/40 block font-sans">
                        Experience
                      </span>
                      <span className="font-semibold text-legal-navy dark:text-legal-bone-light flex items-center gap-1">
                        <Award className="h-4 w-4 text-legal-gold" />
                        {lawyer.experience_years} Years
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-legal-navy/40 dark:text-legal-bone/40 block font-sans">
                        Rating Score
                      </span>
                      <span className="font-semibold text-legal-navy dark:text-legal-bone-light flex items-center gap-1">
                        <Star className="h-4 w-4 text-legal-gold fill-legal-gold" />
                        {lawyer.rating.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Actions & Form Opener */}
                <div className="border-t border-legal-gold/10 pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="flex flex-col space-y-1 text-[11px] text-legal-navy/55 dark:text-legal-bone/55">
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

                  <button
                    onClick={() => handleOpenConsultModal(lawyer)}
                    disabled={!lawyer.is_available}
                    className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-legal-navy dark:bg-legal-bone text-legal-bone-light dark:text-legal-navy border border-legal-gold/30 hover:border-legal-gold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Calendar className="h-4 w-4 text-legal-gold" />
                    Consult Advocate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CONSULTATION REQUEST MODAL */}
      {isConsultModalOpen && selectedLawyer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-legal-bone-light dark:bg-legal-navy-dark border border-legal-gold/30 rounded-2xl max-w-md w-full p-6 md:p-8 space-y-6 relative shadow-2xl">
            <div className="flex justify-between items-center border-b border-legal-gold/10 pb-4">
              <h2 className="font-serif text-xl font-extrabold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                <Calendar className="h-5.5 w-5.5 text-legal-gold" />
                Schedule Consultation
              </h2>
              <button
                onClick={() => setIsConsultModalOpen(false)}
                className="text-legal-navy/40 dark:text-legal-bone/40 hover:text-legal-gold text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {consultSuccess ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto animate-bounce" />
                <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light">
                  Consultation Requested!
                </h3>
                <p className="text-xs text-legal-navy/70 dark:text-legal-bone/70 max-w-xs mx-auto leading-relaxed">
                  Your request has been successfully dispatched. A notification has been registered to your dashboard notifications stream.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitConsultation} className="space-y-4">
                <div className="p-3 bg-legal-gold/10 border border-legal-gold/20 rounded-xl space-y-0.5 text-xs text-legal-navy dark:text-legal-bone-light">
                  <span className="font-bold text-legal-gold font-sans block uppercase text-[9px] tracking-wider">Advocate Assignee</span>
                  <p className="font-serif font-bold text-sm">{selectedLawyer.name}</p>
                  <p className="text-[11px] text-legal-navy/60 dark:text-legal-bone/60">{selectedLawyer.specialization}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-legal-gold uppercase tracking-wider block font-sans">
                    Consultation Subject / Case Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Guidance on Article 25 Encroachment claim"
                    value={consultTitle}
                    onChange={(e) => setConsultTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/15 bg-legal-bone-light dark:bg-legal-navy/20 text-xs text-legal-navy dark:text-legal-bone-light focus:outline-none focus:border-legal-gold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-legal-gold uppercase tracking-wider block font-sans">
                    Detailed Inquiry Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your legal issues, court details, or question. Please specify preferred times or contact method (phone/email)."
                    value={consultMessage}
                    onChange={(e) => setConsultMessage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/15 bg-legal-bone-light dark:bg-legal-navy/20 text-xs text-legal-navy dark:text-legal-bone-light focus:outline-none focus:border-legal-gold resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-legal-gold/10">
                  <button
                    type="button"
                    onClick={() => setIsConsultModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-legal-gold/20 text-legal-gold hover:bg-legal-gold/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingConsult}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-gold-glow hover:scale-102 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingConsult ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
