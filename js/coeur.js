/* =========================================================================
   À deux · cœur logique

   Tout ce qui se calcule vit ici, sans DOM ni localStorage, pour que
   `test-coeur.js` puisse l'exercer sous Node. Le rendu est ailleurs.

   Les dates sont des chaînes « AAAA-MM-JJ » et le restent. Une `Date` ne
   sert que le temps d'un calcul, jamais au stockage.
   ========================================================================= */

(function (racine) {

  /* ----------------------------------------------------------- les dates */

  /* `new Date('2026-01-01')` est interprété en UTC : à Montréal cela donne
     le 31 décembre à 19 h, et toute date reconstruite recule d'un jour la
     moitié de l'année. On construit donc composant par composant, en heure
     locale, et on relit de même. Même piège que love-money, même parade. */
  function depuisTexte(texte) {
    const [a, m, j] = texte.split('-').map(Number);
    return new Date(a, m - 1, j);
  }

  function versTexte(date) {
    const deux = n => String(n).padStart(2, '0');
    return date.getFullYear() + '-' + deux(date.getMonth() + 1) + '-' + deux(date.getDate());
  }

  function aujourdHui() { return versTexte(new Date()); }

  /* Nombre de jours entiers entre deux dates. On compare des minuits locaux :
     un changement d'heure ajouterait sinon une heure et ferait tomber un
     arrondi du mauvais côté. */
  const JOUR = 86400000;
  function joursEntre(depuis, jusqu) {
    return Math.round((depuisTexte(jusqu) - depuisTexte(depuis)) / JOUR);
  }

  /* Décaler d'un nombre de mois sans déborder. Le 31 janvier plus un mois
     donnerait le 3 mars, parce que `new Date(2026, 1, 31)` glisse en
     silence : on ramène au dernier jour du mois, comme `ajouterUnAn` le
     fait dans love-money. La règle des six mois de la tranche 3 s'appuiera
     dessus, et elle est testée dès maintenant pour ne pas la découvrir
     cassée ce jour-là. */
  function ajouterMois(texte, nombre) {
    const [a, m, j] = texte.split('-').map(Number);
    const cible = (m - 1) + nombre;
    const annee = a + Math.floor(cible / 12);
    const mois = ((cible % 12) + 12) % 12;
    const dernierJour = new Date(annee, mois + 1, 0).getDate();
    return versTexte(new Date(annee, mois, Math.min(j, dernierJour)));
  }

  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  function formaterDate(texte) {
    const [a, m, j] = texte.split('-').map(Number);
    return j + ' ' + MOIS[m - 1] + ' ' + a;
  }

  /* -------------------------------------------------------- les langages */

  /* Les cinq langages de Gary Chapman, nommés et rien de plus. On ne copie
     pas son questionnaire, qui est protégé et dont la validité mesurée est
     faible : l'app ENREGISTRE une réponse, elle ne la déduit pas. */
  const LANGAGES = [
    { id: 'paroles',  nom: 'Paroles valorisantes', court: 'Paroles' },
    { id: 'moments',  nom: 'Moments de qualité',   court: 'Moments' },
    { id: 'cadeaux',  nom: 'Cadeaux',              court: 'Cadeaux' },
    { id: 'services', nom: 'Services rendus',      court: 'Services' },
    { id: 'toucher',  nom: 'Toucher physique',     court: 'Toucher' }
  ];

  const PAR_ID = {};
  LANGAGES.forEach(l => { PAR_ID[l.id] = l; });

  function estLangage(id) { return Object.prototype.hasOwnProperty.call(PAR_ID, id); }
  function nomLangage(id) { return estLangage(id) ? PAR_ID[id].nom : ''; }
  function nomCourt(id) { return estLangage(id) ? PAR_ID[id].court : ''; }

  /* --------------------------------------------------------- les profils */

  const NOM_MAX = 18;

  /* Un profil relu peut venir d'une version plus ancienne, ou d'un
     localStorage édité à la main. Tout ce qui n'est pas reconnu redevient
     `null` plutôt que de traverser l'app et de casser un filtre bien plus
     loin, sans rapport apparent avec sa cause.

     Le secondaire ne peut pas égaler le principal : deux appuis rapides sur
     la même ligne le produiraient, et la carte d'accueil afficherait alors
     deux fois la même chose sans rien dire de plus. */
  function normaliserProfil(brut, nomDefaut) {
    const src = (brut && typeof brut === 'object') ? brut : {};
    let nom = typeof src.nom === 'string' ? src.nom.trim().slice(0, NOM_MAX) : '';
    if (!nom) nom = nomDefaut;

    const principal = estLangage(src.principal) ? src.principal : null;
    let secondaire = estLangage(src.secondaire) ? src.secondaire : null;
    if (secondaire && secondaire === principal) secondaire = null;

    /* Un secondaire sans principal n'existe pas : on le promeut plutôt que
       de garder un profil à moitié rempli, illisible sur l'accueil. */
    if (!principal && secondaire) return { nom, principal: secondaire, secondaire: null };

    return { nom, principal, secondaire };
  }

  function profilComplet(p) { return !!(p && p.principal); }

  /* Ce qu'on lit sur la carte d'accueil, sans avoir rien touché. */
  function resumeProfil(p) {
    if (!p || !p.principal) return '';
    return p.secondaire
      ? nomLangage(p.principal) + ' · ' + nomLangage(p.secondaire)
      : nomLangage(p.principal);
  }

  /* ----------------------------------------------------------- le corpus */

  const COUTS = ['gratuit', 'petit', 'moyen'];
  const DUREES = ['heure', 'soiree', 'journee'];
  const LIEUX = ['dedans', 'dehors'];

  /* Le corpus est écrit à la main. Une faute de frappe sur un identifiant de
     langage rendrait une idée invisible au filtrage de la tranche 2, en
     silence et sans la moindre erreur à l'écran. Ce contrôle tourne sous
     Node et refuse de laisser passer une idée pareille. */
  function verifierCorpus(idees) {
    if (!Array.isArray(idees)) return ['le corpus n’est pas une liste'];

    const fautes = [];
    const vus = Object.create(null);

    idees.forEach((idee, i) => {
      const ou = 'idée ' + i + ' (' + ((idee && idee.titre) || 'sans titre') + ')';
      if (!idee || typeof idee !== 'object') { fautes.push(ou + ' : ce n’est pas un objet'); return; }

      if (!idee.id || typeof idee.id !== 'string') fautes.push(ou + ' : identifiant manquant');
      else if (vus[idee.id]) fautes.push(ou + ' : identifiant en double, ' + idee.id);
      else vus[idee.id] = true;

      if (typeof idee.titre !== 'string' || !idee.titre.trim()) fautes.push(ou + ' : titre vide');
      if (typeof idee.phrase !== 'string' || !idee.phrase.trim()) fautes.push(ou + ' : phrase vide');

      if (!Array.isArray(idee.langages) || !idee.langages.length) {
        fautes.push(ou + ' : aucun langage');
      } else {
        if (idee.langages.length > 2) fautes.push(ou + ' : plus de deux langages');
        if (idee.langages.length === 2 && idee.langages[0] === idee.langages[1]) {
          fautes.push(ou + ' : langage répété');
        }
        idee.langages.forEach(l => {
          if (!estLangage(l)) fautes.push(ou + ' : langage inconnu, ' + l);
        });
      }

      if (COUTS.indexOf(idee.cout) < 0) fautes.push(ou + ' : coût inconnu, ' + idee.cout);
      if (DUREES.indexOf(idee.duree) < 0) fautes.push(ou + ' : durée inconnue, ' + idee.duree);
      if (LIEUX.indexOf(idee.lieu) < 0) fautes.push(ou + ' : lieu inconnu, ' + idee.lieu);
    });

    return fautes;
  }

  const MOT_COUT = { gratuit: 'Gratuit', petit: 'Petit budget', moyen: 'Budget moyen' };
  const MOT_DUREE = { heure: 'Une heure', soiree: 'Une soirée', journee: 'Une journée' };
  const MOT_LIEU = { dedans: 'Dedans', dehors: 'Dehors' };

  function etiquettes(idee) {
    return [MOT_COUT[idee.cout], MOT_DUREE[idee.duree], MOT_LIEU[idee.lieu]].filter(Boolean);
  }

  /* ------------------------------------------------------------- export */

  const API = {
    depuisTexte, versTexte, aujourdHui, joursEntre, ajouterMois, formaterDate,
    LANGAGES, estLangage, nomLangage, nomCourt,
    normaliserProfil, profilComplet, resumeProfil,
    COUTS, DUREES, LIEUX, verifierCorpus, etiquettes
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else racine.COEUR = API;

})(typeof globalThis !== 'undefined' ? globalThis : this);
