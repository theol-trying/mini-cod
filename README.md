# Mini Ops: Retro CoD Multiplayer

Mini jeu de tir 3D multijoueur tactique inspiré de la formule culte de Call of Duty, propulsé par une stack légère (**React 19 + Three.js + WebRTC PeerJS**) avec graphismes réalistes retravaillés, 5 cartes équilibrées en 5v5 et un système d'amélioration d'armes dynamique.

---

## 🎨 Refonte Graphique Réaliste

- **Textures PBR Procédurales Haute Définition** (zéro dépendance externe, chargement instantané sans 404) :
  - **Asphalte granuleux & usé** avec fissures, taches d'huile, gravillons et marquages routiers jaunes et blancs.
  - **Dalles de béton industriel** avec chanfreins, joints de dilatation et reflets réalistes.
  - **Conteneurs maritimes en tôle ondulée** avec nervures d'acier en relief, stencils militaires peints et bandes de sécurité biseautées.
  - **Sol terrazzo poli d'aéroport** avec reflets spéculaires et guides de circulation.
  - **Carreaux de terre cuite & marbre veiné** pour la cour de la villa méditerranéenne.
- **Éclairage & Atmosphère Réaliste** :
  - Dôme céleste avec dégradé atmosphérique et brume d'horizon progressive.
  - Disque solaire zénithal avec lueur diffusive.
  - Ombres portées douces (`PCFSoftShadowMap`) avec bias calibré pour éliminer tout effet d'escalier.
  - Post-traitement de mappage tonal cinématographique (`ACESFilmicToneMapping`).
- **Modèles d'Armes Détaillés (Vue FPS)** :
  - Rails Picatinny usinés avec crans individuels.
  - Viseur holographique EOTech / Red Dot avec réticule lumineux rouge au centre du verre.
  - Silencieux et compensateurs à évents de gaz.
  - Gants d'assaut tactiques avec renforts en fibre de carbone sur les phalanges et sangles velcro.
- **Avatars d'Opérateurs 3D Réalistes** :
  - Casques de combat Kevlar avec support NVG et lunettes balistiques.
  - Gilets porte-plaques lourds avec triples poches de chargeurs et antenne radio d'épaule.
  - Brassards d'identification de faction (Bleu Marine pour les Alliés, Rouge Écarlate pour les Ennemis).
  - Étiquettes de noms 3D flottantes au-dessus de la tête.

---

## 🗺️ 5 Cartes Tactiques 100% Équilibrées (5v5)

Toutes les cartes sont conçues selon une **symétrie stricte (miroir ou rotationnelle)** pour garantir qu'aucune des deux équipes (Alliés vs Ennemis) ne dispose du moindre avantage de position, de ligne de tir ou de temps d'accès aux objectifs :

1. **Nuketown 2025 (64m × 44m)** :
   - Symétrie miroir parfaite : Maison Verte (Alliés) vs Maison Jaune (Ennemis) avec étages, fenêtres de snipers et balcons identiques.
   - Centre : Bus scolaire et camion de livraison positionnés en rotation pour offrir les mêmes angles de couverture.
   - Jardins et garages latéraux à distance égale.

2. **Shipment 2025 (48m × 48m)** :
   - Symétrie rotationnelle à 4 quadrants.
   - Piles de conteneurs identiques aux 4 angles.
   - 4 conteneurs traversables au centre formant un carrefour de tir équilibré.
   - Passerelles métalliques surélevées sur les deux flancs.

3. **Rust Refinery (56m × 56m)** :
   - Complexe de raffinage pétrolier désertique.
   - Tour centrale métallique à 3 étages avec rampes d'accès Nord et Sud identiques.
   - 4 silos à carburant cylindriques disposés aux coordonnées $(\pm 14, \pm 14)$.
   - Conduites aériennes et tranchées d'accès symétriques.

4. **Terminal 2025 (62m × 46m)** :
   - Hall d'embarquement d'aéroport international à double aile symétrique.
   - Porte d'embarquement Ouest (Alliés) vs Porte d'embarquement Est (Ennemis).
   - Zone centrale : Rotonde avec doubles carrousels à bagages et panneaux d'affichage des vols.
   - Couloirs latéraux : Boutiques duty-free et portiques de sécurité avec voyants lumineux.

5. **Raid Estate (66m × 48m)** :
   - Somptueuse villa méditerranéenne avec symétrie Nord-Sud.
   - Cour centrale avec piscine romaine en eau turquoise et fontaine en pierre.
   - Villa principale (Nord) vs Villa des invités (Sud) avec terrasses et arcades identiques.
   - Galeries de colonnes de marbre à l'Ouest et garages de luxe à l'Est.

---

## 🎮 Multijoueur, Salons Privés & Armement

- **Salons avec Code Privé** (ex: `COD-4821`) : Rejoignez instantanément vos amis en P2P WebRTC sans latence serveur et 100% gratuitement.
- **Deux Formats de Match** :
  - **Face-à-Face en Équipe (5v5)** : Alliés (Bleu) contre Ennemis (Rouge).
  - **Chacun pour Soi (FFA)** : Tous les tireurs s'affrontent sans distinction d'équipe.
- **Progression & Upgrade d'Armes aux Kills** :
  - *M4A1 Carabine* (0 kill) $\rightarrow$ *MP5 SMG* (2 kills) $\rightarrow$ *Trench 12G* (5 kills) $\rightarrow$ *Barrett .50* (8 kills) $\rightarrow$ *Desert Falcon* (12+ kills).
- **Armes & Caisses de Munitions sur Carte** :
  - Socles rotatifs avec balises lumineuses réapparaissant toutes les 20-25 secondes.
  - Touche **[E]** pour ramasser immédiatement au sol.

---

## ⚡ Déploiement Gratuit sur Cloudflare Pages

Contrairement à Render qui met les serveurs gratuits en veille au bout de 15 minutes, **Cloudflare Pages est 100% gratuit, permanent, sans mise en veille et avec bande passante illimitée**.

### 1. Pousser sur GitHub
```bash
git init
git add .
git commit -m "Mini CoD 5v5 Realistic Graphics & 5 Balanced Maps"
git branch -M main
git remote add origin https://github.com/votre-compte/mini-cod.git
git push -u origin main
```

### 2. Déployer sur Cloudflare Pages
1. Rendez-vous sur [dash.cloudflare.com](https://dash.cloudflare.com) et connectez votre compte.
2. Allez dans **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Choisissez votre dépôt GitHub.
4. Renseignez la configuration de build :
   - **Framework preset** : `Vite`
   - **Build command** : `npm run build`
   - **Build output directory** : `dist`
5. Cliquez sur **Save and Deploy**. Le fichier `wrangler.toml` est déjà préconfiguré à la racine.

---

## ⌨️ Commandes en Jeu
- **Z, Q, S, D** ou **W, A, S, D** : Déplacements (droits, sans inclinaison)
- **Souris** : Visée
- **Clic Gauche** : Tirer
- **Clic Droit** : Viser (ADS / Lunette de sniper)
- **E** : Ramasser une arme au sol / Ouvrir une caisse de ravitaillement
- **Shift** : Sprint tactique
- **Espace** : Sauter
- **C** ou **Ctrl** : S'accroupir
- **R** : Recharger
- **Q** ou **1 / 2** : Changer d'arme
- **V** ou **F** : Attaque au couteau
- **G** : Lancer une grenade à fragmentation
- **TAB** : Tableau des scores
- **Échap** : Menu / Libérer le curseur
