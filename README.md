# SpaceExplorer

Application mobile Expo/React Native de consultation de donnees spatiales NASA, realisee dans un objectif pedagogique (architecture mobile, integration API, UX) et fonctionnel (visualisation, favoris, historique).

## Contexte du projet

Ce projet s'inscrit dans un cadre academique de niveau Master (Ynov Campus). L'application sert de support de mise en pratique pour :

- l'integration d'APIs publiques REST (NASA Open APIs) ;
- la structuration d'une application mobile TypeScript ;
- la gestion des etats UI (chargement, erreur, vide) ;
- la persistance locale (favoris, historique).

## Fonctionnalites principales

### APOD (Astronomy Picture of the Day)

- Consultation de l'image astronomique du jour pour une date choisie.
- Affichage du titre, de l'explication et du media (image/video).
- Navigation par date avec UX de validation explicite.

### NeoWs (Near Earth Objects)

- Affichage des objets proches de la Terre pour une date donnee.
- Informations principales : nom, date d'approche, vitesse, distance, danger potentiel.
- Etats `loading`, erreur et vide geres de facon explicite.

### DONKI (Space Weather)

- Consultation d'evenements recents de meteo spatiale NASA sur une plage courte.
- Normalisation front des donnees heterogenes pour un rendu lisible.
- Affichage d'un resume court et d'un lien NASA (`Voir plus`) quand disponible.

### Favoris

- Ajout/suppression d'elements en favoris via icone etoile (vide/pleine).
- Stockage local persistant avec synchronisation entre ecrans.

### Historique

- Historique de consultation des contenus.
- Actions rapides depuis l'historique (dont ajout en favoris selon le type).

## Stack technique

### Runtime et framework

| Technologie | Version | Role |
| --- | --- | --- |
| Expo | 54.0.20 | Tooling et runtime React Native |
| React Native | 0.81.5 | Framework mobile cross-platform |
| React | 19.1.0 | Moteur de rendu |
| TypeScript | 5.9.2 | Typage statique |

### Navigation

| Bibliotheque | Role |
| --- | --- |
| @react-navigation/native | Conteneur de navigation |
| @react-navigation/bottom-tabs | Navigation par onglets |
| @react-navigation/native-stack | Navigation stack (support projet) |
| react-native-screens | Optimisation native des ecrans |
| react-native-safe-area-context | Gestion des safe areas |

### Donnees et stockage

| Bibliotheque | Role |
| --- | --- |
| fetch API | Appels HTTP NASA |
| @react-native-async-storage/async-storage | Persistance locale |

### UI

| Bibliotheque | Role |
| --- | --- |
| @expo/vector-icons | Iconographie onglets/actions |
| @react-native-community/datetimepicker | Selection de date native |
| expo-splash-screen | Controle du splash au demarrage |

### APIs NASA integrees

| API | Endpoint principal | Usage |
| --- | --- | --- |
| APOD | `/planetary/apod` | Image du jour |
| NeoWs Feed | `/neo/rest/v1/feed` | Objets proches de la Terre |
| DONKI | `/DONKI/{type}` | Evenements de meteo spatiale (FLR, CME, GST, etc.) |

## Architecture globale

```text
SpaceExplorer/
├── App.tsx
├── app.json
├── assets/
└── src/
    ├── config.ts
    ├── hooks/
    │   ├── useFavorites.tsx
    │   └── useHistory.ts
    ├── navigation/
    │   └── AppNavigation.tsx
    ├── screens/
    │   ├── HomeScreen.tsx
    │   ├── APODScreen.tsx
    │   ├── NeoWsScreen.tsx
    │   ├── DONKIScreen.tsx
    │   ├── FavoritesScreen.tsx
    │   ├── HistoryScreen.tsx
    │   └── AboutScreen.tsx
    ├── services/
    │   └── nasa.ts
    ├── types/
    │   ├── errors.ts
    │   └── storage.ts
    └── ui/
        ├── theme.ts
        └── components/
```

Principes d'organisation :

- `services/` : encapsulation des appels NASA et normalisation des donnees.
- `screens/` : orchestration des cas d'usage et rendu des etats UI.
- `ui/components/` : design system reutilisable (`Screen`, `Card`, `Title`, `PrimaryButton`, `Loader`).
- `hooks/` : logique transverse de persistance (`favoris`, `historique`).

## Installation et lancement

Prerequis :

- Node.js 18+
- npm
- Expo Go (test mobile)

Installation :

```bash
git clone <url-du-repo>
cd SpaceExplorer
npm install
```

Lancement :

```bash
npm start
npm run android
npm run ios
npm run web
```

## Configuration

Configurer la cle API NASA dans `src/config.ts` :

```ts
export const NASA_API_KEY = "VOTRE_CLE_API";
```

Reference : https://api.nasa.gov/

## Axes d'amelioration

- Ajouter des tests unitaires et d'integration (services + ecrans critiques).
- Renforcer le cache local et la strategie hors-ligne.
- Ajouter une meilleure vulgarisation des evenements DONKI selon leur type.
- Introduire une telemetrie UX (temps de chargement, taux d'erreur API).
- Preparer une industrialisation CI/CD (lint, type-check, build Expo).

## Auteur

Florentin Portets  
Etudiant Master - Ynov Campus

