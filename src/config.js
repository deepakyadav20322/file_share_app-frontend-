// Set VITE_API_URL in .env.local to point at a local backend, e.g. http://127.0.0.1:3000/api
let baseURL = import.meta.env.VITE_API_URL || 'https://file-share-app-backend.onrender.com/api'

// Opened from another device (http://192.168.x.x:3001)? "localhost" in the API address would then mean
// that device itself, so use the address the page was opened from instead.
if (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(new URL(baseURL).hostname)) {
  const here = window.location.hostname
  if (here && here !== 'localhost' && here !== '127.0.0.1') {
    const url = new URL(baseURL)
    url.hostname = here
    baseURL = url.toString().replace(/\/$/, '')
  }
}

export default baseURL;
