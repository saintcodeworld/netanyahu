import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import SolanaProvider from './components/SolanaProvider.tsx';
import { PrizePoolProvider } from './context/PrizePoolContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SolanaProvider>
      <PrizePoolProvider>
        <App />
      </PrizePoolProvider>
    </SolanaProvider>
  </StrictMode>,
);
