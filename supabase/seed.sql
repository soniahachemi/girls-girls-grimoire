-- GGG-13 -- Jeu de données de test.
--
-- ⚠️ PROJET DEV UNIQUEMENT. Ne JAMAIS exécuter ce fichier sur le projet prod
-- (voir agents/guidelines.md, Stack -- séparation dev/prod). Objectif :
-- permettre à Developer/Tester de travailler sans dépendre de vraies
-- données saisies par Bimo.
--
-- Couvre volontairement plusieurs cas limites du schéma :
-- - un produit avec seulement "link", un avec seulement "affiliate_link",
--   un avec les deux (contrainte product_link_or_affiliate_link) ;
-- - une pick avec rating=5 et approved explicitement laissé à false à
--   l'insertion : sert à vérifier que le trigger pick_auto_approve la
--   repasse bien à true automatiquement ;
-- - une pick approuvée manuellement, sans note ni commentaire.

insert into public.category (slug, name, description) values
  ('beauty', 'Beauté', null),
  ('care', 'Care', null),
  ('cleaning', 'Cleaning', null);

insert into public.profile (name, description, image, famous, author, instagram, tiktok) values
  ('Aria Moon', 'Passionnée de skincare coréen depuis 10 ans.', null, true, true, 'aria.moon', 'aria.moon'),
  ('Belle Rivière', null, null, false, true, null, 'belle.riviere');

-- Produit avec seulement "link".
insert into public.product (name, brand, link, images, description, category_id)
select 'Sérum Vitamine C', 'GlowLab', 'https://example.com/serum-vitamine-c', '{}', 'Sérum éclat au quotidien.', id
from public.category where slug = 'beauty';

-- Produit avec seulement "affiliate_link".
insert into public.product (name, brand, affiliate_link, images, description, category_id)
select 'Baume Lèvres Miel', 'HoneyCare', 'https://example.com/aff/baume-levres-miel', '{}', 'Baume nourrissant au miel.', id
from public.category where slug = 'care';

-- Produit avec les deux.
insert into public.product (name, brand, link, affiliate_link, images, description, category_id)
select 'Spray Multi-Surfaces', 'CleanEasy', 'https://example.com/spray-multi-surfaces', 'https://example.com/aff/spray-multi-surfaces', '{}', 'Nettoyant écologique.', id
from public.category where slug = 'cleaning';

-- Pick avec rating=5 et approved=false à l'insertion -> le trigger
-- pick_auto_approve doit forcer approved à true.
insert into public.pick (profile_id, product_id, rating, approved, comment, note)
select p.id, pr.id, 5, false, 'Mon chouchou depuis des mois.', 'Radiante est celle qui brille de sa propre lumière.'
from public.profile p, public.product pr
where p.name = 'Aria Moon' and pr.name = 'Sérum Vitamine C';

-- Pick approuvée manuellement, sans note ni commentaire.
insert into public.pick (profile_id, product_id, approved)
select p.id, pr.id, true
from public.profile p, public.product pr
where p.name = 'Belle Rivière' and pr.name = 'Spray Multi-Surfaces';
