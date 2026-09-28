import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  CheckCircle2,
  Briefcase,
  MapPin,
  DollarSign,
  Sparkles,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  ExperienceLevel,
  JobListing,
  JobType,
  LocationType,
  UserProfile,
} from '../types';

interface EmployerSectionProps {
  userProfile: UserProfile | null;
  jobs: JobListing[];
  onPostJob: (newJob: Omit<JobListing, 'id' | 'postedAt' | 'authorUid'>) => Promise<void>;
  onDeleteJob: (jobId: string) => Promise<void>;
  onSelectJob: (job: JobListing) => void;
  onOpenAuth: () => void;
}

export const EmployerSection: React.FC<EmployerSectionProps> = ({
  userProfile,
  jobs,
  onPostJob,
  onDeleteJob,
  onSelectJob,
}) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('San Francisco, CA');
  const [locationType, setLocationType] = useState<LocationType>('Hybrid');
  const [jobType, setJobType] = useState<JobType>('Full-time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid-Level');
  const [salaryMin, setSalaryMin] = useState<number>(145000);
  const [salaryMax, setSalaryMax] = useState<number>(185000);
  const [skillsInput, setSkillsInput] = useState('React, TypeScript, Node.js, PostgreSQL, AWS');
  const [description, setDescription] = useState('');
  const [responsibilitiesInput, setResponsibilitiesInput] = useState('');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [benefitsInput, setBenefitsInput] = useState(
    'Competitive salary & equity package\n100% medical, dental, and vision coverage\nFlexible hybrid/remote work policy'
  );
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  const fillSampleTemplate = (templateType: 'fulltime' | 'internship') => {
    if (templateType === 'internship') {
      setTitle('Software Engineering Intern — AI Platform (Fall/Summer)');
      setCompany('Cohere Labs');
      setDepartment('AI & Research');
      setLocation('San Francisco, CA');
      setLocationType('Hybrid');
      setJobType('Internship');
      setExperienceLevel('Internship');
      setSalaryMin(98000);
      setSalaryMax(112000);
      setSkillsInput('Python, TypeScript, React, PyTorch, LLM Engineering');
      setDescription(
        'Join our AI Platform team for a 12-week paid internship where you will build evaluation tooling, interactive agent sandboxes, and low-latency inference APIs alongside senior researchers.'
      );
      setResponsibilitiesInput(
        'Build full-stack developer features in React, TypeScript, and Python\nRun benchmark evaluations on fine-tuned retrieval and generation models\nShip production code directly to enterprise developers'
      );
      setRequirementsInput(
        'Pursuing a BS, MS, or PhD in Computer Science or related field\nStrong project or prior internship experience with Python and TypeScript\nCuriosity for large language models and developer tools'
      );
    } else {
      setTitle('Senior Full-Stack Product Engineer');
      setCompany('Watershed');
      setDepartment('Engineering');
      setLocation('New York, NY');
      setLocationType('Hybrid');
      setJobType('Full-time');
      setExperienceLevel('Senior');
      setSalaryMin(170000);
      setSalaryMax(215000);
      setSkillsInput('React, TypeScript, Node.js, PostgreSQL, GraphQL, System Design');
      setDescription(
        'Help enterprise organizations measure, report, and reduce their carbon footprint with high-precision data pipelines and executive analytics dashboards.'
      );
      setResponsibilitiesInput(
        'Architect end-to-end features across our TypeScript/React frontend and Node.js/PostgreSQL data engine\nCollaborate with climate scientists and product designers to simplify complex regulatory workflows\nLead technical design reviews and mentor engineers'
      );
      setRequirementsInput(
        '4+ years of production full-stack engineering experience\nDeep fluency in TypeScript, React, relational databases, and modern API design\nTrack record of owning complex product initiatives from concept to launch'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessBanner(false);

    const formattedSalary =
      jobType === 'Internship'
        ? `$${Math.round(salaryMin / 2080)} / hr ($${Math.round(salaryMin / 12).toLocaleString()} / mo)`
        : `$${Math.round(salaryMin / 1000)}k – $${Math.round(salaryMax / 1000)}k / yr`;

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const responsibilities = responsibilitiesInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const requirements = requirementsInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const benefits = benefitsInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await onPostJob({
        title: title.trim(),
        company: company.trim(),
        companyLogo: company.trim().slice(0, 2).toUpperCase(),
        companyColor: '#2563EB',
        location: location.trim(),
        locationType,
        jobType,
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
        salaryFormatted: formattedSalary,
        experienceLevel,
        department,
        skills: skills.length > 0 ? skills : ['TypeScript', 'React'],
        description: description.trim(),
        responsibilities:
          responsibilities.length > 0
            ? responsibilities
            : ['Own core product features from design to deployment.'],
        requirements:
          requirements.length > 0
            ? requirements
            : ['2+ years of relevant technical experience.'],
        benefits:
          benefits.length > 0
            ? benefits
            : ['Competitive compensation and full healthcare benefits.'],
        featured: true,
        applicantsCount: 1,
      });

      setSuccessBanner(true);
      setTitle('');
      setCompany('');
      setDescription('');
      setResponsibilitiesInput('');
      setRequirementsInput('');
    } finally {
      setSubmitting(false);
    }
  };

  const employerJobs = jobs.filter(
    (j) =>
      (userProfile && j.authorUid === userProfile.uid) ||
      j.authorUid.startsWith('local-employer')
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-xl p-6 sm:p-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-mono-tech uppercase tracking-wider font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Employer Talent Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            Publish a Job or Internship Opening
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Reach qualified engineers, designers, and product builders. Every role posted here is immediately indexed by our AI Skill Matcher to connect with high-fit candidates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fillSampleTemplate('fulltime')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Auto-Fill Senior Role</span>
          </button>
          <button
            type="button"
            onClick={() => fillSampleTemplate('internship')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Fill Internship</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">
                Job listing published to the live board!
              </p>
              <p className="text-xs text-emerald-700">
                Candidates can now discover, filter, and apply to your opening immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns: Job Posting Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6"
        >
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Role Specification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide clear compensation, location, and skill requirements for higher candidate conversion.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Frontend Engineer"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Acme Cloud"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Employment Type *
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:border-blue-600 outline-none"
              >
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Experience Level *
              </label>
              <select
                value={experienceLevel}
                onChange={(e) =>
                  setExperienceLevel(e.target.value as ExperienceLevel)
                }
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:border-blue-600 outline-none"
              >
                <option value="Internship">Internship</option>
                <option value="Entry-Level">Entry-Level</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:border-blue-600 outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="AI & Research">AI &amp; Research</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Data & AI">Data &amp; AI</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                City / Region *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA or Remote"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Workplace Arrangement *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Remote', 'Hybrid', 'On-site'] as LocationType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLocationType(type)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        locationType === type
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Minimum Annualized Salary (USD) *
              </label>
              <input
                type="number"
                required
                min={20000}
                max={800000}
                step={5000}
                value={salaryMin}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm font-mono-tech rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Maximum Annualized Salary (USD) *
              </label>
              <input
                type="number"
                required
                min={salaryMin}
                max={950000}
                step={5000}
                value={salaryMax}
                onChange={(e) => setSalaryMax(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm font-mono-tech rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Required Technical &amp; Domain Skills (comma-separated) *
            </label>
            <input
              type="text"
              required
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="React, TypeScript, Python, SQL, Figma"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Role Overview &amp; Team Mission *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the impact of this role, the team structure, and what makes this opportunity special..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Key Responsibilities (one per line)
              </label>
              <textarea
                rows={4}
                value={responsibilitiesInput}
                onChange={(e) => setResponsibilitiesInput(e.target.value)}
                placeholder="Architect scalable frontend systems&#10;Collaborate with product and design&#10;Optimize application performance"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Qualifications &amp; Requirements (one per line)
              </label>
              <textarea
                rows={4}
                value={requirementsInput}
                onChange={(e) => setRequirementsInput(e.target.value)}
                placeholder="3+ years experience with React & TypeScript&#10;Strong systems thinking&#10;BS in Computer Science or equivalent"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <PlusCircle className="w-4 h-4" />
              <span>
                {submitting ? 'Publishing Opening...' : 'Publish Job Listing'}
              </span>
            </button>
          </div>
        </form>

        {/* Right 4 Columns: Live Preview & Posted Jobs Management */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Card Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-mono-tech uppercase tracking-wider font-semibold text-blue-600">
                Live Card Preview
              </span>
              <span className="text-[11px] text-slate-400">Instant Render</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                  {(company || 'CO').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-blue-600 truncate">
                    {company || 'Your Company'}
                  </p>
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {title || 'Job Title Preview'}
                  </h4>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {location || 'Remote'} ({locationType})
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {jobType}
                </span>
                <span>•</span>
                <span className="font-mono-tech font-semibold text-slate-900">
                  <DollarSign className="w-3.5 h-3.5 inline text-blue-600 -mt-0.5" />
                  {Math.round(salaryMin / 1000)}k–${Math.round(salaryMax / 1000)}k
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {skillsInput
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 4)
                  .map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded text-[11px] font-mono-tech bg-white border border-slate-200 text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Employer's Active Postings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Your Published Postings ({employerJobs.length})
              </h3>
            </div>

            {employerJobs.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                Jobs you post during this session or under your account will appear here for quick management.
              </p>
            ) : (
              <div className="space-y-2.5">
                {employerJobs.map((j) => (
                  <div
                    key={j.id}
                    className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {j.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {j.company} • {j.jobType} • {j.salaryFormatted}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectJob(j)}
                        className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                        title="Preview Job"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteJob(j.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Remove Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
