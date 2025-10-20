import { supabase } from '../config/supabase';

const abonnementsService = {
  // Récupérer tous les abonnements
  async getAll() {
    const { data, error } = await supabase
      .from('abonnements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Récupérer un abonnement par ID
  async getById(id) {
    const { data, error } = await supabase
      .from('abonnements')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Créer un nouvel abonnement
  async create(abonnementData) {
    const { data, error } = await supabase
      .from('abonnements')
      .insert([abonnementData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Mettre à jour un abonnement
  async update(id, abonnementData) {
    const { data, error } = await supabase
      .from('abonnements')
      .update(abonnementData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Supprimer un abonnement
  async delete(id) {
    const { error } = await supabase
      .from('abonnements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Récupérer les abonnements d'un client
  async getByClient(clientId) {
    const { data, error } = await supabase
      .from('abonnements')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) throw error;
    return data;
  },

  // Récupérer les abonnements expirant bientôt (moins de 30 jours)
  async getExpiringSoon() {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.setDate(today.getDate() + 30));
    
    const { data, error } = await supabase
      .from('abonnements')
      .select('*')
      .lte('date_fin', thirtyDaysFromNow.toISOString())
      .eq('statut_abonnement', 'actif');
    
    if (error) throw error;
    return data;
  },

  // Récupérer les abonnements par statut
  async getByStatut(statut) {
    const { data, error } = await supabase
      .from('abonnements')
      .select('*')
      .eq('statut_abonnement', statut);
    
    if (error) throw error;
    return data;
  }
};

export default abonnementsService;