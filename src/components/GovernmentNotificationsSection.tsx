import React, { useState } from 'react';
import {
  Landmark,
  FileText,
  Calendar,
  Users,
  MapPin,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Search,
  Award,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { JobListing } from '../types';

interface GovernmentNotificationsSectionProps {
  notifications: JobListing[];
  savedJobIds: string[];
  appliedJobIds: string[];
  onToggleSave: (jobId: string) => void;
  onSelectJob: (job: JobListing) => void;
  onQuickTrackVisit: (job: JobListing) => void;
}

export const GovernmentNotificationsSection: React.FC<
  GovernmentNotificationsSectionProps
> = ({
  notifications,
  savedJobIds,
  appliedJobIds,
  onToggleSave,
  onSelectJob,
  onQuickTrackVisit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const filtered = notifications.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.company.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      (item.advtNumber || '').toLowerCase().includes(q) ||
      item.skills.some((s) => s.toLowerCase().includes(q));

    const matchesDept =
      selectedDept === 'All' ||
      item.company.toLowerCase().includes(selectedDept.toLowerCase()) ||
      item.department.toLowerCase().includes(selectedDept.toLowerCase());

    return matchesQuery && matchesDept;
  });

  const totalVacancies = filtered.reduce(
    (acc, item) => acc + (item.vacancies || 0),
    0
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Official Government Notifications Hero Banner */}
      <div className="bg-slate-900 rounded-xl p-6 sm:p-8 text-white border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-mono-tech uppercase tracking-wider font-semibold">
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Public Sector &amp; Central Govt Gazette</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            Government Job Notifications &amp; Direct Recruitment Portals
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Verified recruitment notifications from ISRO, NIC (MeitY), DRDO, UPSC, SBI, SSC, and Federal Agencies. Review advertisement numbers, vacancy counts, pay matrix levels, and click{' '}
            <strong className="text-white">Visit Official Portal to Apply</strong> to go directly to the government application page.
          </p>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4">
            <div className="text-[11px] font-mono-tech uppercase text-slate-400">
              Active Notifications
            </div>
            <div className="text-2xl font-mono-tech font-bold text-white mt-1">
              {filtered.length}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Portals
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4">
            <div className="text-[11px] font-mono-tech uppercase text-slate-400">
              Total Vacancies
            </div>
            <div className="text-2xl font-mono-tech font-bold text-amber-400 mt-1">
              {totalVacancies.toLocaleString()}+
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Open Gazetted &amp; Tech Posts
            </div>
          </div>
        </div>
      </div>

      {/* Search & Organization Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Organization (ISRO, DRDO, NIC, SBI, UPSC), Advt. No., or post title..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'ISRO', 'NIC', 'DRDO', 'SBI', 'UPSC', 'SSC', 'USAJOBS'].map(
            (org) => (
              <button
                key={org}
                type="button"
                onClick={() => setSelectedDept(org)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  selectedDept === org
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {org}
              </button>
            )
          )}
        </div>
      </div>

      {/* Government Notifications List */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const isSaved = savedJobIds.includes(item.id);
          const hasApplied = appliedJobIds.includes(item.id);

          return (
            <article
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 p-6 shadow-2xs hover:shadow-md transition-all space-y-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-13 h-13 rounded-xl flex items-center justify-center text-white font-display font-bold text-base shrink-0 shadow-xs"
                    style={{ backgroundColor: item.companyColor || '#1D4ED8' }}
                  >
                    {item.companyLogo || 'GV'}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono-tech font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        <FileText className="w-3 h-3 text-amber-700" />
                        {item.advtNumber || 'Official Notification'}
                      </span>
                      <span className="text-xs font-bold text-blue-700">
                        {item.department}
                      </span>
                      {item.vacancies && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono-tech font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Users className="w-3 h-3 text-emerald-600" />
                          {item.vacancies.toLocaleString()} Vacancies
                        </span>
                      )}
                      {hasApplied && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono-tech font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Portal Visited / Tracked
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onSelectJob(item)}
                      className="text-lg sm:text-xl font-bold text-slate-900 hover:text-blue-600 font-display cursor-pointer transition-colors"
                    >
                      {item.title}
                    </h3>

                    <p className="text-xs font-semibold text-slate-700">
                      {item.company}
                    </p>
                  </div>
                </div>

                {/* Action Buttons: Save, View Notification Details, Visit Official Page to Apply */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleSave(item.id)}
                    className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                    title={isSaved ? 'Saved Notification' : 'Save Notification'}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectJob(item)}
                    className="px-3.5 py-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Full Notification Details
                  </button>

                  {item.applyUrl && (
                    <a
                      href={item.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onQuickTrackVisit(item)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <span>
                        Visit {item.officialPortalName || 'Official Page'} to Apply
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Key Notification Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Pay Scale / Matrix Level
                    </span>
                    <span className="font-mono-tech font-bold text-slate-900">
                      {item.salaryFormatted}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Posting Location / Cadre
                    </span>
                    <span className="font-semibold text-slate-900">
                      {item.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Last Date to Apply Online
                    </span>
                    <span className="font-mono-tech font-bold text-red-700">
                      {item.applicationDeadline
                        ? new Date(item.applicationDeadline).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )
                        : 'Open Until Filled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description & Eligibility Preview */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap gap-1.5">
                  {item.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-0.5 rounded text-xs font-mono-tech bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <span className="text-[11px] font-mono-tech text-slate-500">
                  Official Portal: {item.officialPortalName || 'gov.in'}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
