// src/services/applicationsService.js
import { supabase } from '../config/supabase';

const applicationsService = {
  // Récupérer toutes les applications
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('nom', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des applications:', error);
      throw error;
    }
  },

  // Récupérer une application par ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'application:', error);
      throw error;
    }
  },

  // Créer une nouvelle application
  async create(applicationData) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert([applicationData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'application:', error);
      throw error;
    }
  },

  // Mettre à jour une application
  async update(id, applicationData) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update(applicationData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'application:', error);
      throw error;
    }
  },

  // Supprimer une application
  async delete(id) {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'application:', error);
      throw error;
    }
  }
};

export default applicationsService;