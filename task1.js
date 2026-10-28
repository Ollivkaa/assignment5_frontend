'use strict';


const START_LIVES = 3;   
const WIN_STREAK = 10;   
const LOG_LIMIT = 5;     
const BEST_KEY = 'higher-lower-best-streak';

const ITEMS = [
  { name: 'Smartphone',          emoji: '📱', price: 699 },
  { name: 'Laptop',              emoji: '💻', price: 1200 },
  { name: 'Wireless earbuds',    emoji: '🎧', price: 149 },
  { name: 'Smartwatch',          emoji: '⌚', price: 299 },
  { name: 'Tablet',              emoji: '📲', price: 449 },
  { name: 'Gaming console',      emoji: '🎮', price: 499 },
  { name: 'E-book reader',       emoji: '📖', price: 129 },
  { name: 'Action camera',       emoji: '📷', price: 299 },
  { name: 'Mechanical keyboard', emoji: '⌨️', price: 99 },
  { name: 'Bluetooth speaker',   emoji: '🔊', price: 79 },
  { name: '4K monitor',          emoji: '🖥️', price: 399 },
  { name: 'VR headset',          emoji: '🥽', price: 549 },
];


const el = {
  game: document.getElementById('game'),
  lives: document.getElementById('lives'),
  streak: document.getElementById('streak'),
  best: document.getElementById('best'),
  round: document.getElementById('round'),
  goalLabel: document.getElementById('goal-label'),
  goalBar: document.getElementById('goal-bar'),
  currentEmoji: document.getElementById('current-emoji'),
  currentName: document.getElementById('current-name'),
  currentPrice: document.getElementById('current-price'),
  nextEmoji: document.getElementById('next-emoji'),
  nextName: document.getElementById('next-name'),
  message: document.getElementById('message'),
  log: document.getElementById('log'),
  higher: document.getElementById('btn-higher'),
  lower: document.getElementById('btn-lower'),
  restart: document.getElementById('btn-restart'),
};


const state = {
  lives: START_LIVES,
  streak: 0,
  best: loadBest(),
  round: 1,
  current: 0,       
  next: 1,          
  over: false,
  result: '',      
  log: [],
  message: '',
  messageType: 'info',
};
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function pickIndex(exclude) {
  let index;
  do {
    index = randomInt(0, ITEMS.length - 1);
  } while (index === exclude);
  return index;
}

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch (error) {
    // storage can be blocked: the game works without it
  }
}

function setMessage(text, type) {
  state.message = text;
  state.messageType = type;
}

function newGame() {
  state.lives = START_LIVES;
  state.streak = 0;
  state.round = 1;
  state.over = false;
  state.result = '';
  state.log = [];
  state.current = pickIndex(-1);
  state.next = pickIndex(state.current);
  setMessage('New game! Will the next gadget cost more or less?', 'info');
  render();
}

function makeGuess(choice) {
  
  if (state.over) {
    setMessage('The game is over. Press Restart to play again.', 'error');
    render();
    return;
  }
  if (choice !== 'higher' && choice !== 'lower') {
    setMessage('Invalid move. Choose Higher or Lower.', 'error');
    render();
    return;
  }

  const current = ITEMS[state.current];
  const next = ITEMS[state.next];


  const isCorrect =
    (choice === 'higher' && next.price >= current.price) ||
    (choice === 'lower' && next.price <= current.price);

  const info = `${next.name} costs $${next.price} (${current.name}: $${current.price}).`;

  if (isCorrect) {
    state.streak += 1;
    if (state.streak > state.best) {
      state.best = state.streak;
      saveBest(state.best);
    }
    if (state.streak === WIN_STREAK) {
      state.over = true;
      state.result = 'win';
      setMessage(`🎉 You win! ${WIN_STREAK} correct guesses in a row. ${info}`, 'ok');
    } else {
      setMessage(`✅ Correct! ${info}`, 'ok');
    }
  } else {
    state.lives -= 1;
    state.streak = 0;
    if (state.lives === 0) {
      state.over = true;
      state.result = 'lose';
      setMessage(`💔 Game over. ${info}`, 'error');
    } else {
      setMessage(`❌ Wrong! ${info}`, 'error');
    }
  }

  state.log.unshift({ text: `${choice.toUpperCase()} — ${info}`, good: isCorrect });
  state.log = state.log.slice(0, LOG_LIMIT);

  if (!state.over) {
    state.current = state.next;
    state.next = pickIndex(state.current);
    state.round += 1;
  }
  render();
}

function render() {
  const currentItem = ITEMS[state.current];
  const nextItem = ITEMS[state.next];

  el.lives.textContent = '♥'.repeat(state.lives) + '♡'.repeat(START_LIVES - state.lives);
  el.lives.setAttribute('aria-label', `${state.lives} of ${START_LIVES} lives left`);
  el.streak.textContent = String(state.streak);
  el.best.textContent = String(state.best);
  el.round.textContent = String(state.round);

  el.goalLabel.textContent = `Goal: ${state.streak} / ${WIN_STREAK} correct in a row`;
  el.goalBar.max = WIN_STREAK;
  el.goalBar.value = state.streak;

  el.currentEmoji.textContent = currentItem.emoji;
  el.currentName.textContent = currentItem.name;
  el.currentPrice.textContent = `$${currentItem.price}`;
  el.nextEmoji.textContent = nextItem.emoji;
  el.nextName.textContent = nextItem.name;

  el.message.textContent = state.message;
  el.message.className = `message message--${state.messageType}`;

  el.game.classList.toggle('is-win', state.result === 'win');
  el.game.classList.toggle('is-lose', state.result === 'lose');

  el.higher.disabled = state.over;
  el.lower.disabled = state.over;

  el.log.replaceChildren();
  for (const entry of state.log) {
    const li = document.createElement('li');
    li.textContent = entry.text;
    li.classList.add(entry.good ? 'is-good' : 'is-bad');
    el.log.append(li);
  }
  if (state.log.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No rounds yet. Make your first guess!';
    li.classList.add('is-empty');
    el.log.append(li);
  }
}

el.higher.addEventListener('click', () => makeGuess('higher'));
el.lower.addEventListener('click', () => makeGuess('lower'));
el.restart.addEventListener('click', newGame);

newGame();
