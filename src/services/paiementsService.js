import { supabase } from '../config/supabase';

const paiementsService = {
  // Récupérer tous les paiements
  async getAll() {
    const { data, error } = await supabase
      .from('paiements')
      .select('*')
      .order('date_paiement', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Récupérer un paiement par ID
  async getById(id) {
    const { data, error } = await supabase
      .from('paiements')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Créer un nouveau paiement
  async create(paiementData) {
    const { data, error } = await supabase
      .from('paiements')
      .insert([paiementData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Mettre à jour un paiement
  async update(id, paiementData) {
    const { data, error } = await supabase
      .from('paiements')
      .update(paiementData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Supprimer un paiement
  async delete(id) {
    const { error } = await supabase
      .from('paiements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Récupérer les paiements d'un abonnement
  async getByAbonnement(abonnementId) {
    const { data, error } = await supabase
      .from('paiements')
      .select('*')
      .eq('abonnement_id', abonnementId);
    
    if (error) throw error;
    return data;
  },

  // Récupérer les paiements par statut
  async getByStatut(statut) {
    const { data, error } = await supabase
      .from('paiements')
      .select('*')
      .eq('statut', statut);
    
    if (error) throw error;
    return data;
  },

  // Calculer le total des paiements
  async getTotalPaiements() {
    const { data, error } = await supabase
      .from('paiements')
      .select('montant');
    
    if (error) throw error;
    
    const total = data.reduce((sum, paiement) => sum + parseFloat(paiement.montant || 0), 0);
    return total;
  },

  // Récupérer les paiements par période
  async getByPeriod(dateDebut, dateFin) {
    const { data, error } = await supabase
      .from('paiements')
      .select('*')
      .gte('date_paiement', dateDebut)
      .lte('date_paiement', dateFin);
    
    if (error) throw error;
    return data;
  }
};

export default paiementsService;