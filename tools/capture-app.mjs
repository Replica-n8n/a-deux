/* Captures des écrans de l'app, à la taille du téléphone.

   Le panneau navigateur intégré rend parfois la page en mosaïque quand un
   `.screen` est en `position:fixed` : le DOM est juste, l'image ne l'est
   pas. Playwright ne triche pas, et sort un PNG par écran.

   Rien n'est semé dans le stockage : le parcours part d'une app vierge et
   choisit les langages en appuyant, comme elle le ferait. Une capture prise
   sur un stockage préfabriqué prouverait le rendu, pas le chemin.

   Prérequis : le serveur `a-deux` tourne (port 8103).
   Lancer depuis a-deux/ :  node tools/capture-app.mjs
*/
import { chromium, devices } from '../../games/tools/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.join(ICI, 'captures');
fs.mkdirSync(DOSSIER, { recursive: true });

const BASE = 'http://localhost:8103/';

/* Elle est sur un Pixel 9a, que Playwright ne connaît pas : le Pixel 9 a la
   même dalle et une largeur utile identique. */
const APPAREIL = devices['Pixel 9'] || { viewport: { width: 375, height: 812 }, deviceScaleFactor: 3 };

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ ...APPAREIL, locale: 'fr-CA' });
const page = await contexte.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const prendre = async nom => {
  await page.waitForTimeout(250);
  const chemin = path.join(DOSSIER, nom + '.png');
  await page.screenshot({ path: chemin });
  console.log('capture :', chemin);
};

/* Playwright refuse parfois de cliquer un élément qu'il juge non visible,
   alors qu'il l'est : on passe par le DOM, comme sur les autres dépôts. */
const clic = s => page.evaluate(sel => document.querySelector(sel).click(), s);

await prendre('1-accueil-vierge');

await clic('#carte-moi');
await page.waitForTimeout(200);
await clic('#pr-principal .opt:nth-child(2)');          // Moments de qualité
await clic('#pr-secondaire .opt:nth-child(1)');         // Paroles valorisantes
await prendre('2-profil');

await clic('#pr-fini');
await page.waitForTimeout(250);
await clic('#carte-autre');
await page.waitForTimeout(200);
await clic('#pr-principal .opt:nth-child(4)');          // Services rendus
await clic('#pr-secondaire .opt:nth-child(5)');         // Toucher physique
await clic('#pr-fini');
await page.waitForTimeout(250);
await prendre('3-accueil-rempli');

await clic('[data-goto="reglages"]');
await prendre('4-reglages');

await navigateur.close();
