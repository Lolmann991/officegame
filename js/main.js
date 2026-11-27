// Einstiegspunkt: verbindet Spiellogik, 3D-Büro und Oberfläche und betreibt die Hauptschleife.

import { Game } from './game.js';
import { Office } from './office.js';
import { UI } from './ui.js';

const game = new Game();
const office = new Office(document.getElementById('scene'));

try {
  office.init();
} catch (err) {
  document.getElementById('webgl-error').hidden = false;
  console.error(err);
}

const ui = new UI(game, office);
document.getElementById('ng-diffs').innerHTML = ui.difficultyCards();
ui.bindTitle();
ui.bindDialog();
ui.toTitle();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  if (ui.running) game.tick(dt);
  if (office.renderer) office.update();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

const inGame = () => game.s && !game.s.gameOver && ui.screen !== 'title' && ui.screen !== 'gameover';

// HUD und PC-Anzeigen 4× pro Sekunde aktualisieren
setInterval(() => { if (inGame()) { ui.updateHUD(); ui.pc.refreshLive(); } }, 250);
// Auto-Save
setInterval(() => { if (inGame()) game.save(); }, 10000);

// Hintergrund-Tab: Zeit wird beim Zurückkommen nachgerechnet
let hiddenAt = null;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    if (inGame()) game.save();
  } else if (hiddenAt) {
    const away = (Date.now() - hiddenAt) / 1000;
    hiddenAt = null;
    if (ui.running && away > 5) {
      const sum = game.simulateAway(away);
      game.save();
      if (sum && sum.months > 0) ui.showAwaySummary(sum);
      ui.updateHUD();
    }
  }
});
window.addEventListener('pagehide', () => { if (inGame()) game.save(); });

// Zum Ausprobieren in der Konsole
window.konzern = { game, ui, office };
