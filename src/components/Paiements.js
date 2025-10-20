import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, DollarSign, Calendar, CheckCircle, XCircle, Clock, Edit, Trash2, X, Save, ChevronDown } from 'lucide-react';
import paiementsService from '../services/paiementsService';
import abonnementsService from '../services/abonnementsService';
import clientsService from '../services/clientsService';

const Paiements = () => {
  const [paiements, setPaiements] = useState([]);
  const [abonnements, setAbonnements] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPaiement, setEditingPaiement] = useState(null);
  
  // 🔍 ÉTATS POUR LA RECHERCHE ABONNEMENT
  const [abonnementSearchTerm, setAbonnementSearchTerm] = useState('');
  const [showAbonnementDropdown, setShowAbonnementDropdown] = useState(false);
  const [selectedAbonnement, setSelectedAbonnement] = useState(null);
  const abonnementSearchRef = useRef(null);
  
  const [formData, setFormData] = useState({
    abonnement_id: '',
    montant: '',
    date_paiement: '',
    methode_paiement: 'virement',
    statut: 'valide',
    reference: '',
    notes: ''
  });

  const methodesPaiement = ['virement', 'especes', 'cheque', 'carte_bancaire'];
  const statutsPaiement = ['valide', 'en_attente', 'annule', 'rembourse'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (abonnementSearchRef.current && !abonnementSearchRef.current.contains(event.target)) {
        setShowAbonnementDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paiementsData, abonnementsData, clientsData] = await Promise.all([
        paiementsService.getAll(),
        abonnementsService.getAll(),
        clientsService.getAll()
      ]);
      setPaiements(paiementsData || []);
      setAbonnements(abonnementsData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getAbonnementDetails = (abonnement) => {
    const client = clients.find(c => c.id === abonnement.client_id);
    return {
      ...abonnement,
      clientNom: client ? `${client.nom} ${client.prenom}` : 'Client inconnu',
      clientRaisonSociale: client?.raison_sociale || '',
      clientWilaya: client?.wilaya || ''
    };
  };

  const filteredAbonnements = abonnements
    .filter(a => a.statut_abonnement === 'actif')
    .map(a => getAbonnementDetails(a))
    .filter(abonnement => {
      const searchLower = abonnementSearchTerm.toLowerCase();
      return (
        abonnement.clientNom?.toLowerCase().includes(searchLower) ||
        abonnement.clientRaisonSociale?.toLowerCase().includes(searchLower) ||
        abonnement.type_abonnement?.toLowerCase().includes(searchLower) ||
        abonnement.clientWilaya?.toLowerCase().includes(searchLower)
      );
    });

  const handleSelectAbonnement = (abonnement) => {
    setSelectedAbonnement(abonnement);
    setFormData({ 
      ...formData, 
      abonnement_id: abonnement.id,
      montant: abonnement.montant_annuel || ''
    });
    setAbonnementSearchTerm(`${abonnement.clientNom} - ${abonnement.type_abonnement}`);
    setShowAbonnementDropdown(false);
  };

  const handleClearAbonnementSearch = () => {
    setSelectedAbonnement(null);
    setAbonnementSearchTerm('');
    setFormData({ ...formData, abonnement_id: '', montant: '' });
    setShowAbonnementDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPaiement) {
        await paiementsService.update(editingPaiement.id, formData);
        alert('Paiement modifié avec succès ! ✅');
      } else {
        await paiementsService.create(formData);
        alert('Paiement enregistré avec succès ! ✅');
      }
      closeModal();
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      try {
        await paiementsService.delete(id);
        alert('Paiement supprimé avec succès ! ✅');
        loadData();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const openModal = (paiement = null) => {
    if (paiement) {
      setEditingPaiement(paiement);
      const abonnement = abonnements.find(a => a.id === paiement.abonnement_id);
      if (abonnement) {
        const abonnementDetails = getAbonnementDetails(abonnement);
        setSelectedAbonnement(abonnementDetails);
        setAbonnementSearchTerm(`${abonnementDetails.clientNom} - ${abonnementDetails.type_abonnement}`);
      }
      setFormData({
        abonnement_id: paiement.abonnement_id,
        montant: paiement.montant,
        date_paiement: paiement.date_paiement,
        methode_paiement: paiement.methode_paiement,
        statut: paiement.statut,
        reference: paiement.reference || '',
        notes: paiement.notes || ''
      });
    } else {
      setEditingPaiement(null);
      setSelectedAbonnement(null);
      setAbonnementSearchTerm('');
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        abonnement_id: '',
        montant: '',
        date_paiement: today,
        methode_paiement: 'virement',
        statut: 'valide',
        reference: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPaiement(null);
    setSelectedAbonnement(null);
    setAbonnementSearchTerm('');
    setShowAbonnementDropdown(false);
  };

  const getClientName = (abonnementId) => {
    const abonnement = abonnements.find(a => a.id === abonnementId);
    if (!abonnement) return 'Client inconnu';
    const client = clients.find(c => c.id === abonnement.client_id);
    return client ? `${client.nom} ${client.prenom}` : 'Client inconnu';
  };

  const getAbonnementInfo = (abonnementId) => {
    const abonnement = abonnements.find(a => a.id === abonnementId);
    return abonnement || null;
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'valide': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'annule': return 'bg-red-100 text-red-800';
      case 'rembourse': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'valide': return <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />;
      case 'en_attente': return <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" />;
      case 'annule': return <XCircle className="w-4 h-4 lg:w-5 lg:h-5 text-red-600" />;
      case 'rembourse': return <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />;
      default: return <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />;
    }
  };

  const filteredPaiements = paiements.filter(paiement => {
    const clientName = getClientName(paiement.abonnement_id).toLowerCase();
    const matchSearch = 
      clientName.includes(searchTerm.toLowerCase()) ||
      paiement.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = !filterStatut || paiement.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const totalPaiements = paiements.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
  const paiementsValides = paiements.filter(p => p.statut === 'valide');
  const totalValide = paiementsValides.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);

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
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Gestion des Paiements</h2>
          <p className="text-sm text-gray-600 mt-1">{filteredPaiements.length} paiement(s)</p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nouveau Paiement
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Paiements</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{paiements.length}</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Montant Total</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{totalPaiements.toLocaleString()} DA</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Paiements Validés</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{totalValide.toLocaleString()} DA</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un paiement..."
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
            {statutsPaiement.map(statut => (
              <option key={statut} value={statut}>{statut.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VUE MOBILE */}
      <div className="lg:hidden space-y-4">
        {filteredPaiements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucun paiement trouvé</div>
        ) : (
          filteredPaiements.map((paiement) => {
            const abonnement = getAbonnementInfo(paiement.abonnement_id);
            return (
              <div key={paiement.id} className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800">{getClientName(paiement.abonnement_id)}</h3>
                    {abonnement && <p className="text-sm text-gray-600 mt-1">{abonnement.type_abonnement}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(paiement.statut)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(paiement.statut)}`}>
                      {paiement.statut.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="text-2xl font-bold text-blue-600">{parseFloat(paiement.montant).toLocaleString()} DA</p>
                </div>
                <div className="space-y-2 text-sm border-t border-b py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="capitalize">{paiement.methode_paiement.replace('_', ' ')}</span>
                  </div>
                  {paiement.reference && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Réf:</span>
                      <span className="font-mono text-gray-700">{paiement.reference}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={() => openModal(paiement)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2">
                    <Edit className="w-4 h-4" />Modifier
                  </button>
                  <button onClick={() => handleDelete(paiement.id)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />Supprimer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* VUE DESKTOP */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Méthode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPaiements.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">Aucun paiement trouvé</td></tr>
            ) : (
              filteredPaiements.map((paiement) => {
                const abonnement = getAbonnementInfo(paiement.abonnement_id);
                return (
                  <tr key={paiement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{getClientName(paiement.abonnement_id)}</div>
                      {abonnement && <div className="text-sm text-gray-500">{abonnement.type_abonnement}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Calendar className="w-4 h-4" />
                        {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="font-medium text-gray-900">{parseFloat(paiement.montant).toLocaleString()} DA</div></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-600 capitalize">{paiement.methode_paiement.replace('_', ' ')}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-600 font-mono">{paiement.reference || '-'}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(paiement.statut)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(paiement.statut)}`}>
                          {paiement.statut.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openModal(paiement)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(paiement.id)} className="text-red-600 hover:text-red-800">
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">{editingPaiement ? 'Modifier le Paiement' : 'Nouveau Paiement'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2" ref={abonnementSearchRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Abonnement * 🔍</label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          required={!selectedAbonnement}
                          value={abonnementSearchTerm}
                          onChange={(e) => {
                            setAbonnementSearchTerm(e.target.value);
                            setShowAbonnementDropdown(true);
                            if (!e.target.value) {
                              setSelectedAbonnement(null);
                              setFormData({ ...formData, abonnement_id: '', montant: '' });
                            }
                          }}
                          onFocus={() => !editingPaiement && setShowAbonnementDropdown(true)}
                          placeholder="Rechercher par client, type d'abonnement, wilaya..."
                          className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={editingPaiement !== null}
                        />
                        {selectedAbonnement && !editingPaiement && (
                          <button type="button" onClick={handleClearAbonnementSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {!editingPaiement && (
                        <button type="button" onClick={() => setShowAbonnementDropdown(!showAbonnementDropdown)} className="px-3 py-2 border rounded-lg hover:bg-gray-50">
                          <ChevronDown className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {showAbonnementDropdown && !editingPaiement && filteredAbonnements.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {filteredAbonnements.map(abonnement => (
                          <button key={abonnement.id} type="button" onClick={() => handleSelectAbonnement(abonnement)} className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0">
                            <div className="font-medium text-gray-800">{abonnement.clientNom}</div>
                            {abonnement.clientRaisonSociale && <div className="text-sm text-gray-600">📊 {abonnement.clientRaisonSociale}</div>}
                            <div className="text-sm text-gray-600 mt-1">📱 {abonnement.type_abonnement}</div>
                            <div className="text-xs text-gray-500 mt-1 flex gap-3">
                              <span>📍 {abonnement.clientWilaya}</span>
                              <span>💰 {parseFloat(abonnement.montant_annuel).toLocaleString()} DA</span>
                              <span className="text-green-600">✓ Actif</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showAbonnementDropdown && !editingPaiement && abonnementSearchTerm && filteredAbonnements.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">Aucun abonnement actif trouvé</div>
                    )}
                  </div>
                  {selectedAbonnement && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-green-800">✅ {selectedAbonnement.clientNom}</p>
                          {selectedAbonnement.clientRaisonSociale && <p className="text-sm text-green-700">{selectedAbonnement.clientRaisonSociale}</p>}
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-green-600">
                            <span>📱 {selectedAbonnement.type_abonnement}</span>
                            <span>📍 {selectedAbonnement.clientWilaya}</span>
                            <span>💰 {parseFloat(selectedAbonnement.montant_annuel).toLocaleString()} DA/an</span>
                          </div>
                        </div>
                        {!editingPaiement && (
                          <button type="button" onClick={handleClearAbonnementSearch} className="text-green-600 hover:text-green-800">
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {!editingPaiement ? (
                    <p className="mt-2 text-xs text-blue-600">💡 Vous pouvez modifier l'abonnement à tout moment en cliquant sur ❌</p>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">ℹ️ L'abonnement ne peut pas être modifié lors de l'édition d'un paiement</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant (DA) *</label>
                  <input type="number" required min="0" step="0.01" value={formData.montant} onChange={(e) => setFormData({...formData, montant: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Entrez le montant" />
                  {selectedAbonnement && <p className="text-xs text-blue-600 mt-1">💡 Montant modifiable • Suggéré: {parseFloat(selectedAbonnement.montant_annuel).toLocaleString()} DA</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de Paiement *</label>
                  <input type="date" required value={formData.date_paiement} onChange={(e) => setFormData({...formData, date_paiement: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de Paiement *</label>
                  <select required value={formData.methode_paiement} onChange={(e) => setFormData({...formData, methode_paiement: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {methodesPaiement.map(methode => (
                      <option key={methode} value={methode}>{methode.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
                  <select required value={formData.statut} onChange={(e) => setFormData({...formData, statut: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {statutsPaiement.map(statut => (
                      <option key={statut} value={statut}>{statut.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                  <input type="text" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Numéro de référence du paiement" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows="3" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Notes additionnelles..." />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2" disabled={!selectedAbonnement}>
                  <Save className="w-5 h-5" />
                  {editingPaiement ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Paiements;