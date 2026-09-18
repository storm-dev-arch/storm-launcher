import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { MiniWidget } from './components/MiniWidget';
import './styles/theme.css';
import './styles/animations.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const isMiniMode = window.location.hash === '#mini';

root.render(
  <React.StrictMode>
    {isMiniMode ? <MiniWidget /> : <App />}
  </React.StrictMode>
);
