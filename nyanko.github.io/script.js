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
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy', 'booru', 'loli'
];

const nsfwDomains = [
  'pornhub.com', 'xvideos.com', 'redtube.com', 'xhamster.com',
  'xnxx.com', 'onlyfans.com', 'rule34', 'hentai', 'erome.com',
  'furaffinity.net', 'nhentai.net', 'e621.net', 'realbooru.com', 'booru'
];

const normalSprite = 'assets/1.webp';
const nervousSprite = 'assets/4.webp';
const blinkSprite = 'assets/13.webp';
const mockingSprite = 'assets/5.webp';

let blinkTimeout = null;
let eyesOpenTimeout = null;
let isNervous = false;

let nsfwCount = 0;
const NSFW_LIMIT = 3;

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
    }, 150);
  }

  blinkTimeout = setTimeout(blinkCycle, 3000);
}

function stopBlinkingAndSetSprite(sprite) {
  clearTimeout(blinkTimeout);
  clearTimeout(eyesOpenTimeout);
  miyuImg.src = sprite;
}

function containsNSFW(query) {
  const lowered = query.toLowerCase();
  return nsfwWords.some(word => lowered.includes(word));
}

function isNSFWDomain(link) {
  const url = link.toLowerCase();
  return nsfwDomains.some(domain => url.includes(domain));
}

function saveSearchTerm(term) {
  if (!term) return;
  let searches = JSON.parse(localStorage.getItem('nyanko_searches')) || {};
  searches[term] = (searches[term] || 0) + 1;
  localStorage.setItem('nyanko_searches', JSON.stringify(searches));
}

function getUserTopSearches(limit = 10) {
  let searches = JSON.parse(localStorage.getItem('nyanko_searches')) || {};
  return Object.entries(searches)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, limit);
}

input.addEventListener('input', () => {
  const query = input.value.toLowerCase().trim();
  suggestionsContainer.innerHTML = '';
  if (!query) return;

  const userTop = getUserTopSearches(10).filter(term => term.startsWith(query));

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

document.addEventListener('click', (e) => {
  if (!suggestionsContainer.contains(e.target) && e.target !== input) {
    suggestionsContainer.innerHTML = '';
  }
});

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;

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
  isNervous = false;
  miyuTalk.classList.remove('visible');
  miyuTalk.classList.add('hidden');

  startBlinking();
  saveSearchTerm(query);
  suggestionsContainer.innerHTML = '';

  const searchContainer = document.querySelector('#search-container') || form.parentElement;
  if (searchContainer) searchContainer.classList.add('shifted');
  miyuImg.classList.add('shifted');
  miyuTalk.classList.add('shifted');

  const resultsWindow = document.getElementById('results-window');
  resultsWindow.classList.remove('active');

  setTimeout(async () => {
    const encoded = encodeURIComponent(query);
    const url = `/api/search?q=${encoded}`;
    const res = await fetch(url);


    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();


      resultsWindow.innerHTML = '';

      if (!data.items || data.items.length === 0) {
        miyuTalk.textContent = "No results... sorry.";
        miyuTalk.classList.add('visible');
        resultsWindow.classList.remove('active');
        return;
      }

      const topItem = data.items[0];

      if (containsNSFW(topItem.link.toLowerCase()) || isNSFWDomain(topItem.link)) {
        stopBlinkingAndSetSprite(mockingSprite);
        miyuTalk.textContent = "blocked... bad kitty.";
        miyuTalk.classList.add('visible');
        resultsWindow.classList.remove('active');
        return;
      }

      const result = document.createElement('div');
      result.className = 'search-result';

      result.innerHTML = `
        <a href="${topItem.link}" target="_blank" class="result-title">${topItem.title}</a>
        <p class="result-snippet">${topItem.snippet}</p>
      `;

      resultsWindow.appendChild(result);
      resultsWindow.classList.add('active');

    } catch (err) {
      console.error('Search failed:', err);
      miyuTalk.textContent = "error... try again?";
      miyuTalk.classList.add('visible');
    }
  }, 500);
});

bgMusic.muted = true;
bgMusic.volume = 0.3;

function playMusicOnClick() {
  bgMusic.muted = false;
  bgMusic.play().catch(() => {});
  document.removeEventListener('click', playMusicOnClick);
}

document.addEventListener('click', playMusicOnClick);

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

startBlinking();

const muteBtn = document.getElementById('mute-btn');

muteBtn.addEventListener('click', () => {
  if (bgMusic.muted) {
    bgMusic.muted = false;
    muteBtn.textContent = 'Mute';
  } else {
    bgMusic.muted = true;
    muteBtn.textContent = 'Unmute';
  }
});

const darkModeToggle = document.getElementById('dark-mode-toggle');

function applyMode(mode) {
  if (mode === 'dark') {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = 'Switch to Light Mode';
  } else {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    darkModeToggle.textContent = 'Switch to Dark Mode';
  }
  localStorage.setItem('mode', mode);
}

// On load, check saved mode or system preference
const savedMode = localStorage.getItem('mode');
if (savedMode) {
  applyMode(savedMode);
} else {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyMode(prefersDark ? 'dark' : 'light');
}

darkModeToggle.addEventListener('click', () => {
  if (document.body.classList.contains('dark-mode')) {
    applyMode('light');
  } else {
    applyMode('dark');
  }
});
