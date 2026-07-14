import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "animate.css";
import "@/react-app/index.css";
import App from "@/react-app/App.tsx";

const rootEl = document.getElementById("root")!;
const tree = (
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);

// Prerendered routes (see scripts/prerender.mjs) ship real HTML inside #root —
// hydrate over it so crawlers get content and users see no flash. Every other
// route arrives with an empty #root and renders fresh.
if (rootEl.childNodes.length > 0) {
  hydrateRoot(rootEl, tree);
} else {
  createRoot(rootEl).render(tree);
}
