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

interface FileUploadLog {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  rawFile?: File;
}

const CATEGORY_GROUPS = [
  {
    label: 'Existing Categories',
    options: [
      'Constitutional Rights',
      'Labor Law',
      'Property Law',
      'Criminal Law',
      'Civil Liberties',
    ],
  },
  {
    label: 'Social Issues',
    options: [
      'Gender Inequality',
      'Domestic Violence',
      'Child Abuse',
      'Human Trafficking',
      'Sexual Harassment',
      'Workplace Harassment',
      'Discrimination',
      'Elder Abuse',
      'Disability Rights',
      'Cyberbullying',
    ],
  },
  {
    label: 'Cyber & Digital Issues',
    options: [
      'Online Fraud',
      'Identity Theft',
      'Privacy Violations',
      'Cyber Crime',
      'Data Misuse',
      'Social Media Abuse',
    ],
  },
  {
    label: 'Public & Administrative Issues',
    options: [
      'Corruption',
      'Bribery',
      'Abuse of Authority',
      'Government Service Complaints',
      'Public Safety Concerns',
    ],
  },
  {
    label: 'Economic Issues',
    options: [
      'Consumer Rights',
      'Financial Fraud',
      'Labor Exploitation',
      'Wage Disputes',
    ],
  },
  {
    label: 'Environmental Issues',
    options: [
      'Illegal Waste Disposal',
      'Pollution',
      'Deforestation',
      'Water Contamination',
    ],
  },
  {
    label: 'Educational Issues',
    options: [
      'Bullying',
      'Ragging',
      'Unfair Treatment',
      'Academic Harassment',
    ],
  },
  {
    label: 'Healthcare Issues',
    options: [
      'Medical Negligence',
      'Unethical Practices',
      'Healthcare Accessibility Problems',
    ],
  },
  {
    label: 'Legal & Human Rights',
    options: [
      'Human Rights Violations',
      'Property Disputes',
      'Threats and Intimidation',
      'Violence and Assault',
    ],
  },
  {
    label: 'Other',
    options: ['Miscellaneous', 'Other'],
  },
];

export default function ReportIncident() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Constitutional Rights');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const MAX_DESC_CHARS = 3000;

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

      // 5. Show professional success notification (no confetti)
      setShowSuccess(true);

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
      }, 2500);

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
          <h1 className="text-heading text-3xl font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2.5">
            <FileWarning className="h-7 w-7 text-legal-gold flex-shrink-0" aria-hidden="true" />
            Report Incident
          </h1>
          <p className="text-body text-sm text-legal-navy/60 dark:text-legal-bone/60 mt-2">
            File human rights violations, wage theft claims, or lease disputes. All submissions are encrypted and handled confidentially.
          </p>
        </div>

        {/* Professional Success Banner */}
        {showSuccess && (
          <div className="success-toast max-w-2xl" role="status" aria-live="polite">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-sm font-inter">Complaint Submitted Successfully</p>
              <p className="text-xs mt-0.5 opacity-80 font-inter leading-relaxed">
                Your complaint has been submitted successfully. We will process it as soon as possible. You will be redirected to case tracking shortly.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="glass-panel-light dark:glass-panel-dark rounded-2xl border border-legal-gold/15 p-12 text-center space-y-6 max-w-2xl mx-auto py-24 shadow-gold-glow">
            <div className="relative mx-auto w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-legal-gold/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-legal-gold animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-legal-gold" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h3 className="text-heading text-xl font-bold text-legal-navy dark:text-legal-bone-light">
                Consulting Nyaya Mitra AI...
              </h3>
              <p className="text-body text-xs text-legal-navy/60 dark:text-legal-bone/60 max-w-sm mx-auto">
                Our models are auditing your report details, generating urgency priority levels, calculating case readiness metrics, and drafting step-by-step action plans.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <div className="glass-panel-light dark:glass-panel-dark p-6 sm:p-8 rounded-2xl border border-legal-gold/15 shadow-glass">
                <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                  {errorMsg && (
                    <div 
                      className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl flex items-start gap-2.5"
                      role="alert"
                      aria-live="assertive"
                    >
                      <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      {errorMsg}
                    </div>
                  )}

                  {/* Title */}
                  <div className="space-y-2">
                    <label 
                      htmlFor="incident-title"
                      className="text-label block text-legal-gold"
                    >
                      Incident Title <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <input
                      id="incident-title"
                      type="text"
                      placeholder="e.g. Missing wage payments for April 2026 at Zenith IT"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input"
                      required
                      aria-required="true"
                      aria-describedby="title-hint"
                    />
                    <p id="title-hint" className="text-caption text-legal-navy/40 dark:text-legal-bone/40">
                      Keep it concise and specific to the incident.
                    </p>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label 
                      htmlFor="incident-category"
                      className="text-label block text-legal-gold"
                    >
                      Incident Category <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <select
                      id="incident-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="form-select"
                      aria-required="true"
                    >
                      {CATEGORY_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <p className="text-caption text-legal-navy/40 dark:text-legal-bone/40">
                      Select the category that best describes your complaint.
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label 
                      htmlFor="incident-description"
                      className="text-label block text-legal-gold"
                    >
                      Detailed Testimony / Facts <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <textarea
                      id="incident-description"
                      placeholder="Include names, exact timelines, location details, amounts due, and context. The AI legal analyzer evaluates completeness."
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC_CHARS))}
                      rows={9}
                      className="form-input resize-none"
                      required
                      aria-required="true"
                      aria-describedby="desc-count desc-hint"
                    />
                    <div className="flex justify-between items-center">
                      <p id="desc-hint" className="text-caption text-legal-navy/40 dark:text-legal-bone/40">
                        More detail improves your AI readiness score.
                      </p>
                      <p 
                        id="desc-count" 
                        className={`text-caption tabular-nums ${description.length >= MAX_DESC_CHARS ? 'text-red-500' : 'text-legal-navy/40 dark:text-legal-bone/40'}`}
                        aria-label={`${description.length} of ${MAX_DESC_CHARS} characters used`}
                      >
                        {description.length}/{MAX_DESC_CHARS}
                      </p>
                    </div>
                  </div>

                  {/* Evidence uploads */}
                  <div className="space-y-3">
                    <label className="text-label block text-legal-gold">
                      Attach Evidence
                      <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-legal-navy/40 dark:text-legal-bone/40">(Optional — Contracts, Receipts, Bank Statements, Chats)</span>
                    </label>
                    
                    {/* Drag Zone */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? fileInputRef.current?.click() : null}
                      role="button"
                      tabIndex={0}
                      aria-label="Click to upload evidence files"
                      className="border-2 border-dashed border-legal-gold/25 hover:border-legal-gold/55 rounded-xl p-8 text-center cursor-pointer bg-legal-navy/3 hover:bg-legal-gold/4 transition-all duration-200 flex flex-col items-center justify-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-legal-gold/40"
                    >
                      <div className="p-3 rounded-xl bg-legal-gold/10 group-hover:bg-legal-gold/15 transition-colors">
                        <Upload className="h-6 w-6 text-legal-gold" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-semibold text-legal-navy/80 dark:text-legal-bone font-inter">
                        Click to select files
                      </span>
                      <span className="text-caption text-legal-navy/40 dark:text-legal-bone/40">
                        PDF, PNG, JPG, or DOCX — Max 10MB per file
                      </span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.docx"
                        className="hidden"
                        aria-hidden="true"
                      />
                    </div>

                    {/* Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2 pt-1" role="list" aria-label="Attached files">
                        {uploadedFiles.map((file, idx) => (
                          <div 
                            key={idx}
                            role="listitem"
                            className="flex items-center justify-between p-3 rounded-xl bg-legal-navy/6 dark:bg-legal-bone/5 border border-legal-gold/12 hover:border-legal-gold/25 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-legal-gold/10 flex-shrink-0">
                                <FileText className="h-4 w-4 text-legal-gold" aria-hidden="true" />
                              </div>
                              <div className="truncate">
                                <span className="text-sm font-medium block truncate text-legal-navy dark:text-legal-bone-light font-inter">{file.name}</span>
                                <span className="text-caption text-legal-navy/40 dark:text-legal-bone/40 block">{(file.size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              aria-label={`Remove ${file.name}`}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submission triggers */}
                  <div className="pt-6 border-t border-legal-gold/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    {/* Anonymous Toggle */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-legal-navy/8 dark:bg-legal-bone/10 rounded-xl text-legal-gold border border-legal-gold/20 flex-shrink-0">
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="text-left">
                          <span className="text-label text-legal-gold block">
                            File Anonymously
                          </span>
                          <span className="text-caption text-legal-navy/40 dark:text-legal-bone/40 block mt-0.5">
                            Identity is fully scrubbed
                          </span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isAnonymous}
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        aria-label="Toggle anonymous filing"
                        className={`relative w-12 h-6 rounded-full p-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-legal-gold/50 flex-shrink-0
                          ${isAnonymous ? 'bg-legal-gold' : 'bg-legal-navy-dark/25 dark:bg-legal-bone/15'}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300
                          ${isAnonymous ? 'translate-x-6' : 'translate-x-0'}`} 
                        />
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-gold-glow hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-legal-gold/60 font-inter"
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
                <h3 className="text-heading text-base text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-legal-gold flex-shrink-0" aria-hidden="true" />
                  Security Guarantee
                </h3>
                <p className="text-body text-xs text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed">
                  We hold privacy as a fundamental pillar of justice. By enabling <strong className="text-legal-gold">File Anonymously</strong>, your case will be registered without your profile linkage, ensuring even system administrators cannot associate your user account with the report content.
                </p>
              </div>

              <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 space-y-4">
                <h3 className="text-heading text-base text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-gold flex-shrink-0" aria-hidden="true" />
                  What Happens Next?
                </h3>
                
                <ol className="space-y-4">
                  {[
                    'AI audits your report and creates compliance readiness scores.',
                    'The case timeline transitions to "Submitted" status.',
                    'Panel administrators initiate legal document reviews and add notes.',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="text-caption font-bold h-5 w-5 rounded-full bg-legal-gold/12 border border-legal-gold/28 text-legal-gold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-body text-xs text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Category Info Card */}
              <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 space-y-3">
                <h3 className="text-heading text-base text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-legal-gold flex-shrink-0" aria-hidden="true" />
                  Not Sure Which Category?
                </h3>
                <p className="text-body text-xs text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed">
                  Select the category closest to your situation. Our AI will refine the classification during analysis. You can always update it afterward from your case tracker.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
