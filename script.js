const form = document.getElementById('searchForm');
const input = document.getElementById('searchInput');
const suggestionsContainer = document.createElement('div');
suggestionsContainer.id = 'suggestions';
form.appendChild(suggestionsContainer);

const miyuImg = document.getElementById('miyu-img');
const miyuTalk = document.getElementById('miyu-talk');
const bgMusic = document.getElementById('bg-music');

const nsfwWords = [
  'nsfw', 'sex', 'porn', 'nude', 'naked', 'xxx',
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy'
];

// Sprites
const normalSprite = 'assets/1.webp';
const nervousSprite = 'assets/4.webp';
const blinkSprite = 'assets/13.webp';
const mockingSprite = 'assets/5.webp';

let blinkTimeout = null;
let eyesOpenTimeout = null;
let isNervous = false;

let nsfwCount = 0;
const NSFW_LIMIT = 3;

// BLINKING LOGIC
function startBlinking() {
  clearTimeout(blinkTimeout);
  clearTimeout(eyesOpenTimeout);
  isNervous = false;

  miyuImg.src = normalSprite;

  function blinkCycle() {
    if (isNervous) return;

    miyuImg.src = blinkSprite;

    eyesOpenTimeout = setTimeout(() => {
      if (isNervous) return;

      miyuImg.src = normalSprite;

      blinkTimeout = setTimeout(blinkCycle, 3000);
    }, 150); // shorter blink duration for less fade effect
  }

  blinkTimeout = setTimeout(blinkCycle, 3000);
}

function stopBlinkingAndSetSprite(sprite) {
  clearTimeout(blinkTimeout);
  clearTimeout(eyesOpenTimeout);
  miyuImg.src = sprite;
}

// NSFW CHECK
function containsNSFW(query) {
  const lowered = query.toLowerCase();
  return nsfwWords.some(word => lowered.includes(word));
}

// LOCALSTORAGE: Save & Load User Searches
function saveSearchTerm(term) {
  if (!term) return;
  let searches = JSON.parse(localStorage.getItem('nyanko_searches')) || {};
  searches[term] = (searches[term] || 0) + 1;
  localStorage.setItem('nyanko_searches', JSON.stringify(searches));
}

function getUserTopSearches(limit = 10) {
  let searches = JSON.parse(localStorage.getItem('nyanko_searches')) || {};
  const sorted = Object.entries(searches)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  return sorted.slice(0, limit);
}

// AUTOCOMPLETE SUGGESTIONS
input.addEventListener('input', () => {
  const query = input.value.toLowerCase().trim();

  suggestionsContainer.innerHTML = '';
  if (!query) return;

  // Get user searches matching input
  const userTop = getUserTopSearches(10).filter(term => term.toLowerCase().startsWith(query));

  // Show up to 5 suggestions from user data
  userTop.slice(0, 5).forEach(suggestion => {
    const div = document.createElement('div');
    div.textContent = suggestion;
    div.classList.add('suggestion-item');
    div.addEventListener('click', () => {
      input.value = suggestion;
      suggestionsContainer.innerHTML = '';
      input.focus();
    });
    suggestionsContainer.appendChild(div);
  });
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!suggestionsContainer.contains(e.target) && e.target !== input) {
    suggestionsContainer.innerHTML = '';
  }
});

// FORM SUBMIT with fade-out and teasing for NSFW
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const query = input.value.trim();

  if (containsNSFW(query)) {
    nsfwCount++;
    isNervous = true;

    if (nsfwCount > NSFW_LIMIT) {
      stopBlinkingAndSetSprite(mockingSprite);
      miyuTalk.textContent = "desperate...";
    } else {
      stopBlinkingAndSetSprite(nervousSprite);
      miyuTalk.textContent = "???";
    }

    miyuTalk.classList.remove('hidden');
    miyuTalk.classList.add('visible');

    setTimeout(() => {
      miyuTalk.classList.remove('visible');
      miyuTalk.classList.add('hidden');

      startBlinking();
    }, 5000);

    return;
  }

  nsfwCount = 0;

  if (!query) return;

  saveSearchTerm(query);

  isNervous = false;
  miyuTalk.classList.remove('visible');
  miyuTalk.classList.add('hidden');

  startBlinking();

  suggestionsContainer.innerHTML = '';

  const container = document.querySelector('.container');
  container.classList.add('fade-out');

  setTimeout(() => {
    const encoded = encodeURIComponent(query);
    window.location.href = `https://www.google.com/search?q=${encoded}`;
  }, 500);
});

// BACKGROUND MUSIC CONTROL
bgMusic.muted = true;
bgMusic.volume = 0.3;

function playMusicOnClick() {
  bgMusic.muted = false;
  bgMusic.play().catch(() => {});
  document.removeEventListener('click', playMusicOnClick);
}

document.addEventListener('click', playMusicOnClick);

// KEYPRESS SOUND WITH PITCH VARIATION
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let keypressBuffer = null;

const KEYPRESS_VOLUME = 0.15;

fetch('assets/keypress.mp3')
  .then(response => response.arrayBuffer())
  .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
  .then(audioBuffer => {
    keypressBuffer = audioBuffer;
  })
  .catch(console.error);

function playKeypressSound() {
  if (!keypressBuffer) return;

  const source = audioContext.createBufferSource();
  source.buffer = keypressBuffer;

  source.playbackRate.value = 0.9 + Math.random() * 0.2;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = KEYPRESS_VOLUME;

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start();
}

input.addEventListener('keydown', () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  playKeypressSound();
});

// START BLINKING ON LOAD
startBlinking();
