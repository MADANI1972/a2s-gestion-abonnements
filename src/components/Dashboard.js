import React, { useState, useEffect } from 'react';
import { Users, DollarSign, AlertCircle, TrendingUp, Calendar, RefreshCw, ArrowUp, ArrowDown, Brain, Activity, Target, Zap, Filter, X } from 'lucide-react';
import clientsService from '../services/clientsService';
import abonnementsService from '../services/abonnementsService';
import paiementsService from '../services/paiementsService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    abonnementsActifs: 0,
    revenus: 0,
    alertes: 0
  });
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [alertesRecentes, setAlertesRecentes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 📅 NOUVEAUX ÉTATS POUR LE FILTRE PAR DATE
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 📅 FONCTION POUR FILTRER LES DONNÉES PAR DATE
  const filterDataByDate = (data, dateField) => {
    if (!dateDebut && !dateFin) return data;
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      const debut = dateDebut ? new Date(dateDebut) : null;
      const fin = dateFin ? new Date(dateFin) : null;
      
      if (debut && fin) {
        return itemDate >= debut && itemDate <= fin;
      } else if (debut) {
        return itemDate >= debut;
      } else if (fin) {
        return itemDate <= fin;
      }
      return true;
    });
  };

  // 📅 APPLIQUER LE FILTRE
  const appliquerFiltre = () => {
    setIsFiltered(true);
    loadDashboardData();
    setShowFilters(false);
  };

  // 📅 RÉINITIALISER LE FILTRE
  const reinitialiserFiltre = () => {
    setDateDebut('');
    setDateFin('');
    setIsFiltered(false);
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [clientsData, abonnementsData, paiementsData] = await Promise.all([
        clientsService.getAll(),
        abonnementsService.getAll(),
        paiementsService.getAll()
      ]);

      setClients(clientsData || []);

      // 📅 FILTRER LES DONNÉES SI UN FILTRE EST ACTIF
      const filteredAbonnements = (dateDebut || dateFin) 
        ? filterDataByDate(abonnementsData, 'date_debut')
        : abonnementsData;

      const filteredPaiements = (dateDebut || dateFin)
        ? filterDataByDate(paiementsData, 'date_paiement')
        : paiementsData;

      // Calculer les statistiques avec les données filtrées
      const totalClients = clientsData?.length || 0;
      
      const abonnementsActifs = filteredAbonnements?.filter(
        a => a.statut_abonnement === 'actif'
      ).length || 0;

      const revenus = filteredPaiements
        ?.filter(p => p.statut === 'valide')
        .reduce((sum, p) => sum + parseFloat(p.montant || 0), 0) || 0;

      // Calculer les alertes
      const today = new Date();
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      const alertes = filteredAbonnements?.filter(a => {
        if (a.statut_abonnement !== 'actif') return false;
        const dateFin = new Date(a.date_fin);
        return dateFin <= thirtyDaysLater;
      }) || [];

      const alertesAvecClients = alertes.map(alerte => {
        const client = clientsData?.find(c => c.id === alerte.client_id);
        const dateFin = new Date(alerte.date_fin);
        const diffTime = dateFin - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          ...alerte,
          client,
          joursRestants: diffDays
        };
      }).sort((a, b) => a.joursRestants - b.joursRestants).slice(0, 5);

      setAlertesRecentes(alertesAvecClients);

      setStats({
        totalClients,
        abonnementsActifs,
        revenus,
        alertes: alertes.length
      });

      // 🤖 ANALYSE IA avec les données filtrées
      const analysis = analyzePaymentsWithAI(filteredPaiements, filteredAbonnements, clientsData);
      setAiAnalysis(analysis);

      // Créer les activités récentes avec les données filtrées
      const activities = generateActivities(clientsData, filteredAbonnements, filteredPaiements);
      setRecentActivities(activities.slice(0, 6));

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🤖 FONCTION D'ANALYSE IA
  const analyzePaymentsWithAI = (paiements, abonnements, clients) => {
    if (!paiements || paiements.length === 0) {
      return {
        score: 0,
        tendance: 'neutre',
        predictions: [],
        insights: ['Aucune donnée disponible pour l\'analyse'],
        recommendations: []
      };
    }

    // 1. ANALYSE TEMPORELLE
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const paiements30j = paiements.filter(p => new Date(p.date_paiement) >= last30Days && p.statut === 'valide');
    const paiements60j = paiements.filter(p => new Date(p.date_paiement) >= last60Days && new Date(p.date_paiement) < last30Days && p.statut === 'valide');

    const revenu30j = paiements30j.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
    const revenu60j = paiements60j.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);

    // 2. CALCUL DE LA TENDANCE
    const croissance = revenu60j > 0 ? ((revenu30j - revenu60j) / revenu60j) * 100 : 0;
    let tendance = 'stable';
    if (croissance > 10) tendance = 'hausse';
    else if (croissance < -10) tendance = 'baisse';

    // 3. ANALYSE DES RETARDS
    const paiementsEnRetard = paiements.filter(p => p.statut === 'en_attente' || p.statut === 'annule').length;
    const tauxRetard = (paiementsEnRetard / paiements.length) * 100;

    // 4. ANALYSE PAR MÉTHODE DE PAIEMENT
    const methodesCount = {};
    paiements.forEach(p => {
      if (p.statut === 'valide') {
        methodesCount[p.methode_paiement] = (methodesCount[p.methode_paiement] || 0) + 1;
      }
    });
    const methodePreferee = Object.keys(methodesCount).reduce((a, b) => 
      methodesCount[a] > methodesCount[b] ? a : b, 'virement');

    // 5. PRÉDICTION DES REVENUS (basée sur la moyenne)
    const moyennePaiement = revenu30j / (paiements30j.length || 1);
    const prediction30j = moyennePaiement * abonnements.filter(a => a.statut_abonnement === 'actif').length;

    // 6. ANALYSE DES CLIENTS À RISQUE
    const clientsARisque = abonnements.filter(a => {
      const dateFin = new Date(a.date_fin);
      const joursRestants = Math.ceil((dateFin - now) / (1000 * 60 * 60 * 24));
      return joursRestants <= 15 && joursRestants > 0 && a.statut_abonnement === 'actif';
    }).length;

    // 7. SCORE DE SANTÉ FINANCIÈRE (0-100)
    let score = 50;
    score += Math.min(croissance, 30);
    score -= tauxRetard * 0.5;
    score += Math.min((paiements30j.length / 10) * 5, 20);
    score = Math.max(0, Math.min(100, score));

    // 8. INSIGHTS INTELLIGENTS
    const insights = [];
    
    if (croissance > 15) {
      insights.push(`📈 Excellente croissance ! Vos revenus ont augmenté de ${croissance.toFixed(1)}% ce mois`);
    } else if (croissance < -15) {
      insights.push(`⚠️ Attention : Baisse de ${Math.abs(croissance).toFixed(1)}% des revenus ce mois`);
    }

    if (tauxRetard > 20) {
      insights.push(`🔴 Taux de retard élevé : ${tauxRetard.toFixed(1)}% des paiements en attente`);
    } else if (tauxRetard < 5) {
      insights.push(`✅ Excellente ponctualité : seulement ${tauxRetard.toFixed(1)}% de retards`);
    }

    if (clientsARisque > 5) {
      insights.push(`⏰ ${clientsARisque} clients à renouveler dans les 15 prochains jours`);
    }

    insights.push(`💳 Méthode préférée : ${methodePreferee.replace('_', ' ').toUpperCase()}`);

    // 9. RECOMMANDATIONS IA
    const recommendations = [];

    if (croissance < 0) {
      recommendations.push({
        icon: '🎯',
        title: 'Relancer les clients inactifs',
        description: 'Contactez les clients sans renouvellement pour comprendre leurs besoins'
      });
    }

    if (tauxRetard > 15) {
      recommendations.push({
        icon: '⚡',
        title: 'Automatiser les relances',
        description: 'Mettre en place des rappels automatiques avant échéance'
      });
    }

    if (clientsARisque > 0) {
      recommendations.push({
        icon: '📞',
        title: 'Campagne de renouvellement',
        description: `${clientsARisque} clients nécessitent une action immédiate`
      });
    }

    if (abonnements.length > clients.length * 0.7) {
      recommendations.push({
        icon: '🚀',
        title: 'Excellent taux de conversion',
        description: 'Maintenir la stratégie actuelle et cibler de nouveaux clients'
      });
    }

    // 10. PRÉDICTIONS
    const predictions = [
      {
        periode: '30 prochains jours',
        montant: prediction30j,
        confiance: score > 70 ? 'haute' : score > 40 ? 'moyenne' : 'faible'
      }
    ];

    return {
      score: Math.round(score),
      tendance,
      croissance: croissance.toFixed(1),
      tauxRetard: tauxRetard.toFixed(1),
      revenu30j,
      revenu60j,
      clientsARisque,
      predictions,
      insights,
      recommendations,
      methodePreferee
    };
  };

  const generateActivities = (clientsData, abonnementsData, paiementsData) => {
    const activities = [];

    const recentClients = [...(clientsData || [])]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 2);

    recentClients.forEach(client => {
      activities.push({
        type: 'client',
        icon: 'user',
        title: 'Nouveau client ajouté',
        description: `${client.nom} ${client.prenom}`,
        time: formatTimeAgo(client.created_at),
        color: 'green'
      });
    });

    const recentAbonnements = [...(abonnementsData || [])]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 2);

    recentAbonnements.forEach(abonnement => {
      const client = clientsData?.find(c => c.id === abonnement.client_id);
      activities.push({
        type: 'abonnement',
        icon: 'calendar',
        title: 'Abonnement créé',
        description: client ? `${client.nom} ${client.prenom} - ${abonnement.type_abonnement}` : abonnement.type_abonnement,
        time: formatTimeAgo(abonnement.created_at),
        color: 'blue'
      });
    });

    const recentPaiements = [...(paiementsData || [])]
      .sort((a, b) => new Date(b.date_paiement) - new Date(a.date_paiement))
      .slice(0, 2);

    recentPaiements.forEach(paiement => {
      const abonnement = abonnementsData?.find(a => a.id === paiement.abonnement_id);
      const client = abonnement ? clientsData?.find(c => c.id === abonnement.client_id) : null;
      
      activities.push({
        type: 'paiement',
        icon: 'dollar',
        title: 'Paiement reçu',
        description: client 
          ? `${client.nom} ${client.prenom} - ${parseFloat(paiement.montant).toLocaleString()} DA`
          : `${parseFloat(paiement.montant).toLocaleString()} DA`,
        time: formatTimeAgo(paiement.date_paiement),
        color: 'purple'
      });
    });

    return activities.sort((a, b) => {
      const timeA = a.time.includes('minute') || a.time.includes('heure') ? 0 : 1;
      const timeB = b.time.includes('minute') || b.time.includes('heure') ? 0 : 1;
      return timeA - timeB;
    });
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return past.toLocaleDateString('fr-FR');
    }
  };

  const getActivityIcon = (type, color) => {
    const colorClasses = {
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    };

    const iconClass = colorClasses[color] || colorClasses.blue;

    const icons = {
      user: <Users className="w-4 h-4" />,
      calendar: <Calendar className="w-4 h-4" />,
      dollar: <DollarSign className="w-4 h-4" />
    };

    return (
      <div className={`p-2 rounded-full ${iconClass}`}>
        {icons[type] || icons.user}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header avec Filtres - Responsive */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Vue d'ensemble</h2>
            <p className="text-sm sm:text-base text-gray-600">Statistiques en temps réel avec analyse IA</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isFiltered 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="text-sm sm:text-base">Filtrer par période</span>
              {isFiltered && <span className="bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full">Actif</span>}
            </button>
            <button
              onClick={loadDashboardData}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="text-sm sm:text-base">Actualiser</span>
            </button>
          </div>
        </div>

        {/* 📅 PANNEAU DE FILTRES PAR DATE */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-2 border-blue-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Filtrer par période
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Du
                </label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date Fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Au
                </label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  min={dateDebut}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Boutons Actions */}
              <div className="sm:col-span-2 flex gap-2">
                <button
                  onClick={appliquerFiltre}
                  disabled={!dateDebut && !dateFin}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Appliquer
                </button>
                <button
                  onClick={reinitialiserFiltre}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* Indicateur de période active */}
            {isFiltered && (dateDebut || dateFin) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">📅 Période sélectionnée :</span>
                  {' '}
                  {dateDebut && new Date(dateDebut).toLocaleDateString('fr-FR')}
                  {dateDebut && dateFin && ' - '}
                  {dateFin && new Date(dateFin).toLocaleDateString('fr-FR')}
                  {!dateDebut && dateFin && `Jusqu'au ${new Date(dateFin).toLocaleDateString('fr-FR')}`}
                  {dateDebut && !dateFin && `À partir du ${new Date(dateDebut).toLocaleDateString('fr-FR')}`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards - Grid Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Card 1 - Total Clients */}
        <div className="stat-card bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Clients</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">{stats.totalClients}</p>
              <div className="flex items-center gap-1 mt-1 sm:mt-2">
                <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <p className="text-xs text-green-600">Actifs</p>
              </div>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Card 2 - Abonnements Actifs */}
        <div className="stat-card bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Abonnements Actifs</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">{stats.abonnementsActifs}</p>
              <div className="flex items-center gap-1 mt-1 sm:mt-2">
                <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <p className="text-xs text-green-600">En cours</p>
              </div>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-full">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Card 3 - Revenus */}
        <div className="stat-card bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Revenus {isFiltered ? '(Période)' : 'Totaux'}</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1 sm:mt-2">
                {(stats.revenus / 1000000).toFixed(1)}M DA
              </p>
              <div className="flex items-center gap-1 mt-1 sm:mt-2">
                <p className="text-xs text-gray-500 truncate">{stats.revenus.toLocaleString()} DA</p>
              </div>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Card 4 - Alertes */}
        <div className="stat-card bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Alertes</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1 sm:mt-2">{stats.alertes}</p>
              <div className="flex items-center gap-1 mt-1 sm:mt-2">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                <p className="text-xs text-red-600">À renouveler</p>
              </div>
            </div>
            <div className="bg-red-100 p-2 sm:p-3 rounded-full">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 🤖 ANALYSE IA - Responsive */}
      {aiAnalysis && (
        <div className="mb-6 sm:mb-8">
          {/* Score de Santé - Header Responsive */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 text-white mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left Section */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-white bg-opacity-20 p-3 sm:p-4 rounded-full backdrop-blur-sm flex-shrink-0">
                  <Brain className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold">Analyse IA des Paiements</h3>
                  <p className="text-xs sm:text-sm text-purple-100">Intelligence artificielle • Analyse en temps réel</p>
                </div>
              </div>
              
              {/* Right Section - Score */}
              <div className="text-center sm:text-right">
                <p className="text-xs sm:text-sm opacity-90">Score de Santé Financière</p>
                <p className="text-4xl sm:text-5xl font-bold">{aiAnalysis.score}%</p>
                <div className="flex items-center gap-2 justify-center sm:justify-end mt-1">
                  {aiAnalysis.tendance === 'hausse' && <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />}
                  {aiAnalysis.tendance === 'baisse' && <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                  <span className="text-xs sm:text-sm">{aiAnalysis.tendance.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights et Recommandations - Grid Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Insights */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Insights Intelligents
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {aiAnalysis.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommandations */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                Recommandations IA
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {aiAnalysis.recommendations.length > 0 ? (
                  aiAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{rec.icon}</span>
                      <div>
                        <p className="font-medium text-sm sm:text-base text-gray-800">{rec.title}</p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">{rec.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Target className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Toutes les métriques sont optimales !</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alertes et Activités - Grid Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Alertes Récentes */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            Alertes Récentes
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {alertesRecentes.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">Aucune alerte pour le moment</p>
              </div>
            ) : (
              alertesRecentes.map((alerte) => {
                const isExpired = alerte.joursRestants < 0;
                const isUrgent = alerte.joursRestants <= 7 && alerte.joursRestants >= 0;
                
                return (
                  <div
                    key={alerte.id}
                    className={`flex items-start p-3 sm:p-4 rounded-lg border-l-4 ${
                      isExpired
                        ? 'bg-red-50 border-red-500'
                        : isUrgent
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <AlertCircle
                      className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 mt-0.5 flex-shrink-0 ${
                        isExpired
                          ? 'text-red-600'
                          : isUrgent
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base text-gray-800 truncate">
                        {alerte.client?.nom} {alerte.client?.prenom}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {alerte.client?.raison_sociale}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {isExpired
                          ? `Expiré depuis ${Math.abs(alerte.joursRestants)} jour(s)`
                          : `Expire dans ${alerte.joursRestants} jour(s)`}
                        {' - '}
                        {new Date(alerte.date_fin).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Activités Récentes */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">Activités Récentes</h3>
          <div className="space-y-3 sm:space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">Aucune activité récente</p>
              </div>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start">
                  {getActivityIcon(activity.icon, activity.color)}
                  <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{activity.title}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;