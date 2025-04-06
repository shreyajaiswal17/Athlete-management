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
        domain={`${import.meta.env.VITE_AUTH0_DOMAIN}`} // Using ${} for explicit interpolation
        clientId={`${import.meta.env.VITE_AUTH0_CLIENT_ID}`} // Using ${} for explicit interpolation
        authorizationParams={{
          redirect_uri: `${import.meta.env.VITE_AUTH0_REDIRECT_URI}`, // Using ${} for explicit interpolation
        }}
      >
        <App />
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>
);