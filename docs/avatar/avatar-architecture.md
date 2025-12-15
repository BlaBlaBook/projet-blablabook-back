# 🏗️ Architecture des avatars

Ce document explique l'architecture complète de la gestion des avatars.

## Composants

```mermaid
classDiagram
    class User {
        +String id
        +String username
        +String avatar_url
        +String avatar_seed
    }

    class DiceBear {
        +generateAvatar(seed: string): string
    }

    class AvatarService {
        +generateDiceBearAvatar(seed: string): string
        +generateRandomAvatarSeed(): string
    }

    User "1" -- "1" AvatarService : utilise
    AvatarService "1" -- "1" DiceBear : utilise
```

## Flux de données

```mermaid
graph TD
    A[Utilisateur] -->|Inscription| B[Backend]
    B -->|Génère avatar| C[DiceBear]
    C -->|Retourne SVG| B
    B -->|Stocke| D[Base de données]
    D -->|avatar_url| B
    B -->|Retourne| A
```

## Configuration

La collection par défaut est définie dans `src/lib/dicebear.ts`:
```typescript
const DEFAULT_COLLECTION: CollectionName = 'avataaars';
```

Pour changer le style pour tous les utilisateurs, modifiez cette constante et redémarrez le serveur.
