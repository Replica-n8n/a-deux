/* =========================================================================
   À deux · navigation et rendu

   Les calculs sont dans coeur.js, le stockage dans store.js, le corpus dans
   idees.js. Ce fichier ne fait que montrer et écouter.
   ========================================================================= */

(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const C = window.COEUR;
  const S = window.STORE;
  const IDEES = window.IDEES;

  function annoncer(texte) {
    const el = $('#annonce');
    el.textContent = '';
    setTimeout(() => { el.textContent = texte; }, 60);
  }

  /* ------------------------------------------------------- navigation */

  /* Chaque écran est une entrée d'historique, et les boutons « Retour » de
     l'interface CONSOMMENT l'entrée de l'aller par `history.back()`. Les
     empiler ferait qu'un aller-retour ajoute deux entrées, et le retour
     matériel d'Android ne ramènerait plus à l'accueil mais rejouerait le
     parcours à l'envers. Contrôle : cinq allers-retours ajoutent zéro
     entrée. */
  function afficher(etat) {
    const nom = (etat && etat.ecran) || 'accueil';

    $$('.screen').forEach(s => { s.hidden = s.id !== 'screen-' + nom; });
    const vue = $('#screen-' + nom);
    if (vue) vue.querySelector('.body').scrollTop = 0;

    if (nom === 'accueil') rendreAccueil();
    if (nom === 'profil') rendreProfil(etat.qui === 'autre' ? 'autre' : 'moi');
    if (nom === 'reglages') rendreReglages();
  }

  function aller(etat) {
    history.pushState(etat, '');
    afficher(etat);
  }

  addEventListener('popstate', e => afficher(e.state));

  $$('[data-back]').forEach(b => b.addEventListener('click', () => history.back()));
  $$('[data-goto]').forEach(b =>
    b.addEventListener('click', () => aller({ ecran: b.dataset.goto })));
  $$('[data-profil]').forEach(b =>
    b.addEventListener('click', () => aller({ ecran: 'profil', qui: b.dataset.profil })));

  /* ---------------------------------------------------------- accueil */

  function rendreCarte(qui, profil) {
    const carte = $('#carte-' + qui);
    $('#' + qui + '-nom').textContent = profil.nom;

    const vide = !C.profilComplet(profil);
    carte.classList.toggle('vide', vide);

    /* Sans langage choisi, la carte dit quoi faire à la place du langage
       lui-même : c'est la seule ligne de l'accueil qui a le droit
       d'expliquer, parce qu'elle disparaît dès le premier appui. */
    $('#' + qui + '-principal').textContent = vide
      ? 'Choisir son langage'
      : C.nomLangage(profil.principal);

    $('#' + qui + '-secondaire').textContent = (!vide && profil.secondaire)
      ? 'puis ' + C.nomLangage(profil.secondaire)
      : '';

    carte.setAttribute('aria-label',
      profil.nom + ' : ' + (vide ? 'aucun langage choisi' : C.resumeProfil(profil)) +
      '. Modifier.');
  }

  function carteIdee(idee) {
    const bloc = document.createElement('div');
    bloc.className = 'idee';

    const titre = document.createElement('div');
    titre.className = 'titre';
    titre.textContent = idee.titre;

    const phrase = document.createElement('p');
    phrase.className = 'phrase';
    phrase.textContent = idee.phrase;

    const etiq = document.createElement('div');
    etiq.className = 'etiquettes';

    /* Les langages d'abord, et colorés : c'est par eux que la tranche 2
       filtrera, autant les voir dès maintenant. */
    idee.langages.forEach(l => {
      const e = document.createElement('span');
      e.className = 'etiq langue';
      e.textContent = C.nomCourt(l);
      etiq.append(e);
    });
    C.etiquettes(idee).forEach(mot => {
      const e = document.createElement('span');
      e.className = 'etiq';
      e.textContent = mot;
      etiq.append(e);
    });

    bloc.append(titre, phrase, etiq);
    return bloc;
  }

  function rendreAccueil() {
    const p = S.profils();
    rendreCarte('moi', p.moi);
    rendreCarte('autre', p.autre);

    const liste = $('#idees');
    liste.textContent = '';
    IDEES.forEach(idee => liste.append(carteIdee(idee)));
  }

  /* ----------------------------------------------------------- profil */

  let quiEnEdition = 'moi';

  const prNom = $('#pr-nom');

  function ligneChoix(langage, choisi, inerte, note) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', choisi ? 'true' : 'false');
    if (inerte) b.disabled = true;

    const coche = document.createElement('span');
    coche.className = 'coche';
    coche.textContent = '✓';

    const nom = document.createElement('span');
    nom.className = 'nom';
    nom.textContent = langage.nom;

    b.append(coche, nom);

    if (note) {
      const n = document.createElement('span');
      n.className = 'note';
      n.textContent = note;
      b.append(n);
    }
    return b;
  }

  function rendreProfil(qui) {
    quiEnEdition = qui;
    const profil = S.profil(qui);
    $('#pr-erreur').hidden = true;

    $('#pr-titre').textContent = profil.nom;

    /* « Son prénom » sur l'écran de l'autre, « ton » sur le sien. Trois mots
       qui coûtent une ligne et évitent de lire « Son prénom : Moi ». */
    const possessif = qui === 'moi' ? 'Ton' : 'Son';
    $('#l-nom').textContent = possessif + ' prénom';
    $('#t-principal').textContent = possessif + ' langage principal';
    $('#t-secondaire').textContent = possessif + ' langage secondaire';
    /* Ne pas réécrire le champ pendant la frappe : remettre la même valeur
       replacerait le curseur à la fin à chaque lettre. */
    if (document.activeElement !== prNom) prNom.value = profil.nom;

    const boiteP = $('#pr-principal');
    const boiteS = $('#pr-secondaire');
    boiteP.textContent = '';
    boiteS.textContent = '';
    boiteS.classList.toggle('menthe', qui === 'autre');
    boiteP.classList.toggle('menthe', qui === 'autre');

    C.LANGAGES.forEach(l => {
      const p = ligneChoix(l, profil.principal === l.id, false, '');
      p.addEventListener('click', () => changer(qui, 'principal', l.id));
      boiteP.append(p);

      /* Le langage déjà principal reste dans la liste, grisé : le retirer
         ferait glisser les quatre autres lignes sous le doigt à chaque
         changement de principal. */
      const dejaPrincipal = profil.principal === l.id;
      const s = ligneChoix(l, profil.secondaire === l.id, dejaPrincipal,
                           dejaPrincipal ? 'déjà principal' : '');
      if (!dejaPrincipal) s.addEventListener('click', () => changer(qui, 'secondaire', l.id));
      boiteS.append(s);
    });
  }

  /* Un deuxième appui sur la ligne déjà retenue la retire : sans cela, un
     langage choisi par erreur ne se défait plus. Le cœur se charge du reste,
     y compris de promouvoir le secondaire si le principal disparaît. */
  function changer(qui, champ, id) {
    const profil = S.profil(qui);
    profil[champ] = (profil[champ] === id) ? null : id;
    const range = S.enregistrerProfil(qui, profil);
    rendreProfil(qui);

    /* `null` veut dire que le navigateur a refusé d'écrire. Sans ce test on
       annonçait le langage comme rangé alors que la coche restait vide. */
    if (!range) return direErreur();
    effacerErreur();
    annoncer(range.principal ? C.resumeProfil(range) : 'Aucun langage choisi.');
  }

  function direErreur() {
    const el = $('#pr-erreur');
    el.textContent = 'Ce navigateur bloque le stockage du site : rien ne peut ' +
      'être enregistré. Autoriser les données de site pour cette page.';
    el.hidden = false;
    annoncer('Impossible d’enregistrer.');
  }

  function effacerErreur() { $('#pr-erreur').hidden = true; }

  prNom.addEventListener('input', () => {
    const profil = S.profil(quiEnEdition);
    profil.nom = prNom.value;
    const range = S.enregistrerProfil(quiEnEdition, profil);
    if (!range) return direErreur();
    effacerErreur();
    $('#pr-titre').textContent = range.nom;
  });

  $('#pr-fini').addEventListener('click', () => history.back());

  /* --------------------------------------------------------- réglages */

  function rendreReglages() {
    desarmerEffacer();

    /* `caches` n'existe pas hors contexte sécurisé : servie en http:// sur
       une adresse de réseau local, la page lèverait une ReferenceError ici
       et l'écran resterait à moitié rendu. */
    if (typeof caches === 'undefined') { $('#version').textContent = ''; return; }
    caches.keys().then(noms => {
      const coquille = noms.find(n => n.indexOf('ad-shell-') === 0);
      $('#version').textContent = coquille ? 'version ' + coquille.replace('ad-shell-', '') : '';
    }).catch(() => {});
  }

  /* Effacer demande deux appuis. Le premier arme le bouton et le dit, le
     second efface : une destruction sans retour ne doit pas tenir dans un
     seul geste au pouce. */
  const btnEffacer = $('#btn-effacer');
  let arme = false;

  function desarmerEffacer() {
    arme = false;
    btnEffacer.classList.remove('arme');
    btnEffacer.textContent = 'Effacer les deux profils';
  }

  btnEffacer.addEventListener('click', () => {
    if (!arme) {
      arme = true;
      btnEffacer.classList.add('arme');
      btnEffacer.textContent = 'Appuyer encore pour effacer';
      return;
    }
    S.effacerTout();
    desarmerEffacer();
    annoncer('Profils effacés.');
    history.back();
  });

  /* -------------------------------------------------------- installation */

  /* ⚠️ RAPATRIÉ DE LOVE-MONEY ET DE GVT. Chrome ne montre plus de bandeau
     d'installation de lui-même : il prévient la page par
     `beforeinstallprompt` et attend qu'elle réagisse. Une page qui ignore
     cet événement remplit tous les critères et ne propose jamais rien, donc
     a l'air de n'être qu'un site. Tout nouveau PWA de ces dépôts porte ce
     bloc dès le premier jour. */
  let evenementInstall = null;
  const elInstall = $('#install');

  addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    evenementInstall = e;
    elInstall.hidden = false;
  });

  /* L'écoute du clic est posée UNE fois, hors de l'événement : l'attacher à
     l'intérieur empilerait un écouteur de plus à chaque
     `beforeinstallprompt`, et le même appui déclencherait alors plusieurs
     invites. */
  elInstall.addEventListener('click', async () => {
    const invite = evenementInstall;
    if (!invite) return;
    /* L'événement ne sert qu'une fois, refusé ou accepté. On le jette donc
       tout de suite ; si le navigateur en renvoie un autre plus tard, le
       bouton revient de lui-même. */
    evenementInstall = null;
    elInstall.hidden = true;
    try { await invite.prompt(); } catch {}
  });

  addEventListener('appinstalled', () => {
    evenementInstall = null;
    elInstall.hidden = true;
  });

  /* Safari sur iPhone ne déclenche jamais `beforeinstallprompt` : la seule
     voie est Partager puis « Sur l'écran d'accueil ». Sans ce rappel, l'app
     a l'air non installable sur iPhone alors qu'elle l'est. */
  const surIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const dejaInstallee = matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true;
  if (surIOS && !dejaInstallee) $('#install-ios').hidden = false;

  /* ------------------------------------------------------ service worker */

  if ('serviceWorker' in navigator) {
    addEventListener('load', () => {
      /* Noté AVANT l'enregistrement : install appelle skipWaiting et activate
         appelle clients.claim, si bien qu'une toute première installation se
         donne un contrôleur avant le statechange et annoncerait « nouvelle
         version » à quelqu'un qui ouvre l'app pour la première fois. */
      const dejaPilotee = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && dejaPilotee) {
              $('#update-bar').hidden = false;
              $('#update-btn').addEventListener('click', () => {
                sw.postMessage('skip-waiting');
                location.reload();
              });
            }
          });
        });
      }).catch(() => {});
    });
  }

  /* ---------------------------------------------------------- démarrage */

  history.replaceState({ ecran: 'accueil' }, '');
  afficher({ ecran: 'accueil' });

})();
