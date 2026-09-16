# supabase/migrations/

Migrations SQL versionnées du schéma de données (GGG-13, Keeper), appliquées
identiquement aux deux projets Supabase (dev + prod, voir GGG-24).

**Point de coordination Architecte/Keeper (GGG-14)** : ce dossier est créé
vide par GGG-14, pour que la structure soit prête. C'est à la première
migration de Keeper d'activer les extensions Postgres nécessaires à la
recherche (`create extension if not exists pg_trgm;`) avant la création des
tables -- l'Architecte ne l'a pas fait lui-même pour éviter d'écrire dans ce
dossier en parallèle de Keeper et de dupliquer/entrer en conflit avec son
travail de schéma.
