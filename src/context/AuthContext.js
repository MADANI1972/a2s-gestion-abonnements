// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../config/supabase';
import usersService from '../services/usersService';

// Créer le contexte
const AuthContext = createContext({});

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Provider du contexte
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Vérifier la session au chargement
  useEffect(() => {
    checkUser();

    // Écouter les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          setSession(session);
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setSession(null);
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Vérifier l'utilisateur actuel
  const checkUser = async () => {
    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session?.user) {
        setUser(session.user);
        setSession(session);
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Erreur checkUser:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger le profil utilisateur depuis user_profiles
  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await usersService.getUserById(userId);
      
      if (error) throw error;
      
      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Erreur loadUserProfile:', error);
      return null;
    }
  };

  // Connexion
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Charger le profil
      await loadUserProfile(data.user.id);

      // Vérifier si l'utilisateur est actif
      const profile = await loadUserProfile(data.user.id);
      if (profile && !profile.is_active) {
        await signOut();
        throw new Error('Votre compte est désactivé. Contactez l\'administrateur.');
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erreur signIn:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      setUser(null);
      setSession(null);
      setUserProfile(null);

      return { error: null };
    } catch (error) {
      console.error('Erreur signOut:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le mot de passe
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur resetPassword:', error);
      return { data: null, error };
    }
  };

  // Mettre à jour le mot de passe
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur updatePassword:', error);
      return { data: null, error };
    }
  };

  // Mettre à jour le profil utilisateur
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await usersService.updateUserProfile(user.id, updates);
      
      if (error) throw error;

      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Erreur updateProfile:', error);
      return { data: null, error };
    }
  };

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role) => {
    if (!userProfile) return false;
    return userProfile.role === role;
  };

  // Vérifier si l'utilisateur est admin (super_admin ou admin)
  const isAdmin = () => {
    if (!userProfile) return false;
    return ['super_admin', 'admin'].includes(userProfile.role);
  };

  // Vérifier si l'utilisateur est super admin
  const isSuperAdmin = () => {
    if (!userProfile) return false;
    return userProfile.role === 'super_admin';
  };

  // Vérifier si l'utilisateur a accès à une wilaya
  const hasWilayaAccess = (wilaya) => {
    if (!userProfile) return false;
    
    // Super admin et admin ont accès à toutes les wilayas
    if (isAdmin()) return true;
    
    // Commercial: vérifier les wilayas assignées
    if (userProfile.role === 'commercial') {
      return userProfile.wilaya_assigned?.includes(wilaya) || false;
    }
    
    // Lecteur: accès en lecture seule à tout
    return userProfile.role === 'lecteur';
  };

  // Vérifier si l'utilisateur peut modifier (pas lecteur)
  const canEdit = () => {
    if (!userProfile) return false;
    return userProfile.role !== 'lecteur';
  };

  // Valeur du contexte
  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    hasRole,
    isAdmin,
    isSuperAdmin,
    hasWilayaAccess,
    canEdit,
    refreshProfile: () => loadUserProfile(user?.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;