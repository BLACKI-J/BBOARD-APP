# Guide d'utilisation d'OpenCode

Ce document explique comment installer et utiliser OpenCode de manière optimale.

## Démarrage Rapide

OpenCode est un outil puissant accessible depuis n'importe quel terminal.

### Installation

Pour installer OpenCode sur votre système :

1. Téléchargez le script d'installation.
2. Donnez les droits d'exécution.
3. Lancez l'installation.

### Accès Partout (PATH)

L'installation ajoute automatiquement le binaire à votre PATH. Si ce n'est pas le cas, vous pouvez l'ajouter manuellement dans votre `~/.bashrc` ou `~/.zshrc` :

```bash
export PATH="$PATH:/usr/local/bin/opencode"
```

## Accès Root (sudo)

Si vous devez utiliser OpenCode avec des privilèges administrateur :

```bash
sudo opencode [commande]
```

---

## Commandes de base

Voici les commandes essentielles à connaître :

- `opencode start` : Lance l'interface principale.
- `opencode --help` : Affiche l'aide et les options disponibles.
- `opencode config` : Permet de configurer vos préférences.

---

## Liens Utiles

- [Documentation Officielle](https://github.com/BLACKI-J/BBOARD-APP)
- [Support & FAQ](https://github.com/BLACKI-J/BBOARD-APP/issues)
