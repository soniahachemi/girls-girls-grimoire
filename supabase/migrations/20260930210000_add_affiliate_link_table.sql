-- GGG-31 -- Table dédiée aux liens affiliés produit.
--
-- Remplace le champ text `product.affiliate_link` par une relation vers une
-- nouvelle table `affiliate_link`, pour pouvoir à terme y stocker d'autres
-- informations que le seul lien (demande de Bimo, 30/09/2026).
--
-- Relation à sens unique, portée par `product` uniquement : `affiliate_link`
-- ne référence rien (pas de colonne product_id ni aucune autre FK) -- c'est
-- `product` qui référence `affiliate_link` via `affiliate_link_id`, jamais
-- l'inverse (confirmé par Bimo, 30/09/2026).

-- ---------------------------------------------------------------------------
-- affiliate_link
-- ---------------------------------------------------------------------------
create table public.affiliate_link (
  id uuid primary key default gen_random_uuid(),
  link text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.affiliate_link
  for each row execute function public.set_updated_at();

comment on table public.affiliate_link is
  'Liens affiliés produit. Aucune colonne de relation : c''est product.affiliate_link_id qui référence cette table, jamais l''inverse -- voir GGG-31.';

alter table public.affiliate_link enable row level security;

create policy "affiliate_link is publicly readable"
  on public.affiliate_link for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- product : migration de affiliate_link (text) vers affiliate_link_id (FK)
-- ---------------------------------------------------------------------------

-- 1. Nouvelle colonne, nullable le temps de migrer les données existantes.
alter table public.product
  add column affiliate_link_id uuid references public.affiliate_link (id);

-- 2. Migration ligne par ligne (plutôt qu'un join par valeur de texte, qui
--    assignerait incorrectement le même affiliate_link à plusieurs produits
--    en cas de lien identique) : une ligne affiliate_link par produit ayant
--    déjà un affiliate_link renseigné, puis on fait pointer le produit dessus.
do $$
declare
  prod record;
  new_link_id uuid;
begin
  for prod in select id, affiliate_link from public.product where affiliate_link is not null loop
    insert into public.affiliate_link (link) values (prod.affiliate_link) returning id into new_link_id;
    update public.product set affiliate_link_id = new_link_id where id = prod.id;
  end loop;
end $$;

-- 3. Contrainte "au moins un lien" mise à jour : product_link_or_affiliate_link
--    portait sur (link, affiliate_link) -- remplacée par une version portant
--    sur (link, affiliate_link_id). Le champ text affiliate_link est retiré.
alter table public.product
  drop constraint product_link_or_affiliate_link;

alter table public.product
  drop column affiliate_link;

alter table public.product
  add constraint product_link_or_affiliate_link check (link is not null or affiliate_link_id is not null);

comment on column public.product.affiliate_link_id is
  'FK vers affiliate_link.id (nullable). Peut être absent si link est renseigné (voir contrainte product_link_or_affiliate_link). Relation à sens unique : affiliate_link ne référence pas product.';

-- Index sur la nouvelle FK, comme les autres FK du schéma (voir
-- 20260916230200_create_indexes.sql).
create index product_affiliate_link_id_idx on public.product (affiliate_link_id);
