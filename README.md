# AuditFlash

Diagnostic de configuration pour une page web : en-têtes, cookies, signaux publics (CMS, paiement), score de A+ à F, simulation de correctif et rapport dirigeant.

## Lancer

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000 puis « Scanner la boutique de démo ».

## Périmètre

L'audit lit uniquement l'adresse indiquée, comme un visiteur. Il ne teste pas les injections, ne télécharge pas de fichiers privés (`.env`, `.git`, sauvegardes) et n'affiche aucune clé. Les adresses locales et les réseaux privés sont refusées.
