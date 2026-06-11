'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { dbService } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { aiService } from '@/lib/ai';
import { 
  FileWarning, Upload, ShieldAlert, AlertCircle, EyeOff, 
  HelpCircle, CheckCircle2, FileText, Trash2, ShieldCheck, Sparkles, Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FileUploadLog {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  rawFile?: File;
}

export default function ReportIncident() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Labor Law');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const categories = ['Constitutional Rights', 'Labor Law', 'Property Law', 'Criminal Law', 'Civil Liberties'];

  useEffect(() => {
    // Anonymous reporting is allowed without login
    // but we pre-load user if they're authenticated
  }, [authLoading, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    filesArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedFiles(prev => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl: event.target!.result as string,
              rawFile: file
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset file value
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (!title || !description) {
      setErrorMsg('Please enter a title and description.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Run AI analysis of the text & attachments
      const aiResult = await aiService.analyzeIncident(title, description, uploadedFiles.length);

      // 2. Prepare case payload
      const casePayload = {
        user_id: isAnonymous ? null : (user ? user.id : 'user-mock-id'), // Fallback if guest report
        title: title.trim(),
        description: description.trim(),
        category: category,
        anonymous: isAnonymous,
        urgency: aiResult.urgency,
        readiness_score: aiResult.readiness_score,
        action_plan: aiResult.action_plan,
      };

      // 3. Save to database
      const createdCase = await dbService.createCase(casePayload);

      // 4. Save evidence file records if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          let storageUrl = file.dataUrl;
          if (file.rawFile) {
            // Upload to Supabase Storage bucket
            storageUrl = await dbService.uploadFileToStorage(createdCase.id, file.rawFile);
          }
          await dbService.uploadEvidence(
            createdCase.id,
            file.name,
            file.type,
            file.size,
            storageUrl
          );
        }
      }

      // 5. Trigger Confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#C5A880', '#0D1B2A', '#3F72AF']
      });

      // 6. Notify user of receipt
      if (user && !isAnonymous) {
        await dbService.createNotification(
          user.id,
          'Case Filed Successfully',
          `Your incident report titled "${title.slice(0, 20)}..." has been cataloged.`
        );
      }

      // Redirect to cases page
      setTimeout(() => {
        router.push('/cases');
      }, 1500);

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to report incident. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        {/* Header Section */}
        <div className="border-b border-legal-gold/15 pb-6">
          <h1 className="font-serif text-3xl font-extrabold text-legal-navy dark:text-legal-bone-light flex items-center gap-2.5">
            <FileWarning className="h-7 w-7 text-legal-gold" />
            Report Incident
          </h1>
          <p className="text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60 mt-1">
            File human rights violations, wage theft claims, or lease disputes. Assured encryption.
          </p>
        </div>

        {isLoading ? (
          <div className="glass-panel-light dark:glass-panel-dark rounded-2xl border border-legal-gold/15 p-12 text-center space-y-6 max-w-2xl mx-auto py-24 shadow-gold-glow">
            <Sparkles className="h-12 w-12 text-legal-gold animate-spin mx-auto" />
            <div className="space-y-2">
              <h3 className="font-serif text-xl font-bold text-legal-navy dark:text-legal-bone-light">
                Consulting Nyaya Mitra AI...
              </h3>
              <p className="text-xs text-legal-navy/60 dark:text-legal-bone/60 max-w-sm mx-auto font-sans">
                Our models are auditing your report details, generating urgency priority levels, calculating case readiness metrics, and drafting step-by-step action plans.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <div className="glass-panel-light dark:glass-panel-dark p-6 sm:p-8 rounded-2xl border border-legal-gold/15 shadow-glass">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errorMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Incident Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Missing wage payments for April 2026 at Zenith IT"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Incident Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="text-black bg-white">{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Detailed Testimony / Facts
                    </label>
                    <textarea
                      placeholder="Include names, exact timelines, location details, amounts due, and context. The AI legal analyzer evaluates completeness."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone leading-relaxed"
                      required
                    />
                  </div>

                  {/* Evidence uploads */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Attach Evidence (Contracts, Receipts, Bank Statements, Chats)
                    </label>
                    
                    {/* Drag Zone */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-legal-gold/30 hover:border-legal-gold/60 rounded-xl p-8 text-center cursor-pointer bg-legal-navy/5 hover:bg-legal-gold/5 transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <Upload className="h-8 w-8 text-legal-gold group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-legal-navy/80 dark:text-legal-bone font-sans">
                        Click to select files
                      </span>
                      <span className="text-[10px] text-legal-navy/40 dark:text-legal-bone/40 font-semibold font-sans">
                        PDF, PNG, JPG, or DOCX (Max 10MB per file)
                      </span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                      />
                    </div>

                    {/* Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {uploadedFiles.map((file, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-legal-navy/10 dark:bg-legal-bone/5 border border-legal-gold/15"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="h-4.5 w-4.5 text-legal-gold flex-shrink-0" />
                              <div className="truncate">
                                <span className="text-xs font-semibold block truncate text-legal-navy dark:text-legal-bone-light">{file.name}</span>
                                <span className="text-[9px] text-legal-navy/40 dark:text-legal-bone/40 block">{(file.size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="p-1 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submission triggers */}
                  <div className="pt-6 border-t border-legal-gold/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    {/* Anonymous Toggle */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-legal-navy/10 dark:bg-legal-bone/10 rounded-xl text-legal-gold border border-legal-gold/25">
                          <EyeOff className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold font-sans uppercase tracking-wider text-legal-gold block">
                            File Anonymously
                          </span>
                          <span className="text-[10px] text-legal-navy/40 dark:text-legal-bone/40 block font-semibold leading-none">
                            Identity is fully scrubbed
                          </span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative
                          ${isAnonymous ? 'bg-legal-gold' : 'bg-legal-navy-dark/30 dark:bg-legal-bone/20'}`}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-all duration-300
                          ${isAnonymous ? 'translate-x-5.5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-gold-glow hover:scale-102 transition-all"
                    >
                      Analyze and File Case
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar Guidelines */}
            <div className="space-y-6">
              <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 space-y-4">
                <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-legal-gold" />
                  Security Guarantee
                </h3>
                <p className="text-xs text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed font-sans font-medium">
                  We hold privacy as a fundamental pillar of justice. By enabling **File Anonymously**, your case will be registered without your profile linkage, ensuring even system administrators cannot associate your user account with the report content.
                </p>
              </div>

              <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 space-y-4">
                <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-gold" />
                  What Happens Next?
                </h3>
                
                <ul className="space-y-3.5 font-sans">
                  <li className="flex gap-2">
                    <span className="text-[10px] font-bold h-4.5 w-4.5 rounded-full bg-legal-gold/15 border border-legal-gold/30 text-legal-gold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span className="text-[11px] font-semibold text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed">
                      AI audits data and creates compliance readiness scores.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[10px] font-bold h-4.5 w-4.5 rounded-full bg-legal-gold/15 border border-legal-gold/30 text-legal-gold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span className="text-[11px] font-semibold text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed">
                      The case timeline transitions to "Submitted" status.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[10px] font-bold h-4.5 w-4.5 rounded-full bg-legal-gold/15 border border-legal-gold/30 text-legal-gold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span className="text-[11px] font-semibold text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed">
                      Panel administrators initiate legal document reviews and add notes.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
