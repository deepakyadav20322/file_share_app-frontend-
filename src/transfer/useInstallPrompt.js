import { useEffect, useState } from "react";

// "Install app": the browser offers an install prompt (Chrome, Edge, Android) and we keep it until the
// visitor presses our button. Nothing shows once the app is installed or when the browser has no prompt.
let saved = null;
const listeners = new Set();
const publish = () => listeners.forEach((fn) => fn(saved));

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    saved = e;
    publish();
  });
  window.addEventListener("appinstalled", () => {
    saved = null;
    publish();
  });
}

export default function useInstallPrompt() {
  const [prompt, setPrompt] = useState(saved);
  useEffect(() => {
    listeners.add(setPrompt);
    return () => listeners.delete(setPrompt);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice.catch(() => {});
    saved = null;
    publish();
  };
  return { canInstall: Boolean(prompt), install };
}
