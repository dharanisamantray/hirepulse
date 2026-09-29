import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  SlidersHorizontal,
  X,
  ArrowUpRight,
  Building2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, signOut } from './firebase';
import {
  ApplicationStatus,
  ExperienceLevel,
  FilterState,
  JobApplication,
  JobListing,
  OperationType,
  UserProfile,
  UserRole,
} from './types';
import { POPULAR_SKILLS, SAMPLE_JOBS } from './data/sampleJobs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ActiveTab, Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { JobDetailsModal } from './components/JobDetailsModal';
import { EmployerSection } from './components/EmployerSection';
import { AIRecommendationsSection } from './components/AIRecommendationsSection';
import { SeekerDashboard } from './components/SeekerDashboard';
import { N8nChatWidget } from './components/N8nChatWidget';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  // Auth & Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [guestSkills, setGuestSkills] = useState<string[]>([
    'React',
    'TypeScript',
    'Python',
    'Node.js',
    'SQL',
  ]);
  const [guestHeadline, setGuestHeadline] = useState(
    'Full-Stack Software Engineer'
  );
  const [guestLevel, setGuestLevel] = useState<ExperienceLevel>('Mid-Level');
  const [guestSavedJobIds, setGuestSavedJobIds] = useState<string[]>([
    'job-stripe-fe-01',
    'job-figma-intern-03',
  ]);
  const [guestApplications, setGuestApplications] = useState<JobApplication[]>([]);

  // Firestore Live Collections
  const [firestoreJobs, setFirestoreJobs] = useState<JobListing[]>([]);
  const [localPostedJobs, setLocalPostedJobs] = useState<JobListing[]>([]);
  const [firestoreApplications, setFirestoreApplications] = useState<
    JobApplication[]
  >([]);

  // Selected Job for Details & Apply Now Modal
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  // Search & Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    location: 'All',
    locationType: 'All',
    jobType: 'All',
    minSalary: 0,
    selectedSkills: [],
    experienceLevel: 'All',
    sortBy: 'newest',
  });

  // 1. Listen to public /jobs collection in Firestore
  useEffect(() => {
    const q = query(collection(db, 'jobs'), orderBy('postedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: JobListing[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as JobListing);
        });
        setFirestoreJobs(loaded);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'jobs');
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Listen to Firebase Auth state and sync /users/{uid} + /applications
  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubApps: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }
      if (unsubApps) {
        unsubApps();
        unsubApps = null;
      }

      if (!fbUser) {
        setUserProfile(null);
        setFirestoreApplications([]);
        return;
      }

      const userRef = doc(db, 'users', fbUser.uid);
      unsubUser = onSnapshot(
        userRef,
        async (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || 'user@hirepulse.io',
              displayName:
                fbUser.displayName ||
                fbUser.email?.split('@')[0] ||
                'HirePulse Member',
              photoURL: fbUser.photoURL || '',
              role: 'seeker',
              headline: guestHeadline,
              location: 'San Francisco, CA',
              experienceLevel: guestLevel,
              skills: guestSkills,
              savedJobIds: guestSavedJobIds,
              bio: 'Passionate software & product builder.',
              updatedAt: new Date().toISOString(),
            };
            try {
              await setDoc(userRef, newProfile);
              setUserProfile(newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
            }
          }
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
        }
      );

      const appsQuery = query(
        collection(db, 'applications'),
        where('applicantUid', '==', fbUser.uid)
      );
      unsubApps = onSnapshot(
        appsQuery,
        (snapshot) => {
          const apps: JobApplication[] = [];
          snapshot.forEach((d) => apps.push(d.data() as JobApplication));
          apps.sort(
            (a, b) =>
              new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
          );
          setFirestoreApplications(apps);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'applications');
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
      if (unsubApps) unsubApps();
    };
  }, []);

  // Combined Jobs Catalog (Firestore jobs + local session jobs + realistic sample jobs)
  const allJobs = useMemo(() => {
    const map = new Map<string, JobListing>();
    firestoreJobs.forEach((j) => map.set(j.id, j));
    localPostedJobs.forEach((j) => {
      if (!map.has(j.id)) map.set(j.id, j);
    });
    SAMPLE_JOBS.forEach((j) => {
      if (!map.has(j.id)) map.set(j.id, j);
    });
    return Array.from(map.values());
  }, [firestoreJobs, localPostedJobs]);

  const activeSkills = userProfile ? userProfile.skills : guestSkills;
  const activeHeadline =
    userProfile?.headline || guestHeadline || 'Full-Stack Engineer';
  const activeLevel: ExperienceLevel =
    (userProfile?.experienceLevel as ExperienceLevel) || guestLevel;
  const activeSavedJobIds = userProfile
    ? userProfile.savedJobIds
    : guestSavedJobIds;
  const activeApplications = userProfile
    ? firestoreApplications
    : guestApplications;
  const appliedJobIds = useMemo(
    () => activeApplications.map((a) => a.jobId),
    [activeApplications]
  );

  // Compute Skill Match Score for any job
  const getJobMatchScore = (job: JobListing): number => {
    const normalizedUser = activeSkills.map((s) => s.toLowerCase().trim());
    const matched = job.skills.filter((s) =>
      normalizedUser.some(
        (u) => s.toLowerCase().includes(u) || u.includes(s.toLowerCase())
      )
    );
    const ratio = job.skills.length > 0 ? matched.length / job.skills.length : 0.5;
    const bonus = job.experienceLevel === activeLevel ? 10 : 4;
    return Math.min(98, Math.max(52, Math.round(ratio * 82 + bonus)));
  };

  // Filtered & Sorted Jobs
  const filteredJobs = useMemo(() => {
    return allJobs
      .filter((job) => {
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchesTitle = job.title.toLowerCase().includes(q);
          const matchesCompany = job.company.toLowerCase().includes(q);
          const matchesDept = job.department.toLowerCase().includes(q);
          const matchesSkill = job.skills.some((s) =>
            s.toLowerCase().includes(q)
          );
          if (!matchesTitle && !matchesCompany && !matchesDept && !matchesSkill) {
            return false;
          }
        }

        if (filters.location !== 'All') {
          if (
            !job.location.toLowerCase().includes(filters.location.toLowerCase())
          ) {
            return false;
          }
        }

        if (filters.locationType !== 'All') {
          if (job.locationType !== filters.locationType) return false;
        }

        if (filters.jobType !== 'All') {
          if (job.jobType !== filters.jobType) return false;
        }

        if (filters.experienceLevel !== 'All') {
          if (job.experienceLevel !== filters.experienceLevel) return false;
        }

        if (filters.minSalary > 0) {
          if (job.salaryMax < filters.minSalary) return false;
        }

        if (filters.selectedSkills.length > 0) {
          const hasAllSelectedSkills = filters.selectedSkills.every((sel) =>
            job.skills.some((s) => s.toLowerCase() === sel.toLowerCase())
          );
          if (!hasAllSelectedSkills) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'salary-high') {
          return b.salaryMax - a.salaryMax;
        }
        if (filters.sortBy === 'match') {
          return getJobMatchScore(b) - getJobMatchScore(a);
        }
        return (
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        );
      });
  }, [allJobs, filters, activeSkills, activeLevel]);

  // Handlers
  const handleToggleSaveJob = async (jobId: string) => {
    const exists = activeSavedJobIds.includes(jobId);
    const updated = exists
      ? activeSavedJobIds.filter((id) => id !== jobId)
      : [...activeSavedJobIds, jobId];

    if (userProfile && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          savedJobIds: updated,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `users/${auth.currentUser.uid}`
        );
      }
    } else {
      setGuestSavedJobIds(updated);
    }

    showToast(
      exists ? 'Removed job from saved bookmarks' : 'Job saved to your dashboard'
    );
  };

  const handleUpdateSkillsAndProfile = async (
    newSkills: string[],
    newHeadline?: string,
    newLevel?: ExperienceLevel
  ) => {
    setGuestSkills(newSkills);
    if (newHeadline !== undefined) setGuestHeadline(newHeadline);
    if (newLevel !== undefined) setGuestLevel(newLevel);

    if (userProfile && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          skills: newSkills.slice(0, 45),
          headline: (newHeadline ?? userProfile.headline ?? '').slice(0, 190),
          experienceLevel: newLevel ?? userProfile.experienceLevel ?? 'Mid-Level',
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `users/${auth.currentUser.uid}`
        );
      }
    }
  };

  const handleSubmitApplication = async (
    job: JobListing,
    formData: {
      applicantName: string;
      applicantEmail: string;
      phone: string;
      portfolioUrl: string;
      resumeSummary: string;
      coverNote: string;
    }
  ) => {
    const appId = `app-${Date.now()}`;
    const newApp: JobApplication = {
      id: appId,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      salaryFormatted: job.salaryFormatted,
      applicantUid: auth.currentUser?.uid || 'guest-seeker',
      applicantName: formData.applicantName.slice(0, 110),
      applicantEmail: formData.applicantEmail.slice(0, 190),
      phone: formData.phone.slice(0, 45),
      portfolioUrl: formData.portfolioUrl.slice(0, 450),
      resumeSummary: formData.resumeSummary.slice(0, 3500),
      coverNote: formData.coverNote.slice(0, 2800),
      status: 'Submitted',
      appliedAt: new Date().toISOString(),
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'applications', appId), newApp);
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `applications/${appId}`
        );
      }
    } else {
      setGuestApplications((prev) => [newApp, ...prev]);
    }

    showToast(`Application submitted to ${job.company}!`);
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    status: ApplicationStatus
  ) => {
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'applications', applicationId), { status });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `applications/${applicationId}`
        );
      }
    } else {
      setGuestApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
      );
    }
    showToast(`Application status updated to ${status}`);
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'applications', applicationId));
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `applications/${applicationId}`
        );
      }
    } else {
      setGuestApplications((prev) =>
        prev.filter((a) => a.id !== applicationId)
      );
    }
    showToast('Application withdrawn');
  };

  const handlePostJob = async (
    jobData: Omit<JobListing, 'id' | 'postedAt' | 'authorUid'>
  ) => {
    const jobId = `job-${Date.now()}`;
    const fullJob: JobListing = {
      ...jobData,
      id: jobId,
      postedAt: new Date().toISOString(),
      authorUid: auth.currentUser?.uid || 'local-employer-session',
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'jobs', jobId), fullJob);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `jobs/${jobId}`);
      }
    } else {
      setLocalPostedJobs((prev) => [fullJob, ...prev]);
    }

    showToast(`Published "${fullJob.title}" at ${fullJob.company}!`);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (auth.currentUser && firestoreJobs.some((j) => j.id === jobId)) {
      try {
        await deleteDoc(doc(db, 'jobs', jobId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `jobs/${jobId}`);
      }
    } else {
      setLocalPostedJobs((prev) => prev.filter((j) => j.id !== jobId));
    }
    showToast('Job listing removed');
  };

  const toggleSkillFilter = (skill: string) => {
    setFilters((prev) => {
      const exists = prev.selectedSkills.includes(skill);
      return {
        ...prev,
        selectedSkills: exists
          ? prev.selectedSkills.filter((s) => s !== skill)
          : [...prev.selectedSkills, skill],
      };
    });
  };

  const resetAllFilters = () => {
    setFilters({
      searchQuery: '',
      location: 'All',
      locationType: 'All',
      jobType: 'All',
      minSalary: 0,
      selectedSkills: [],
      experienceLevel: 'All',
      sortBy: 'newest',
    });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
        {/* Sticky Navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userProfile={userProfile}
          savedCount={activeSavedJobIds.length}
          appliedCount={activeApplications.length}
          onOpenAuth={(mode = 'login') => {
            setAuthInitialMode(mode);
            setAuthModalOpen(true);
          }}
          onSignOut={async () => {
            await signOut(auth);
            showToast('Signed out successfully');
          }}
        />

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4 duration-150">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Workspace Switcher */}
        <main className="flex-1">
          {activeTab === 'explore' && (
            <div>
              {/* Hero Section with Unified Search Bar */}
              <section className="bg-slate-900 text-white border-b border-slate-800 relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, #2563EB 0%, transparent 45%), radial-gradient(circle at 80% 60%, #1D4ED8 0%, transparent 40%)',
                  }}
                />
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10 space-y-7">
                  <div className="max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-mono-tech uppercase tracking-wider font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        {allJobs.length} Verified Tech, Product &amp; Design Openings
                      </span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.12]">
                      Find your next high-impact{' '}
                      <span className="text-blue-400">career or internship.</span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                      Search transparent compensation ranges, filter by technical stack, and unlock personalized AI skill matching across top engineering and product teams.
                    </p>
                  </div>

                  {/* Unified Multi-Input Search Bar */}
                  <div className="bg-white p-2 sm:p-2.5 rounded-xl shadow-xl border border-slate-200 max-w-4xl grid grid-cols-1 sm:grid-cols-12 gap-2 text-slate-900">
                    <div className="sm:col-span-5 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 focus-within:border-blue-600 focus-within:bg-white transition-colors">
                      <Search className="w-4 h-4 text-blue-600 shrink-0" />
                      <input
                        type="text"
                        value={filters.searchQuery}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            searchQuery: e.target.value,
                          }))
                        }
                        placeholder="Job title, company, or skill (e.g., React, Stripe)..."
                        className="w-full text-sm bg-transparent outline-none placeholder:text-slate-400"
                      />
                      {filters.searchQuery && (
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, searchQuery: '' }))
                          }
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <select
                        value={filters.location}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        className="w-full text-sm bg-transparent outline-none text-slate-700 cursor-pointer"
                      >
                        <option value="All">All Locations</option>
                        <option value="Remote">Remote</option>
                        <option value="San Francisco">San Francisco, CA</option>
                        <option value="New York">New York, NY</option>
                        <option value="Seattle">Seattle, WA</option>
                        <option value="Austin">Austin, TX</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                      <select
                        value={filters.jobType}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            jobType: e.target.value,
                          }))
                        }
                        className="w-full text-sm bg-transparent outline-none text-slate-700 cursor-pointer"
                      >
                        <option value="All">All Types</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('job-board-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="sm:col-span-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Quick Filter Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">
                      Popular searches:
                    </span>
                    {[
                      { label: 'Summer Internships', type: 'Internship' },
                      { label: '100% Remote', locType: 'Remote' },
                      { label: 'React & TypeScript', skill: 'React' },
                      { label: 'Python & AI', skill: 'Python' },
                      { label: 'Product Design', skill: 'Figma' },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          if (chip.type) {
                            setFilters((p) => ({
                              ...p,
                              jobType:
                                p.jobType === chip.type ? 'All' : chip.type,
                            }));
                          } else if (chip.locType) {
                            setFilters((p) => ({
                              ...p,
                              locationType:
                                p.locationType === chip.locType
                                  ? 'All'
                                  : chip.locType,
                            }));
                          } else if (chip.skill) {
                            toggleSkillFilter(chip.skill);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800/90 hover:bg-blue-600/30 text-slate-200 hover:text-white border border-slate-700 hover:border-blue-400 transition-colors cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Main 12-Column Job Board Workspace */}
              <section
                id="job-board-section"
                className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left 3 Columns: Sticky Faceted Filters */}
                  <aside className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-6 lg:sticky lg:top-22">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                        <h2 className="text-sm font-bold text-slate-900 font-display">
                          Filter Openings
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>

                    {/* Job Type Filter */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Role Type
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['All', 'Full-time', 'Internship', 'Contract'].map(
                          (type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() =>
                                setFilters((prev) => ({
                                  ...prev,
                                  jobType: type,
                                }))
                              }
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-colors cursor-pointer ${
                                filters.jobType === type
                                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {type}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Workplace Arrangement */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Workplace Mode
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['All', 'Remote', 'Hybrid', 'On-site'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                locationType: mode,
                              }))
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-colors cursor-pointer ${
                              filters.locationType === mode
                                ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Minimum Salary Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Minimum Salary
                        </label>
                        <span className="text-xs font-mono-tech font-bold text-blue-600">
                          {filters.minSalary === 0
                            ? 'Any'
                            : `$${Math.round(filters.minSalary / 1000)}k+ / yr`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={200000}
                        step={20000}
                        value={filters.minSalary}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            minSalary: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-mono-tech text-slate-400">
                        <span>Any</span>
                        <span>$100k+</span>
                        <span>$160k+</span>
                        <span>$200k+</span>
                      </div>
                    </div>

                    {/* Experience Level */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Seniority Level
                      </label>
                      <select
                        value={filters.experienceLevel}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            experienceLevel: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-600 outline-none cursor-pointer"
                      >
                        <option value="All">All Experience Levels</option>
                        <option value="Internship">Internship</option>
                        <option value="Entry-Level">Entry-Level</option>
                        <option value="Mid-Level">Mid-Level</option>
                        <option value="Senior">Senior</option>
                      </select>
                    </div>

                    {/* Skills Filter */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Filter by Skills
                        </label>
                        {filters.selectedSkills.length > 0 && (
                          <span className="text-[11px] font-mono-tech text-blue-600 font-semibold">
                            {filters.selectedSkills.length} selected
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SKILLS.slice(0, 14).map((skill) => {
                          const isSelected =
                            filters.selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkillFilter(skill)}
                              className={`px-2.5 py-1 rounded text-xs font-mono-tech transition-colors border cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white font-medium'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300'
                              }`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </aside>

                  {/* Center/Right 9 Columns: AI Match Strip + Job Feed */}
                  <div className="lg:col-span-9 space-y-6">
                    {/* AI-Powered Skill Match Callout Card */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-xs font-mono-tech uppercase tracking-wider text-blue-100 font-semibold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Personalized AI Job Matcher</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold font-display">
                          Matched to your skills:{' '}
                          <span className="text-blue-100 font-normal">
                            {activeSkills.slice(0, 5).join(', ')}
                          </span>
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('ai-match')}
                        className="px-4 py-2.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-xs transition-colors shrink-0 inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Open AI Recommendations</span>
                      </button>
                    </div>

                    {/* Feed Toolbar: Count & Sort */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-xs text-slate-600">
                        Showing{' '}
                        <span className="font-mono-tech font-bold text-slate-900">
                          {filteredJobs.length}
                        </span>{' '}
                        verified roles &amp; internships
                        {filters.selectedSkills.length > 0 && (
                          <span>
                            {' '}
                            matching{' '}
                            <strong className="text-blue-600">
                              {filters.selectedSkills.join(', ')}
                            </strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">
                          Sort by:
                        </span>
                        <select
                          value={filters.sortBy}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              sortBy: e.target.value as FilterState['sortBy'],
                            }))
                          }
                          className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="newest">Most Recent</option>
                          <option value="match">Highest AI Skill Match</option>
                          <option value="salary-high">Highest Salary</option>
                        </select>
                      </div>
                    </div>

                    {/* Job Cards List */}
                    {filteredJobs.length === 0 ? (
                      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                          <Search className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 font-display">
                          No jobs match your exact filter combination
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Try clearing one of your selected skill tags or lowering the minimum salary threshold to see more openings.
                        </p>
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset All Filters</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredJobs.map((job) => {
                          const isSaved = activeSavedJobIds.includes(job.id);
                          const hasApplied = appliedJobIds.includes(job.id);
                          const matchScore = getJobMatchScore(job);

                          return (
                            <article
                              key={job.id}
                              onClick={() => setSelectedJob(job)}
                              className="group bg-white rounded-xl border border-slate-200 hover:border-blue-400 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all cursor-pointer"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                {/* Left: Company Monogram & Role Title */}
                                <div className="flex items-start gap-4">
                                  <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-display font-bold text-base shrink-0 shadow-2xs"
                                    style={{
                                      backgroundColor:
                                        job.companyColor || '#2563EB',
                                    }}
                                  >
                                    {job.companyLogo ||
                                      job.company.slice(0, 2).toUpperCase()}
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-bold text-blue-600">
                                        {job.company}
                                      </span>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-xs text-slate-500">
                                        {job.department}
                                      </span>
                                      {job.jobType === 'Internship' && (
                                        <span className="px-2 py-0.5 text-[10px] font-mono-tech uppercase tracking-wider font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded">
                                          Internship
                                        </span>
                                      )}
                                      {hasApplied && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono-tech uppercase font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Applied
                                        </span>
                                      )}
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 font-display transition-colors">
                                      {job.title}
                                    </h3>

                                    {/* Metadata Row */}
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-600">
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
                                        {job.jobType} · {job.experienceLevel}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: AI Match Badge & Save/Apply Buttons */}
                                <div
                                  className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono-tech font-semibold">
                                    <Sparkles className="w-3 h-3 text-blue-600" />
                                    {matchScore}% Skill Match
                                  </span>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSaveJob(job.id)}
                                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                                        isSaved
                                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                                      }`}
                                      title={
                                        isSaved ? 'Saved' : 'Bookmark Job'
                                      }
                                    >
                                      {isSaved ? (
                                        <BookmarkCheck className="w-4 h-4" />
                                      ) : (
                                        <Bookmark className="w-4 h-4" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedJob(job)}
                                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                    >
                                      <span>
                                        {hasApplied
                                          ? 'View Status'
                                          : 'Apply Now'}
                                      </span>
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Description Preview & Skill Tags */}
                              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {job.skills.map((skill) => {
                                    const isUserSkill = activeSkills.some(
                                      (u) =>
                                        u.toLowerCase() === skill.toLowerCase()
                                    );
                                    return (
                                      <span
                                        key={skill}
                                        className={`px-2.5 py-0.5 rounded text-xs font-mono-tech border ${
                                          isUserSkill
                                            ? 'bg-blue-50/80 border-blue-200 text-blue-800 font-medium'
                                            : 'bg-slate-50 border-slate-200/80 text-slate-600'
                                        }`}
                                      >
                                        {skill}
                                      </span>
                                    );
                                  })}
                                </div>

                                <span className="text-[11px] text-slate-400 shrink-0 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(job.postedAt).toLocaleDateString(
                                    'en-US',
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                    }
                                  )}
                                </span>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'ai-match' && (
            <AIRecommendationsSection
              jobs={allJobs}
              activeSkills={activeSkills}
              headline={activeHeadline}
              experienceLevel={activeLevel}
              savedJobIds={activeSavedJobIds}
              appliedJobIds={appliedJobIds}
              onUpdateSkillsAndProfile={handleUpdateSkillsAndProfile}
              onSelectJob={(job) => setSelectedJob(job)}
              onToggleSave={handleToggleSaveJob}
            />
          )}

          {activeTab === 'dashboard' && (
            <SeekerDashboard
              userProfile={userProfile}
              jobs={allJobs}
              savedJobIds={activeSavedJobIds}
              applications={activeApplications}
              activeSkills={activeSkills}
              headline={activeHeadline}
              experienceLevel={activeLevel}
              onSelectJob={(job) => setSelectedJob(job)}
              onToggleSave={handleToggleSaveJob}
              onUpdateApplicationStatus={handleUpdateApplicationStatus}
              onDeleteApplication={handleDeleteApplication}
              onNavigateToAI={() => setActiveTab('ai-match')}
              onNavigateToExplore={() => setActiveTab('explore')}
            />
          )}

          {activeTab === 'employer' && (
            <EmployerSection
              userProfile={userProfile}
              jobs={allJobs}
              onPostJob={handlePostJob}
              onDeleteJob={handleDeleteJob}
              onSelectJob={(job) => setSelectedJob(job)}
              onOpenAuth={() => {
                setAuthInitialMode('signup');
                setAuthModalOpen(true);
              }}
            />
          )}
        </main>

        {/* Clean Footer */}
        <footer className="bg-white border-t border-slate-200 mt-16">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <span className="font-display font-bold text-slate-900">
                HirePulse
              </span>
              <span>— Modern Career &amp; Internship Portal</span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                className="hover:text-blue-600 cursor-pointer"
              >
                Explore Jobs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ai-match')}
                className="hover:text-blue-600 cursor-pointer"
              >
                AI Skill Matcher
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="hover:text-blue-600 cursor-pointer"
              >
                Seeker Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('employer')}
                className="hover:text-blue-600 cursor-pointer"
              >
                Employer Studio
              </button>
            </div>
          </div>
        </footer>

        {/* Job Details & Apply Now Slide-over Modal */}
        <JobDetailsModal
          job={selectedJob}
          userProfile={userProfile}
          activeSkills={activeSkills}
          isSaved={
            selectedJob ? activeSavedJobIds.includes(selectedJob.id) : false
          }
          hasApplied={
            selectedJob ? appliedJobIds.includes(selectedJob.id) : false
          }
          onClose={() => setSelectedJob(null)}
          onToggleSave={handleToggleSaveJob}
          onSubmitApplication={handleSubmitApplication}
        />

        {/* User Login / Signup Modal */}
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authInitialMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={async (
            selectedRole: UserRole,
            customSkills?: string[],
            customHeadline?: string
          ) => {
            if (customSkills && customSkills.length > 0) {
              setGuestSkills(customSkills);
            }
            if (customHeadline) {
              setGuestHeadline(customHeadline);
            }
            if (auth.currentUser) {
              const userRef = doc(db, 'users', auth.currentUser.uid);
              try {
                await setDoc(
                  userRef,
                  {
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email || 'user@hirepulse.io',
                    displayName:
                      auth.currentUser.displayName ||
                      auth.currentUser.email?.split('@')[0] ||
                      'HirePulse Member',
                    photoURL: auth.currentUser.photoURL || '',
                    role: selectedRole,
                    headline: customHeadline || guestHeadline,
                    skills:
                      customSkills && customSkills.length > 0
                        ? customSkills
                        : guestSkills,
                    savedJobIds: guestSavedJobIds,
                    updatedAt: new Date().toISOString(),
                  },
                  { merge: true }
                );
              } catch (err) {
                handleFirestoreError(
                  err,
                  OperationType.WRITE,
                  `users/${auth.currentUser.uid}`
                );
              }
            }
            showToast('Signed in to HirePulse!');
          }}
        />

        {/* Floating n8n AI Career Chatbot */}
        <N8nChatWidget />
      </div>
    </ErrorBoundary>
  );
}
