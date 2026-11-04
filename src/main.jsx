import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HarProvider } from './context/HarContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <HarProvider>
        <App />
      </HarProvider>
    </BrowserRouter>
  </React.StrictMode>
);
