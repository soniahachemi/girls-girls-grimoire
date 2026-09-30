-- GGG-32 -- Repère interne sur affiliate_link.
--
-- affiliate_link n'a aucune colonne de relation vers product (relation à
-- sens unique portée par product.affiliate_link_id, voir GGG-31) : en
-- parcourant la table seule dans Supabase Studio, impossible de savoir à
-- quel produit correspond une ligne. Ajout d'un champ `name` texte libre,
-- usage strictement interne pour Bimo (jamais affiché aux visiteurs du
-- site) -- ex. "Baume Lèvres Miel - Amazon".

alter table public.affiliate_link
  add column name text;

comment on column public.affiliate_link.name is
  'Repère interne pour Bimo dans Supabase Studio (ex. "Baume Lèvres Miel - Amazon"). Jamais affiché aux visiteurs du site. Nullable, aucun impact sur les policies RLS existantes (RLS est au niveau ligne, pas colonne).';
