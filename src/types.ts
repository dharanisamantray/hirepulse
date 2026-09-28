export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type LocationType = 'Remote' | 'Hybrid' | 'On-site';
export type JobType = 'Full-time' | 'Internship' | 'Contract' | 'Part-time';
export type ExperienceLevel = 'Internship' | 'Entry-Level' | 'Mid-Level' | 'Senior' | 'Lead';
export type UserRole = 'seeker' | 'employer' | 'admin';
export type ApplicationStatus = 'Submitted' | 'Under Review' | 'Interviewing' | 'Offered';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyColor?: string;
  location: string;
  locationType: LocationType;
  jobType: JobType;
  salaryMin: number;
  salaryMax: number;
  salaryFormatted: string;
  experienceLevel: ExperienceLevel;
  department: string;
  skills: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  postedAt: string;
  authorUid: string;
  featured?: boolean;
  applicantsCount?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  headline?: string;
  location?: string;
  experienceLevel?: ExperienceLevel;
  skills: string[];
  savedJobIds: string[];
  bio?: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  jobType: JobType;
  salaryFormatted: string;
  applicantUid: string;
  applicantName: string;
  applicantEmail: string;
  phone?: string;
  portfolioUrl?: string;
  resumeSummary: string;
  coverNote?: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface AIJobRecommendation {
  jobId: string;
  matchScore: number;
  matchHeadline: string;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
  interviewTip: string;
}

export interface FilterState {
  searchQuery: string;
  location: string;
  locationType: string;
  jobType: string;
  minSalary: number;
  selectedSkills: string[];
  experienceLevel: string;
  sortBy: 'newest' | 'salary-high' | 'match';
}
