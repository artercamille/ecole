# Partiels

Appli privée : tout le contenu est chiffré (AES-256-GCM, clé PBKDF2) dans `app.enc`.
Sans le mot de passe, ce dépôt ne contient rien de lisible.

- Mettre à jour : `ECOLE_PASS=... node tools/build.mjs <sources>` puis changer `VERSION` dans `sw.js`.
- Récupérer les sources : `ECOLE_PASS=... node tools/decrypt.mjs <dossier>`.
