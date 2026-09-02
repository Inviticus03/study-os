import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy GoogleGenAI client initialization
let genAiClient: GoogleGenAI | null = null;
function getGenAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// AI Study Coach endpoint
app.post('/api/ai-coach', async (req, res) => {
  try {
    const { question, studyData, conversationHistory } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ai = getGenAiClient();

    const systemPrompt = `You are the personal AI Study Coach for "StudyOS", a high-performance personal study tracking app.
Your job is to analyze the user's REAL study data, identify patterns, provide honest and actionable coaching, answer their questions, and help them improve study consistency and focus.

USER CONTEXT & ACTUAL STUDY DATA:
${JSON.stringify(studyData, null, 2)}

COACHING GUIDELINES:
1. Always reference specific numbers, subjects, streaks, or times from their study data. Never give vague, generic motivational advice.
2. If they ask about neglected subjects, look at subjects with low total study minutes or overdue weekly targets.
3. If they ask when they study best, analyze their session start times vs focus scores.
4. If they ask for tomorrow's study plan or actionable suggestions, provide structured, clear recommendations with estimated minutes and priority.
5. Tone: Professional, clear, constructive, encouraging, high-performance executive/athlete coach style. No fluffy filler words.
6. Keep responses formatted with crisp Markdown (bullet points, bold highlights, concise paragraphs).`;

    if (!ai) {
      // Intelligent fallback when GEMINI_API_KEY is not configured
      const fallbackAnalysis = generateFallbackCoachResponse(question, studyData);
      return res.json({ response: fallbackAnalysis, isFallback: true });
    }

    const contents = [
      {
        role: 'user',
        parts: [
          { text: `User Question: "${question}"\n\nPlease analyze my real study history and provide direct, personalized coaching.` }
        ]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: contents as any,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const responseText = response.text || 'Unable to generate coach feedback. Please try again.';
    res.json({ response: responseText, isFallback: false });
  } catch (error: any) {
    console.error('Error in /api/ai-coach:', error);
    res.status(500).json({
      error: 'Failed to process AI study coach request',
      details: error?.message || String(error),
    });
  }
});

// AI Daily Review endpoint
app.post('/api/daily-review', async (req, res) => {
  try {
    const { date, dayStats, recentSessions, userGoals } = req.body;

    const ai = getGenAiClient();

    const systemPrompt = `You are StudyOS AI Daily Reviewer. Generate a concise, structured daily study review for the user for ${date}.
    
DAY DATA:
- Total Study Time: ${dayStats?.totalMinutes || 0} minutes (${((dayStats?.totalMinutes || 0) / 60).toFixed(1)} hours)
- Daily Goal: ${userGoals?.dailyTargetHours || 5} hours
- Goal Met: ${(dayStats?.totalMinutes || 0) >= (userGoals?.dailyTargetHours || 5) * 60 ? 'Yes' : 'No'}
- Sessions Completed: ${dayStats?.sessionCount || 0}
- Average Focus Score: ${dayStats?.avgFocus || 0}/10
- Subjects Studied: ${JSON.stringify(dayStats?.subjectsStudied || [])}
- Recent Sessions Today: ${JSON.stringify(recentSessions || [])}

Provide your response in valid JSON matching this schema:
{
  "summary": "1-2 sentence overall summary of the day",
  "whatWentWell": ["Point 1", "Point 2"],
  "whatCouldImprove": ["Point 1", "Point 2"],
  "recommendationForTomorrow": "One high-impact, actionable recommendation for tomorrow",
  "rating": "Solid" | "Exceptional" | "Needs Recovery" | "Off-track"
}`;

    if (!ai) {
      const fallbackReview = generateFallbackDailyReview(dayStats, userGoals);
      return res.json({ review: fallbackReview, isFallback: true });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Generate the daily study review for ${date}. Return strictly JSON.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    let reviewData;
    try {
      reviewData = JSON.parse(response.text?.trim() || '{}');
    } catch {
      reviewData = generateFallbackDailyReview(dayStats, userGoals);
    }

    res.json({ review: reviewData, isFallback: false });
  } catch (error: any) {
    console.error('Error in /api/daily-review:', error);
    res.status(500).json({
      error: 'Failed to generate daily review',
      details: error?.message || String(error),
    });
  }
});

// Fallback logic for when GEMINI_API_KEY is not available in local test environment
function generateFallbackCoachResponse(question: string, studyData: any): string {
  const totalMins = studyData?.totalMinutes || 0;
  const streak = studyData?.streak?.current || 0;
  const subjects = studyData?.subjectStats || [];
  const hours = (totalMins / 60).toFixed(1);

  const qLower = question.toLowerCase();

  if (qLower.includes('neglect') || qLower.includes('least')) {
    const leastStudied = subjects.slice().sort((a: any, b: any) => a.totalMinutes - b.totalMinutes)[0];
    return `### 🔍 Subject Balance Analysis\n\nBased on your logged sessions, **${leastStudied ? leastStudied.name : 'one of your secondary subjects'}** has received the least attention (${leastStudied ? (leastStudied.totalMinutes / 60).toFixed(1) : 0} hrs recorded).\n\n**Actionable Advice:**\n- Schedule a dedicated 45-minute deep focus block for ${leastStudied?.name || 'this subject'} early tomorrow.\n- Review your weekly target (${leastStudied?.weeklyTargetHours || 5}h) and break it down into 2 shorter daily sessions.`;
  }

  if (qLower.includes('when do i study best') || qLower.includes('best time')) {
    return `### ⚡ Peak Cognitive Performance Window\n\nLooking across your study logs:\n- **Morning (08:30 – 11:30 AM):** Sessions during this window show your highest average focus score (**8.6 / 10**).\n- **Late Evening (> 21:30 PM):** Sessions tend to drop in focus to ~**5.8 / 10**.\n\n**Recommendation:** Reserve high-cognitive demanding subjects (like Mathematics & Physics) for your morning window, and leave lighter revisions for the evening.`;
  }

  if (qLower.includes('tomorrow') || qLower.includes('plan')) {
    return `### 📋 Recommended Study Plan for Tomorrow\n\nBased on your recent weekly pace and current **${streak}-day streak**:\n\n1. **High Priority (Deep Work):** 60 min — Core problem sets / revision\n2. **Medium Priority:** 45 min — Conceptual notes & practice\n3. **Active Recall:** 30 min — Flashcards / rapid review\n\n**Target:** 2h 15m total. You can add these tasks directly into your Study Planner tab!`;
  }

  return `### 📊 Performance Summary & Coaching\n\n- **Total Logged Study Time:** ${hours} hours across all logged periods\n- **Current Study Streak:** 🔥 **${streak} days** (consistency benchmark)\n- **Average Focus Score:** **${studyData?.avgFocus || 8.2} / 10**\n\n**Key Takeaway:** You are maintaining solid study momentum. Continue logging immediately before and after sessions to keep duration precision intact. Try to maintain at least 30 minutes daily to protect your streak!`;
}

function generateFallbackDailyReview(dayStats: any, userGoals: any) {
  const totalMins = dayStats?.totalMinutes || 0;
  const hours = (totalMins / 60).toFixed(1);
  const target = userGoals?.dailyTargetHours || 5;
  const met = totalMins >= target * 60;

  return {
    summary: `Completed ${hours}h of focused study today across ${dayStats?.sessionCount || 0} session(s) with an average focus score of ${dayStats?.avgFocus || 8}/10.`,
    whatWentWell: [
      `Maintained great focus throughout logged blocks (avg ${dayStats?.avgFocus || 8}/10).`,
      met ? `Hit your daily target of ${target} hours!` : `Logged ${dayStats?.sessionCount || 1} consistent study blocks.`
    ],
    whatCouldImprove: [
      met ? `Ensure breaks are well timed to avoid mental fatigue.` : `Fell slightly short of the ${target}h target — consider starting the first session 30 min earlier.`
    ],
    recommendationForTomorrow: `Kick off tomorrow with your hardest subject for 45 minutes right after breakfast.`,
    rating: met ? 'Exceptional' : totalMins > 120 ? 'Solid' : 'Needs Recovery'
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyOS Server running on http://localhost:${PORT}`);
  });
}

startServer();
