# Schéma de données V2 — GGG-13

Documentation de référence pour Developer/Tester (GGG-16 à GGG-23). Le
schéma est défini par les migrations SQL de `supabase/migrations/`
(appliquées identiquement sur les deux projets Supabase, dev et prod — voir
`agents/guidelines.md`). Tenu à jour par Keeper.

## Vue d'ensemble

```
category 1───* product 1───* pick *───1 profile
```

- `category` : catégories de produits, table extensible (pas un ENUM).
- `profile` : les "girls girls", fantômes en V2 (pas d'auth).
- `product` : produits recommandés.
- `pick` : la recommandation qui relie un `profile` à un `product`.

## Convention de nommage

Colonnes en **snake_case** (convention Postgres/Supabase) — la spec
fonctionnelle du ticket utilisait du camelCase (`profileId`, `productId`) à
l'oral/dans le ticket, mais un identifiant SQL non quoté est de toute façon
replié en minuscules par Postgres. En base : `profile_id`, `product_id`,
`category_id`. Si le front veut du camelCase côté JS, aliaser dans la
requête supabase-js (`.select('id, profileId:profile_id, ...')`).

## Tables

### `category`
| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | |
| slug | text | unique, not null | clé technique stable (`beauty`, `care`, `cleaning`) |
| name | text | not null | libellé affiché |
| description | text | nullable | réservé à un usage futur |
| created_at / updated_at | timestamptz | not null | `updated_at` maintenu par trigger |

### `profile`
| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | not null | |
| description | text | nullable | |
| image | text | nullable | URL Cloudinary |
| famous | boolean | not null, default false | |
| author | boolean | not null, default false | |
| instagram / snapchat / youtube / tiktok / x | text | nullable | handles, pas des URLs complètes |
| user_id | uuid | nullable | **anticipe la V3** (Supabase Auth) — pas de FK, pas exploité en V2, ne pas s'y fier |
| created_at / updated_at | timestamptz | not null | |

### `product`
| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | not null | |
| brand | text | not null | |
| link | text | nullable | lien de commande direct |
| affiliate_link | text | nullable | lien affilié |
| images | text[] | not null, default `{}` | URLs Cloudinary, ordre = ordre d'affichage |
| description | text | not null | |
| category_id | uuid | not null, FK → `category.id` | |
| created_at / updated_at | timestamptz | not null | |

**`link` et `affiliate_link` sont chacun nullable, mais au moins un des deux
doit être renseigné** (contrainte `product_link_or_affiliate_link`) —
décision de Bimo (17/09/2026) : un produit peut n'avoir qu'un lien direct,
qu'un lien affilié, ou les deux. Côté front, tester lequel des deux existe
avant d'afficher le bouton de commande (préférer `affiliate_link` s'il est
présent, sinon `link` — à confirmer avec Bimo au moment du dev front,
GGG-18).

### `pick`
| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | uuid | PK | |
| profile_id | uuid | not null, FK → `profile.id` | |
| product_id | uuid | not null, FK → `product.id` | |
| rating | smallint | nullable, 1–5 si renseigné | |
| approved | boolean | not null, default false | voir ci-dessous — **ne conditionne pas la visibilité** |
| comment | text | nullable | |
| link | text | nullable | vers la vidéo/page source de la reco |
| note | text | nullable | **publique** (confirmé par Bimo le 16/09/2026, voir GGG-22) |
| created_at / updated_at | timestamptz | not null | |

**`approved` n'est pas un statut de modération/publication** — toutes les
picks sont publiques (voir RLS ci-dessous). C'est le fait que le profil
approuve le produit, indépendamment du commentaire ou de la note : un
profil peut approuver sans rien écrire. Règle métier (Bimo, 17/09/2026) :
poser `rating = 5` met automatiquement `approved = true` (trigger
`pick_auto_approve`, dans `20260916230100_create_core_tables.sql`) —
l'inverse n'est pas vrai (on peut approuver sans note 5, ou sans note du
tout).

## RLS (sécurité)

Lecture publique (rôle `anon`) sur les 4 tables, **aucune écriture
publique** — voir `supabase/migrations/20260916230300_enable_rls_policies.sql`
et la note de sécurité de l'Architecte sur GGG-13 (les clés
URL/publishable ne sont pas des secrets : les policies RLS sont l'unique
frontière de sécurité réelle). Les 4 tables sont publiques dans leur
intégralité, y compris les picks non approuvées.

## Recherche multi-type (GGG-16)

Index trigram (`pg_trgm`, GIN) sur `product.name`, `product.brand` et
`profile.name` — permet des requêtes `ilike '%terme%'` ou `similarity(...)`
rapides même à plusieurs milliers de lignes. Pas de fonction SQL de
recherche unifiée fournie par ce ticket : à l'échelle visée (~100 à
quelques milliers de produits), trois requêtes `supabase-js` filtrées en
parallèle (une par type : `product`, `profile`, `pick`) puis fusionnées
côté front sont largement suffisantes et plus simples à maintenir,
cohérent avec l'absence de backend/build. Voir la migration
`20260916230200_create_indexes.sql` pour le détail des index.

## Données de test (dev uniquement)

`supabase/seed.sql` — jeu de données minimal (catégories, 2 profils, 3
produits couvrant les 3 cas de `link`/`affiliate_link`, 2 picks dont une
sert à vérifier le trigger `pick_auto_approve`). **Jamais exécuté sur le
projet prod.**
