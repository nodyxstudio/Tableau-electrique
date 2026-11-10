# Tableau Malin

Outil web pour concevoir des tableaux électriques résidentiels conformes à la **NF C 15-100**, en glisser-déposer.

- **Glisser-déposer** : un appareil (four, clim, prises…) déposé sur une rangée devient un disjoncteur, avec le bon calibre et la bonne section de câble.
- **Câblage** : un disjoncteur posé à droite d’un interrupteur différentiel est alimenté par le peigne. On peut aussi tirer un fil depuis le rond au-dessus du disjoncteur jusqu’à un différentiel.
- **Contrôle en direct** des règles vérifiées par le Consuel :
  - 30 mA partout, 8 circuits maximum par différentiel ;
  - type A pour la plaque, le lave-linge et la recharge de véhicule ;
  - calibre compatible avec la section du câble ;
  - nombre maximum de prises et de points lumineux par circuit ;
  - nombre minimum de différentiels selon la surface ;
  - 20 % de réserve, repérage des circuits, parafoudre, tableau divisionnaire.
- **Bilan de puissance** : puissance appelée et abonnement conseillé. La clim et la recharge du véhicule sont comptées.
- **Tableaux divisionnaires** : un départ 32 A / 6 mm², 40 A / 10 mm² ou 63 A / 16 mm² à glisser dans le tableau principal. Il se branche sur le câble d’arrivée de l’AGCP (avant les différentiels) ou derrière un différentiel. Le tableau divisionnaire est créé tout seul.
- **Section sur chaque fil** : départs, arrivée et liaisons en fil, en mm².
- **Guide des différentiels AC / A / F / B** selon les appareils (clim, PAC, induction, lave-linge, recharge…).
- **Réglage rapide** : choisir le calibre adapte la section du câble, et inversement. La liste « Circuits » sous le tableau permet de tout modifier d’un coup.
- **« Ranger »** compacte le tableau sans changer tes différentiels. **« Optimiser tout »** répartit tous les circuits selon les règles. Les flèches du clavier déplacent le module sélectionné.
- **Matériel** : gammes Schneider (Resi9) ou Legrand (DX³), liste d’achat selon ton stock.
- **Assistant « Créer depuis mon logement »** : génère un tableau complet et conforme à partir de quelques questions.

> Aide à la conception. Ne remplace ni l’attestation du Consuel ni les notices des fabricants. Les modules sont des illustrations.

- **Manipulation** : toucher un module ouvre une barre Régler / Dupliquer / Supprimer. On peut aussi glisser un module vers la corbeille. Un module lâché entre deux autres s'insère et décale la rangée.

## Utiliser

Ouvrir `index.html` dans un navigateur, avec `regles.js` à côté. Aucune installation, aucun serveur. Le projet est enregistré dans le navigateur.

Pour avoir un lien public : dans GitHub, Settings → Pages → *Deploy from a branch* → `main` / `/ (root)`. Le site est alors servi sur `https://nodyxstudio.github.io/tableau-electrique/`.

## Organisation

| Fichier | Rôle |
|---|---|
| `regles.js` | Règles NF C 15-100 : données (sections, calibres, limites), calculs, rangement automatique, vérification. Pas de DOM. |
| `app.html` | Interface : dessin du tableau, glisser-déposer, panneaux. |
| `tests/regles.test.js` | Tests des règles (Node 18+). |
| `build.sh` | Génère `index.html` (page autonome) à partir de `app.html`. |

```bash
npm test
```

```bash
./build.sh
```
