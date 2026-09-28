import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/instrument-sans/wdth.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/app.css';
import { Guide } from './ui/Guide';

// ?guide opens the printable presenter guide instead of the exhibit
const guide = new URLSearchParams(window.location.search).has('guide');

createRoot(document.getElementById('root')!).render(<StrictMode>{guide ? <Guide /> : <App />}</StrictMode>);
