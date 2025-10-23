import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { NBAProvider } from './context/NBAProvider';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NBAProvider>
        <App />
      </NBAProvider>
    </BrowserRouter>
  </StrictMode>,
);
