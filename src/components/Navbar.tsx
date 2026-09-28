import React from 'react';
import {
  Briefcase,
  Sparkles,
  BookmarkCheck,
  Building2,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { UserProfile } from '../types';

export type ActiveTab = 'explore' | 'ai-match' | 'dashboard' | 'employer';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userProfile: UserProfile | null;
  savedCount: number;
  appliedCount: number;
  onOpenAuth: (defaultMode?: 'login' | 'signup') => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  savedCount,
  appliedCount,
  onOpenAuth,
  onSignOut,
}) => {
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
  }[] = [
    {
      id: 'explore',
      label: 'Find Jobs & Internships',
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: 'ai-match',
      label: 'AI Recommendations',
      icon: <Sparkles className="w-4 h-4 text-blue-600" />,
      badge: 'AI',
    },
    {
      id: 'dashboard',
      label: 'Seeker Dashboard',
      icon: <BookmarkCheck className="w-4 h-4" />,
      badge: savedCount + appliedCount > 0 ? savedCount + appliedCount : undefined,
    },
    {
      id: 'employer',
      label: 'Post a Job',
      icon: <Building2 className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab('explore')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-slate-900">
                Hire<span className="text-blue-600">Pulse</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-mono-tech uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                Careers &amp; Internships
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-mono-tech px-1.5 py-0.5 rounded font-semibold ${
                        item.badge === 'AI'
                          ? 'bg-blue-600 text-white'
                          : isActive
                          ? 'bg-blue-200/80 text-blue-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions / User Auth */}
        <div className="flex items-center gap-3">
          {userProfile ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 bg-slate-50/70 hover:bg-blue-50/40 transition-colors cursor-pointer"
                title="View Profile & Skills"
              >
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-md object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {userProfile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-none">
                    {userProfile.displayName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
                    {userProfile.role === 'employer' ? 'Employer Account' : 'Job Seeker'}
                  </p>
                </div>
              </button>

              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 bg-white px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600'
              }`}
            >
              {item.icon}
              <span>{item.label.split(' ')[0]}</span>
              {item.badge !== undefined && (
                <span className="text-[10px] font-mono-tech px-1 py-0.2 bg-blue-100 text-blue-800 rounded">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
