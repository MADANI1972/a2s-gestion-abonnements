// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'votre-cle-anonyme';

// Options de configuration
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'a2s-auth-token',
    flowType: 'pkce' // Utilise PKCE pour plus de sécurité
  },
  global: {
    headers: {
      'x-application-name': 'A2S-Abonnements'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
};

// Créer l'instance Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Helper functions pour l'authentification
export const auth = {
  // Se connecter
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { data: null, error };
    }
  },

  // Se déconnecter
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      return { error };
    }
  },

  // Récupérer l'utilisateur actuel
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      return { user: null, error };
    }
  },

  // Récupérer la session actuelle
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      console.error('Erreur récupération session:', error);
      return { session: null, error };
    }
  },

  // Écouter les changements d'authentification
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Réinitialiser le mot de passe
  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      return { data: null, error };
    }
  },

  // Mettre à jour le mot de passe
  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur mise à jour mot de passe:', error);
      return { data: null, error };
    }
  }
};

// Helper functions pour la base de données
export const db = {
  // Requête générique SELECT
  async select(table, options = {}) {
    try {
      let query = supabase.from(table).select(options.select || '*');

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options.order) {
        query = query.order(options.order.column, { 
          ascending: options.order.ascending !== false 
        });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.range) {
        query = query.range(options.range.from, options.range.to);
      }

      const { data, error } = options.single 
        ? await query.single() 
        : await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Erreur SELECT ${table}:`, error);
      return { data: null, error };
    }
  },

  // Requête INSERT
  async insert(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      console.error(`Erreur INSERT ${table}:`, error);
      return { data: null, error };
    }
  },

  // Requête UPDATE
  async update(table, id, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      console.error(`Erreur UPDATE ${table}:`, error);
      return { data: null, error };
    }
  },

  // Requête DELETE
  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error(`Erreur DELETE ${table}:`, error);
      return { error };
    }
  }
};

// Helper functions pour le temps réel
export const realtime = {
  // S'abonner aux changements d'une table
  subscribe(table, callback, filters = {}) {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...filters
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return channel;
  },

  // Se désabonner
  unsubscribe(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
};

// Helper functions pour le stockage de fichiers
export const storage = {
  // Upload un fichier
  async upload(bucket, path, file) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur upload fichier:', error);
      return { data: null, error };
    }
  },

  // Télécharger un fichier
  async download(bucket, path) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur download fichier:', error);
      return { data: null, error };
    }
  },

  // Obtenir l'URL publique d'un fichier
  getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  // Supprimer un fichier
  async remove(bucket, paths) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
      return { data: null, error };
    }
  }
};

// Fonction de vérification de la connexion
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('regions').select('count');
    return !error;
  } catch (error) {
    console.error('Erreur de connexion Supabase:', error);
    return false;
  }
};

export default supabase;