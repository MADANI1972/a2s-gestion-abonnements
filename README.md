# 📱 A2S - Gestion des Abonnements

Application web complète pour la gestion des abonnements annuels de la SARL A2S en Algérie.

## 🎯 Fonctionnalités

### ✅ Gestion Clients
- Base de données complète avec raison sociale, N° RC
- Filtrage par wilaya (48 wilayas d'Algérie)
- Affectation aux commerciaux
- Historique des modifications

### ✅ Gestion Abonnements
- Suivi des dates de début et fin
- Alertes automatiques 30 jours avant expiration
- Statuts : actif, à renouveler, expiré, suspendu, résilié
- Calcul du CA potentiel

### ✅ Gestion Paiements
- Multiples modes : espèces, chèque, virement, CCP
- Montants en DA (Dinar Algérien)
- Statuts : payé, partiel, impayé
- Upload de documents justificatifs

### ✅ Système de Rôles
- **Super Admin** : Accès complet
- **Admin** : Gestion clients, abonnements, paiements
- **Commercial** : Gestion de ses clients assignés
- **Lecteur** : Consultation uniquement

### ✅ Dashboard & Rapports
- Statistiques en temps réel
- Répartition par wilaya
- Graphiques et indicateurs clés
- Activités récentes

## 🛠️ Technologies

- **Frontend** : React 18, React Router v6
- **UI** : Tailwind CSS, Lucide Icons
- **Backend** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Base de données** : PostgreSQL avec RLS

## 📋 Prérequis

- Node.js 14+ et npm
- Compte Supabase (gratuit)
- Git

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/a2s-gestion-abonnements.git
cd a2s-gestion-abonnements
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration Supabase

#### 3.1 Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un compte et un nouveau projet
3. Noter l'URL du projet et la clé API anonyme

#### 3.2 Créer les tables

1. Ouvrir le **SQL Editor** dans Supabase
2. Copier le contenu de `database/schema.sql`
3. Exécuter le script SQL complet

#### 3.3 Configurer les variables d'environnement

```bash
# Copier le fichier exemple
cp .env.example .env.local

# Éditer .env.local avec vos clés Supabase
REACT_APP_SUPABASE_URL=https://votre-projet.supabase.co
REACT_APP_SUPABASE_ANON_KEY=votre-cle-anonyme
```

### 4. Créer le premier utilisateur

Dans Supabase :
1. Aller dans **Authentication** > **Users**
2. Cliquer sur **Add user**
3. Créer un utilisateur avec email/mot de passe
4. Aller dans **Table Editor** > `user_profiles`
5. Ajouter une ligne avec :
   - `id` : UUID de l'utilisateur créé
   - `full_name` : Votre nom
   - `role` : `super_admin`
   - `is_active` : `true`

### 5. Démarrer l'application

```bash
npm start
```

L'application sera accessible sur `http://localhost:3000`

## 📁 Structure du Projet

```
a2s-gestion-abonnements/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── common/          # Composants réutilisables
│   │   ├── dashboard/       # Tableau de bord
│   │   ├── clients/         # Gestion clients
│   │   ├── abonnements/     # Gestion abonnements
│   │   └── paiements/       # Gestion paiements
│   ├── services/            # Services API Supabase
│   ├── context/             # Context React (Auth)
│   ├── config/              # Configuration
│   ├── styles/              # Styles CSS
│   ├── App.js
│   └── index.js
├── database/
│   └── schema.sql           # Schéma base de données
├── .env.example
├── package.json
└── README.md
```

## 🔐 Authentification

### Se connecter

Utilisez les identifiants créés dans Supabase :
- Email : votre-email@example.com
- Mot de passe : votre-mot-de-passe

### Permissions par rôle

| Fonctionnalité | Super Admin | Admin | Commercial | Lecteur |
|----------------|-------------|-------|------------|---------|
| Tableau de bord | ✅ | ✅ | ✅ | ✅ |
| Clients (lecture) | ✅ | ✅ | ✅ (assignés) | ✅ |
| Clients (écriture) | ✅ | ✅ | ❌ | ❌ |
| Abonnements | ✅ | ✅ | ✅ (ses clients) | ✅ (lecture) |
| Paiements | ✅ | ✅ | ✅ (ses clients) | ✅ (lecture) |
| Utilisateurs | ✅ | ✅ | ❌ | ❌ |
| Rapports | ✅ | ✅ | ✅ | ❌ |

## 📊 Base de Données

### Tables Principales

- **user_profiles** : Profils utilisateurs avec rôles
- **clients** : Informations clients (raison sociale, RC, wilaya)
- **abonnements** : Abonnements annuels avec dates et montants
- **paiements** : Historique des paiements
- **alertes** : Système d'alertes automatiques
- **audit_logs** : Traçabilité des modifications

### Vues SQL

- **v_abonnements_details** : Vue enrichie des abonnements
- **v_stats_par_wilaya** : Statistiques par wilaya

### Fonctions Automatiques

- Mise à jour des statuts d'abonnements
- Création d'alertes 30 et 15 jours avant expiration
- Audit trail automatique

## 🎨 Personnalisation

### Modifier les wilayas

Éditer `src/services/clientsService.js` :

```javascript
getWilayasList() {
  return ['Alger', 'Oran', ...]; // Vos wilayas
}
```

### Ajouter un type d'abonnement

Éditer `src/services/abonnementsService.js` :

```javascript
getTypesAbonnement() {
  return ['Basic', 'Standard', 'Premium', 'Votre Type'];
}
```

## 🐛 Résolution de Problèmes

### Erreur de connexion Supabase

```bash
# Vérifier les variables d'environnement
cat .env.local

# Vérifier que les clés sont correctes dans Supabase
```

### Erreur "Module not found"

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur RLS (Row Level Security)

Vérifier que les policies sont bien créées dans Supabase SQL Editor.

## 📦 Build pour Production

```bash
# Créer le build
npm run build

# Le dossier build/ contient les fichiers optimisés
```

## 🚀 Déploiement

### Sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Ajouter les variables d'environnement dans Vercel Dashboard
```

### Sur Netlify

```bash
# Installer Netlify CLI
npm i -g netlify-cli

# Déployer
netlify deploy --prod

# Ajouter les variables d'environnement dans Netlify Dashboard
```

## 📝 Scripts Disponibles

```bash
npm start          # Démarrer en développement
npm run build      # Build pour production
npm test           # Lancer les tests
npm run eject      # Éjecter la configuration
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Email : support@a2s.dz
- Documentation : [Wiki du projet](https://github.com/votre-username/a2s-gestion-abonnements/wiki)

## 🙏 Remerciements

- [React](https://reactjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

Développé avec ❤️ par SARL A2S