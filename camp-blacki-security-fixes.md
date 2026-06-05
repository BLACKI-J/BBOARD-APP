# camp.blacki.net — Sécurité à corriger (BBOARD - Colo)

> Scan du 2026-05-31 (`/secrets-hunt`, mode JS-bundle, self-scan).
> Source : `findings/secrets/20260531_004013/SUMMARY.md`

## ✅ Bonne nouvelle : aucune clé/secret exposé
Aucune clé API fuitée dans le JS (AWS, GCP, Google, Slack, Stripe, GitHub,
OpenAI, Anthropic, SendGrid, Twilio, Firebase, Supabase, JWT, clés PEM…).
Aucune variable `VITE_*` inlinée par erreur. Rien à corriger côté secrets.

---

## 🔴 CRITIQUE — Contrôle d'accès cassé (à corriger en priorité)

**Problème :** l'application n'a **aucune authentification côté serveur**.
La "connexion admin" est uniquement un flag dans le navigateur (localStorage),
donc contournable par n'importe qui.

### Preuves (extraites du bundle minifié)
- Base API : `J = "/api"` → `https://camp.blacki.net/api/...` (même origine)
- PIN admin par défaut codé en dur :
  ```js
  adminPin = localStorage.getItem("colo-admin-pin") || "1234"
  ```
- "Authentifié" = simple valeur localStorage :
  ```js
  authenticated = localStorage.getItem("colo-authenticated") === "true"
  ```
  → ouvrir la console et taper `localStorage.setItem("colo-authenticated","true")`
    = accès admin instantané.
- Le PIN admin est même servi par le backend **sans authentification** :
  `GET /api/state/adminPin`
- Tous les `fetch()` n'envoient que `{"Content-Type":"application/json"}` :
  **aucun header `Authorization`, aucun cookie de session, aucun token.**
- Il n'existe **aucune** route `/api/auth`, `/api/login` ou `/api/verify`.

### Endpoints exposés sans authentification (sur `/api`)
| Endpoint | Données exposées |
|---|---|
| `/api/participants` | **données personnelles des enfants** |
| `/api/incident-sheets` | fiches d'incident concernant des mineurs |
| `/api/exit-sheets` | autorisations de sortie / récupération |
| `/api/inventory/items`, `/api/inventory/search` | inventaire |
| `/api/meeting-recaps` | comptes-rendus de réunion |
| `/api/action-logs?limit=200` | journal d'actions |
| `/api/ai/rewrite-fei` | proxy IA côté serveur (abus de coût / injection de prompt) |
| `/api/state/adminPin`, `/api/state/accessControl`, `/api/state/savedViews` | état/config |

### Impact
N'importe qui sur Internet peut **lire et modifier** les données d'une colonie
de vacances concernant des **mineurs** (noms, incidents, autorisations de
sortie). C'est de la **donnée personnelle sensible de mineurs** → enjeu **RGPD**.
Gravité bien supérieure à une simple clé fuitée.

### À corriger
- [ ] Ajouter une vraie authentification **côté serveur** (cookie de session
      signé ou token) et l'exiger sur **CHAQUE** route `/api/...`.
- [ ] Ne plus jamais servir le PIN admin via l'API ; le client ne doit jamais
      être la source de vérité pour l'autorisation.
- [ ] Supprimer le PIN par défaut `"1234"`.
- [ ] Protéger + limiter le débit (rate-limit) sur `/api/ai/rewrite-fei`
      (coût et injection de prompt).
- [ ] Vérifier les permissions par rôle (qui peut lire/écrire quoi).

### Vérifier soi-même (ton propre asset, requête inoffensive)
```bash
curl -s https://camp.blacki.net/api/state/adminPin
curl -s https://camp.blacki.net/api/participants | head
```
Si ça renvoie des données **sans header d'authentification**, le contrôle
d'accès est bien cassé.

---

## Notes
- Scan réalisé en *regex fallback* (aucun scanner installé : trufflehog /
  noseyparker / gitleaks). Pour une vérif de clés "live", installer trufflehog.
- Données téléchargées et analysées localement : `findings/secrets/20260531_004013/`
