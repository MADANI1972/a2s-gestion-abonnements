import { supabase } from '../config/supabase';

const statsService = {
  // Statistiques globales du dashboard
  async getDashboardStats() {
    try {
      // Récupérer le nombre total de clients
      const { count: totalClients, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      
      if (clientsError) throw clientsError;

      // Récupérer le nombre d'abonnements actifs
      const { count: abonnementsActifs, error: abonnementsError } = await supabase
        .from('abonnements')
        .select('*', { count: 'exact', head: true })
        .eq('statut_abonnement', 'actif');
      
      if (abonnementsError) throw abonnementsError;

      // Calculer le revenu total
      const { data: paiements, error: paiementsError } = await supabase
        .from('paiements')
        .select('montant')
        .eq('statut', 'valide');
      
      if (paiementsError) throw paiementsError;
      
      const revenus = paiements.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);

      // Compter les alertes (abonnements expirant dans moins de 30 jours)
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: alertes, error: alertesError } = await supabase
        .from('abonnements')
        .select('*', { count: 'exact', head: true })
        .lte('date_fin', thirtyDaysFromNow.toISOString())
        .eq('statut_abonnement', 'actif');
      
      if (alertesError) throw alertesError;

      return {
        totalClients: totalClients || 0,
        abonnementsActifs: abonnementsActifs || 0,
        revenus: revenus || 0,
        alertes: alertes || 0
      };
    } catch (error) {
      console.error('Erreur statistiques:', error);
      return {
        totalClients: 0,
        abonnementsActifs: 0,
        revenus: 0,
        alertes: 0
      };
    }
  },

  // Statistiques par région
  async getStatsByRegion() {
    const { data, error } = await supabase
      .from('clients')
      .select('region');
    
    if (error) throw error;

    // Compter les clients par région
    const regionStats = data.reduce((acc, client) => {
      const region = client.region || 'Non défini';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(regionStats).map(([region, count]) => ({
      region,
      count
    }));
  },

  // Statistiques des paiements par mois
  async getPaymentsByMonth(year = new Date().getFullYear()) {
    const { data, error } = await supabase
      .from('paiements')
      .select('montant, date_paiement')
      .gte('date_paiement', `${year}-01-01`)
      .lte('date_paiement', `${year}-12-31`)
      .eq('statut', 'valide');
    
    if (error) throw error;

    // Grouper par mois
    const monthlyStats = Array(12).fill(0);
    data.forEach(paiement => {
      const month = new Date(paiement.date_paiement).getMonth();
      monthlyStats[month] += parseFloat(paiement.montant || 0);
    });

    return monthlyStats.map((montant, index) => ({
      mois: index + 1,
      montant: montant
    }));
  },

  // Statistiques des abonnements par type
  async getAbonnementsByType() {
    const { data, error } = await supabase
      .from('abonnements')
      .select('type_abonnement, statut_abonnement');
    
    if (error) throw error;

    // Grouper par type
    const typeStats = data.reduce((acc, abonnement) => {
      const type = abonnement.type_abonnement || 'Non défini';
      if (!acc[type]) {
        acc[type] = { total: 0, actifs: 0 };
      }
      acc[type].total++;
      if (abonnement.statut_abonnement === 'actif') {
        acc[type].actifs++;
      }
      return acc;
    }, {});

    return Object.entries(typeStats).map(([type, stats]) => ({
      type,
      total: stats.total,
      actifs: stats.actifs
    }));
  },

  // Récupérer les alertes d'expiration
  async getExpirationAlerts() {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { data, error } = await supabase
      .from('abonnements')
      .select(`
        *,
        clients (
          nom,
          prenom,
          raison_sociale
        )
      `)
      .lte('date_fin', thirtyDaysFromNow.toISOString())
      .gte('date_fin', today.toISOString())
      .eq('statut_abonnement', 'actif')
      .order('date_fin', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Statistiques de croissance
  async getGrowthStats() {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Nouveaux clients ce mois
    const { count: newClientsThisMonth, error: error1 } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString());
    
    if (error1) throw error1;

    // Nouveaux abonnements ce mois
    const { count: newAbonnementsThisMonth, error: error2 } = await supabase
      .from('abonnements')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString());
    
    if (error2) throw error2;

    // Revenus ce mois
    const { data: recentPayments, error: error3 } = await supabase
      .from('paiements')
      .select('montant')
      .gte('date_paiement', lastMonth.toISOString())
      .eq('statut', 'valide');
    
    if (error3) throw error3;

    const revenusThisMonth = recentPayments.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);

    return {
      newClientsThisMonth: newClientsThisMonth || 0,
      newAbonnementsThisMonth: newAbonnementsThisMonth || 0,
      revenusThisMonth: revenusThisMonth || 0
    };
  }
};

export default statsService;