import { GoogleGenAI, Type } from '@google/genai';
import { AIJobRecommendation, JobListing } from '../types';

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export async function getAIJobRecommendations(
  userSkills: string[],
  headline: string,
  experienceLevel: string,
  jobs: JobListing[]
): Promise<AIJobRecommendation[]> {
  const ai = getAIClient();

  // Compute deterministic baseline scores first so we always have fast, accurate fallbacks
  const computeDeterministicRecommendations = (): AIJobRecommendation[] => {
    const normalizedUserSkills = userSkills.map((s) => s.toLowerCase().trim());

    return jobs
      .map((job) => {
        const matchedSkills = job.skills.filter((skill) =>
          normalizedUserSkills.some(
            (u) =>
              skill.toLowerCase().includes(u) || u.includes(skill.toLowerCase())
          )
        );
        const missingSkills = job.skills.filter(
          (skill) => !matchedSkills.includes(skill)
        );

        const skillRatio =
          job.skills.length > 0 ? matchedSkills.length / job.skills.length : 0.4;
        const levelBonus =
          experienceLevel &&
          job.experienceLevel.toLowerCase() === experienceLevel.toLowerCase()
            ? 12
            : 4;
        const headlineBonus =
          headline &&
          (job.title.toLowerCase().includes(headline.toLowerCase().split(' ')[0]) ||
            job.department.toLowerCase().includes(headline.toLowerCase().split(' ')[0]))
            ? 8
            : 0;

        const rawScore = Math.round(skillRatio * 76 + levelBonus + headlineBonus);
        const matchScore = Math.max(45, Math.min(98, rawScore));

        return {
          jobId: job.id,
          matchScore,
          matchHeadline:
            matchedSkills.length >= 2
              ? `Strong overlap in ${matchedSkills.slice(0, 2).join(' & ')}`
              : `Aligned with ${job.department} career path`,
          matchReason:
            matchedSkills.length > 0
              ? `Your background in ${matchedSkills.join(', ')} directly maps to ${job.company}'s core stack for the ${job.title} role.`
              : `This ${job.experienceLevel} position at ${job.company} offers high-growth exposure to ${job.skills.slice(0, 3).join(', ')}.`,
          matchedSkills,
          missingSkills: missingSkills.slice(0, 3),
          interviewTip:
            missingSkills.length > 0
              ? `Highlight transferable projects using ${matchedSkills[0] || userSkills[0] || 'your core stack'} and review ${missingSkills[0]} fundamentals before the technical screen.`
              : `Prepare a deep-dive architecture walkthrough showcasing how you shipped production features with ${matchedSkills.slice(0, 2).join(' and ')}.`,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  };

  if (!ai || userSkills.length === 0) {
    return computeDeterministicRecommendations();
  }

  try {
    const compactJobs = jobs.slice(0, 14).map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      jobType: j.jobType,
      experienceLevel: j.experienceLevel,
      department: j.department,
      skills: j.skills,
    }));

    const prompt = `You are an expert technical recruiter and career advisor.
Analyze the candidate's profile and select the top 5 best-matching jobs from the provided job catalog.

Candidate Profile:
- Headline: ${headline || 'Software & Product Professional'}
- Experience Level: ${experienceLevel || 'Mid-Level'}
- Skills: ${userSkills.join(', ')}

Available Jobs JSON:
${JSON.stringify(compactJobs)}

Return a JSON array of the top 5 best-fitting jobs ordered by matchScore descending (from 65 to 99). For each job, explain specifically why the candidate's skills fit, which skills match, which skills from the job are missing, and 1 actionable interview tip.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              jobId: { type: Type.STRING },
              matchScore: { type: Type.NUMBER },
              matchHeadline: { type: Type.STRING },
              matchReason: { type: Type.STRING },
              matchedSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              missingSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              interviewTip: { type: Type.STRING },
            },
            required: [
              'jobId',
              'matchScore',
              'matchHeadline',
              'matchReason',
              'matchedSkills',
              'missingSkills',
              'interviewTip',
            ],
          },
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text) as AIJobRecommendation[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Fallback to deterministic skill matcher:', err);
  }

  return computeDeterministicRecommendations();
}

export async function extractSkillsWithAI(bioOrResumeText: string): Promise<{
  skills: string[];
  suggestedHeadline: string;
  suggestedLevel: string;
}> {
  const ai = getAIClient();
  if (!ai || !bioOrResumeText.trim()) {
    return {
      skills: ['React', 'TypeScript', 'Node.js', 'SQL'],
      suggestedHeadline: 'Full-Stack Software Engineer',
      suggestedLevel: 'Mid-Level',
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract up to 8 concrete technical or professional skills, a concise professional headline, and an experience level ('Internship', 'Entry-Level', 'Mid-Level', 'Senior', or 'Lead') from the following candidate summary or resume text:\n\n"${bioOrResumeText}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedHeadline: { type: Type.STRING },
            suggestedLevel: { type: Type.STRING },
          },
          required: ['skills', 'suggestedHeadline', 'suggestedLevel'],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
  } catch (error) {
    console.warn('Error extracting skills with AI:', error);
  }

  return {
    skills: ['React', 'TypeScript', 'Python', 'SQL'],
    suggestedHeadline: 'Software Engineer',
    suggestedLevel: 'Mid-Level',
  };
}

export async function generateTailoredCoverNote(
  job: JobListing,
  candidateName: string,
  candidateSkills: string[],
  resumeSummary: string
): Promise<string> {
  const ai = getAIClient();
  if (!ai) {
    return `Hi ${job.company} Hiring Team,\n\nI am excited to apply for the ${job.title} role. With hands-on experience in ${candidateSkills.slice(0, 4).join(', ')}, I have built and shipped production solutions that align closely with your team's focus on ${job.skills.slice(0, 2).join(' and ')}. I would welcome the opportunity to discuss how I can contribute to ${job.company}.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a concise, authentic, high-impact 3-sentence cover note for ${candidateName} applying to the "${job.title}" role at ${job.company}.
Candidate Skills: ${candidateSkills.join(', ')}
Candidate Experience Summary: ${resumeSummary || 'Experienced builder with strong technical fundamentals'}
Job Required Skills: ${job.skills.join(', ')}
Keep it natural, specific, and free of clichés.`,
    });
    return (
      response.text?.trim() ||
      `I am thrilled to apply for the ${job.title} position at ${job.company}. My background in ${candidateSkills.slice(0, 3).join(', ')} aligns directly with your team's technical goals.`
    );
  } catch {
    return `I am thrilled to apply for the ${job.title} position at ${job.company}. My background in ${candidateSkills.slice(0, 3).join(', ')} aligns directly with your team's goals.`;
  }
}
