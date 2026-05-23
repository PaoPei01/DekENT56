import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { EventProvider } from './context/EventContext';
import { LanguageProvider } from './context/LanguageContext';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <EventProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </EventProvider>
    </LanguageProvider>
  </StrictMode>,
);
