import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/archivo/wdth-italic.css';
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource-variable/atkinson-hyperlegible-next/wght-italic.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/app.css';
import { Guide } from './ui/Guide';

// ?guide opens the printable presenter guide instead of the exhibit
const guide = new URLSearchParams(window.location.search).has('guide');

createRoot(document.getElementById('root')!).render(<StrictMode>{guide ? <Guide /> : <App />}</StrictMode>);
