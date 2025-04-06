import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { loginWithRedirect } = useAuth0(); // Use Auth0's hook
  const navigate = useNavigate();

  const handleAuth = () => {
    // Redirect to Auth0's hosted login page
    loginWithRedirect({
      redirectUri: `${VITE_AUTH0_REDIRECT_URI}`, // Where to go after login
      screen_hint: isLogin ? "login" : "signup", // Hint to Auth0: login or signup
    });
  };

  const handleGoogleLogin = () => {
    // Redirect to Auth0 with Google connection
    loginWithRedirect({
      redirectUri: `${VITE_AUTH0_REDIRECT_URI}`,
      connection: "google-oauth2", // Specify Google OAuth2 connection
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-700">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-indigo-400 mb-2">
          Welcome to Athlete Management Forum
        </h1>
        <p className="text-gray-300">
          {isLogin ? "Sign in to your account" : "Create your account"}
        </p>
      </div>
  
      <div className="space-y-6">
        <button
          onClick={handleAuth}
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-400 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-300 hover:scale-105 shadow-md"
        >
          {isLogin ? "Sign In" : "Create Account"}
        </button>
  
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-300 hover:scale-105 shadow-md"
        >
          Sign in with Google
        </button>
  
        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  </div>
  
  );
};

export default AuthForm;