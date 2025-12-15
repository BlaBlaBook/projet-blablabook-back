# 📚 Documentation des Avatars

Ce dossier contient la documentation technique concernant la gestion des avatars dans l'application.

## Fichiers

- **[avatar-creation-flow.md](avatar-creation-flow.md)** : Diagramme du flux de création d'avatar
- **[avatar-change-flow.md](avatar-change-flow.md)** : Diagramme du flux de changement d'avatar
- **[avatar-architecture.md](avatar-architecture.md)** : Architecture complète du système d'avatars

## Visualisation

Pour visualiser les diagrammes Mermaid :
1. Installez l'extension [Mermaid Preview](https://marketplace.visualstudio.com/items?itemName=vstirbu.vscode-mermaid-preview) dans VS Code
2. Ouvrez un fichier `.md`
3. Utilisez le raccourci `Ctrl+Shift+V` pour prévisualiser le diagramme

## Style actuel

Le style d'avatar actuel est défini dans `src/lib/dicebear.ts` avec la constante `DEFAULT_COLLECTION`.

Options disponibles :
- `'avataaars'` - Style cartoon (défaut)
- `'adventurer'` - Style fantasy/RPG
- `'big-smile'` - Visages simples
- `'bottts'` - Style robots

## Changement de style

Pour changer le style pour tous les utilisateurs :
1. Modifiez `DEFAULT_COLLECTION` dans `src/lib/dicebear.ts`
2. Redémarrez le serveur backend
3. Les nouveaux avatars utiliseront le nouveau style
