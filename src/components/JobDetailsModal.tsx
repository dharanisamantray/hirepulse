import React, { useState } from 'react';
import {
  X,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  Send,
  ArrowLeft,
  Award,
  Users,
  Globe,
} from 'lucide-react';
import { JobListing, UserProfile } from '../types';
import { generateTailoredCoverNote } from '../services/aiService';

interface JobDetailsModalProps {
  job: JobListing | null;
  userProfile: UserProfile | null;
  activeSkills: string[];
  isSaved: boolean;
  hasApplied: boolean;
  onClose: () => void;
  onToggleSave: (jobId: string) => void;
  onSubmitApplication: (
    job: JobListing,
    formData: {
      applicantName: string;
      applicantEmail: string;
      phone: string;
      portfolioUrl: string;
      resumeSummary: string;
      coverNote: string;
    }
  ) => Promise<void>;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  userProfile,
  activeSkills,
  isSaved,
  hasApplied,
  onClose,
  onToggleSave,
  onSubmitApplication,
}) => {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicantName, setApplicantName] = useState(
    userProfile?.displayName || ''
  );
  const [applicantEmail, setApplicantEmail] = useState(
    userProfile?.email || ''
  );
  const [phone, setPhone] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeSummary, setResumeSummary] = useState(
    userProfile?.bio ||
      `Experienced in ${activeSkills.slice(0, 5).join(', ')} with a strong track record of shipping high-impact software.`
  );
  const [coverNote, setCoverNote] = useState('');
  const [generatingCover, setGeneratingCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!job) return null;

  const normalizedUserSkills = activeSkills.map((s) => s.toLowerCase().trim());
  const matchedSkills = job.skills.filter((skill) =>
    normalizedUserSkills.some(
      (u) =>
        skill.toLowerCase().includes(u) || u.includes(skill.toLowerCase())
    )
  );
  const matchPercentage =
    job.skills.length > 0
      ? Math.min(
          98,
          Math.max(55, Math.round((matchedSkills.length / job.skills.length) * 85 + 15))
        )
      : 78;

  const handleOpenApplyForm = () => {
    setApplicantName(userProfile?.displayName || '');
    setApplicantEmail(userProfile?.email || '');
    setResumeSummary(
      userProfile?.bio ||
        `Proficient in ${activeSkills.slice(0, 5).join(', ')}. Passionate about building scalable products at ${job.company}.`
    );
    setShowApplyForm(true);
    setSubmittedSuccess(false);
  };

  const handleGenerateAICoverNote = async () => {
    setGeneratingCover(true);
    try {
      const note = await generateTailoredCoverNote(
        job,
        applicantName || userProfile?.displayName || 'Candidate',
        activeSkills,
        resumeSummary
      );
      setCoverNote(note);
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitApplication(job, {
        applicantName: applicantName.trim() || 'Alex Rivera',
        applicantEmail: applicantEmail.trim() || 'candidate@example.com',
        phone: phone.trim(),
        portfolioUrl: portfolioUrl.trim(),
        resumeSummary: resumeSummary.trim(),
        coverNote: coverNote.trim(),
      });
      setSubmittedSuccess(true);
      setShowApplyForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDate = new Date(job.postedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl h-full flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Action Bar */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Job Listings</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onToggleSave(job.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-blue-600" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Save Job</span>
                </>
              )}
            </button>

            {hasApplied || submittedSuccess ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Application Submitted</span>
              </span>
            ) : (
              <button
                onClick={handleOpenApplyForm}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Apply Now</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Job Header Card */}
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg shrink-0 shadow-xs"
                  style={{ backgroundColor: job.companyColor || '#2563EB' }}
                >
                  {job.companyLogo || job.company.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-blue-600">
                      {job.company}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-500">
                      {job.department}
                    </span>
                    {job.jobType === 'Internship' && (
                      <span className="px-2 py-0.5 text-[11px] font-mono-tech uppercase tracking-wider font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded">
                        Internship
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display mt-1">
                    {job.title}
                  </h1>
                </div>
              </div>

              {/* AI Skill Match Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-200 text-blue-800 shrink-0 self-start">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <div className="text-left">
                  <div className="text-xs font-mono-tech font-bold leading-none">
                    {matchPercentage}% Skill Match
                  </div>
                  <div className="text-[10px] text-blue-600 mt-0.5">
                    {matchedSkills.length} of {job.skills.length} skills aligned
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80">
              <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>Compensation</span>
                </div>
                <p className="text-sm font-mono-tech font-bold text-slate-900 mt-1">
                  {job.salaryFormatted}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Location</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {job.location}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({job.locationType})
                  </span>
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>Role Type</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {job.jobType} · {job.experienceLevel}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Posted</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {formattedDate}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Apply Now Drawer (When toggled) */}
          {showApplyForm && (
            <div className="p-6 rounded-xl bg-blue-50/60 border-2 border-blue-600 space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono-tech uppercase tracking-wider font-semibold text-blue-600">
                    Direct Application
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 font-display">
                    Apply to {job.company} — {job.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplyForm(false)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="alex@university.edu"
                      className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Portfolio / GitHub / LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Resume / Experience Highlights *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={resumeSummary}
                    onChange={(e) => setResumeSummary(e.target.value)}
                    placeholder="Summarize your relevant experience, key projects, and technical stack..."
                    className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Cover Note to Hiring Manager
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAICoverNote}
                      disabled={generatingCover}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {generatingCover
                          ? 'Drafting with Gemini AI...'
                          : 'Auto-Draft with AI'}
                      </span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Click 'Auto-Draft with AI' or write a brief note explaining why you're excited about this role..."
                    className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submitting ? 'Submitting Application...' : 'Submit Application'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Required Skills & Match Breakdown */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
              Required Skills &amp; Your Match Profile
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => {
                const isMatched = matchedSkills.includes(skill);
                return (
                  <span
                    key={skill}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono-tech font-medium border ${
                      isMatched
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {isMatched && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{skill}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Role Overview */}
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display mb-2.5">
              About the Role
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-[68ch]">
              {job.description}
            </p>
          </div>

          {/* Responsibilities */}
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display mb-3">
              What You Will Do
            </h3>
            <ul className="space-y-2.5">
              {job.responsibilities.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display mb-3">
              Qualifications &amp; Requirements
            </h3>
            <ul className="space-y-2.5">
              {job.requirements.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display mb-3">
              Compensation &amp; Benefits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs font-medium text-slate-700"
                >
                  <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Call-to-Action Banner */}
          <div className="p-6 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-display font-bold text-base">
                Ready to take the next step with {job.company}?
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {job.applicantsCount || 24} candidates have applied • Direct review by hiring team
              </p>
            </div>
            {hasApplied || submittedSuccess ? (
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Applied</span>
              </span>
            ) : (
              <button
                onClick={handleOpenApplyForm}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer shrink-0"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
