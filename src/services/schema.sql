-- ============================================
-- SCRIPT SQL COMPLET POUR A2S
-- Compatible avec les composants React
-- ============================================

-- ÉTAPE 1 : SUPPRIMER LES ANCIENNES TABLES SI ELLES EXISTENT
-- ============================================

DROP TABLE IF EXISTS public.paiements CASCADE;
DROP TABLE IF EXISTS public.abonnements CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ÉTAPE 2 : CRÉER LA TABLE CLIENTS
-- ============================================

CREATE TABLE public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    raison_sociale VARCHAR(200),
    email VARCHAR(150) UNIQUE NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    adresse TEXT NOT NULL,
    wilaya VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_region ON public.clients(region);
CREATE INDEX idx_clients_wilaya ON public.clients(wilaya);
CREATE INDEX idx_clients_statut ON public.clients(statut);

COMMENT ON TABLE public.clients IS 'Table des clients A2S';

-- ÉTAPE 3 : CRÉER LA TABLE ABONNEMENTS
-- ============================================

CREATE TABLE public.abonnements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    type_abonnement VARCHAR(50) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    montant_annuel DECIMAL(12, 2) NOT NULL CHECK (montant_annuel > 0),
    statut_paiement VARCHAR(20) DEFAULT 'en_attente' CHECK (statut_paiement IN ('en_attente', 'paye', 'en_retard')),
    statut_abonnement VARCHAR(20) DEFAULT 'actif' CHECK (statut_abonnement IN ('actif', 'expire', 'suspendu', 'annule')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (date_fin > date_debut)
);

-- Index pour améliorer les performances
CREATE INDEX idx_abonnements_client ON public.abonnements(client_id);
CREATE INDEX idx_abonnements_dates ON public.abonnements(date_debut, date_fin);
CREATE INDEX idx_abonnements_statut_abo ON public.abonnements(statut_abonnement);
CREATE INDEX idx_abonnements_statut_paie ON public.abonnements(statut_paiement);

COMMENT ON TABLE public.abonnements IS 'Table des abonnements clients';

-- ÉTAPE 4 : CRÉER LA TABLE PAIEMENTS
-- ============================================

CREATE TABLE public.paiements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    abonnement_id UUID NOT NULL REFERENCES public.abonnements(id) ON DELETE CASCADE,
    montant DECIMAL(12, 2) NOT NULL CHECK (montant > 0),
    date_paiement DATE NOT NULL,
    methode_paiement VARCHAR(50) NOT NULL CHECK (methode_paiement IN ('virement', 'especes', 'cheque', 'carte_bancaire')),
    statut VARCHAR(20) DEFAULT 'valide' CHECK (statut IN ('valide', 'en_attente', 'annule', 'rembourse')),
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_paiements_abonnement ON public.paiements(abonnement_id);
CREATE INDEX idx_paiements_date ON public.paiements(date_paiement);
CREATE INDEX idx_paiements_statut ON public.paiements(statut);

COMMENT ON TABLE public.paiements IS 'Table des paiements';

-- ÉTAPE 5 : CRÉER LA TABLE USERS
-- ============================================

CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'utilisateur' CHECK (role IN ('super_admin', 'admin', 'commercial', 'utilisateur', 'lecteur')),
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

COMMENT ON TABLE public.users IS 'Table des utilisateurs système';

-- ÉTAPE 6 : ACTIVER ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 7 : CRÉER LES POLITIQUES RLS (PERMETTRE TOUT POUR L'INSTANT)
-- ============================================

-- Politiques pour CLIENTS
CREATE POLICY "Allow all operations on clients" 
ON public.clients 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Politiques pour ABONNEMENTS
CREATE POLICY "Allow all operations on abonnements" 
ON public.abonnements 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Politiques pour PAIEMENTS
CREATE POLICY "Allow all operations on paiements" 
ON public.paiements 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Politiques pour USERS
CREATE POLICY "Allow all operations on users" 
ON public.users 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ÉTAPE 8 : CRÉER DES TRIGGERS POUR UPDATED_AT
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour CLIENTS
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour ABONNEMENTS
CREATE TRIGGER update_abonnements_updated_at BEFORE UPDATE ON public.abonnements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour PAIEMENTS
CREATE TRIGGER update_paiements_updated_at BEFORE UPDATE ON public.paiements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour USERS
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ÉTAPE 9 : INSÉRER DES DONNÉES DE TEST
-- ============================================

-- Clients de test
INSERT INTO public.clients (nom, prenom, raison_sociale, email, telephone, adresse, wilaya, region, statut) VALUES
('Benali', 'Ahmed', 'SARL TechnoSoft', 'a.benali@technosoft.dz', '0555123456', '15 Rue Didouche Mourad', 'Alger', 'Alger', 'actif'),
('Khelifa', 'Fatima', 'Digital Services', 'f.khelifa@digital.dz', '0661234567', '45 Boulevard de la Soummam', 'Oran', 'Oran', 'actif'),
('Mansouri', 'Karim', 'Entreprise Mansouri & Fils', 'k.mansouri@entreprise.dz', '0770345678', '28 Avenue de l''Indépendance', 'Constantine', 'Constantine', 'actif'),
('Belhadj', 'Samira', 'EURL InnovateTech', 's.belhadj@innovate.dz', '0550987654', '12 Rue des Frères Bouadou', 'Annaba', 'Annaba', 'actif'),
('Zouaoui', 'Mohamed', 'SPA Solutions Pro', 'm.zouaoui@solutions.dz', '0668876543', '67 Boulevard Zighout Youcef', 'Sétif', 'Sétif', 'actif');

-- Abonnements de test
INSERT INTO public.abonnements (client_id, type_abonnement, date_debut, date_fin, montant_annuel, statut_paiement, statut_abonnement, notes)
SELECT 
    id,
    'Premium',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    150000.00,
    'paye',
    'actif',
    'Abonnement initial'
FROM public.clients
WHERE email = 'a.benali@technosoft.dz';

INSERT INTO public.abonnements (client_id, type_abonnement, date_debut, date_fin, montant_annuel, statut_paiement, statut_abonnement, notes)
SELECT 
    id,
    'Standard',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '25 days',
    80000.00,
    'paye',
    'actif',
    'Renouvellement proche'
FROM public.clients
WHERE email = 'f.khelifa@digital.dz';

INSERT INTO public.abonnements (client_id, type_abonnement, date_debut, date_fin, montant_annuel, statut_paiement, statut_abonnement)
SELECT 
    id,
    'Basic',
    CURRENT_DATE - INTERVAL '6 months',
    CURRENT_DATE + INTERVAL '6 months',
    50000.00,
    'en_attente',
    'actif'
FROM public.clients
WHERE email = 'k.mansouri@entreprise.dz';

-- Paiements de test
INSERT INTO public.paiements (abonnement_id, montant, date_paiement, methode_paiement, statut, reference)
SELECT 
    a.id,
    150000.00,
    CURRENT_DATE,
    'virement',
    'valide',
    'PAY-2025-001'
FROM public.abonnements a
JOIN public.clients c ON a.client_id = c.id
WHERE c.email = 'a.benali@technosoft.dz';

INSERT INTO public.paiements (abonnement_id, montant, date_paiement, methode_paiement, statut, reference)
SELECT 
    a.id,
    80000.00,
    CURRENT_DATE - INTERVAL '15 days',
    'cheque',
    'valide',
    'CHQ-2025-045'
FROM public.abonnements a
JOIN public.clients c ON a.client_id = c.id
WHERE c.email = 'f.khelifa@digital.dz';

-- Utilisateur admin de test
INSERT INTO public.users (nom, prenom, email, role, statut) VALUES
('Admin', 'Système', 'admin@a2s.dz', 'super_admin', 'actif'),
('Commercial', 'Alger', 'commercial.alger@a2s.dz', 'commercial', 'actif'),
('User', 'Test', 'user@a2s.dz', 'utilisateur', 'actif');

-- ÉTAPE 10 : VÉRIFICATION FINALE
-- ============================================

-- Compter les enregistrements
SELECT 'Clients' as table_name, COUNT(*) as count FROM public.clients
UNION ALL
SELECT 'Abonnements', COUNT(*) FROM public.abonnements
UNION ALL
SELECT 'Paiements', COUNT(*) FROM public.paiements
UNION ALL
SELECT 'Users', COUNT(*) FROM public.users;

-- Message de succès
SELECT '✅ Base de données créée avec succès !' as status;
SELECT '📊 Tables créées : clients, abonnements, paiements, users' as info;
SELECT '🔐 RLS activé sur toutes les tables' as security;
SELECT '📝 Données de test insérées' as data;
-- ============================================
-- AJOUTER LA TABLE APPLICATIONS
-- ============================================

-- Créer la table Applications
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    prix_annuel DECIMAL(12, 2) NOT NULL CHECK (prix_annuel >= 0),
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_applications_nom ON public.applications(nom);
CREATE INDEX idx_applications_statut ON public.applications(statut);

COMMENT ON TABLE public.applications IS 'Table des applications disponibles pour les abonnements';

-- Activer RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Politique RLS (permettre tout pour l'instant)
CREATE POLICY "Allow all operations on applications" 
ON public.applications 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Trigger pour updated_at
CREATE TRIGGER update_applications_updated_at 
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insérer des applications par défaut
INSERT INTO public.applications (nom, description, prix_annuel, statut) VALUES
('CRM', 'Gestion de la Relation Client - Système complet de gestion des clients et prospects', 150000.00, 'actif'),
('ERP', 'Enterprise Resource Planning - Gestion intégrée de l''entreprise', 300000.00, 'actif'),
('Comptabilité', 'Logiciel de comptabilité et gestion financière', 120000.00, 'actif'),
('GRH', 'Gestion des Ressources Humaines - Paie et personnel', 180000.00, 'actif'),
('E-Commerce', 'Plateforme de vente en ligne complète', 200000.00, 'actif'),
('Stock', 'Gestion des stocks et inventaires', 100000.00, 'actif'),
('Point de Vente', 'Système de caisse et gestion des ventes', 80000.00, 'actif'),
('Marketing', 'Outils de marketing digital et automation', 150000.00, 'actif')
ON CONFLICT (nom) DO NOTHING;

-- Modifier la colonne type_abonnement en application_id dans la table abonnements
ALTER TABLE public.abonnements 
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id);

-- Migrer les données existantes (optionnel)
-- Cette partie crée une application pour chaque type existant et lie les abonnements
DO $$
DECLARE
    app_record RECORD;
    type_record RECORD;
BEGIN
    FOR type_record IN 
        SELECT DISTINCT type_abonnement 
        FROM public.abonnements 
        WHERE type_abonnement IS NOT NULL 
        AND type_abonnement != ''
    LOOP
        -- Insérer l'application si elle n'existe pas
        INSERT INTO public.applications (nom, description, prix_annuel, statut)
        VALUES (
            type_record.type_abonnement,
            'Application migrée depuis les types d''abonnements',
            50000.00,
            'actif'
        )
        ON CONFLICT (nom) DO NOTHING;
        
        -- Récupérer l'ID de l'application
        SELECT id INTO app_record FROM public.applications WHERE nom = type_record.type_abonnement;
        
        -- Mettre à jour les abonnements
        UPDATE public.abonnements 
        SET application_id = app_record.id 
        WHERE type_abonnement = type_record.type_abonnement 
        AND application_id IS NULL;
    END LOOP;
END $$;

-- Vérification
SELECT 'Applications créées:' as info, COUNT(*) as count FROM public.applications;
SELECT 'Abonnements avec application_id:' as info, COUNT(*) as count FROM public.abonnements WHERE application_id IS NOT NULL;
-- Créer la table installations
CREATE TABLE IF NOT EXISTS public.installations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    montant DECIMAL(10, 2) NOT NULL,
    statut VARCHAR(50) NOT NULL CHECK (statut IN ('active', 'suspendu', 'prochainement')),
    date_debut DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_installations_client_id ON public.installations(client_id);
CREATE INDEX IF NOT EXISTS idx_installations_application_id ON public.installations(application_id);
CREATE INDEX IF NOT EXISTS idx_installations_statut ON public.installations(statut);
CREATE INDEX IF NOT EXISTS idx_installations_date_debut ON public.installations(date_debut);

-- Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_installations_updated_at BEFORE UPDATE ON public.installations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS (Row Level Security)
ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Enable read access for authenticated users" ON public.installations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.installations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.installations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.installations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE public.installations IS 'Table pour gérer les installations d''applications chez les clients';
COMMENT ON COLUMN public.installations.id IS 'Identifiant unique de l''installation';
COMMENT ON COLUMN public.installations.client_id IS 'Référence au client';
COMMENT ON COLUMN public.installations.application_id IS 'Référence à l''application installée';
COMMENT ON COLUMN public.installations.montant IS 'Montant de l''installation';
COMMENT ON COLUMN public.installations.statut IS 'Statut de l''installation: active, suspendu, prochainement';
COMMENT ON COLUMN public.installations.date_debut IS 'Date de début de l''installation';
COMMENT ON COLUMN public.installations.notes IS 'Notes additionnelles sur l''installation';
COMMENT ON COLUMN public.installations.created_at IS 'Date de création de l''enregistrement';
COMMENT ON COLUMN public.installations.updated_at IS 'Date de dernière mise à jour de l''enregistrement';