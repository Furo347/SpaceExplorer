# 🚀 SpaceExplorer

**Application mobile d'exploration spatiale utilisant les APIs publiques de la NASA**

---

## 📋 Description

SpaceExplorer est une application mobile développée avec **Expo** et **React Native** permettant d'explorer l'univers à travers les données publiques de la NASA. L'application offre un accès simplifié aux images astronomiques, aux photographies des rovers martiens et aux vues de la Terre depuis l'espace.

### Objectifs

- **Pédagogique** : Mise en pratique des concepts React Native, gestion d'état, appels API REST, navigation et persistance des données
- **Fonctionnel** : Fournir une interface intuitive pour consulter et sauvegarder des contenus issus des APIs NASA

---

## 🎓 Contexte du projet

Ce projet a été réalisé dans le cadre d'un cursus de **Master** à **Ynov Campus**. Il s'inscrit dans une démarche d'apprentissage des technologies mobiles cross-platform et de l'intégration d'APIs publiques.

L'application exploite les **NASA Open APIs**, un ensemble d'APIs RESTful gratuites donnant accès à une vaste collection de données spatiales : images astronomiques, photographies martiennes, observations terrestres, etc.

---

## ✨ Fonctionnalités principales

### 🖼️ APOD (Astronomy Picture of the Day)
- Consultation de l'image astronomique du jour sélectionnée par la NASA
- Navigation par date (depuis le 16 juin 1995)
- Affichage du titre, de l'explication scientifique et de l'image haute résolution
- Gestion des contenus vidéo (YouTube) avec indication appropriée

### 🔴 Mars Rover Photos
- Exploration des photographies prises par les rovers martiens :
  - **Curiosity** (actif depuis 2012)
  - **Opportunity** (2004-2019)
  - **Spirit** (2004-2010)
- Sélection par date avec plages adaptées à chaque rover
- Affichage des métadonnées : caméra utilisée, date terrestre, statut du rover

### 🌍 EPIC (Earth Polychromatic Imaging Camera)
- Visualisation des images de la Terre capturées par le satellite DSCOVR
- Images en couleurs naturelles depuis le point de Lagrange L1
- Métadonnées géographiques (coordonnées du centroïde)
- Récupération automatique des dates disponibles

### ❤️ Favoris
- Sauvegarde locale des images préférées
- Organisation par source (APOD, Mars, EPIC)
- Suppression individuelle ou globale
- Persistance entre les sessions

### 📜 Historique
- Suivi automatique des images consultées
- Horodatage des consultations
- Possibilité d'ajouter aux favoris depuis l'historique
- Effacement de l'historique

---

## 🛠️ Stack technique

### Framework & Runtime
| Technologie | Version | Rôle |
|-------------|---------|------|
| **Expo** | 54.0.20 | Framework de développement React Native |
| **React Native** | 0.81.5 | Framework UI mobile cross-platform |
| **React** | 19.1.0 | Bibliothèque UI |
| **TypeScript** | 5.9.2 | Typage statique |

### Navigation
| Bibliothèque | Rôle |
|--------------|------|
| **@react-navigation/native** | Core de navigation |
| **@react-navigation/bottom-tabs** | Navigation par onglets |
| **react-native-screens** | Optimisation des écrans natifs |
| **react-native-safe-area-context** | Gestion des zones sécurisées |

### Stockage & Données
| Bibliothèque | Rôle |
|--------------|------|
| **@react-native-async-storage/async-storage** | Persistance locale (favoris, historique) |
| **axios** | Client HTTP (disponible) |
| **fetch API** | Appels REST vers les APIs NASA |

### UI & Composants
| Bibliothèque | Rôle |
|--------------|------|
| **@expo/vector-icons (Ionicons)** | Icônes vectorielles |
| **@react-native-community/datetimepicker** | Sélecteur de date natif |

### APIs externes
| API | Endpoint | Description |
|-----|----------|-------------|
| **NASA APOD** | `/planetary/apod` | Image astronomique du jour |
| **NASA Mars Rover Photos** | `/mars-photos/api/v1/rovers/{rover}/photos` | Photos des rovers |
| **NASA EPIC** | `/EPIC/api/natural/date/{date}` | Images de la Terre |

---

## 📁 Architecture du projet

```
SpaceExplorer/
├── App.tsx                    # Point d'entrée de l'application
├── index.js                   # Enregistrement du composant racine
├── app.json                   # Configuration Expo
├── package.json               # Dépendances et scripts
├── tsconfig.json              # Configuration TypeScript
│
├── assets/                    # Ressources statiques
│   ├── icon.png
│   ├── splash-icon.png
│   └── ...
│
└── src/
    ├── config.ts              # Configuration (clé API)
    │
    ├── hooks/                 # Hooks personnalisés
    │   ├── useFavorites.ts    # Gestion des favoris
    │   └── useHistory.ts      # Gestion de l'historique
    │
    ├── navigation/
    │   └── AppNavigation.tsx  # Configuration de la navigation
    │
    ├── screens/               # Écrans de l'application
    │   ├── HomeScreen.tsx     # Accueil
    │   ├── APODScreen.tsx     # Image du jour
    │   ├── MarsScreen.tsx     # Photos Mars
    │   ├── EPICScreen.tsx     # Images Terre
    │   ├── FavoritesScreen.tsx
    │   ├── HistoryScreen.tsx
    │   └── AboutScreen.tsx
    │
    ├── services/
    │   └── nasa.ts            # Appels API NASA centralisés
    │
    ├── types/
    │   ├── storage.ts         # Types pour le stockage
    │   └── errors.ts          # Types d'erreurs API
    │
    └── ui/
        ├── theme.ts           # Design system (couleurs, espacements)
        └── components/        # Composants réutilisables
            ├── Screen.tsx
            ├── Card.tsx
            ├── Title.tsx
            ├── PrimaryButton.tsx
            ├── Loader.tsx
            ├── FavoriteButton.tsx
            ├── ErrorDisplay.tsx
            └── OptimizedImage.tsx
```

### Organisation logique

| Couche | Responsabilité |
|--------|----------------|
| **screens/** | Logique métier et composition des vues |
| **ui/components/** | Composants UI réutilisables (design system) |
| **services/** | Abstraction des appels API |
| **hooks/** | Logique réutilisable avec état (favoris, historique) |
| **types/** | Définitions TypeScript partagées |

---

## 🚀 Installation et lancement

### Prérequis

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Expo CLI** (installé globalement ou via npx)
- **Expo Go** sur appareil mobile (iOS/Android) pour le test

### Installation

```bash
# Cloner le repository
git clone <url-du-repository>
cd SpaceExplorer

# Installer les dépendances
npm install
```

### Lancement

```bash
# Démarrer le serveur de développement Expo
npm start
# ou
npx expo start
```

Options de lancement :
- **`npm run android`** : Lancer sur émulateur/appareil Android
- **`npm run ios`** : Lancer sur simulateur/appareil iOS (macOS requis)
- **`npm run web`** : Lancer dans le navigateur

### Scanner le QR Code

Une fois le serveur démarré, scanner le QR code affiché dans le terminal avec l'application **Expo Go** pour tester sur un appareil physique.

---

## 🔧 Configuration

### Clé API NASA

L'application utilise une clé API NASA configurée dans `src/config.ts`. Pour obtenir votre propre clé :

1. Rendez-vous sur [https://api.nasa.gov/](https://api.nasa.gov/)
2. Remplissez le formulaire d'inscription
3. Récupérez votre clé API
4. Remplacez la valeur dans `src/config.ts`

```typescript
export const NASA_API_KEY = "VOTRE_CLE_API";
```

> **Note** : La clé `DEMO_KEY` peut être utilisée pour des tests limités (30 requêtes/heure).

---

## 📈 Axes d'amélioration

### Fonctionnalités
- [ ] Recherche d'images par mots-clés (NASA Image Library)
- [ ] Notifications pour l'APOD du jour
- [ ] Partage d'images sur les réseaux sociaux
- [ ] Mode hors-ligne avec cache d'images
- [ ] Widget pour l'écran d'accueil

### Technique
- [ ] Mise en cache des réponses API (React Query / SWR)
- [ ] Tests unitaires et d'intégration
- [ ] Pagination infinie pour les listes d'images
- [ ] Animations et transitions (Reanimated)
- [ ] Support du mode sombre/clair dynamique

### UX/UI
- [ ] Zoom et galerie d'images plein écran
- [ ] Filtres par caméra pour Mars Rover
- [ ] Calendrier visuel pour la sélection de dates
- [ ] Skeleton loaders pour un meilleur feedback

---

## 👤 Auteur

**Florentin Portets**  
Étudiant en Master - Ynov Campus  
Développeur Full Stack

---

## 📄 Licence

Ce projet est réalisé dans un cadre académique. Les données utilisées proviennent des [NASA Open APIs](https://api.nasa.gov/) et sont soumises à leurs conditions d'utilisation.

---

## 🙏 Remerciements

- **NASA** pour la mise à disposition gratuite de leurs APIs
- **Expo** et la communauté React Native pour l'écosystème de développement
- **Ynov Campus** pour l'encadrement pédagogique

