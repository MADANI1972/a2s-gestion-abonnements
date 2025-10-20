import { supabase } from '../config/supabase';

const usersService = {
  // Récupérer tous les utilisateurs
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Récupérer un utilisateur par ID
  async getById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Créer un nouvel utilisateur
  async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        role: userData.role || 'utilisateur',
        statut: userData.statut || 'actif'
      }])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Mettre à jour un utilisateur
  async update(id, userData) {
    const { data, error } = await supabase
      .from('users')
      .update({
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        role: userData.role,
        statut: userData.statut
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Supprimer un utilisateur
  async delete(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Récupérer les utilisateurs par rôle
  async getByRole(role) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('nom', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Récupérer les utilisateurs actifs
  async getActiveUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('statut', 'actif')
      .order('nom', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Changer le statut d'un utilisateur
  async changeStatus(id, statut) {
    const { data, error } = await supabase
      .from('users')
      .update({ statut })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Rechercher des utilisateurs
  async search(searchTerm) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('nom', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Récupérer les statistiques des utilisateurs
  async getStats() {
    const { data: allUsers, error: error1 } = await supabase
      .from('users')
      .select('role, statut');
    
    if (error1) throw error1;

    const stats = {
      total: allUsers.length,
      actifs: allUsers.filter(u => u.statut === 'actif').length,
      inactifs: allUsers.filter(u => u.statut === 'inactif').length,
      suspendus: allUsers.filter(u => u.statut === 'suspendu').length,
      super_admins: allUsers.filter(u => u.role === 'super_admin').length,
      admins: allUsers.filter(u => u.role === 'admin').length,
      commerciaux: allUsers.filter(u => u.role === 'commercial').length,
      utilisateurs: allUsers.filter(u => u.role === 'utilisateur').length,
      lecteurs: allUsers.filter(u => u.role === 'lecteur').length
    };

    return stats;
  },

  // Vérifier si un email existe déjà
  async emailExists(email, excludeId = null) {
    let query = supabase
      .from('users')
      .select('id')
      .eq('email', email);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data.length > 0;
  },

  // Mettre à jour le rôle d'un utilisateur
  async updateRole(id, role) {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Récupérer les utilisateurs récemment créés
  async getRecentUsers(limit = 10) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // Récupérer les utilisateurs par statut
  async getByStatut(statut) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('statut', statut)
      .order('nom', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Activer plusieurs utilisateurs à la fois
  async activateMultiple(userIds) {
    const { data, error } = await supabase
      .from('users')
      .update({ statut: 'actif' })
      .in('id', userIds)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Désactiver plusieurs utilisateurs à la fois
  async deactivateMultiple(userIds) {
    const { data, error } = await supabase
      .from('users')
      .update({ statut: 'inactif' })
      .in('id', userIds)
      .select();
    
    if (error) throw error;
    return data;
  }
};

export default usersService;