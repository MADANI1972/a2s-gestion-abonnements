import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Save, Shield, Mail, Phone, User, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import usersService from '../services/usersService';
import { supabase } from '../config/supabase';

const Utilisateurs = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'utilisateur',
    statut: 'actif'
  });

  const roles = [
    { value: 'super_admin', label: 'Super Admin', color: 'red', description: 'Accès total au système' },
    { value: 'admin', label: 'Admin', color: 'orange', description: 'Gestion complète' },
    { value: 'commercial', label: 'Commercial', color: 'blue', description: 'Gestion clients et abonnements' },
    { value: 'utilisateur', label: 'Utilisateur', color: 'green', description: 'Utilisation standard' },
    { value: 'lecteur', label: 'Lecteur', color: 'gray', description: 'Consultation uniquement' }
  ];

  const statuts = ['actif', 'inactif', 'suspendu'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll();
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      alert('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Mode édition - pas besoin de mot de passe
        await usersService.update(editingUser.id, {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          role: formData.role,
          statut: formData.statut
        });
        alert('Utilisateur modifié avec succès ! ✅');
      } else {
        // Mode création - vérifier les mots de passe
        if (formData.password !== formData.confirmPassword) {
          alert('❌ Les mots de passe ne correspondent pas !');
          return;
        }

        if (formData.password.length < 6) {
          alert('❌ Le mot de passe doit contenir au moins 6 caractères !');
          return;
        }

        // Créer l'utilisateur dans Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nom: formData.nom,
              prenom: formData.prenom,
              role: formData.role
            }
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            alert('❌ Cet email est déjà utilisé !');
          } else {
            alert(`❌ Erreur : ${authError.message}`);
          }
          return;
        }

        // Créer l'utilisateur dans la table users
        await usersService.create({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          role: formData.role,
          statut: formData.statut
        });

        alert('✅ Utilisateur créé avec succès !\n📧 Un email de confirmation a été envoyé.');
      }
      closeModal();
      loadUsers();
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await usersService.delete(id);
        alert('Utilisateur supprimé avec succès ! ✅');
        loadUsers();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleChangeStatus = async (id, newStatut) => {
    try {
      await usersService.changeStatus(id, newStatut);
      alert(`Statut modifié à "${newStatut}" avec succès ! ✅`);
      loadUsers();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        password: '',
        confirmPassword: '',
        role: user.role,
        statut: user.statut
      });
    } else {
      setEditingUser(null);
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'utilisateur',
        statut: 'actif'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const getRoleInfo = (roleValue) => {
    return roles.find(r => r.value === roleValue) || roles[3];
  };

  const getRoleColor = (roleValue) => {
    const role = getRoleInfo(roleValue);
    const colors = {
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colors[role.color] || colors.gray;
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'inactif': return 'bg-gray-100 text-gray-800';
      case 'suspendu': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutIcon = (statut) => {
    return statut === 'actif' ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <XCircle className="w-4 h-4 text-red-600" />;
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = 
      user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRole = !filterRole || user.role === filterRole;
    const matchStatut = !filterStatut || user.statut === filterStatut;
    
    return matchSearch && matchRole && matchStatut;
  });

  // Statistiques
  const stats = {
    total: users.length,
    actifs: users.filter(u => u.statut === 'actif').length,
    admins: users.filter(u => u.role === 'super_admin' || u.role === 'admin').length,
    inactifs: users.filter(u => u.statut === 'inactif').length
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
      {/* Header Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Gestion des Utilisateurs</h2>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm sm:text-base">Nouvel Utilisateur</span>
        </button>
      </div>

      {/* Statistiques - Grid Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
        <div className="stat-card bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1 sm:mt-2">{stats.total}</p>
            </div>
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="stat-card bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">Actifs</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1 sm:mt-2">{stats.actifs}</p>
            </div>
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="stat-card bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">Admins</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600 mt-1 sm:mt-2">{stats.admins}</p>
            </div>
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500 opacity-20" />
          </div>
        </div>

        <div className="stat-card bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">Inactifs</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600 mt-1 sm:mt-2">{stats.inactifs}</p>
            </div>
            <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filtres Responsive */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-6">
        <div className="filters-container grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="relative search-bar">
            <Search className="absolute left-3 top-2.5 sm:top-3 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les rôles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            {statuts.map(statut => (
              <option key={statut} value={statut}>{statut.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VUE MOBILE - Cartes */}
      <div className="lg:hidden space-y-4 mb-6">
        {filteredUsers.map((user) => {
          const roleInfo = getRoleInfo(user.role);
          return (
            <div key={user.id} className="mobile-card bg-white rounded-lg shadow-md p-4">
              {/* Header de la carte */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {user.nom} {user.prenom}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges Rôle et Statut */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)} flex items-center gap-1`}>
                  <Shield className="w-3 h-3" />
                  {roleInfo.label}
                </span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatutColor(user.statut)} flex items-center gap-1`}>
                  {getStatutIcon(user.statut)}
                  {user.statut.toUpperCase()}
                </span>
              </div>

              {/* Description du rôle */}
              <p className="text-xs text-gray-500 mb-3">{roleInfo.description}</p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(user)}
                  className="flex-1 text-blue-600 border border-blue-600 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-50 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
                
                {user.statut === 'actif' ? (
                  <button
                    onClick={() => handleChangeStatus(user.id, 'inactif')}
                    className="px-3 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50"
                    title="Désactiver"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleChangeStatus(user.id, 'actif')}
                    className="px-3 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
                    title="Activer"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(user.id)}
                  className="px-3 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      {/* VUE DESKTOP - Tableau */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden table-responsive">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => {
              const roleInfo = getRoleInfo(user.role);
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">
                          {user.nom} {user.prenom}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)} flex items-center gap-2 w-fit`}>
                        <Shield className="w-3 h-3" />
                        {roleInfo.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{roleInfo.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatutIcon(user.statut)}
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatutColor(user.statut)}`}>
                        {user.statut.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openModal(user)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      
                      {user.statut === 'actif' ? (
                        <button
                          onClick={() => handleChangeStatus(user.id, 'inactif')}
                          className="text-orange-600 hover:text-orange-800 p-2 hover:bg-orange-50 rounded"
                          title="Désactiver"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleChangeStatus(user.id, 'actif')}
                          className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded"
                          title="Activer"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun utilisateur trouvé
          </div>
        )}
      </div>

      {/* Modal Formulaire Responsive */}
      {showModal && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-content bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-2xl font-bold">
                  {editingUser ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}
                </h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={editingUser !== null}
                    />
                    {editingUser && (
                      <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                    )}
                  </div>

                  {/* Champs mot de passe - Seulement en mode création */}
                  {!editingUser && (
                    <>
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mot de Passe *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Minimum 6 caractères"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 sm:top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirmer le Mot de Passe *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirmer le mot de passe"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-2.5 sm:top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rôle *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label} - {role.description}
                        </option>
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
                      className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {statuts.map(statut => (
                        <option key={statut} value={statut}>
                          {statut.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Info sur les rôles - Responsive */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 mb-4 sm:mb-6 rounded">
                  <p className="text-xs sm:text-sm font-medium text-blue-800 mb-2">ℹ️ Information importante :</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {!editingUser && (
                      <li>• Un email de confirmation sera envoyé à l'utilisateur</li>
                    )}
                    <li>• L'utilisateur pourra se connecter avec son email et mot de passe</li>
                    <li>• <strong>Rôles disponibles :</strong></li>
                    {roles.map(role => (
                      <li key={role.value} className="ml-4">
                        - <strong>{role.label}:</strong> {role.description}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Boutons - Responsive */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                    {editingUser ? 'Modifier' : 'Créer'}
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

export default Utilisateurs;