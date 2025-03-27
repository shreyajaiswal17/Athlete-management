import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain="dev-6qk83ogv0ykpxkkr.us.auth0.com"
        clientId="Bcxbaye7UIEd9i0qtlo6m41Rzn6UU35E"
        authorizationParams={{
          redirect_uri: 'http://localhost:5173', // Explicitly set to match your frontend
        }}
      >
        <App />
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>
);