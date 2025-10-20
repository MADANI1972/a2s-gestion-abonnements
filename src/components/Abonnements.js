import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, X, Save, Calendar, DollarSign, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import abonnementsService from '../services/abonnementsService';
import clientsService from '../services/clientsService';
import { supabase } from '../config/supabase';

const Abonnements = () => {
  const [abonnements, setAbonnements] = useState([]);
  const [clients, setClients] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAbonnement, setEditingAbonnement] = useState(null);
  
  // 🔍 NOUVEAUX ÉTATS POUR LA RECHERCHE CLIENT
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const clientSearchRef = useRef(null);
  
  const [formData, setFormData] = useState({
    client_id: '',
    type_abonnement: '',
    date_debut: '',
    date_fin: '',
    montant_annuel: '',
    statut_paiement: 'en_attente',
    statut_abonnement: 'actif',
    notes: ''
  });

  const statutsPaiement = ['en_attente', 'paye', 'en_retard'];
  const statutsAbonnement = ['actif', 'expire', 'suspendu', 'annule'];

  useEffect(() => {
    loadData();
  }, []);

  // 🔍 FERMER LE DROPDOWN QUAND ON CLIQUE AILLEURS
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [abonnementsData, clientsData] = await Promise.all([
        abonnementsService.getAll(),
        clientsService.getAll()
      ]);
      
      const { data: applicationsData, error } = await supabase
        .from('applications')
        .select('*')
        .eq('statut', 'actif')
        .order('nom', { ascending: true });
      
      if (error) {
        console.error('Erreur chargement applications:', error);
      }
      
      setAbonnements(abonnementsData || []);
      setClients(clientsData || []);
      setApplications(applicationsData || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // 🔍 FILTRER LES CLIENTS SELON LA RECHERCHE
  const filteredClients = clients.filter(client => {
    const searchLower = clientSearchTerm.toLowerCase();
    return (
      client.nom?.toLowerCase().includes(searchLower) ||
      client.prenom?.toLowerCase().includes(searchLower) ||
      client.raison_sociale?.toLowerCase().includes(searchLower) ||
      client.telephone?.includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  });

  // 🔍 SÉLECTIONNER UN CLIENT
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setFormData({ ...formData, client_id: client.id });
    setClientSearchTerm(`${client.nom} ${client.prenom}${client.raison_sociale ? ` - ${client.raison_sociale}` : ''}`);
    setShowClientDropdown(false);
  };

  // 🔍 RÉINITIALISER LA RECHERCHE CLIENT
  const handleClearClientSearch = () => {
    setSelectedClient(null);
    setClientSearchTerm('');
    setFormData({ ...formData, client_id: '' });
    setShowClientDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAbonnement) {
        await abonnementsService.update(editingAbonnement.id, formData);
        alert('Abonnement modifié avec succès');
      } else {
        await abonnementsService.create(formData);
        alert('Abonnement créé avec succès');
      }
      closeModal();
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')) {
      try {
        await abonnementsService.delete(id);
        alert('Abonnement supprimé avec succès');
        loadData();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const openModal = (abonnement = null) => {
    if (abonnement) {
      setEditingAbonnement(abonnement);
      
      // 🔍 CHARGER LE CLIENT EXISTANT
      const client = clients.find(c => c.id === abonnement.client_id);
      if (client) {
        setSelectedClient(client);
        setClientSearchTerm(`${client.nom} ${client.prenom}${client.raison_sociale ? ` - ${client.raison_sociale}` : ''}`);
      }
      
      setFormData({
        client_id: abonnement.client_id,
        type_abonnement: abonnement.type_abonnement,
        date_debut: abonnement.date_debut,
        date_fin: abonnement.date_fin,
        montant_annuel: abonnement.montant_annuel,
        statut_paiement: abonnement.statut_paiement,
        statut_abonnement: abonnement.statut_abonnement,
        notes: abonnement.notes || ''
      });
    } else {
      setEditingAbonnement(null);
      setSelectedClient(null);
      setClientSearchTerm('');
      
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      
      setFormData({
        client_id: '',
        type_abonnement: '',
        date_debut: today,
        date_fin: nextYear.toISOString().split('T')[0],
        montant_annuel: '',
        statut_paiement: 'en_attente',
        statut_abonnement: 'actif',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAbonnement(null);
    setSelectedClient(null);
    setClientSearchTerm('');
    setShowClientDropdown(false);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.nom} ${client.prenom}` : 'Client inconnu';
  };

  const getClientRaisonSociale = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.raison_sociale || '';
  };

  const getDaysRemaining = (dateFin) => {
    const today = new Date();
    const endDate = new Date(dateFin);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'expire': return 'bg-red-100 text-red-800';
      case 'suspendu': return 'bg-yellow-100 text-yellow-800';
      case 'annule': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaiementColor = (statut) => {
    switch (statut) {
      case 'paye': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'en_retard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAbonnements = abonnements.filter(abonnement => {
    const clientName = getClientName(abonnement.client_id).toLowerCase();
    const matchSearch = 
      clientName.includes(searchTerm.toLowerCase()) ||
      abonnement.type_abonnement?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatut = !filterStatut || abonnement.statut_abonnement === filterStatut;
    
    return matchSearch && matchStatut;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Gestion des Abonnements</h2>
          <p className="text-sm text-gray-600 mt-1">{filteredAbonnements.length} abonnement(s)</p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nouvel Abonnement
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="filters-container">
          <div className="search-bar">
            <Search className="w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un abonnement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            {statutsAbonnement.map(statut => (
              <option key={statut} value={statut}>
                {statut.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des abonnements */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAbonnements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            Aucun abonnement trouvé
          </div>
        ) : (
          filteredAbonnements.map((abonnement) => {
            const daysRemaining = getDaysRemaining(abonnement.date_fin);
            const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
            const isExpired = daysRemaining < 0;

            return (
              <div key={abonnement.id} className="mobile-card lg:bg-white lg:rounded-lg lg:shadow-md lg:p-6 lg:hover:shadow-lg lg:transition-shadow">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-lg lg:text-xl font-bold text-gray-800">
                        {getClientName(abonnement.client_id)}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`badge ${getStatusColor(abonnement.statut_abonnement)}`}>
                          {abonnement.statut_abonnement.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`badge ${getPaiementColor(abonnement.statut_paiement)}`}>
                          {abonnement.statut_paiement.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    {getClientRaisonSociale(abonnement.client_id) && (
                      <p className="text-sm text-gray-600 mb-3">
                        {getClientRaisonSociale(abonnement.client_id)}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="font-medium text-gray-800">{abonnement.type_abonnement}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Montant</p>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {parseInt(abonnement.montant_annuel).toLocaleString()} DA
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date début</p>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(abonnement.date_debut).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date fin</p>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(abonnement.date_fin).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      {isExpiringSoon && (
                        <div className="flex items-center gap-2 text-yellow-600 text-sm bg-yellow-50 p-2 rounded">
                          <AlertCircle className="w-4 h-4" />
                          Expire dans {daysRemaining} jours
                        </div>
                      )}
                      
                      {isExpired && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                          <AlertCircle className="w-4 h-4" />
                          Expiré depuis {Math.abs(daysRemaining)} jours
                        </div>
                      )}
                      
                      {!isExpiringSoon && !isExpired && abonnement.statut_abonnement === 'actif' && (
                        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-2 rounded">
                          <CheckCircle className="w-4 h-4" />
                          {daysRemaining} jours restants
                        </div>
                      )}
                    </div>

                    {abonnement.notes && (
                      <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                        📝 {abonnement.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex lg:flex-col gap-2 mt-4 lg:mt-0 lg:ml-4">
                    <button
                      onClick={() => openModal(abonnement)}
                      className="flex-1 lg:flex-none btn bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-2 lg:p-2"
                    >
                      <Edit className="w-4 h-4 lg:w-5 lg:h-5" />
                      <span className="lg:hidden">Modifier</span>
                    </button>
                    <button
                      onClick={() => handleDelete(abonnement.id)}
                      className="flex-1 lg:flex-none btn bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-2 lg:p-2"
                    >
                      <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                      <span className="lg:hidden">Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Formulaire */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl lg:text-2xl font-bold">
                {editingAbonnement ? 'Modifier l\'Abonnement' : 'Nouvel Abonnement'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                
                {/* 🔍 RECHERCHE CLIENT AVEC AUTOCOMPLÉTION */}
                <div className="form-group md:col-span-2" ref={clientSearchRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client * 🔍
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          required={!selectedClient}
                          value={clientSearchTerm}
                          onChange={(e) => {
                            setClientSearchTerm(e.target.value);
                            setShowClientDropdown(true);
                            if (!e.target.value) {
                              setSelectedClient(null);
                              setFormData({ ...formData, client_id: '' });
                            }
                          }}
                          onFocus={() => setShowClientDropdown(true)}
                          placeholder="Rechercher par nom, raison sociale, téléphone..."
                          className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        {selectedClient && (
                          <button
                            type="button"
                            onClick={handleClearClientSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowClientDropdown(!showClientDropdown)}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>

                    {/* DROPDOWN DES RÉSULTATS */}
                    {showClientDropdown && filteredClients.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {filteredClients.map(client => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => handleSelectClient(client)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-800">
                              {client.nom} {client.prenom}
                            </div>
                            {client.raison_sociale && (
                              <div className="text-sm text-gray-600">
                                📊 {client.raison_sociale}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1 flex gap-3">
                              {client.telephone && <span>📞 {client.telephone}</span>}
                              {client.email && <span>📧 {client.email}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {showClientDropdown && clientSearchTerm && filteredClients.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">
                        Aucun client trouvé
                      </div>
                    )}
                  </div>
                  
                  {/* CLIENT SÉLECTIONNÉ */}
                  {selectedClient && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-green-800">
                            ✅ {selectedClient.nom} {selectedClient.prenom}
                          </p>
                          {selectedClient.raison_sociale && (
                            <p className="text-sm text-green-700">
                              {selectedClient.raison_sociale}
                            </p>
                          )}
                          <p className="text-xs text-green-600 mt-1">
                            {selectedClient.wilaya} • {selectedClient.telephone}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearClientSearch}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application *
                  </label>
                  <select
                    required
                    value={formData.type_abonnement}
                    onChange={(e) => {
                      const selectedApp = applications.find(app => app.nom === e.target.value);
                      setFormData({
                        ...formData, 
                        type_abonnement: e.target.value,
                        montant_annuel: selectedApp ? selectedApp.prix_annuel : ''
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une application...</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.nom}>
                        {app.nom}
                      </option>
                    ))}
                  </select>
                  {applications.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Aucune application disponible
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant Annuel (DA) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.montant_annuel}
                    onChange={(e) => setFormData({...formData, montant_annuel: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Entrez le montant"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Montant modifiable : {formData.montant_annuel ? `${parseFloat(formData.montant_annuel).toLocaleString()} DA/an` : 'Prix suggéré selon l\'application'}
                  </p>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Début *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_debut}
                    onChange={(e) => setFormData({...formData, date_debut: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Fin *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_fin}
                    onChange={(e) => setFormData({...formData, date_fin: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut Paiement *
                  </label>
                  <select
                    required
                    value={formData.statut_paiement}
                    onChange={(e) => setFormData({...formData, statut_paiement: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {statutsPaiement.map(statut => (
                      <option key={statut} value={statut}>
                        {statut.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut Abonnement *
                  </label>
                  <select
                    required
                    value={formData.statut_abonnement}
                    onChange={(e) => setFormData({...formData, statut_abonnement: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {statutsAbonnement.map(statut => (
                      <option key={statut} value={statut}>
                        {statut.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Notes additionnelles..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center justify-center gap-2"
                  disabled={!selectedClient}
                >
                  <Save className="w-5 h-5" />
                  {editingAbonnement ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Abonnements;