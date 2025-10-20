// src/App.js - Version avec AuthContext, Navigation et Installations
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import des composants existants
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Abonnements from './components/Abonnements';
import Paiements from './components/Paiements';
import Alertes from './components/Alertes';
import Applications from './components/Applications';
import Installations from './components/Installations'; // ⬇️ NOUVEAU
import Utilisateurs from './components/Utilisateurs';

// Composant Layout (le contenu principal avec sidebar)
function AppLayout() {
  const { userProfile, user, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // ⬇️ NAVIGATION MISE À JOUR - Installations ajouté, Services supprimé
  const navigationItems = [
    { path: '/dashboard', icon: '📊', label: 'Tableau de Bord' },
    { path: '/clients', icon: '👥', label: 'Clients' },
    { path: '/abonnements', icon: '📅', label: 'Abonnements' },
    { path: '/paiements', icon: '💳', label: 'Paiements' },
    { path: '/installations', icon: '⬇️', label: 'Installations' }, // ⬇️ NOUVEAU
    { path: '/alertes', icon: '🔔', label: 'Alertes' },
    { path: '/applications', icon: '📦', label: 'Applications' },
    { path: '/utilisateurs', icon: '⚙️', label: 'Utilisateurs' }
  ];

  return (
    <div className="main-container">
      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Header Sidebar */}
        <div className="p-4 border-b border-blue-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-900 font-bold text-xl">A2S</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">A2S Gestion</h1>
              <p className="text-xs text-blue-200">Abonnements</p>
            </div>
          </div>
          <button 
            onClick={closeSidebar}
            className="lg:hidden text-white hover:bg-blue-700 p-2 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-700 text-white'
                      : 'hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {userProfile?.nom?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden lg:block">
                <p className="font-medium text-sm truncate max-w-[150px]">
                  {userProfile?.nom && userProfile?.prenom 
                    ? `${userProfile.nom} ${userProfile.prenom}` 
                    : user?.email}
                </p>
                <p className="text-xs text-blue-200 capitalize">
                  {userProfile?.role?.replace('_', ' ') || 'Utilisateur'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-blue-200 hover:text-white transition-colors p-2"
              title="Déconnexion"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="mobile-header">
          <button
            onClick={toggleSidebar}
            className="text-gray-700 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A2S</span>
            </div>
            <span className="font-bold text-gray-900">A2S Gestion</span>
          </div>

          <button className="text-gray-700 hover:text-gray-900 relative">
            <Bell size={24} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </header>

        {/* Content Area */}
        <main className="content-wrapper">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/abonnements" element={<Abonnements />} />
            <Route path="/paiements" element={<Paiements />} />
            <Route path="/installations" element={<Installations />} /> {/* ⬇️ NOUVEAU */}
            <Route path="/alertes" element={<Alertes />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/utilisateurs" element={<Utilisateurs />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Composant principal App
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}
export default App;