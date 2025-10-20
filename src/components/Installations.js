// src/components/Installations.js - Avec services comme les autres composants
import React, { useState, useEffect } from 'react';
import { Download, Plus, Search, Edit2, Trash2, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import installationsService from '../services/installationsService';
import clientsService from '../services/clientsService';
import applicationsService from '../services/applicationsService';

const Installations = () => {
  const [installations, setInstallations] = useState([]);
  const [clients, setClients] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInstallation, setEditingInstallation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');

  const [formData, setFormData] = useState({
    client_id: '',
    application_id: '',
    montant: '',
    date_debut: '',
    statut: 'active',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les données via les services
      const installationsData = await installationsService.getAll();
      const clientsData = await clientsService.getAll();
      const applicationsData = await applicationsService.getAll();

      setInstallations(installationsData || []);
      setClients(clientsData || []);
      setApplications(applicationsData || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client_id || !formData.application_id || !formData.montant || !formData.date_debut) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const dataToSave = {
        client_id: formData.client_id,
        application_id: formData.application_id,
        montant: parseFloat(formData.montant),
        date_debut: formData.date_debut,
        statut: formData.statut,
        notes: formData.notes
      };

      if (editingInstallation) {
        // Mise à jour
        await installationsService.update(editingInstallation.id, dataToSave);
        alert('Installation mise à jour avec succès !');
      } else {
        // Création
        await installationsService.create(dataToSave);
        alert('Installation créée avec succès !');
      }

      closeModal();
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette installation ?')) {
      return;
    }

    try {
      await installationsService.delete(id);
      alert('Installation supprimée avec succès !');
      loadData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const openModal = (installation = null) => {
    if (installation) {
      setEditingInstallation(installation);
      setFormData({
        client_id: installation.client_id,
        application_id: installation.application_id,
        montant: installation.montant,
        date_debut: installation.date_debut,
        statut: installation.statut,
        notes: installation.notes || ''
      });
    } else {
      setEditingInstallation(null);
      setFormData({
        client_id: '',
        application_id: '',
        montant: '',
        date_debut: new Date().toISOString().split('T')[0],
        statut: 'active',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingInstallation(null);
    setFormData({
      client_id: '',
      application_id: '',
      montant: '',
      date_debut: '',
      statut: 'active',
      notes: ''
    });
  };

  const handleApplicationChange = (applicationId) => {
    setFormData({ ...formData, application_id: applicationId });
    
    // Pré-remplir le prix si l'application existe
    const app = applications.find(a => a.id === applicationId);
    if (app && app.prix) {
      setFormData({ ...formData, application_id: applicationId, montant: app.prix });
    } else {
      setFormData({ ...formData, application_id: applicationId });
    }
  };

  const getStatutBadge = (statut) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-4 h-4" />, label: 'Active' },
      suspendu: { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle className="w-4 h-4" />, label: 'Suspendu' },
      prochainement: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Clock className="w-4 h-4" />, label: 'Prochainement' }
    };
    const badge = badges[statut] || badges.active;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const filteredInstallations = installations.filter(installation => {
    const client = clients.find(c => c.id === installation.client_id);
    const app = applications.find(a => a.id === installation.application_id);
    const matchesSearch = client 
      ? `${client.nom} ${client.prenom} ${client.raison_sociale}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app?.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
      : (app?.nom || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatut = filterStatut === 'tous' || installation.statut === filterStatut;
    
    return matchesSearch && matchesStatut;
  });

  const stats = {
    total: installations.length,
    actives: installations.filter(i => i.statut === 'active').length,
    suspendues: installations.filter(i => i.statut === 'suspendu').length,
    prochainement: installations.filter(i => i.statut === 'prochainement').length
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Download className="w-7 h-7 text-blue-600" />
            Gestion des Installations
          </h2>
          <p className="text-gray-600 mt-1">Gérez les installations d'applications clients</p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Installation
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm">Total</p>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-600">
          <p className="text-gray-600 text-sm">Actives</p>
          <p className="text-3xl font-bold text-green-600">{stats.actives}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-600">
          <p className="text-gray-600 text-sm">Suspendues</p>
          <p className="text-3xl font-bold text-red-600">{stats.suspendues}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-600">
          <p className="text-gray-600 text-sm">Prochainement</p>
          <p className="text-3xl font-bold text-orange-600">{stats.prochainement}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par client ou application..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtre Statut */}
          <div className="w-full lg:w-64">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="tous">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="suspendu">Suspendues</option>
              <option value="prochainement">Prochainement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des installations */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInstallations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Download className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>Aucune installation trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredInstallations.map((installation) => {
                  const client = clients.find(c => c.id === installation.client_id);
                  const app = applications.find(a => a.id === installation.application_id);
                  return (
                    <tr key={installation.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {client ? `${client.nom} ${client.prenom}` : 'Client inconnu'}
                          </div>
                          {client && client.raison_sociale && (
                            <div className="text-sm text-gray-500">{client.raison_sociale}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{app?.nom || 'Application inconnue'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {parseFloat(installation.montant).toLocaleString()} DA
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(installation.date_debut).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatutBadge(installation.statut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(installation)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Modifier"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(installation.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingInstallation ? 'Modifier Installation' : 'Nouvelle Installation'}
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.nom} {client.prenom} {client.raison_sociale && `- ${client.raison_sociale}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Application */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.application_id}
                    onChange={(e) => handleApplicationChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner une application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.nom} {app.prix && `- ${parseFloat(app.prix).toLocaleString()} DA`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant (DA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.montant}
                    onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Date début */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="suspendu">Suspendu</option>
                    <option value="prochainement">Prochainement</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Notes optionnelles..."
                  />
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingInstallation ? 'Mettre à jour' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Installations;