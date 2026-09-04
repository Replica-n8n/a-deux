/* Filet de non-régression du cœur logique.
   Lancer :  node test-coeur.js

   Chaque cas vient d'un piège réel, pas d'une liste générique : les dates qui
   glissent d'un jour par UTC, le changement d'heure de Montréal qui fausse un
   écart en jours, la fin de mois qui déborde, et le corpus écrit à la main où
   un identifiant mal tapé rendrait une idée invisible en silence.
*/

const C = require('./js/coeur.js');
const IDEES = require('./js/idees.js');

let echecs = 0;
function verifie(nom, obtenu, attendu) {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (!ok) {
    echecs++;
    console.log('ECHEC  ' + nom + '\n   obtenu  : ' + JSON.stringify(obtenu) +
                '\n   attendu : ' + JSON.stringify(attendu));
  }
}

/* ------------------------------------------------------------- les dates */

/* Le piège UTC : à Montréal, `new Date('2026-01-01')` est le 31 décembre à
   19 h. Toute date reconstruite via UTC recule d'un jour la moitié de
   l'année. On vérifie donc l'aller-retour aux deux extrémités de l'année. */
verifie('aller-retour 1er janvier', C.versTexte(C.depuisTexte('2026-01-01')), '2026-01-01');
verifie('aller-retour 1er juillet', C.versTexte(C.depuisTexte('2026-07-01')), '2026-07-01');
verifie('aller-retour 31 décembre', C.versTexte(C.depuisTexte('2026-12-31')), '2026-12-31');
verifie('le jour lu est le bon', C.depuisTexte('2026-01-01').getDate(), 1);

// Le cas ordinaire du décalage de mois.
verifie('un mois plus tard', C.ajouterMois('2026-07-11', 1), '2026-08-11');
verifie('six mois plus tard', C.ajouterMois('2026-07-11', 6), '2027-01-11');

/* Le 31 janvier plus un mois n'existe pas : `new Date(2026, 1, 31)` déborde
   en silence sur le 3 mars. C'est ce glissement qui ferait remonter une idée
   faite trop tôt, ou trop tard, quand la règle des six mois arrivera. */
verifie('31 janvier plus un mois', C.ajouterMois('2026-01-31', 1), '2026-02-28');
verifie('31 janvier plus un mois, année bissextile', C.ajouterMois('2028-01-31', 1), '2028-02-29');
verifie('31 août plus six mois', C.ajouterMois('2026-08-31', 6), '2027-02-28');
verifie('31 mars plus un mois', C.ajouterMois('2026-03-31', 1), '2026-04-30');

// Le passage d'année, dans les deux sens.
verifie('décembre plus un mois', C.ajouterMois('2026-12-15', 1), '2027-01-15');
verifie('janvier moins un mois', C.ajouterMois('2026-01-15', -1), '2025-12-15');
verifie('juillet moins huit mois', C.ajouterMois('2026-07-11', -8), '2025-11-11');

/* Le changement d'heure : au printemps une journée dure 23 h, à l'automne
   25 h. Un écart calculé sans arrondi tomberait à 1,958 jour et un `floor`
   renverrait 1 au lieu de 2. À Montréal en 2026 : le 8 mars et le 1er
   novembre. */
verifie('écart au passage à l’heure d’été', C.joursEntre('2026-03-07', '2026-03-09'), 2);
verifie('écart au retour à l’heure normale', C.joursEntre('2026-10-31', '2026-11-02'), 2);
verifie('écart nul', C.joursEntre('2026-05-04', '2026-05-04'), 0);
verifie('écart négatif', C.joursEntre('2026-05-04', '2026-05-01'), -3);
verifie('écart sur une année', C.joursEntre('2026-01-01', '2027-01-01'), 365);

verifie('date écrite en toutes lettres', C.formaterDate('2026-07-04'), '4 juillet 2026');
verifie('date de février bissextile', C.formaterDate('2028-02-29'), '29 février 2028');

/* --------------------------------------------------------- les langages */

verifie('cinq langages', C.LANGAGES.length, 5);
verifie('un langage connu', C.estLangage('toucher'), true);
verifie('un langage inventé', C.estLangage('cuisine'), false);
verifie('nom du langage', C.nomLangage('moments'), 'Moments de qualité');
verifie('nom court', C.nomCourt('services'), 'Services');
verifie('nom d’un langage inconnu', C.nomLangage('cuisine'), '');

/* ---------------------------------------------------------- les profils */

verifie('profil absent',
  C.normaliserProfil(null, 'Moi'),
  { nom: 'Moi', principal: null, secondaire: null });

verifie('profil complet',
  C.normaliserProfil({ nom: 'Alex', principal: 'moments', secondaire: 'toucher' }, 'Moi'),
  { nom: 'Alex', principal: 'moments', secondaire: 'toucher' });

/* Deux appuis rapides sur la même ligne donneraient un profil qui affiche
   deux fois la même chose sans rien dire de plus. */
verifie('secondaire égal au principal',
  C.normaliserProfil({ nom: 'Alex', principal: 'moments', secondaire: 'moments' }, 'Moi'),
  { nom: 'Alex', principal: 'moments', secondaire: null });

/* Un secondaire seul est illisible sur l'accueil : il devient le principal. */
verifie('secondaire sans principal',
  C.normaliserProfil({ nom: 'Alex', principal: null, secondaire: 'cadeaux' }, 'Moi'),
  { nom: 'Alex', principal: 'cadeaux', secondaire: null });

/* Un localStorage écrit par une version plus ancienne, ou édité à la main. */
verifie('langage inconnu ignoré',
  C.normaliserProfil({ nom: 'Alex', principal: 'cuisine', secondaire: 'toucher' }, 'Moi'),
  { nom: 'Alex', principal: 'toucher', secondaire: null });

verifie('nom vide, on reprend le défaut',
  C.normaliserProfil({ nom: '   ', principal: 'paroles' }, 'L’autre').nom, 'L’autre');
verifie('nom rogné',
  C.normaliserProfil({ nom: '  Alexandra  ', principal: 'paroles' }, 'Moi').nom, 'Alexandra');
verifie('nom plafonné à 18 signes',
  C.normaliserProfil({ nom: 'Marie-Christine-Anne', principal: 'paroles' }, 'Moi').nom.length, 18);
verifie('nom qui n’est pas du texte',
  C.normaliserProfil({ nom: 42, principal: 'paroles' }, 'Moi').nom, 'Moi');

verifie('profil complet, oui', C.profilComplet({ principal: 'moments' }), true);
verifie('profil complet, non', C.profilComplet({ principal: null }), false);

verifie('résumé à deux langages',
  C.resumeProfil({ principal: 'moments', secondaire: 'toucher' }),
  'Moments de qualité · Toucher physique');
verifie('résumé à un langage',
  C.resumeProfil({ principal: 'moments', secondaire: null }), 'Moments de qualité');
verifie('résumé vide', C.resumeProfil({ principal: null }), '');

/* ----------------------------------------------------------- le corpus */

/* Le contrôle qui compte : le corpus embarqué passe, sinon une idée mal
   taguée deviendrait invisible au filtrage de la tranche 2, sans erreur. */
verifie('le corpus embarqué est propre', C.verifierCorpus(IDEES), []);
verifie('le corpus n’est pas vide', IDEES.length > 0, true);

const bonne = { id: 'x', titre: 'T', phrase: 'P', langages: ['moments'],
                cout: 'petit', duree: 'soiree', lieu: 'dedans' };

verifie('une idée juste passe', C.verifierCorpus([bonne]), []);
verifie('langage inconnu refusé',
  C.verifierCorpus([{ ...bonne, langages: ['cuisine'] }]).length, 1);
verifie('trois langages refusés',
  C.verifierCorpus([{ ...bonne, langages: ['moments', 'toucher', 'cadeaux'] }]).length, 1);
verifie('langage répété refusé',
  C.verifierCorpus([{ ...bonne, langages: ['moments', 'moments'] }]).length, 1);
verifie('aucun langage refusé',
  C.verifierCorpus([{ ...bonne, langages: [] }]).length, 1);
verifie('coût inconnu refusé',
  C.verifierCorpus([{ ...bonne, cout: 'cher' }]).length, 1);
verifie('durée inconnue refusée',
  C.verifierCorpus([{ ...bonne, duree: 'weekend' }]).length, 1);
verifie('lieu inconnu refusé',
  C.verifierCorpus([{ ...bonne, lieu: 'ailleurs' }]).length, 1);
verifie('phrase vide refusée',
  C.verifierCorpus([{ ...bonne, phrase: '  ' }]).length, 1);

/* Deux idées au même identifiant : la seconde écraserait la première dès
   qu'un statut sera rangé par identifiant, à la tranche 3. */
verifie('identifiant en double refusé',
  C.verifierCorpus([bonne, { ...bonne, titre: 'Autre' }]).length, 1);

verifie('étiquettes lisibles',
  C.etiquettes(bonne), ['Petit budget', 'Une soirée', 'Dedans']);

/* --------------------------------------------------------------- bilan */

if (echecs) {
  console.log('\n' + echecs + ' échec(s)');
  process.exit(1);
}
console.log('TOUT EST VERT · ' + IDEES.length + ' idées vérifiées');
