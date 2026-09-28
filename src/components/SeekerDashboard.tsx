import React, { useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Sparkles,
  Trash2,
  ArrowUpRight,
  UserCheck,
  Award,
} from 'lucide-react';
import {
  ApplicationStatus,
  ExperienceLevel,
  JobApplication,
  JobListing,
  UserProfile,
} from '../types';

interface SeekerDashboardProps {
  userProfile: UserProfile | null;
  jobs: JobListing[];
  savedJobIds: string[];
  applications: JobApplication[];
  activeSkills: string[];
  headline: string;
  experienceLevel: ExperienceLevel;
  onSelectJob: (job: JobListing) => void;
  onToggleSave: (jobId: string) => void;
  onUpdateApplicationStatus: (
    applicationId: string,
    status: ApplicationStatus
  ) => Promise<void>;
  onDeleteApplication: (applicationId: string) => Promise<void>;
  onNavigateToAI: () => void;
  onNavigateToExplore: () => void;
}

export const SeekerDashboard: React.FC<SeekerDashboardProps> = ({
  userProfile,
  jobs,
  savedJobIds,
  applications,
  activeSkills,
  headline,
  experienceLevel,
  onSelectJob,
  onToggleSave,
  onUpdateApplicationStatus,
  onDeleteApplication,
  onNavigateToAI,
  onNavigateToExplore,
}) => {
  const [subTab, setSubTab] = useState<'applied' | 'saved'>('applied');

  const savedJobs = jobs.filter((job) => savedJobIds.includes(job.id));

  const statusStyles: Record<ApplicationStatus, string> = {
    Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    'Under Review': 'bg-amber-50 text-amber-800 border-amber-200',
    Interviewing: 'bg-purple-50 text-purple-800 border-purple-200',
    Offered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Candidate Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-600 text-white font-display font-bold text-xl flex items-center justify-center shrink-0 shadow-xs">
            {(userProfile?.displayName || 'Candidate').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                {userProfile?.displayName || 'Job Seeker Workspace'}
              </h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono-tech font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {experienceLevel}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">{headline}</p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {activeSkills.slice(0, 7).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded text-[11px] font-mono-tech bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onNavigateToAI}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Edit Skills &amp; AI Match</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToExplore}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Browse More Jobs</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Applied Roles</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-bold font-mono-tech text-slate-900 mt-2">
            {applications.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Active applications in pipeline
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Saved Jobs</span>
            <Bookmark className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-bold font-mono-tech text-slate-900 mt-2">
            {savedJobs.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Bookmarked for quick review
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Interview Stage</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold font-mono-tech text-slate-900 mt-2">
            {
              applications.filter(
                (a) => a.status === 'Interviewing' || a.status === 'Offered'
              ).length
            }
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Interviews or offers in progress
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Verified Skills</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-bold font-mono-tech text-slate-900 mt-2">
            {activeSkills.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Indexed for AI job recommendations
          </p>
        </div>
      </div>

      {/* Sub-navigation Tabs: Applied vs Saved Jobs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 px-6 pt-4 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setSubTab('applied')}
            className={`pb-3.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              subTab === 'applied'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Applied Jobs ({applications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('saved')}
            className={`pb-3.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              subTab === 'saved'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Bookmarks ({savedJobs.length})</span>
          </button>
        </div>

        <div className="p-6">
          {subTab === 'applied' ? (
            applications.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  No applications submitted yet
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Explore open full-time roles and internships, click on any listing to view details, and hit &ldquo;Apply Now&rdquo; to track your progress here.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToExplore}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <span>Explore Open Roles</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const matchedJob = jobs.find((j) => j.id === app.jobId);
                  return (
                    <div
                      key={app.id}
                      className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/40"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-blue-600">
                            {app.company}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500">
                            {app.jobType}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-mono-tech text-slate-700 font-semibold">
                            {app.salaryFormatted}
                          </span>
                        </div>

                        <h4
                          onClick={() => matchedJob && onSelectJob(matchedJob)}
                          className="text-base font-bold text-slate-900 hover:text-blue-600 font-display cursor-pointer"
                        >
                          {app.jobTitle}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {app.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Applied{' '}
                            {new Date(app.appliedAt).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase">
                            Stage:
                          </label>
                          <select
                            value={app.status}
                            onChange={(e) =>
                              onUpdateApplicationStatus(
                                app.id,
                                e.target.value as ApplicationStatus
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border outline-none cursor-pointer ${
                              statusStyles[app.status]
                            }`}
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Offered">Offered</option>
                          </select>
                        </div>

                        {matchedJob && (
                          <button
                            type="button"
                            onClick={() => onSelectJob(matchedJob)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                          >
                            <span>Details</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteApplication(app.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Withdraw Application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : savedJobs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                No saved jobs yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click the bookmark icon on any job card while browsing to save roles and internships for later comparison.
              </p>
              <button
                type="button"
                onClick={onNavigateToExplore}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                <span>Browse Jobs</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 rounded-xl border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-blue-600">
                          {job.company}
                        </span>
                        <h4
                          onClick={() => onSelectJob(job)}
                          className="text-base font-bold text-slate-900 hover:text-blue-600 font-display cursor-pointer"
                        >
                          {job.title}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleSave(job.id)}
                        className="text-xs font-medium text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-mono-tech font-semibold text-slate-900">
                        <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                        {job.salaryFormatted}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {job.jobType}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {job.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded text-[11px] font-mono-tech bg-slate-100 text-slate-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectJob(job)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <span>View &amp; Apply</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
