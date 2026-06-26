import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to proxy to Cobalt to bypass CORS
  app.post("/api/proxy-cobalt", async (req, res) => {
    try {
      const { url, isAudioOnly, aFormat, audioBitrate } = req.body;

      if (!url) {
        return res.status(400).json({ status: "error", text: "A URL é obrigatória." });
      }

      console.log(`Proxying request to Cobalt for URL: ${url}`);

      // We try the official API and alternative working instances of Cobalt (both v10 and v7 endpoints)
      const cobaltEndpoints = [
        { url: "https://api.cobalt.tools/", version: 10 },
        { url: "https://co.wuk.sh/", version: 10 },
        { url: "https://api.cobalt.tools/api/json", version: 7 },
        { url: "https://co.wuk.sh/api/json", version: 7 }
      ];

      let lastError: any = null;
      for (const endpoint of cobaltEndpoints) {
        try {
          console.log(`Trying Cobalt endpoint: ${endpoint.url} (version ${endpoint.version})`);
          
          const requestBody = endpoint.version === 10 
            ? {
                url,
                downloadMode: "audio",
                audioFormat: "mp3",
                audioBitrate: "128"
              }
            : {
                url,
                isAudioOnly: isAudioOnly ?? true,
                aFormat: aFormat ?? 'mp3',
                audioBitrate: audioBitrate ?? '128'
              };

          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`Successfully received response from Cobalt:`, JSON.stringify(data).substring(0, 300));
            
            // If the instance returned an error status in the JSON response
            if (data.status === 'error') {
              console.warn(`Cobalt endpoint ${endpoint.url} returned JSON error:`, data.text);
              lastError = new Error(data.text || "Erro retornado pelo servidor Cobalt.");
              continue;
            }
            
            return res.json(data);
          } else {
            const errText = await response.text();
            console.warn(`Cobalt endpoint ${endpoint.url} failed with status ${response.status}: ${errText}`);
            
            try {
              const errJson = JSON.parse(errText);
              lastError = new Error(errJson.text || `Status ${response.status}`);
            } catch {
              lastError = new Error(`Status ${response.status}: ${errText}`);
            }
          }
        } catch (e: any) {
          console.warn(`Failed to connect to ${endpoint.url}:`, e.message);
          lastError = e;
        }
      }

      throw lastError || new Error("Todos os servidores de processamento estão ocupados ou indisponíveis no momento.");
    } catch (error: any) {
      console.error("Error in /api/proxy-cobalt:", error);
      res.status(500).json({ status: "error", text: error.message || "Erro interno ao processar a conversão." });
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
