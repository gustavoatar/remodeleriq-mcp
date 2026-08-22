// Server-side PDF text extraction. This is the fallback the browser uses when
// its own pdf.js worker can't run (notably mobile Safari), so a homeowner on
// any device can still upload a PDF bid. unpdf runs pdf.js in a serverless-safe
// way on Cloudflare Workers — no DOM/canvas needed for text.
import { Hono } from "hono";
import { extractText, getDocumentProxy } from "unpdf";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

const MAX_BYTES = 10 * 1024 * 1024; // mirror the client 10MB cap

app.post("/", async (c) => {
  try {
    const buf = await c.req.arrayBuffer();
    if (!buf || buf.byteLength === 0) {
      return c.json({ error: "No file received" }, 400);
    }
    if (buf.byteLength > MAX_BYTES) {
      return c.json({ error: "File too large (max 10MB)" }, 413);
    }
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    return c.json({ text: text || "", totalPages: totalPages || 1 });
  } catch (e) {
    console.error("pdf-extract failed:", e);
    return c.json({ error: "Could not extract text from this PDF" }, 422);
  }
});

export default app;
