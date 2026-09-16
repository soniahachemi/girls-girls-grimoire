-- GGG-13 -- Row Level Security.
--
-- Rappel (voir commentaire de l'Architecte sur ce ticket, 16/09/2026) : la
-- clé anonyme/publishable n'est pas un secret, donc ces policies sont la
-- SEULE vraie frontière de sécurité de la V2. Principe : lecture publique,
-- AUCUNE écriture publique sur aucune des 4 tables -- la saisie de contenu
-- se fait exclusivement via Supabase Studio (rôle service_role / postgres,
-- qui contourne RLS), jamais via le front.
--
-- RLS est activée explicitement ici (indépendamment du réglage "RLS
-- automatique" du projet, voir GGG-24) : plus sûr de ne pas dépendre d'un
-- seul réglage, et plus lisible pour quiconque relit ce fichier.
--
-- Aucune policy INSERT/UPDATE/DELETE n'est créée pour anon/authenticated sur
-- aucune des 4 tables : RLS activée + zéro policy d'écriture = écriture
-- refusée par défaut pour ces rôles. Ne pas en ajouter sans une raison
-- explicite validée avec Bimo/l'Architecte (voir note de sécurité du
-- 16/09/2026 sur ce ticket).

alter table public.category enable row level security;
alter table public.profile  enable row level security;
alter table public.product  enable row level security;
alter table public.pick     enable row level security;

-- Les 4 tables sont publiques dans leur intégralité : pas de notion de
-- "brouillon" ou de modération en V2. En particulier, "pick.approved" n'est
-- PAS un statut de publication (c'est l'approbation du profil sur le
-- produit, voir commentaire sur la table pick) -- une pick non approuvée
-- reste visible, comme les autres.
create policy "category is publicly readable"
  on public.category for select
  to anon, authenticated
  using (true);

create policy "profile is publicly readable"
  on public.profile for select
  to anon, authenticated
  using (true);

create policy "product is publicly readable"
  on public.product for select
  to anon, authenticated
  using (true);

create policy "pick is publicly readable"
  on public.pick for select
  to anon, authenticated
  using (true);
