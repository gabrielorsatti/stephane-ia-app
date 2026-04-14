# Déploiement — Secrets & variables d'environnement

## Contexte

Le Coach IA consomme l'endpoint Llama 3.3 du Groupe GENES via trois variables `VITE_*` :

| Variable            | Requise | Défaut                                          |
| ------------------- | ------- | ----------------------------------------------- |
| `VITE_LLM_API_KEY`  | ✅      | —                                               |
| `VITE_LLM_BASE_URL` | ❌      | `https://llm.lab.groupe-genes.fr/openai`        |
| `VITE_LLM_MODEL`    | ❌      | `llama3.3:70b`                                  |

> ⚠️ **Avertissement sécurité** : toute variable préfixée `VITE_` est **inlinée en clair dans le bundle JS** servi au navigateur. La clé API sera donc visible par n'importe quel visiteur du site qui ouvre les DevTools. Pour un vrai déploiement public, il faudra :
>
> 1. Révoquer cette clé et en générer une nouvelle.
> 2. Router les appels LLM via un petit proxy backend (Vercel Function, Cloudflare Worker…) qui garde la clé côté serveur.
> 3. Remplacer `chatCompletion` dans `src/lib/llm.ts` pour pointer vers ce proxy.
>
> Tant que l'app est en usage strictement personnel / privé, l'inlining reste acceptable.

---

## 1. Développement local

1. Crée `.env` à la racine du repo (déjà gitignoré) :
   ```env
   VITE_LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
   VITE_LLM_BASE_URL=https://llm.lab.groupe-genes.fr/openai
   VITE_LLM_MODEL=llama3.3:70b
   ```
2. **Redémarre** `npm run dev` — Vite ne relit pas `.env` à chaud.

---

## 2. Déploiement via GitHub Actions

### 2.1 Ajouter les secrets dans GitHub

1. Va sur `https://github.com/gabrielorsatti/Personnal-gym-tracker/settings/secrets/actions`.
2. Clique **New repository secret**.
3. Crée les 3 secrets :
   - Nom : `VITE_LLM_API_KEY`, valeur : ta clé.
   - Nom : `VITE_LLM_BASE_URL`, valeur : `https://llm.lab.groupe-genes.fr/openai`.
   - Nom : `VITE_LLM_MODEL`, valeur : `llama3.3:70b`.

### 2.2 Les injecter dans le workflow

Dans `.github/workflows/deploy.yml` (ou équivalent), injecte-les au step `npm run build` :

```yaml
- name: Build
  run: npm run build
  env:
    VITE_LLM_API_KEY: ${{ secrets.VITE_LLM_API_KEY }}
    VITE_LLM_BASE_URL: ${{ secrets.VITE_LLM_BASE_URL }}
    VITE_LLM_MODEL: ${{ secrets.VITE_LLM_MODEL }}
```

Vite lit ces variables au build et les inline dans le bundle. Aucun fichier `.env` n'est requis sur le runner.

### 2.3 GitHub Pages — spécificité

Si tu déploies sur GitHub Pages avec un workflow type `actions/deploy-pages`, le secret n'est lisible que depuis le job qui exécute réellement `npm run build`. Place donc l'`env:` sur ce step précis, pas sur le job de déploiement.

---

## 3. Déploiement via Vercel / Netlify / Cloudflare Pages

Interface graphique → **Environment Variables** du projet → ajoute les 3 mêmes clés (pas de `secrets.` ici, valeurs en clair dans la config du provider). Redéploie.

---

## 4. Vérification après déploiement

1. Ouvre le site, onglet **coach**.
2. Si le bandeau jaune "Clé API manquante" s'affiche → les variables ne sont pas arrivées dans le bundle, vérifie le step `env:` du workflow.
3. Sinon, tape une question : si tu vois une erreur `LLM HTTP 401` → la clé est mal recopiée. `LLM HTTP 403` → la clé n'a pas accès au modèle.
