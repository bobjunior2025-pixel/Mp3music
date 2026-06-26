import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI SDK
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API route for translating lyrics
  app.post("/api/gemini/translate-lyrics", async (req, res) => {
    try {
      const { lyrics, targetLanguage } = req.body;
      if (!lyrics || !Array.isArray(lyrics)) {
        return res.status(400).json({ error: "Lyrics must be provided as an array of strings." });
      }

      const prompt = `Translate the following song lyrics to ${targetLanguage || 'Portuguese'}. Keep any timestamp tags like [MM:SS] exactly as they are at the beginning of each line if present. Do not translate the timestamp tags. Return ONLY the translated lines in the same order. Do not add any introductory or explanatory text.
      
Lyrics to translate:
${lyrics.join('\n')}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const translatedText = response.text || "";
      const translatedLines = translatedText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      res.json({ translatedLyrics: translatedLines });
    } catch (error: any) {
      console.error("Gemini Translation Error:", error);
      res.status(500).json({ error: error.message || "Failed to translate lyrics using Gemini API." });
    }
  });

  // API route for generating time-synced lyrics using Gemini
  app.post("/api/gemini/generate-lyrics", async (req, res) => {
    try {
      const { title, artist, duration } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title must be provided." });
      }

      const prompt = `You are a music lyrics expert. Search or generate the real or highly appropriate lyrics for the song "${title}" by "${artist || 'Unknown Artist'}".
Generate the lyrics with estimated, synchronized time tags like [MM:SS] at the beginning of each line, based on typical song progression and the track duration which is ${duration || '05:00'}.
Ensure the timing spreads evenly from [00:00] until near the end of the song.
Return ONLY the formatted lyric lines (one per line). Do NOT include any markdown formatting, markdown code blocks (e.g. \`\`\`), introduction, or explanations. Start immediately with the first lyric line.

Example format:
[00:00] (Instrumental - Intro)
[00:15] Lyrics of the song...
[00:30] More lyrics...`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      res.json({ lyrics: lines });
    } catch (error: any) {
      console.error("Gemini Generate Lyrics Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate lyrics using Gemini API." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
