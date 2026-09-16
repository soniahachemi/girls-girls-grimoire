-- GGG-13 -- Tables coeur du modèle V2 : category, profile, product, pick.
--
-- Convention de nommage : colonnes en snake_case (convention Postgres/Supabase
-- standard -- un identifiant non quoté est de toute façon replié en
-- minuscules par Postgres, donc le camelCase de la spec fonctionnelle
-- (ex. "profileId") devient profile_id ici ; à retenir côté front pour
-- l'aliasing éventuel des colonnes dans les requêtes supabase-js).
--
-- Clés primaires en uuid (gen_random_uuid()) plutôt qu'en entier séquentiel :
-- évite d'exposer un compteur (nombre de produits/profils) via les URLs de
-- pages produit/profil/pick, cohérent avec le fait que ces id finiront dans
-- des URLs publiques.

-- Fonction réutilisée par les 4 tables pour maintenir updated_at à jour.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- category
-- ---------------------------------------------------------------------------
-- Table plutôt qu'un ENUM Postgres figé (demande explicite de Bimo) : permet
-- d'ajouter des catégories sans migration, et de stocker plus que le nom à
-- l'avenir (description, icône, ordre d'affichage...) sans revoir le schéma.
-- "slug" = clé technique stable (utilisée par le code, jamais affichée telle
-- quelle) ; "name" = libellé affiché aux visiteurs (français pour la V1/V2,
-- voir agents/guidelines.md section Conventions pour l'i18n prévue plus tard).
create table public.category (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.category
  for each row execute function public.set_updated_at();

comment on table public.category is
  'Catégories de produits (beauty, care, cleaning...). Table extensible plutôt qu''ENUM -- voir GGG-13.';

-- ---------------------------------------------------------------------------
-- profile
-- ---------------------------------------------------------------------------
-- Tous les profils sont "fantômes" en V2 (pas d'authentification). user_id
-- anticipe la V3 (Supabase Auth) : colonne nullable présente dès maintenant,
-- volontairement sans contrainte de clé étrangère vers auth.users ni policy
-- RLS basée dessus tant qu'elle n'est pas exploitée (voir note sécurité de
-- l'Architecte sur ce ticket).
create table public.profile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image text,
  famous boolean not null default false,
  author boolean not null default false,
  instagram text,
  snapchat text,
  youtube text,
  tiktok text,
  x text,
  user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.profile
  for each row execute function public.set_updated_at();

comment on table public.profile is
  'Profils "girls girls". Tous fantômes en V2 (user_id nullable, non exploité avant la V3).';
comment on column public.profile.user_id is
  'Anticipe la V3 (Supabase Auth). Non exploité en V2 : pas de FK, pas de policy RLS basée dessus pour l''instant.';

-- ---------------------------------------------------------------------------
-- product
-- ---------------------------------------------------------------------------
-- "link" (lien de commande direct) et "affiliate_link" (lien affilié) sont
-- tous les deux nullable : un produit peut n'avoir que l'un ou l'autre, mais
-- au moins un des deux est obligatoire (décision de Bimo, 17/09/2026) --
-- garanti par la contrainte CHECK ci-dessous plutôt que par la seule
-- validation applicative.
create table public.product (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  link text,
  affiliate_link text,
  images text[] not null default '{}',
  description text not null,
  category_id uuid not null references public.category (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_link_or_affiliate_link check (link is not null or affiliate_link is not null)
);

create trigger set_updated_at
  before update on public.product
  for each row execute function public.set_updated_at();

comment on table public.product is
  'Produits recommandés. "link" = lien de commande direct, "affiliate_link" = lien affilié -- au moins un des deux doit être renseigné.';
comment on column public.product.link is
  'Lien externe de commande direct. Nullable : peut être absent si affiliate_link est renseigné (voir contrainte product_link_or_affiliate_link).';
comment on column public.product.affiliate_link is
  'Lien affilié. Nullable : peut être absent si link est renseigné (voir contrainte product_link_or_affiliate_link).';
comment on column public.product.images is
  'Liste d''URLs d''images (Cloudinary, voir GGG-24). Tableau plutôt qu''une table à part : simple à lire/écrire depuis Supabase Studio, pas de besoin de métadonnées par image en V2.';

-- ---------------------------------------------------------------------------
-- pick
-- ---------------------------------------------------------------------------
-- "approved" n'est PAS un statut de modération/publication (toutes les picks
-- sont publiques, voir policies RLS) : c'est le fait que le profil approuve
-- ou non le produit, indépendamment du commentaire/de la note -- un profil
-- peut approuver sans rien écrire. Règle métier (Bimo, 17/09/2026) : une
-- note de 5 entraîne automatiquement approved = true (voir trigger
-- pick_auto_approve ci-dessous) ; l'inverse n'est pas vrai (on peut approuver
-- sans mettre 5, ou sans mettre de note du tout).
create table public.pick (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile (id),
  product_id uuid not null references public.product (id),
  rating smallint,
  approved boolean not null default false,
  comment text,
  link text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pick_rating_range check (rating is null or rating between 1 and 5)
);

create trigger set_updated_at
  before update on public.pick
  for each row execute function public.set_updated_at();

-- Applique la règle métier "note de 5 => approved automatique" -- se
-- déclenche à la création ET à la modification d'une pick (Bimo peut
-- corriger une note a posteriori dans Supabase Studio).
create or replace function public.pick_auto_approve()
returns trigger
language plpgsql
as $$
begin
  if new.rating = 5 then
    new.approved = true;
  end if;
  return new;
end;
$$;

create trigger pick_auto_approve
  before insert or update on public.pick
  for each row execute function public.pick_auto_approve();

comment on table public.pick is
  'Recommandation d''un profil pour un produit. "note" est publique (confirmé 16/09/2026, voir GGG-22). "approved" = approbation du profil (pas un statut de modération), auto-vrai si rating = 5 (voir trigger pick_auto_approve).';
comment on column public.pick.approved is
  'Le profil approuve le produit (indépendant du commentaire/de la note). Auto-mis à true si rating = 5 (trigger pick_auto_approve) -- ne conditionne PAS la visibilité publique, voir policies RLS.';
