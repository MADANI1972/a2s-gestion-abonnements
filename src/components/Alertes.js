import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, CheckCircle, Calendar, User, Phone, Mail, DollarSign, RefreshCw } from 'lucide-react';
import abonnementsService from '../services/abonnementsService';
import clientsService from '../services/clientsService';

const Alertes = () => {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [clients, setClients] = useState([]);

  useEffect(() => {
    loadAlertes();
  }, []);

  const loadAlertes = async () => {
    try {
      setLoading(true);
      
      // Charger tous les abonnements et clients
      const [abonnementsData, clientsData] = await Promise.all([
        abonnementsService.getAll(),
        clientsService.getAll()
      ]);
      
      setClients(clientsData || []);
      
      // Calculer les alertes
      const today = new Date();
      const alertesCalculees = [];

      abonnementsData.forEach(abonnement => {
        if (abonnement.statut_abonnement === 'actif') {
          const dateFin = new Date(abonnement.date_fin);
          const diffTime = dateFin - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let type = null;
          let priorite = null;

          // Définir le type d'alerte selon le nombre de jours restants
          if (diffDays < 0) {
            type = 'expire';
            priorite = 'critique';
          } else if (diffDays <= 7) {
            type = 'urgent';
            priorite = 'haute';
          } else if (diffDays <= 15) {
            type = 'important';
            priorite = 'moyenne';
          } else if (diffDays <= 30) {
            type = 'attention';
            priorite = 'basse';
          }

          if (type) {
            alertesCalculees.push({
              ...abonnement,
              type,
              priorite,
              joursRestants: diffDays,
              dateFin: dateFin
            });
          }
        }
      });

      // Trier par priorité et jours restants
      alertesCalculees.sort((a, b) => {
        const prioriteOrder = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
        if (prioriteOrder[a.priorite] !== prioriteOrder[b.priorite]) {
          return prioriteOrder[a.priorite] - prioriteOrder[b.priorite];
        }
        return a.joursRestants - b.joursRestants;
      });

      setAlertes(alertesCalculees);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
      alert('Erreur lors du chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  const getClientInfo = (clientId) => {
    return clients.find(c => c.id === clientId) || {};
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'expire':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'urgent':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'important':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'attention':
        return 'bg-blue-100 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'expire':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'urgent':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'important':
        return <Bell className="w-6 h-6 text-yellow-600" />;
      case 'attention':
        return <Bell className="w-6 h-6 text-blue-600" />;
      default:
        return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  const getAlertTitle = (type, joursRestants) => {
    if (joursRestants < 0) {
      return `Expiré depuis ${Math.abs(joursRestants)} jour(s)`;
    } else if (joursRestants === 0) {
      return 'Expire aujourd\'hui !';
    } else if (joursRestants === 1) {
      return 'Expire demain !';
    } else {
      return `Expire dans ${joursRestants} jour(s)`;
    }
  };

  const filteredAlertes = alertes.filter(alerte => {
    if (filterType === 'all') return true;
    return alerte.type === filterType;
  });

  // Statistiques
  const stats = {
    total: alertes.length,
    critiques: alertes.filter(a => a.priorite === 'critique').length,
    urgentes: alertes.filter(a => a.priorite === 'haute').length,
    importantes: alertes.filter(a => a.priorite === 'moyenne').length,
    attention: alertes.filter(a => a.priorite === 'basse').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Chargement des alertes...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Alertes d'Expiration</h2>
          <p className="text-gray-600 mt-1">Suivi des abonnements arrivant à échéance</p>
        </div>
        <button
          onClick={loadAlertes}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <RefreshCw className="w-5 h-5" />
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Alertes</p>
              <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Critiques</p>
              <p className="text-2xl font-bold text-red-700">{stats.critiques}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Urgentes</p>
              <p className="text-2xl font-bold text-orange-700">{stats.urgentes}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Importantes</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.importantes}</p>
            </div>
            <Bell className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">À surveiller</p>
              <p className="text-2xl font-bold text-blue-700">{stats.attention}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterType === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes ({stats.total})
          </button>
          <button
            onClick={() => setFilterType('expire')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterType === 'expire'
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Expirées ({stats.critiques})
          </button>
          <button
            onClick={() => setFilterType('urgent')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterType === 'urgent'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            Urgentes ≤7j ({stats.urgentes})
          </button>
          <button
            onClick={() => setFilterType('important')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterType === 'important'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            Importantes ≤15j ({stats.importantes})
          </button>
          <button
            onClick={() => setFilterType('attention')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterType === 'attention'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            À surveiller ≤30j ({stats.attention})
          </button>
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-4">
        {filteredAlertes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Aucune alerte !</h3>
            <p className="text-gray-600">
              {filterType === 'all' 
                ? 'Tous les abonnements sont à jour 🎉'
                : 'Aucune alerte dans cette catégorie'
              }
            </p>
          </div>
        ) : (
          filteredAlertes.map((alerte) => {
            const client = getClientInfo(alerte.client_id);
            return (
              <div
                key={alerte.id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${getAlertColor(alerte.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icône */}
                    <div className="flex-shrink-0">
                      {getAlertIcon(alerte.type)}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {client.nom} {client.prenom}
                        </h3>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getAlertColor(alerte.type)}`}>
                          {getAlertTitle(alerte.type, alerte.joursRestants)}
                        </span>
                      </div>

                      {client.raison_sociale && (
                        <p className="text-sm text-gray-600 mb-3">
                          {client.raison_sociale}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{alerte.type_abonnement}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">
                            Fin: {new Date(alerte.date_fin).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">
                            {parseInt(alerte.montant_annuel).toLocaleString()} DA
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        {client.telephone && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-3 h-3" />
                            {client.telephone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                        )}
                      </div>

                      {alerte.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          Note: {alerte.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badge priorité */}
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                      alerte.priorite === 'critique' ? 'bg-red-600 text-white' :
                      alerte.priorite === 'haute' ? 'bg-orange-600 text-white' :
                      alerte.priorite === 'moyenne' ? 'bg-yellow-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {alerte.priorite.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Alertes;