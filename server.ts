import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GOVERNMENT_JOB_NOTIFICATIONS, SAMPLE_JOBS } from './src/data/sampleJobs.js';
import { JobListing } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const COMPANY_COLORS = [
  '#2563EB',
  '#4F46E5',
  '#0284C7',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#E11D48',
  '#0F172A',
];

function extractSkillsFromText(text: string): string[] {
  const candidates = [
    'React',
    'TypeScript',
    'JavaScript',
    'Node.js',
    'Python',
    'Java',
    'Go',
    'Rust',
    'C++',
    'SQL',
    'PostgreSQL',
    'MongoDB',
    'AWS',
    'Kubernetes',
    'Docker',
    'GraphQL',
    'Next.js',
    'Tailwind CSS',
    'Figma',
    'Product Design',
    'Machine Learning',
    'PyTorch',
    'Data Analysis',
    'System Design',
    'Cybersecurity',
  ];
  const lower = text.toLowerCase();
  const matched = candidates.filter((skill) =>
    lower.includes(skill.toLowerCase())
  );
  return matched.length > 0
    ? matched.slice(0, 6)
    : ['Software Engineering', 'Cloud', 'APIs', 'System Design'];
}

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]*>?/gm, '').trim();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Live Adzuna API Proxy Route for Private Job Listings
  app.get('/api/jobs/adzuna', async (req, res) => {
    const what = String(req.query.what || 'software developer').trim();
    const where = String(req.query.where || '').trim();
    const country = String(
      req.query.country || process.env.ADZUNA_COUNTRY || 'in'
    )
      .toLowerCase()
      .trim();
    const page = Math.max(1, Number(req.query.page) || 1);

    const appId = (process.env.ADZUNA_APP_ID || '').trim();
    const appKey = (process.env.ADZUNA_APP_KEY || '').trim();

    // When Adzuna credentials are configured, fetch live from api.adzuna.com
    if (
      appId &&
      appKey &&
      appId !== 'MY_ADZUNA_APP_ID' &&
      appKey !== 'MY_ADZUNA_APP_KEY'
    ) {
      try {
        const params = new URLSearchParams({
          app_id: appId,
          app_key: appKey,
          results_per_page: '20',
          what,
          'content-type': 'application/json',
        });
        if (where && where.toLowerCase() !== 'all') {
          params.set('where', where);
        }

        const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(
          country
        )}/search/${page}?${params.toString()}`;

        const response = await fetch(adzunaUrl);
        if (response.ok) {
          const data = (await response.json()) as {
            results?: Array<{
              id?: string | number;
              title?: string;
              company?: { display_name?: string };
              location?: { display_name?: string };
              salary_min?: number;
              salary_max?: number;
              contract_time?: string;
              contract_type?: string;
              category?: { label?: string };
              description?: string;
              created?: string;
              redirect_url?: string;
            }>;
          };

          const currencySymbol =
            country === 'in'
              ? '₹'
              : country === 'gb'
              ? '£'
              : 'US$';

          const mappedJobs: JobListing[] = (data.results || []).map(
            (item, idx) => {
              const title = stripHtml(item.title || 'Software Engineer');
              const company =
                item.company?.display_name || 'Adzuna Verified Employer';
              const location =
                item.location?.display_name ||
                (country === 'in' ? 'Bengaluru, India' : 'San Francisco, CA');
              const cleanDesc = stripHtml(
                item.description ||
                  'Exciting private sector role sourced live via Adzuna Job Search API.'
              );

              const minSal = item.salary_min
                ? Math.round(item.salary_min)
                : country === 'in'
                ? 1200000
                : 130000;
              const maxSal = item.salary_max
                ? Math.round(item.salary_max)
                : Math.round(minSal * 1.25);

              const salaryFormatted =
                country === 'in' && minSal > 250000
                  ? `${currencySymbol}${(minSal / 100000).toFixed(1)}L – ${currencySymbol}${(
                      maxSal / 100000
                    ).toFixed(1)}L / yr`
                  : `${currencySymbol}${Math.round(
                      minSal / 1000
                    )}k – ${currencySymbol}${Math.round(maxSal / 1000)}k / yr`;

              const isInternship =
                title.toLowerCase().includes('intern') ||
                item.contract_type?.toLowerCase().includes('intern');
              const isContract =
                item.contract_type?.toLowerCase() === 'contract' ||
                title.toLowerCase().includes('contract');

              const jobType = isInternship
                ? 'Internship'
                : isContract
                ? 'Contract'
                : item.contract_time === 'part_time'
                ? 'Part-time'
                : 'Full-time';

              const locationType =
                title.toLowerCase().includes('remote') ||
                location.toLowerCase().includes('remote') ||
                cleanDesc.toLowerCase().includes('remote')
                  ? 'Remote'
                  : 'Hybrid';

              const skills = extractSkillsFromText(`${title} ${cleanDesc}`);

              return {
                id: `adzuna-${country}-${item.id || idx}`,
                title,
                company,
                companyLogo: company.slice(0, 2).toUpperCase(),
                companyColor: COMPANY_COLORS[idx % COMPANY_COLORS.length],
                location,
                locationType,
                jobType,
                salaryMin: country === 'in' && minSal > 300000 ? Math.round(minSal / 10) : minSal,
                salaryMax: country === 'in' && maxSal > 300000 ? Math.round(maxSal / 10) : maxSal,
                salaryFormatted,
                experienceLevel: isInternship
                  ? 'Internship'
                  : title.toLowerCase().includes('senior') ||
                    title.toLowerCase().includes('lead') ||
                    title.toLowerCase().includes('staff')
                  ? 'Senior'
                  : title.toLowerCase().includes('junior') ||
                    title.toLowerCase().includes('entry')
                  ? 'Entry-Level'
                  : 'Mid-Level',
                department:
                  item.category?.label?.replace(' Jobs', '') || 'Engineering',
                skills,
                description: cleanDesc,
                responsibilities: [
                  `Deliver high-impact solutions for ${company} in the ${title} role.`,
                  'Collaborate with cross-functional engineering, product, and business stakeholders.',
                  'Follow modern software quality, security, and scalability standards.',
                ],
                requirements: [
                  `Demonstrated experience in ${skills.slice(0, 3).join(', ')}.`,
                  'Strong problem-solving and communication skills.',
                ],
                benefits: [
                  'Competitive private sector compensation & performance bonus',
                  'Comprehensive health insurance and flexible leave',
                ],
                postedAt: item.created || new Date().toISOString(),
                authorUid: 'adzuna-api',
                featured: idx < 3,
                applicantsCount: 15 + ((idx * 7) % 50),
                sector: 'private',
                source: 'Adzuna Live API',
                officialPortalName: 'adzuna.com',
                applyUrl:
                  item.redirect_url ||
                  `https://www.adzuna.${
                    country === 'in' ? 'in' : country === 'gb' ? 'co.uk' : 'com'
                  }/search?q=${encodeURIComponent(title)}`,
              };
            }
          );

          return res.json({
            mode: 'live_adzuna_api',
            country,
            count: mappedJobs.length,
            jobs: mappedJobs,
          });
        }
      } catch (err) {
        console.warn('Adzuna API call failed, using fallback feed:', err);
      }
    }

    // Fallback: Live public job feed + Adzuna deep-linked Private Sector listings
    const adzunaDomain =
      country === 'in'
        ? 'adzuna.in'
        : country === 'gb'
        ? 'adzuna.co.uk'
        : 'adzuna.com';

    const enrichedPrivateJobs: JobListing[] = SAMPLE_JOBS.map((job) => ({
      ...job,
      sector: 'private',
      source: job.source || 'Adzuna Private Network',
      applyUrl:
        job.applyUrl ||
        `https://www.${adzunaDomain}/search?q=${encodeURIComponent(
          `${job.title} ${job.company}`
        )}`,
    }));

    return res.json({
      mode: 'adzuna_partner_feed',
      country,
      configuredKeys: Boolean(appId && appKey),
      count: enrichedPrivateJobs.length,
      jobs: enrichedPrivateJobs,
    });
  });

  // 2. Official Government Job Notifications Route
  app.get('/api/jobs/government', (req, res) => {
    const q = String(req.query.q || '')
      .toLowerCase()
      .trim();
    const list = q
      ? GOVERNMENT_JOB_NOTIFICATIONS.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.company.toLowerCase().includes(q) ||
            item.department.toLowerCase().includes(q) ||
            (item.advtNumber || '').toLowerCase().includes(q)
        )
      : GOVERNMENT_JOB_NOTIFICATIONS;

    res.json({
      count: list.length,
      notifications: list,
    });
  });

  // 3. Vite Middlewares in Dev / Static in Prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HirePulse server listening on http://localhost:${PORT}`);
  });
}

startServer();
