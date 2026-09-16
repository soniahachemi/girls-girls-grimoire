-- GGG-13 -- Index.
--
-- 1) Index "classiques" sur les clés étrangères : Postgres n'indexe jamais
--    automatiquement une colonne de FK, indispensable ici pour les jointures
--    et les filtres (page produit -> ses picks, page profil -> ses picks...).
-- 2) Index trigram (GIN, pg_trgm) sur les colonnes recherchées en texte
--    libre : permet ILIKE '%terme%' et similarity() rapides même sur
--    plusieurs milliers de lignes (voir note de faisabilité dans
--    supabase/SCHEMA.md).

-- Clés étrangères
create index product_category_id_idx on public.product (category_id);
create index pick_profile_id_idx on public.pick (profile_id);
create index pick_product_id_idx on public.pick (product_id);

-- Recherche multi-type (GGG-16) : nom des produits/profils, marque produit.
create index product_name_trgm_idx on public.product using gin (name gin_trgm_ops);
create index product_brand_trgm_idx on public.product using gin (brand gin_trgm_ops);
create index profile_name_trgm_idx on public.profile using gin (name gin_trgm_ops);

-- Filtre très fréquent (RLS + pages) : ne remonter que les picks approuvés.
create index pick_approved_idx on public.pick (approved) where approved;
