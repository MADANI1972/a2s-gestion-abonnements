import { supabase } from '../config/supabase';

const clientsService = {
  // Récupérer tous les clients
  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Récupérer un client par ID
  async getById(id) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Créer un nouveau client
  async create(clientData) {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Mettre à jour un client
  async update(id, clientData) {
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Supprimer un client
  async delete(id) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Rechercher des clients
  async search(searchTerm) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,raison_sociale.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    
    if (error) throw error;
    return data;
  },

  // Filtrer par région
  async getByRegion(region) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('region', region);
    
    if (error) throw error;
    return data;
  }
};

export default clientsService;