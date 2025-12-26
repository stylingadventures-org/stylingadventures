import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Cognito callback URL fix deployed to support root domain

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
