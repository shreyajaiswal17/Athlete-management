import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const endpoint = isLogin
        ? `${import.meta.env.VITE_BACKEND_URL}/auth/login`
        : `${import.meta.env.VITE_BACKEND_URL}/auth/signup`;

      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { username: formData.username, email: formData.email, password: formData.password };

      // Redirect to Auth0 for login
      window.location.href = `https://dev-6qk83ogv0ykpxkkr.us.auth0.com/login?redirect_uri=${window.location.origin}/login`;
      return;

    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleLogin = () => {
    const googleLoginUrl = `https://dev-6qk83ogv0ykpxkkr.us.auth0.com/login?redirect_uri=${window.location.origin}/login&connection=google-oauth2`;
    window.location.href = googleLoginUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-indigo-700 mb-2">
            Welcome to Athlete Management Forum
          </h1>
          <p className="text-gray-600">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-3 px-6 rounded-lg"
          >
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 text-white font-bold py-3 px-6 rounded-lg"
          >
            Sign in with Google
          </button>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 hover:text-indigo-800 font-medium mt-4"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
