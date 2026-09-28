import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-400-italic.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-sans/latin-600-italic.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-500-italic.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import '@fontsource/unbounded/latin-800.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { LITE } from './app/quality';
import './styles/app.css';
import { Guide } from './ui/Guide';

// weaker devices get lighter 3D and fewer screen effects (see app/quality.ts)
if (LITE) document.documentElement.classList.add('lite');

// ?guide opens the printable presenter guide instead of the exhibit
const guide = new URLSearchParams(window.location.search).has('guide');

createRoot(document.getElementById('root')!).render(<StrictMode>{guide ? <Guide /> : <App />}</StrictMode>);
