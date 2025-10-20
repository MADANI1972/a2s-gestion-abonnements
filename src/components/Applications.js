import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Save, Package, DollarSign } from 'lucide-react';
import { supabase } from '../config/supabase';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix_annuel: '',
    statut: 'actif'
  });

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('nom', { ascending: true });
      
      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Erreur chargement applications:', error);
      alert('Erreur lors du chargement des applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingApp) {
        const { error } = await supabase
          .from('applications')
          .update(formData)
          .eq('id', editingApp.id);
        
        if (error) throw error;
        alert('Application modifiée avec succès ! ✅');
      } else {
        const { error } = await supabase
          .from('applications')
          .insert([formData]);
        
        if (error) throw error;
        alert('Application créée avec succès ! ✅');
      }
      closeModal();
      loadApplications();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer cette application ?')) {
      try {
        const { error } = await supabase
          .from('applications')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        alert('Application supprimée avec succès ! ✅');
        loadApplications();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const openModal = (app = null) => {
    if (app) {
      setEditingApp(app);
      setFormData({
        nom: app.nom,
        description: app.description || '',
        prix_annuel: app.prix_annuel,
        statut: app.statut
      });
    } else {
      setEditingApp(null);
      setFormData({
        nom: '',
        description: '',
        prix_annuel: '',
        statut: 'actif'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingApp(null);
  };

  const filteredApplications = applications.filter(app => 
    app.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Gestion des Applications</h2>
          <p className="text-sm text-gray-600 mt-1">{filteredApplications.length} application(s)</p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Application
        </button>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="search-bar">
          <Search className="w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher une application..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Liste des applications - Grid responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filteredApplications.map((app) => (
          <div key={app.id} className="bg-white rounded-lg shadow-md p-4 lg:p-6 hover:shadow-lg transition-shadow">
            {/* Header de la carte */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-blue-100 p-2 lg:p-3 rounded-lg">
                  <Package className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base lg:text-lg font-bold text-gray-800 truncate">
                    {app.nom}
                  </h3>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                    app.statut === 'actif' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {app.statut.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {app.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {app.description}
              </p>
            )}

            {/* Prix */}
            <div className="bg-purple-50 p-3 rounded-lg mb-4">
              <div className="flex items-center justify-center gap-2 text-purple-700">
                <DollarSign className="w-5 h-5" />
                <span className="font-bold text-lg">
                  {parseFloat(app.prix_annuel).toLocaleString()} DA
                </span>
              </div>
              <p className="text-xs text-center text-purple-600 mt-1">par an</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => openModal(app)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm lg:text-base"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => handleDelete(app.id)}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucune application */}
      {filteredApplications.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 lg:p-12 text-center text-gray-500">
          <Package className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-base lg:text-lg">Aucune application trouvée</p>
          <button
            onClick={() => openModal()}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
          >
            Créer une nouvelle application
          </button>
        </div>
      )}

      {/* Modal Formulaire */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl lg:text-2xl font-bold">
                {editingApp ? 'Modifier l\'Application' : 'Nouvelle Application'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'Application *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: CRM, ERP, Comptabilité..."
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Description de l'application..."
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix Annuel (DA) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.prix_annuel}
                      onChange={(e) => setFormData({...formData, prix_annuel: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="150000"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-500 text-sm">DA</span>
                  </div>
                  {formData.prix_annuel && (
                    <p className="text-xs text-blue-600 mt-1">
                      💰 {parseFloat(formData.prix_annuel).toLocaleString()} DA par an
                    </p>
                  )}
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
                  {editingApp ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;