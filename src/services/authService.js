import { supabase } from '../config/supabase';

const authService = {
  // Connexion
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Déconnexion
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },

  // Inscription
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Récupérer l'utilisateur actuel
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Récupérer la session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Réinitialiser le mot de passe
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
    return data;
  },

  // Mettre à jour le mot de passe
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return data;
  },

  // Mettre à jour le profil
  async updateProfile(userData) {
    const { data, error } = await supabase.auth.updateUser({
      data: userData
    });
    
    if (error) throw error;
    return data;
  },

  // Écouter les changements d'authentification
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

export default authService;