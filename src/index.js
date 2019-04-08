import {Howl} from 'howler';
import BoxGame from './game';

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const bgSound = new Howl({
  src: ['assets/bgsound.mp3'],
  loop: true,
});

bgSound.play();

const stepSound = new Howl({
  src: ['assets/step.mp3'],
});

const spotSound = new Howl({
  src: ['assets/success.mp3'],
});

const currentLevel = document.getElementById('currentlevel');
const previousLevel = document.getElementById('previouslevel');
const nextLevel = document.getElementById('nextlevel');
const reset = document.getElementById('reset');
const autoPlay = document.getElementById('autoplay');

const playLevel = Number(localStorage.getItem('playlevel')) || 1;

const app = new BoxGame({
  container: document.getElementById('boxmap'),
  onload(level) {
    currentLevel.value = level;
  },
  onmove([man, bucket], direction) {
    let sound = stepSound;
    if(bucket) {
      let [x, y] = this.getXY(bucket);
      if(direction === 'left') {
        x--;
      } else if(direction === 'right') {
        x++;
      } else if(direction === 'up') {
        y--;
      } else {
        y++;
      }
      if(this.getSpot(x, y)) {
        sound = spotSound;
      }
    }
    sound.play();
  },
  async onLevelComplete(level) {
    localStorage.setItem('playlevel', level + 1);
    const result = document.getElementById('game-result');
    result.className = 'show';
    await wait(1300);
    result.className = '';
    await wait(200);
    this.load(level + 1);
  },
});

app.load(playLevel);

currentLevel.addEventListener('change', ({target}) => {
  app.load(Number(target.value));
});

previousLevel.addEventListener('click', () => {
  app.load(app.level - 1);
});

nextLevel.addEventListener('click', () => {
  app.load(app.level + 1);
});

reset.addEventListener('click', () => {
  app.load(app.level);
});

autoPlay.addEventListener('click', async () => {
  autoPlay.disabled = true;
  autoPlay.innerHTML = '思考中...';
  const steps = await app.solve(app.level);
  autoPlay.innerHTML = '行动中...';
  await app.autoPlay(steps, app.level);
  autoPlay.disabled = false;
  autoPlay.innerHTML = '自动过关';
});

// for debug
window.app = app;
