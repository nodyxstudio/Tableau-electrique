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
- **Tableaux divisionnaires**, chacun avec son départ depuis le tableau principal.
- **Matériel** : gammes Schneider (Resi9) ou Legrand (DX³), liste d’achat selon ton stock.
- **Assistant « Créer depuis mon logement »** : génère un tableau complet et conforme à partir de quelques questions.

> Aide à la conception. Ne remplace ni l’attestation du Consuel ni les notices des fabricants. Les modules sont des illustrations.

## Utiliser

Ouvrir `index.html` dans un navigateur. Aucune installation, aucun serveur. Le projet est enregistré dans le navigateur.

## Développer

Le code source est dans `app.html` (HTML, CSS et JavaScript sans dépendance). Après modification :

```bash
./build.sh
```

Le script régénère `index.html`, la page autonome publiable telle quelle (par exemple sur GitHub Pages).
