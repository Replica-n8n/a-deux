/* =========================================================================
   À deux · le corpus d'idées

   Embarqué dans l'app, en dur. Aucun appel réseau, donc aucune idée périmée
   et aucune page blanche hors ligne.

   ⚠️ TRANCHE 1 : ces dix idées sont un ÉCHANTILLON JETABLE. Elles servent à
   juger le ton et la forme, pas le contenu. Le vrai corpus, une cinquantaine
   d'idées taguées, arrive à la tranche 2 et remplacera ce fichier.

   La forme, elle, est définitive :
     id        identifiant stable, jamais réutilisé
     titre     court, il tient sur une ligne de téléphone
     phrase    une seule phrase, ce qui rend l'idée concrète
     langages  un ou deux, parmi les cinq de coeur.js
     cout      gratuit · petit · moyen
     duree     heure · soiree · journee
     lieu      dedans · dehors

   `COEUR.verifierCorpus` refuse tout ce qui sort de là, sous Node, avant
   qu'une idée mal taguée devienne invisible au filtrage.
   ========================================================================= */

(function (racine) {

  const IDEES = [
    {
      id: 'souper-maison',
      titre: 'Cuisiner ensemble, sans écran',
      phrase: 'Un plat qu’aucun des deux ne sait faire, téléphones dans l’autre pièce.',
      langages: ['moments', 'services'],
      cout: 'petit', duree: 'soiree', lieu: 'dedans'
    },
    {
      id: 'mont-royal-coucher',
      titre: 'Monter voir le soleil se coucher',
      phrase: 'Partir une heure avant, prendre le temps de redescendre à pied.',
      langages: ['moments'],
      cout: 'gratuit', duree: 'heure', lieu: 'dehors'
    },
    {
      id: 'lettre-trois-choses',
      titre: 'Trois choses, écrites à la main',
      phrase: 'Trois choses précises que l’autre a faites ce mois-ci, sur papier.',
      langages: ['paroles'],
      cout: 'gratuit', duree: 'heure', lieu: 'dedans'
    },
    {
      id: 'massage-dos',
      titre: 'Vingt minutes de dos',
      phrase: 'Une minuterie, de l’huile, et personne ne parle.',
      langages: ['toucher'],
      cout: 'gratuit', duree: 'heure', lieu: 'dedans'
    },
    {
      id: 'marche-jean-talon',
      titre: 'Le marché, et rien de prévu',
      phrase: 'Chacun choisit une chose pour l’autre, sans dire pourquoi.',
      langages: ['moments', 'cadeaux'],
      cout: 'petit', duree: 'heure', lieu: 'dehors'
    },
    {
      id: 'patin-vieux-port',
      titre: 'Patiner un soir de semaine',
      phrase: 'Moins de monde qu’en fin de semaine, et un chocolat chaud après.',
      langages: ['moments', 'toucher'],
      cout: 'petit', duree: 'soiree', lieu: 'dehors'
    },
    {
      id: 'corvee-detestee',
      titre: 'Faire la corvée qu’il déteste',
      phrase: 'Celle qu’il repousse depuis trois semaines, faite sans l’annoncer.',
      langages: ['services'],
      cout: 'gratuit', duree: 'heure', lieu: 'dedans'
    },
    {
      id: 'film-repertoire',
      titre: 'Un film que personne n’a choisi',
      phrase: 'Chacun écrit trois titres, on tire au sort, on ne discute pas.',
      langages: ['moments', 'toucher'],
      cout: 'petit', duree: 'soiree', lieu: 'dedans'
    },
    {
      id: 'friperie-cadeau',
      titre: 'Vingt dollars en friperie',
      phrase: 'Une heure, un budget, et il faut revenir avec quelque chose pour l’autre.',
      langages: ['cadeaux'],
      cout: 'petit', duree: 'heure', lieu: 'dehors'
    },
    {
      id: 'journee-sans-plan',
      titre: 'Une journée sans plan',
      phrase: 'Déjeuner tard, marcher au hasard, décider la suite sur place.',
      langages: ['moments'],
      cout: 'moyen', duree: 'journee', lieu: 'dehors'
    }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = IDEES;
  else racine.IDEES = IDEES;

})(typeof globalThis !== 'undefined' ? globalThis : this);
