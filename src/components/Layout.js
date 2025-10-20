// src/components/common/Layout.js
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Bell,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCog
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Navigation items
  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'admin', 'commercial', 'lecteur']
    },
    {
      name: 'Clients',
      path: '/clients',
      icon: Users,
      roles: ['super_admin', 'admin', 'commercial', 'lecteur']
    },
    {
      name: 'Abonnements',
      path: '/abonnements',
      icon: Calendar,
      roles: ['super_admin', 'admin', 'commercial', 'lecteur']
    },
    {
      name: 'Paiements',
      path: '/paiements',
      icon: DollarSign,
      roles: ['super_admin', 'admin', 'commercial', 'lecteur']
    },
    {
      name: 'Alertes',
      path: '/alertes',
      icon: Bell,
      roles: ['super_admin', 'admin', 'commercial', 'lecteur']
    },
    {
      name: 'Rapports',
      path: '/rapports',
      icon: FileText,
      roles: ['super_admin', 'admin', 'commercial']
    },
    {
      name: 'Utilisateurs',
      path: '/utilisateurs',
      icon: UserCog,
      roles: ['super_admin', 'admin']
    }
  ];

  // Filtrer les items selon le rôle
  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes(userProfile?.role)
  );

  // Fermer le menu profil quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuOpen && !event.target.closest('.profile-menu-container')) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  // Fermer la sidebar mobile lors du changement de route
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">A2S</h1>
                <p className="text-xs text-gray-500">Gestion Abonnements</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Desktop */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {userProfile?.full_name || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {userProfile?.role?.replace('_', ' ') || 'Rôle'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Mobile - Overlay + Sidebar */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 sm:w-72 bg-white z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-xl">
            {/* Header Mobile */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">A2S</h1>
                  <p className="text-xs text-gray-500">Gestion Abonnements</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Mobile */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile Mobile */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">
                    {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {userProfile?.full_name || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize truncate">
                    {userProfile?.role?.replace('_', ' ') || 'Rôle'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar - Responsive */}
        <div className="sticky top-0 z-30 flex-shrink-0 h-14 sm:h-16 bg-white shadow">
          <div className="flex h-full">
            {/* Menu Hamburger - Mobile Only */}
            <button
              type="button"
              className="px-3 sm:px-4 border-r border-gray-200 text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Navbar Content */}
            <div className="flex-1 px-3 sm:px-4 flex justify-between items-center">
              {/* Page Title */}
              <div className="flex-1 flex items-center min-w-0">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 capitalize truncate">
                  {location.pathname.split('/')[1] || 'Dashboard'}
                </h2>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2 ml-2">
                {/* Notifications */}
                <button className="relative p-1.5 sm:p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                </button>

                {/* Settings */}
                <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                {/* Profile Menu Desktop */}
                <div className="relative hidden lg:block profile-menu-container">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200 animate-fadeIn">
                      <Link
                        to="/profil"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Mon Profil
                      </Link>
                      <Link
                        to="/parametres"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Paramètres
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;