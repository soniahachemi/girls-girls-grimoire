-- GGG-13 -- Extensions Postgres nécessaires au schéma V2.
-- À appliquer en premier, sur les deux projets (dev et prod).

-- Recherche texte floue (similarité, ILIKE accéléré par index GIN) : utilisée
-- pour la recherche multi-type (produits/profils/picks), voir GGG-16.
create extension if not exists pg_trgm;

-- gen_random_uuid() pour les clés primaires. Généralement déjà disponible
-- sur un projet Supabase, mais on l'active explicitement pour ne pas en
-- dépendre implicitement.
create extension if not exists pgcrypto;
