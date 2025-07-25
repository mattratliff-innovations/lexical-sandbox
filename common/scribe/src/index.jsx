import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import AppProvider from './AppProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode render things twice in development
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
