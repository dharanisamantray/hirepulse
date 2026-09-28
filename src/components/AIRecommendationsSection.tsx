import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Plus,
  X,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  RefreshCw,
  FileText,
  MapPin,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import {
  AIJobRecommendation,
  ExperienceLevel,
  JobListing,
} from '../types';
import { POPULAR_SKILLS } from '../data/sampleJobs';
import {
  extractSkillsWithAI,
  getAIJobRecommendations,
} from '../services/aiService';

interface AIRecommendationsSectionProps {
  jobs: JobListing[];
  activeSkills: string[];
  headline: string;
  experienceLevel: ExperienceLevel;
  savedJobIds: string[];
  appliedJobIds: string[];
  onUpdateSkillsAndProfile: (
    skills: string[],
    headline?: string,
    level?: ExperienceLevel
  ) => void;
  onSelectJob: (job: JobListing) => void;
  onToggleSave: (jobId: string) => void;
}

export const AIRecommendationsSection: React.FC<
  AIRecommendationsSectionProps
> = ({
  jobs,
  activeSkills,
  headline,
  experienceLevel,
  savedJobIds,
  appliedJobIds,
  onUpdateSkillsAndProfile,
  onSelectJob,
  onToggleSave,
}) => {
  const [customSkill, setCustomSkill] = useState('');
  const [localHeadline, setLocalHeadline] = useState(headline);
  const [localLevel, setLocalLevel] = useState<ExperienceLevel>(experienceLevel);
  const [resumeSnippet, setResumeSnippet] = useState('');
  const [showResumeExtractor, setShowResumeExtractor] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [recommendations, setRecommendations] = useState<
    AIJobRecommendation[]
  >([]);

  const runAIMatching = async (
    skillsToUse = activeSkills,
    headlineToUse = localHeadline,
    levelToUse = localLevel
  ) => {
    setLoadingAI(true);
    try {
      const recs = await getAIJobRecommendations(
        skillsToUse,
        headlineToUse,
        levelToUse,
        jobs
      );
      setRecommendations(recs);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    runAIMatching(activeSkills, localHeadline, localLevel);
  }, [jobs.length]);

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (
      !activeSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())
    ) {
      const updated = [...activeSkills, trimmed];
      onUpdateSkillsAndProfile(updated, localHeadline, localLevel);
      runAIMatching(updated, localHeadline, localLevel);
    }
    setCustomSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    const updated = activeSkills.filter((s) => s !== skill);
    onUpdateSkillsAndProfile(updated, localHeadline, localLevel);
    runAIMatching(updated, localHeadline, localLevel);
  };

  const handleExtractFromResume = async () => {
    if (!resumeSnippet.trim()) return;
    setExtracting(true);
    try {
      const result = await extractSkillsWithAI(resumeSnippet);
      const mergedSkills = Array.from(
        new Set([...result.skills, ...activeSkills])
      ).slice(0, 12);
      const validLevel = (
        ['Internship', 'Entry-Level', 'Mid-Level', 'Senior', 'Lead'].includes(
          result.suggestedLevel
        )
          ? result.suggestedLevel
          : localLevel
      ) as ExperienceLevel;

      setLocalHeadline(result.suggestedHeadline || localHeadline);
      setLocalLevel(validLevel);
      onUpdateSkillsAndProfile(
        mergedSkills,
        result.suggestedHeadline || localHeadline,
        validLevel
      );
      setShowResumeExtractor(false);
      setResumeSnippet('');
      await runAIMatching(
        mergedSkills,
        result.suggestedHeadline || localHeadline,
        validLevel
      );
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Hero Banner */}
      <div className="bg-slate-900 rounded-xl p-6 sm:p-8 text-white border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-mono-tech uppercase tracking-wider font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Gemini AI Career Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            AI-Powered Job &amp; Internship Recommendations
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Our AI engine analyzes your technical skills, seniority, and career focus against every open role to surface your highest-probability matches and personalized interview strategies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowResumeExtractor(!showResumeExtractor)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Paste Resume / Bio to Extract Skills</span>
          </button>

          <button
            type="button"
            onClick={() =>
              runAIMatching(activeSkills, localHeadline, localLevel)
            }
            disabled={loadingAI}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingAI ? 'animate-spin' : ''}`}
            />
            <span>
              {loadingAI ? 'Analyzing Matches...' : 'Recalculate AI Matches'}
            </span>
          </button>
        </div>
      </div>

      {/* Optional Resume / Bio AI Extractor Drawer */}
      {showResumeExtractor && (
        <div className="bg-blue-50/80 border-2 border-blue-600 rounded-xl p-6 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                AI Resume &amp; Bio Skill Extractor
              </h3>
              <p className="text-xs text-slate-600">
                Paste a paragraph from your resume, LinkedIn summary, or coursework and Gemini will automatically extract your technical skills and experience tier.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResumeExtractor(false)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <textarea
            rows={3}
            value={resumeSnippet}
            onChange={(e) => setResumeSnippet(e.target.value)}
            placeholder="Example: Computer Science junior at UC Berkeley experienced in building full-stack web apps with React, TypeScript, Python, and PyTorch. Built an LLM evaluation pipeline during my last hackathon..."
            className="w-full p-3.5 text-sm bg-white rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
          />

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleExtractFromResume}
              disabled={extracting || !resumeSnippet.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {extracting
                  ? 'Extracting Skills with AI...'
                  : 'Extract Skills & Match Jobs'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Skill & Career Profile Control Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-5 border-b border-slate-100">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Target Career Headline
            </label>
            <input
              type="text"
              value={localHeadline}
              onChange={(e) => {
                setLocalHeadline(e.target.value);
                onUpdateSkillsAndProfile(
                  activeSkills,
                  e.target.value,
                  localLevel
                );
              }}
              placeholder="e.g., Full-Stack Engineer / Product Designer"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Experience Level
            </label>
            <select
              value={localLevel}
              onChange={(e) => {
                const lvl = e.target.value as ExperienceLevel;
                setLocalLevel(lvl);
                onUpdateSkillsAndProfile(activeSkills, localHeadline, lvl);
                runAIMatching(activeSkills, localHeadline, lvl);
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:border-blue-600 outline-none"
            >
              <option value="Internship">Internship / Student</option>
              <option value="Entry-Level">Entry-Level / New Grad</option>
              <option value="Mid-Level">Mid-Level (2–5 yrs)</option>
              <option value="Senior">Senior (5+ yrs)</option>
              <option value="Lead">Staff / Lead</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Add Custom Skill
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddSkill(customSkill);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="e.g., Rust, Next.js, Kubernetes..."
                className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shrink-0"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Active User Skills */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your Active Skills ({activeSkills.length})
            </span>
            <span className="text-xs text-slate-400">
              Click any skill to remove or add from suggestions below
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-mono-tech font-medium shadow-2xs"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-blue-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Quick-Add Popular Skills */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">
              Quick add:
            </span>
            {POPULAR_SKILLS.filter(
              (s) =>
                !activeSkills.some(
                  (active) => active.toLowerCase() === s.toLowerCase()
                )
            )
              .slice(0, 10)
              .map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleAddSkill(skill)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/80 text-xs font-mono-tech transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{skill}</span>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      {loadingAI ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-6 w-48 bg-slate-200 rounded" />
                <div className="h-8 w-24 bg-blue-100 rounded-lg" />
              </div>
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
              <div className="h-16 w-full bg-slate-50 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recommendations.map((rec, index) => {
            const job = jobs.find((j) => j.id === rec.jobId) || jobs[index];
            if (!job) return null;

            const isSaved = savedJobIds.includes(job.id);
            const hasApplied = appliedJobIds.includes(job.id);

            return (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Top Row: Company Info + Match Score Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-display font-bold text-base shrink-0"
                        style={{ backgroundColor: job.companyColor || '#2563EB' }}
                      >
                        {job.companyLogo || job.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-600">
                            {job.company}
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-500">
                            {job.jobType}
                          </span>
                        </div>
                        <h3
                          onClick={() => onSelectJob(job)}
                          className="text-lg font-bold text-slate-900 hover:text-blue-600 font-display mt-0.5 cursor-pointer transition-colors"
                        >
                          {job.title}
                        </h3>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-right shrink-0 shadow-2xs">
                      <div className="text-sm font-mono-tech font-bold leading-none">
                        {rec.matchScore}% Match
                      </div>
                      <div className="text-[10px] text-blue-100 mt-0.5">
                        Rank #{index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Strip */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 font-mono-tech font-semibold text-slate-900">
                      <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                      {job.salaryFormatted}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location} ({job.locationType})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {job.experienceLevel}
                    </span>
                  </div>

                  {/* AI Analysis Box */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{rec.matchHeadline}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {rec.matchReason}
                    </p>
                    <div className="pt-2 border-t border-blue-200/60 flex items-start gap-2 text-xs text-blue-900">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-semibold">Interview Tip:</strong>{' '}
                        {rec.interviewTip}
                      </span>
                    </div>
                  </div>

                  {/* Matched & Missing Skills */}
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => {
                      const isMatched = rec.matchedSkills.some(
                        (m) => m.toLowerCase() === skill.toLowerCase()
                      );
                      return (
                        <span
                          key={skill}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono-tech font-medium border ${
                            isMatched
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {isMatched && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}
                          <span>{skill}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleSave(job.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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
                        <span>Save</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectJob(job)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>
                      {hasApplied ? 'View Application' : 'View Details & Apply'}
                    </span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
