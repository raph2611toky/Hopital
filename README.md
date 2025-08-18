# 1) Modèle RDP de l’hôpital (structure initiale)

## Ressources (places bornées, capacité = nb de jetons max)

* `Medecins_Generaux_libres` (4)
* `SagesFemmes_libres` (6)
* `Stagiaires_Generaux_libres` (7)
* `Stagiaires_SF_libres` (8)
* `Chirurgiens_libres` (3)  *(peuvent aussi faire des consults générales)*
* `Bureaux_Consultation_libres` (4)
* `Salles_Operation_libres` (2)
* `Salles_Maternite_libres` (4 salles × capacité 3 femmes → voir plus bas)
* `File_Attente_Consultation` (non bornée ou avec seuil d’alerte)
* `File_Attente_Maternite` (non bornée, priorités possible)
* `Patients_en_Consultation` (comptage)
* `Patients_en_Travail_Maternite` (comptage)
* `Patients_en_PreOp` / `Patients_en_PostOp` (option chirurgie)
* `Patients_Sortis` (puits)

> Places = états, transitions = événements, arcs relient places ↔ transitions, marquage = jetons. Franchissement possible s’il y a assez de jetons en entrée (pondérations).&#x20;

## Capacités particulières

* **Maternité** : modéliser chaque salle séparément, p.ex. `SalleMat_1_libre(3)`, … `SalleMat_4_libre(3)` pour représenter **3 femmes max par salle** via poids d’arc & capacité de place. (RDP généralisé avec arcs pondérés. )
* **Bureaux** : 4 bureaux libèrent/occupent un jeton par consultation.

## Flux patients (transitions principales)

* `Arrivee_Patient` → ajoute un jeton à `File_Attente_Consultation` (source).&#x20;
* `Debut_Consultation` (pré-conditions) :

  * 1 jeton depuis `File_Attente_Consultation`
  * * 1 jeton `Bureaux_Consultation_libres`
  * * 1 jeton d’un **professionnel** autorisé (choix priorisé : `Medecins_Generaux_libres` ; sinon `Chirurgiens_libres` si dispo ; option : `Stagiaires_Generaux_libres` sous supervision)
      → sorties : `Patients_en_Consultation`, `Bureaux_Consultation_occupes`, ressource pro occupée
* `Fin_Consultation` → libère le pro + bureau, route le patient :

  * 70% → `Patients_Sortis`
  * 30% → `File_Attente_Maternite` ou `Patients_en_PreOp` selon motif
* **Maternité**

  * `Debut_PriseEnCharge_Maternite` : consomme 1 femme de `File_Attente_Maternite` + 1 **Sage-femme** + **1 place** dans une salle (pondération=1 mais **capacité** de la place salle=3)
  * `Fin_PriseEnCharge` : libère SF + slot de salle → `Patients_Sortis` (mère et bébé)
* **Chirurgie**

  * `Debut_Operation` : 1 patient `Patients_en_PreOp` + 1 `Chirurgiens_libres` + 1 `Salles_Operation_libres` (+ option : 1 `Sage-femme` si obstétrique)
  * `Fin_Operation` : ressources libérées → `Patients_en_PostOp` → `Sortie`

## Règles jour/nuit & gardes (contraintes dynamiques)

* **Plages horaires** (transitions temporisées) :

  * `Debut_Jour` / `Debut_Nuit` modifient **la disponibilité** (jetons) dans les places de ressources.
* **Stagiaires de garde** :

  * Nuit : `Activation_Stagiaires_Nuit` déplace jetons de `Stagiaires_*_libres` → `Stagiaires_*_en_Garde` (places dédiées)
  * Jour : `Relais_Stagiaires` inverse le mouvement.
* **Max 12h de garde/stagiaire/jour** :

  * Implémenter via **compteur par stagiaire** (tokens de “crédit d’heures”) :

    * Place `Heures_Garde_Stagiaire` initialisée à 12 jetons par stagiaire → chaque `Prise_Post_Nuit` consomme un jeton/heure ; `Reset_Quotidien` (à `Debut_Jour`) remet à 12. (Arcs pondérés et transition “minuit”/“début jour”.)&#x20;

## Conflits, priorités, urgences

* **Urgence Maternité** : file `File_Urgences_Maternite` avec priorité → transitions `Debut_PriseEnCharge_Urgence` compétitives mais **prioritaires** (politique de tir).
* **Chirurgiens polyvalents** : choix conflictuel entre `Debut_Consultation` et `Debut_Operation` géré par **priorité** ou **garde d’ordonnancement** (place “Politique\_Allocation\_Chirurgiens”).

---

# 2) Règles d’édition (ce que doit permettre ton éditeur visuel)

## Éléments éditables

* **Places** : nom, capacité (bornage), jetons initiaux, type (ressource, file, état patient), visibilité.
* **Transitions** : nom, type (instantanée / temporisée), distribution de temps (durée moyenne consultation, accouchement, opération), priorité.
* **Arcs** : sens, **poids** (RDP généralisé), **inhibiteur** (pour empêcher franchissement si seuil atteint), **reset** (pour “vider” une place sur un événement rare).&#x20;
* **Paramètres de scénario** : taux d’arrivées, calendrier jour/nuit, pourcentages de routage, limites (p. ex. longueur max de file).

## Interactions UI indispensables

* Drag & drop places/transitions, **édition inline** des libellés/poids.
* Panneau de propriétés (capacité, jetons initiaux, distribution de temps, priorité).
* **Duplication** de sous-réseaux (ex. cloner une salle de maternité).
* **Couches** (layers) : Consultation / Maternité / Chirurgie / Gardes / Règles horaires.
* **Mode simulation** :

  * Play/Pause/Step, **visualisation des jetons en temps réel**, mise en surbrillance des transitions franchissables (condition de tir).&#x20;
  * Graphiques intégrés : occupation ressources, temps d’attente, longueur de file.
* **Validation** :

  * Alerte si une place dépasse sa capacité, si un stagiaire excède 12h, si une salle maternité dépasse 3 femmes.
  * Vérif. **vivacité** (pas de deadlock global), **concurrence** (consultations et maternité en parallèle), **bornitude** (aucune place critique non bornée).&#x20;
* **Export** : image PNG/SVG du graphe, export/import **JSON** du modèle (pour partager/relire un scénario).

---

# 3) Paramétrage concret de départ (marquage initial)

* `Medecins_Generaux_libres = 4`
* `SagesFemmes_libres = 6`
* `Stagiaires_Generaux_libres = 7`
* `Stagiaires_SF_libres = 8`
* `Chirurgiens_libres = 3`
* `Bureaux_Consultation_libres = 4`
* `Salles_Operation_libres = 2`
* `SalleMat_1_libre = 3`, `SalleMat_2_libre = 3`, `SalleMat_3_libre = 3`, `SalleMat_4_libre = 3`
* Files d’attente = 0 (au démarrage nominal)
* Compteurs d’heures stagiaires : `Heures_Garde_Stagiaire = 12` **par stagiaire** (modélisés par sous-places ou par couleur de jeton si tu utilises des jetons colorés).

---

# 4) Contraintes & gardes (implémentation RDP)

* **Capacités** : places bornées (ex. `SalleMat_i_libre` bornée à 3).
* **Inhibiteurs** : interdire `Debut_PriseEnCharge_Maternite` si `SalleMat_i_libre = 0`.
* **Priorités** : `Debut_Operation` > `Debut_Consultation` quand `Patients_en_PreOp` > 0.
* **Arcs pondérés** : consommer **1 bureau + 1 pro** par consultation ; consommer **1 SF + 1 slot de salle** par prise en charge maternité.&#x20;
* **Transitions temporisées** : durées (consultation, accouchement, opération, post-op), `Debut_Jour`/`Debut_Nuit`, `Reset_Quotidien`.

---

# 5) Plan de réalisation & livrables (sans code, opérationnel)

1. **Cartographie** (D1)

   * Lister toutes les places/transitions/arcs + capacités/poids.
   * Schéma v1 (Consultation, Maternité, Chirurgie, Gardes).

2. **Règles** (D2)

   * Traduire horaires, 12h stagiaire, priorités, urgences en **arcs/places de contrôle**.
   * Définir distributions de temps & taux d’arrivée.

3. **Éditeur** (D3)

   * Fonctions d’édition (création/suppression/renommage, drag\&drop, propriétés).
   * Mode simulation (affichage jetons, transitions franchissables, métriques).

4. **Scénarios** (D4)

   * `Nominal`, `Nuit`, `Afflux_Maternité`, `Bloc_Op_saturé`, `Sous-effectif_Jour`.
   * Pour chacun : paramètres + KPIs attendus.

5. **Vérification** (D5)

   * Vivacité, concurrence, bornitude, non-saturation (tests auto).&#x20;

6. **Export visuels** (D6)

   * Images haute résolution du graphe (global + par couche).
   * Rapport avec KPIs & captures (avant/après).

---

### Construction du réseau de Petri pour le scénario 1

Nous allons construire un réseau de Petri basé sur votre scénario hospitalier avec les éléments spécifiés : P1, P2, P3, P4, P5, et les transitions T1, T2, T3. Voici une description détaillée du réseau, y compris les équivalences, directions, poids des arcs, et une explication.

#### Éléments du réseau
- **Places** :
  - **P1 : File d'attente** (5 jetons initiaux) : Représente les patients attendant l'admission.
  - **P2 : Patients admis** (capacité 3, 0 jeton initial) : Représente les patients en cours de traitement, limitée à 3 pour simuler une capacité d'accueil.
  - **P3 : Lits disponibles** (3 jetons initiaux) : Représente les lits libres dans l'hôpital.
  - **P4 : Patients sortis** (0 jeton initial) : Représente les patients ayant terminé leur traitement.
  - **P5 : Nouveaux patients** (0 jeton initial) : Représente l'arrivée de nouveaux patients pour réapprovisionner P1.

- **Transitions** :
  - **T1 : Admission** : Déplace un patient de P1 à P2 si un lit est disponible (P3).
  - **T2 : Traitement et sortie** : Déplace un patient de P2 à P4 et libère un lit dans P3.
  - **T3 : Arrivée de nouveaux patients** : Ajoute un nouveau patient à P1 toutes les 5 secondes (lié à P5).

#### Connexions et arcs
- **Arcs entrants et sortants** :
  - **P1 → T1** : Poids = 1 (1 patient requis pour l'admission).
  - **P3 → T1** : Poids = 1 (1 lit requis pour l'admission).
  - **T1 → P2** : Poids = 1 (1 patient admis).
  - **T1 → P3** : Poids = -1 (1 lit consommé, mais reste géré par la logique pour éviter une diminution réelle).
  - **P2 → T2** : Poids = 1 (1 patient en traitement requis).
  - **T2 → P4** : Poids = 1 (1 patient sorti).
  - **T2 → P3** : Poids = 1 (1 lit libéré).
  - **P5 → T3** : Poids = 1 (1 nouveau patient disponible).
  - **T3 → P1** : Poids = 1 (1 patient ajouté à la file d'attente).

- **Optionnel : Arc inhibiteur** :
  - Pour ajouter une contrainte (ex. : bloquer T1 si P2 est plein), vous pouvez ajouter un arc inhibiteur **P2 → T1** avec `is_inhibitor=true`. Cela empêchera une nouvelle admission si P2 a 3 jetons.

#### Explication du flux
- **Début** : P1 a 5 jetons, P3 a 3 jetons, P2 et P4 sont vides. P5 commence à 0 mais sera utilisé par T3.
- **T1 (Admission)** : Tant que P1 ≥ 1 et P3 ≥ 1, T1 peut être tirée, déplaçant 1 jeton de P1 à P2 et "consommant" 1 lit (logiquement, P3 reste à 3 jusqu'à T2). P2 est limité à 3, donc T1 s'arrête si P2 atteint sa capacité.
- **T2 (Traitement et sortie)** : Quand P2 ≥ 1, T2 peut être tirée, déplaçant 1 jeton de P2 à P4 et ajoutant 1 jeton à P3 (libérant un lit).
- **T3 (Arrivée)** : Toutes les 5 secondes, T3 tire automatiquement (si implémenté), prenant 1 jeton de P5 (qui doit être réapprovisionné, par exemple via une logique externe) et ajoutant 1 jeton à P1. Si P5 reste à 0 sans réapprovisionnement, T3 ne fonctionnera pas sauf si vous simulez une arrivée continue.

#### Équivalences et directions
- **P1 (File d'attente)** équivaut à l'état initial des patients en attente.
- **P2 (Patients admis)** équivaut à l'état des patients en traitement, avec une limite physique.
- **P3 (Lits disponibles)** équivaut à une ressource partagée, diminuant logiquement avec T1 et augmentant avec T2.
- **P4 (Patients sortis)** équivaut à l'état final des patients traités.
- **P5 (Nouveaux patients)** équivaut à une source externe de patients, activée par T3.
- **T1** dirige le flux de P1 et P3 vers P2, modélisant l'admission.
- **T2** dirige le flux de P2 vers P4 et P3, modélisant la sortie et la libération des lits.
- **T3** dirige le flux de P5 vers P1, simulant l'arrivée continue.

#### Poids des arcs
- P1 → T1 : 1
- P3 → T1 : 1
- T1 → P2 : 1
- T1 → P3 : -1 (logique, pas une diminution réelle)
- P2 → T2 : 1
- T2 → P4 : 1
- T2 → P3 : 1
- P5 → T3 : 1
- T3 → P1 : 1

#### Implémentation dans votre système
- Dans `PetriEditor.jsx`, configurez les places avec leurs jetons initiaux et capacités via `addPlace` ou `handleThemeLoad`.
- Ajoutez les transitions avec `addTransition` et connectez-les via le mode connexion pour créer les arcs avec les poids spécifiés.
- Implémentez T3 avec une logique dans `playSimulation` : toutes les 5 secondes, vérifiez si P5 a un jeton (ou simulez-en un), tirez T3, et mettez à jour P1.

---

### Scénario étendu (autre possibilité)

Pour enrichir le réseau, ajoutons un scénario plus complexe avec une gestion des urgences :
- **P6 : Urgences** (0 jeton initial, capacité 2) : Patients en urgence.
- **T4 : Traitement urgence** : Déplace un patient de P6 à P4, prioritaire sur T2.
- **Arcs** :
  - P1 → T4 : Poids = 1 (patient urgent de la file).
  - T4 → P6 : Poids = 1 (patient en urgence).
  - P6 → T4 : Poids = 1 (patient en traitement urgence).
  - T4 → P4 : Poids = 1 (patient sorti après urgence).

- **Règle** : Ajoutez un arc inhibiteur **P6 → T1** (`is_inhibitor=true`) pour bloquer les admissions normales si une urgence est en cours (P6 ≥ 1).
- **Flux** : Si un jeton est dirigé vers P6 (via une logique externe ou T4), T1 est bloquée jusqu'à ce que P6 soit vide.

#### Équivalences et directions
- **P6** équivaut à l'état des urgences en cours.
- **T4** dirige le flux de P1 vers P6, puis P6 vers P4, avec priorité.

#### Poids des arcs supplémentaires
- P1 → T4 : 1
- T4 → P6 : 1
- P6 → T4 : 1
- T4 → P4 : 1
- P6 → T1 : 0 (inhibiteur, pas de poids).

---

### Explication supplémentaire
- **Dynamique** : Le réseau simule un hôpital où les patients arrivent (P1), sont admis (P2) si des lits (P3) sont disponibles, traités et sortis (P4), avec des arrivées continues (P5, T3) et une gestion des urgences (P6, T4). L'arc inhibiteur sur T1 protège contre la surcharge en cas d'urgence.
- **Blocage** : Sans P5 ou T3, P1 s'épuise, arrêtant T1. Avec P6 plein et l'inhibiteur, T1 est bloquée jusqu'à résolution.
- **Visualisation** : Dans `Place.jsx`, animez les jetons de P1 à P2 avec un effet de déplacement. Dans `Transition.jsx`, surlignez T1 et T4 quand activés (`.enabled`). Dans `Arc.jsx`, animez les arcs avec `stroke-dashoffset`.

---
---

### Objectif

Ce document fournit un guide détaillé pour concevoir un réseau de Petri complexe basé sur un scénario hospitalier enrichi, intégrant des arcs inhibiteurs et réinitialisateurs, ainsi que des données supplémentaires pour un scénario complet. Le réseau inclura des places, des transitions, des arcs avec des directions spécifiques (haut, gauche, droite, bas), des poids, et des comportements dynamiques tels que des délais et des priorités. Ce réseau sera construit à partir des éléments initiaux fournis (P1, P2, P3, P4, P5, T1, T2, T3) et étendu pour refléter un système hospitalier plus réaliste, tout en respectant les modifications récentes (directions des arcs, points de contrôle curvilignes).

---

### Scénario 2 détaillé : Gestion hospitalière complexe

#### Contexte
L'objectif est de modéliser un hôpital avec une gestion avancée des patients, des ressources, et des processus. Le réseau inclut des files d'attente, des traitements, des lits, des interruptions, et des réinitialisations, avec des arcs inhibiteurs pour gérer les contraintes et des arcs réinitialisateurs pour réorganiser les flux en cas d'urgence.

#### Éléments du réseau

##### Places
- **P1 : File d'attente initiale** (5 jetons initiaux) : Patients attendant l'admission.
- **P2 : Patients admis** (capacité 3, 0 jeton initial) : Patients en cours de traitement, limitée à 3.
- **P3 : Lits disponibles** (3 jetons initiaux) : Lits libres dans l'unité.
- **P4 : Patients sortis** (0 jeton initial) : Patients ayant terminé leur traitement.
- **P5 : Nouveaux patients** (0 jeton initial) : Arrivée de nouveaux patients pour réapprovisionner P1.
- **P6 : Urgences** (0 jeton initial, capacité 2) : Patients nécessitant une admission prioritaire.
- **P7 : Salle d'opération** (1 jeton initial) : Ressource pour les chirurgies.
- **P8 : Patients en chirurgie** (0 jeton initial, capacité 1) : Patients en cours d'opération.
- **P9 : Patients réadmis** (0 jeton initial) : Patients retournant en traitement après une réinitialisation.

##### Transitions
- **T1 : Admission standard** : Déplace un patient de P1 à P2 si un lit est disponible (P3) et sans urgence en cours.
- **T2 : Traitement et sortie** : Déplace un patient de P2 à P4 et libère un lit dans P3.
- **T3 : Arrivée de nouveaux patients** : Ajoute un patient de P5 à P1 toutes les 5 secondes.
- **T4 : Admission d'urgence** : Déplace un patient de P6 à P2, prioritaire sur T1, avec un lit requis.
- **T5 : Préparation chirurgie** : Déplace un patient de P2 à P8 si la salle d'opération (P7) est libre.
- **T6 : Chirurgie terminée** : Déplace un patient de P8 à P4 et libère P7.
- **T7 : Réinitialisation d'urgence** : Réinitialise P2 et P3 en cas de surcharge, redirigeant les patients vers P9.

#### Connexions et arcs
##### Arcs standards
- **P1 → T1** : Poids = 1, Direction = BAS (sortie), Entrée = HAUT (T1).
- **P3 → T1** : Poids = 1, Direction = BAS, Entrée = HAUT.
- **T1 → P2** : Poids = 1, Direction = HAUT (sortie T1), Entrée = HAUT.
- **T1 → P3** : Poids = -1 (logique, pas de jeton réel consommé), Direction = HAUT, Entrée = HAUT.
- **P2 → T2** : Poids = 1, Direction = BAS, Entrée = HAUT.
- **T2 → P4** : Poids = 1, Direction = HAUT, Entrée = HAUT.
- **T2 → P3** : Poids = 1, Direction = HAUT, Entrée = HAUT.
- **P5 → T3** : Poids = 1, Direction = BAS, Entrée = HAUT.
- **T3 → P1** : Poids = 1, Direction = HAUT, Entrée = HAUT.
- **P6 → T4** : Poids = 1, Direction = BAS, Entrée = HAUT.
- **P3 → T4** : Poids = 1, Direction = BAS, Entrée = HAUT.
- **T4 → P2** : Poids = 1, Direction = HAUT, Entrée = HAUT.
- **P2 → T5** : Poids = 1, Direction = BAS, Entrée = HAUT.
- **P7 → T5** : Poids = 1, Direction = BAS, Entrée = HAUT.
- **T5 → P8** : Poids = 1, Direction = HAUT, Entrée = HAUT.
- **P8 → T6** : Poids = 1, Direction = BAS, Entrée = HAUT.
- **T6 → P4** : Poids = 1, Direction = HAUT, Entrée = HAUT.
- **T6 → P7** : Poids = 1, Direction = HAUT, Entrée = HAUT.
- **P2 → T7** : Poids = 1, Direction = BAS, Entrée = HAUT (arc réinitialisateur).
- **T7 → P9** : Poids = 1, Direction = HAUT, Entrée = HAUT.

##### Arc inhibiteur
- **P6 → T1** : Poids = 1, Direction = BAS, Type = Inhibiteur. Cet arc empêche T1 (admission standard) de se déclencher si une urgence (P6 > 0) est en cours.

##### Arc réinitialisateur
- **P2 → T7** : Poids = 1, Direction = BAS, Type = Réinitialisateur. Cet arc vide complètement P2 (patients admis) et redirige les patients vers P9 en cas de surcharge ou d'urgence critique.

#### Paramètres supplémentaires
- **Délais** :
  - T1 : Délai moyen = 2 secondes.
  - T2 : Délai moyen = 5 secondes.
  - T3 : Délai fixe = 5 secondes.
  - T4 : Délai moyen = 1 seconde (priorité).
  - T5 : Délai moyen = 3 secondes.
  - T6 : Délai moyen = 4 secondes.
  - T7 : Délai moyen = 1 seconde (urgence).
- **Priorités** :
  - T4 (admission d'urgence) : Priorité = 2.
  - T1, T2, T3, T5, T6, T7 : Priorité = 1.
- **Capacités** :
  - P2 : Capacité = 3.
  - P6 : Capacité = 2.
  - P8 : Capacité = 1.
  - Autres : Illimitées sauf indication contraire.

#### Comportement attendu
- **Flux normal** : Les patients de P1 sont admis via T1 si P3 > 0 et P6 = 0, traités via T2, et sortent via P4. P5 réapprovisionne P1 via T3.
- **Urgence** : Si P6 > 0, T4 prend le dessus sur T1, utilisant un lit de P3.
- **Chirurgie** : Si P7 > 0, T5 envoie un patient de P2 à P8, et T6 le ramène à P4.
- **Réinitialisation** : Si P2 atteint sa capacité (3) et une condition d'urgence est détectée (ex. : P6 plein), T7 réinitialise P2 et redirige vers P9.

---

### Instructions pour implémenter le réseau dans l'application

#### Configuration initiale
- Créez les places P1 (5 jetons), P2 (0, capacité 3), P3 (3 jetons), P4 (0), P5 (0), P6 (0, capacité 2), P7 (1 jeton), P8 (0, capacité 1), et P9 (0) via le menu contextuel.
- Ajoutez les transitions T1, T2, T3, T4, T5, T6, et T7 avec leurs labels et orientations (par défaut portrait).
- Connectez les arcs avec les poids, directions, et types spécifiés :
  - Utilisez le mode connexion pour lier les places et transitions.
  - Ajoutez l'arc inhibiteur P6 → T1 via le menu contextuel (option "Arc inhibiteur").
  - Ajoutez l'arc réinitialisateur P2 → T7 via le menu contextuel (option "Arc de remise à zéro").

#### Ajustements visuels
- Définissez les directions des arcs (ex. : P1 → T1 : BAS, T1 → P2 : HAUT) via le menu contextuel.
- Ajustez les points de contrôle (25 %, 50 %, 75 %) pour éviter les superpositions, notamment pour les arcs inhibiteurs et réinitialisateurs.

#### Simulation
- Lancez la simulation avec "Play" pour observer le flux normal (T1, T2, T3).
- Ajoutez des jetons dans P6 pour déclencher T4 et tester l'inhibiteur sur T1.
- Remplissez P2 (3 jetons) et activez T7 pour tester la réinitialisation vers P9.
- Utilisez "Step" pour valider chaque transition individuellement.

#### Validation
- Vérifiez que `validation.deadlock` se met à jour correctement (ex. : si P3 = 0 et P6 plein).
- Assurez-vous que les capacités (P2, P6, P8) sont respectées.

---