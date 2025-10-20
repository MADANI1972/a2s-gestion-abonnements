import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Save, MapPin, Phone, Mail, Building } from 'lucide-react';
import clientsService from '../services/clientsService';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    raison_sociale: '',
    email: '',
    telephone: '',
    adresse: '',
    wilaya: '',
    region: '',
    statut: 'actif'
  });

  const regions = ['Oran', 'Alger', 'Constantine', 'Annaba', 'Sétif', 'Tlemcen', 'Béjaïa', 'Autre'];
  const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
    'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou',
    'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès',
    'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara',
    'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès',
    'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela', 'Souk Ahras',
    'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane'
  ];

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getAll();
      setClients(data || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      alert('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await clientsService.update(editingClient.id, formData);
        alert('Client modifié avec succès');
      } else {
        await clientsService.create(formData);
        alert('Client ajouté avec succès');
      }
      closeModal();
      loadClients();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await clientsService.delete(id);
        alert('Client supprimé avec succès');
        loadClients();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const openModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({
        nom: '',
        prenom: '',
        raison_sociale: '',
        email: '',
        telephone: '',
        adresse: '',
        wilaya: '',
        region: '',
        statut: 'actif'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const filteredClients = clients.filter(client => {
    const matchSearch = 
      client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.raison_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRegion = !filterRegion || client.region === filterRegion;
    
    return matchSearch && matchRegion;
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
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Gestion des Clients</h2>
          <p className="text-sm text-gray-600 mt-1">{filteredClients.length} client(s)</p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nouveau Client
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="filters-container">
          <div className="search-bar">
            <Search className="w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les régions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VUE MOBILE - Cartes */}
      <div className="lg:hidden space-y-4 mb-6">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucun client trouvé
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="mobile-card">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">
                    {client.nom} {client.prenom}
                  </h3>
                  {client.raison_sociale && (
                    <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Building className="w-3 h-3" />
                      {client.raison_sociale}
                    </div>
                  )}
                </div>
                <span className={`badge ${
                  client.statut === 'actif' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {client.statut}
                </span>
              </div>

              {/* Body */}
              <div className="mobile-card-body space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                    {client.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${client.telephone}`} className="text-blue-600 hover:underline">
                    {client.telephone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{client.wilaya} • {client.region}</span>
                </div>
                {client.adresse && (
                  <p className="text-sm text-gray-600 pl-6">{client.adresse}</p>
                )}
              </div>

              {/* Actions */}
              <div className="mobile-card-actions mt-4">
                <button
                  onClick={() => openModal(client)}
                  className="btn bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="btn bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* VUE DESKTOP - Tableau */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="table-responsive">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localisation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {client.nom} {client.prenom}
                        </div>
                        {client.raison_sociale && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {client.raison_sociale}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-900">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Phone className="w-3 h-3" />
                          {client.telephone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-900">
                          <MapPin className="w-3 h-3" />
                          {client.wilaya}
                        </div>
                        <div className="text-gray-500">{client.region}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        client.statut === 'actif' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(client)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulaire */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl lg:text-2xl font-bold">
                {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="form-group md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raison Sociale
                  </label>
                  <input
                    type="text"
                    value={formData.raison_sociale}
                    onChange={(e) => setFormData({...formData, raison_sociale: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="form-group md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.adresse}
                    onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wilaya *
                  </label>
                  <select
                    required
                    value={formData.wilaya}
                    onChange={(e) => setFormData({...formData, wilaya: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {wilayas.map(wilaya => (
                      <option key={wilaya} value={wilaya}>{wilaya}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Région *
                  </label>
                  <select
                    required
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut *
                  </label>
                  <select
                    required
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
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
                >
                  <Save className="w-5 h-5" />
                  {editingClient ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;