// src/services/installationsService.js
import { supabase } from '../config/supabase';

const installationsService = {
  // Récupérer toutes les installations
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('installations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des installations:', error);
      throw error;
    }
  },

  // Récupérer une installation par ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('installations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'installation:', error);
      throw error;
    }
  },

  // Créer une nouvelle installation
  async create(installationData) {
    try {
      const { data, error } = await supabase
        .from('installations')
        .insert([installationData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'installation:', error);
      throw error;
    }
  },

  // Mettre à jour une installation
  async update(id, installationData) {
    try {
      const { data, error } = await supabase
        .from('installations')
        .update(installationData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'installation:', error);
      throw error;
    }
  },

  // Supprimer une installation
  async delete(id) {
    try {
      const { error } = await supabase
        .from('installations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'installation:', error);
      throw error;
    }
  },

  // Récupérer les installations par client
  async getByClient(clientId) {
    try {
      const { data, error } = await supabase
        .from('installations')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des installations du client:', error);
      throw error;
    }
  },

  // Récupérer les installations par statut
  async getByStatut(statut) {
    try {
      const { data, error } = await supabase
        .from('installations')
        .select('*')
        .eq('statut', statut)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des installations par statut:', error);
      throw error;
    }
  }
};

export default installationsService;