import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        throw signInError;
      }
      
      // La redirection est gérée automatiquement par AuthContext
      console.log('Connexion réussie');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      
      if (err.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter');
      } else if (err.message.includes('désactivé')) {
        setError(err.message);
      } else {
        setError('Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 sm:p-4 rounded-full backdrop-blur-sm">
                <LogIn className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">A2S Gestion</h1>
            <p className="text-blue-100 text-center text-xs sm:text-sm">
              Système de Gestion des Abonnements
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Connexion</h2>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 sm:mb-6 bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs sm:text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Email Field */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
                    placeholder="exemple@email.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de Passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Se souvenir de moi
                  </label>
                </div>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Mot de passe oublié ?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm sm:text-base">Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    <span className="text-sm sm:text-base">Se connecter</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold mb-2 text-blue-800">
                🔐 Mode Démo (pour tester)
              </p>
              <div className="space-y-1 text-xs text-blue-700">
                <p className="break-all">
                  <strong>Email:</strong> demo@a2s.dz
                </p>
                <p>
                  <strong>Mot de passe:</strong> demo123
                </p>
                <p className="text-blue-600 mt-2 italic text-xs">
                  Utilisez ces identifiants pour tester l'application
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 sm:px-8 py-3 sm:py-4 border-t border-gray-200">
            <p className="text-center text-xs sm:text-sm text-gray-600">
              © 2025 SARL A2S - Tous droits réservés
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-white text-xs sm:text-sm">
            Besoin d'aide ? Contactez l'administrateur
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;