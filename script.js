'use strict';

const DOCUMENT = document;
const STORAGE = localStorage;

DOCUMENT.addEventListener('DOMContentLoaded', () => {
  // Element selections
  const body = DOCUMENT.body;
  const themeBtn = DOCUMENT.getElementById('theme-btn');
  const languageBtn = DOCUMENT.getElementById('language-btn');
  const volumeBtn = DOCUMENT.getElementById('volume-btn');
  const helpBtn = DOCUMENT.getElementById('help-btn');
  const tutorialOverlay = DOCUMENT.querySelector('.tutorial-overlay');
  const tutorialCloseBtn = DOCUMENT.getElementById('tutorial-close-btn');
  const difficultyBtns = DOCUMENT.querySelectorAll('.difficulty-btn');
  const attemptsCounter = DOCUMENT.querySelector('.attempts-counter');
  const timerDisplay = DOCUMENT.getElementById('timer');
  const winRateDisplay = DOCUMENT.getElementById('win-rate');
  const digitInputs = Array.from(DOCUMENT.querySelectorAll('.digit-input'));
  const clearInputBtn = DOCUMENT.getElementById('clear-input');
  const inputFeedback = DOCUMENT.getElementById('input-feedback');
  const submitBtn = DOCUMENT.getElementById('submit-btn');
  const guessesGrid = DOCUMENT.getElementById('guesses-grid');
  const gameOverlay = DOCUMENT.querySelector('.game-overlay');
  const resultMessage = DOCUMENT.getElementById('result-message');
  const resultTime = DOCUMENT.getElementById('stat-time');
  const resultAttempts = DOCUMENT.getElementById('stat-attempts');
  const resultAccuracy = DOCUMENT.getElementById('stat-accuracy');
  const resetBtn = DOCUMENT.getElementById('reset-btn');
  const textElements = DOCUMENT.querySelectorAll('[data-en], [data-ar]');
  const resultTitleEl = DOCUMENT.querySelector('.result-title');
  const confettiContainer = DOCUMENT.getElementById('confetti-container');

  // Audio elements for sound effects
  const soundSuccess = DOCUMENT.getElementById('sound-success');
  const soundError = DOCUMENT.getElementById('sound-error');

  // Game variables
  let secretNumber = generateSecretNumber();
  let maxAttempts = 5; // default for medium
  let attempts;
  let timerInterval;
  let startTime;
  let currentDifficulty = 'medium';
  let gameActive = true;
  let currentLanguage = STORAGE.getItem('language') || 'en';
  let isDarkMode = STORAGE.getItem('theme') === 'dark';
  let isSoundOn = STORAGE.getItem('sound') !== 'off';

  /* ====================
     INITIALIZATION
  ===================== */
  function initializeGame() {
    setTheme(isDarkMode);
    setLanguage(currentLanguage);
    updateDifficultyUI(currentDifficulty);
    resetGame();
    setupEventListeners();
  }

  /* ====================
     THEME HANDLERS
  ===================== */
  function setTheme(darkMode) {
    isDarkMode = darkMode;
    STORAGE.setItem('theme', darkMode ? 'dark' : 'light');
    body.classList.toggle('dark-mode', darkMode);
  }
  function toggleTheme() {
    setTheme(!isDarkMode);
  }

  /* ====================
     LANGUAGE HANDLERS
  ===================== */
  function setLanguage(lang) {
    currentLanguage = lang;
    STORAGE.setItem('language', lang);
    updateTextContent();
    updateInputFeedback();
  }
  function toggleLanguage() {
    languageBtn.classList.add('fade-out');
    setTimeout(() => {
      setLanguage(currentLanguage === 'en' ? 'ar' : 'en');
      languageBtn.classList.remove('fade-out');
      languageBtn.classList.add('fade-in');
      setTimeout(() => languageBtn.classList.remove('fade-in'), 300);
    }, 300);
  }
  function updateTextContent() {
    textElements.forEach(el => {
      const txt = el.getAttribute(`data-${currentLanguage}`);
      if (txt) el.textContent = txt;
    });
    body.setAttribute('dir', currentLanguage === 'ar' ? 'rtl' : 'ltr');
  }
  function updateInputFeedback() {
    const hintText = inputFeedback.getAttribute(`data-${currentLanguage}`);
    inputFeedback.textContent = hintText;
  }

  /* ====================
     VOLUME HANDLERS
  ===================== */
  function toggleSound() {
    isSoundOn = !isSoundOn;
    STORAGE.setItem('sound', isSoundOn ? 'on' : 'off');
    volumeBtn.classList.toggle('muted', !isSoundOn);
  }

  /* ====================
     DIFFICULTY HANDLERS
  ===================== */
  function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    updateDifficultyUI(difficulty);
    if (difficulty === 'easy') maxAttempts = Infinity;
    else if (difficulty === 'medium') maxAttempts = 5;
    else if (difficulty === 'hard') maxAttempts = 3;
    resetGame();
  }
  function updateDifficultyUI(difficulty) {
    difficultyBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
  }

  /* ====================
     CUSTOM DIGIT INPUT HANDLERS
  ===================== */
  function getCombinedInput() {
    return digitInputs.map(input => input.value).join('');
  }
  function clearInputs() {
    digitInputs.forEach(input => (input.value = ''));
    digitInputs[0].focus();
    updateSubmitState();
  }
  function updateSubmitState() {
    const guess = getCombinedInput();
    let message = '';
    if (guess.length < 4) {
      message = currentLanguage === 'ar' ? 'أدخل 4 أرقام' : 'Enter 4 digits';
      submitBtn.disabled = true;
    } else if (new Set(guess).size < 4) {
      message = currentLanguage === 'ar' ? 'الأرقام يجب أن تكون فريدة' : 'Digits must be unique';
      submitBtn.disabled = true;
    } else {
      message = currentLanguage === 'ar' ? 'تخمين صحيح!' : 'Valid guess!';
      submitBtn.disabled = false;
    }
    inputFeedback.textContent = message;
  }
  digitInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '');
      if (input.value && index < digitInputs.length - 1) {
        digitInputs[index + 1].focus();
      }
      updateSubmitState();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        digitInputs[index - 1].focus();
      }
    });
  });
  clearInputBtn.addEventListener('click', clearInputs);

  /* ====================
     GAME LOGIC
  ===================== */
  function generateSecretNumber() {
    let number = '';
    while (number.length < 4) {
      const digit = String(Math.floor(Math.random() * 10));
      if (!number.includes(digit)) number += digit;
    }
    return number;
  }
  function resetGame() {
    secretNumber = generateSecretNumber();
    attempts = maxAttempts === Infinity ? '∞' : maxAttempts;
    gameActive = true;
    attemptsCounter.textContent = attempts;
    guessesGrid.innerHTML = '';
    clearInputs();
    submitBtn.disabled = true;
    gameOverlay.hidden = true;
    clearInterval(timerInterval);
    timerDisplay.textContent = '0:00';
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    digitInputs[0].focus();
  }
  function updateTimer() {
    if (!gameActive) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  function stopTimer() {
    clearInterval(timerInterval);
    return timerDisplay.textContent;
  }
  function compareGuess(guess, secret) {
    let feedback = '';
    for (let i = 0; i < 4; i++) {
      if (guess[i] === secret[i]) feedback += '+';
      else if (secret.includes(guess[i])) feedback += '-';
      else feedback += ' ';
    }
    return feedback;
  }
  function displayGuessFeedback(guess, feedback) {
    const row = DOCUMENT.createElement('div');
    row.classList.add('guess-row');
    for (let i = 0; i < 4; i++) {
      const box = DOCUMENT.createElement('div');
      box.classList.add('digit-box');
      box.textContent = guess[i];
      if (feedback[i] === '+') box.classList.add('correct');
      else if (feedback[i] === '-') box.classList.add('misplaced');
      else box.classList.add('incorrect');
      row.appendChild(box);
    }
    guessesGrid.prepend(row);
  }
  function handleGuessSubmit() {
    if (!gameActive) return;
    const guess = getCombinedInput();
    if (guess.length !== 4 || new Set(guess).size < 4) return;
    if (maxAttempts !== Infinity) {
      attempts--;
      attemptsCounter.textContent = attempts;
    }
    clearInputs();
    const feedback = compareGuess(guess, secretNumber);
    displayGuessFeedback(guess, feedback);
    submitBtn.classList.add('clicked');
    setTimeout(() => submitBtn.classList.remove('clicked'), 150);
    if (feedback === '++++') {
      if (isSoundOn) soundSuccess.play();
      if (navigator.vibrate) navigator.vibrate(200);
      gameWon();
    } else {
      if (isSoundOn) soundError.play();
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      if (maxAttempts !== Infinity && attempts <= 0) {
        gameLost();
      }
    }
  }
  function calculateAccuracy() {
    const total = guessesGrid.children.length;
    const perfectGuesses = Array.from(guessesGrid.children).filter(row =>
      Array.from(row.children).every(box => box.classList.contains('correct'))
    ).length;
    return total ? Math.round((perfectGuesses / total) * 100) : 0;
  }
  function gameWon() {
    gameActive = false;
    const finalTime = stopTimer();
    gameOverlay.hidden = false;
    launchConfetti();
    resultTitleEl.textContent = currentLanguage === 'en' ? 'You Win!' : 'أنت فزت!';
    resultMessage.textContent =
      currentLanguage === 'en'
        ? 'You cracked the code!'
        : 'لقد نجحت في فك الشفرة!';
    resultTime.textContent = finalTime;
    resultAttempts.textContent =
      maxAttempts === Infinity ? '-' : (maxAttempts - attempts);
    resultAccuracy.textContent = `${calculateAccuracy()}%`;
    updateStats(
      true,
      finalTime,
      maxAttempts === Infinity ? 0 : (maxAttempts - attempts),
      calculateAccuracy()
    );
  }
  function gameLost() {
    gameActive = false;
    const finalTime = stopTimer();
    gameOverlay.hidden = false;
    resultTitleEl.textContent =
      currentLanguage === 'en' ? 'Game Over' : 'اللعبة انتهت';
    resultMessage.textContent =
      currentLanguage === 'en'
        ? `The number was ${secretNumber}`
        : `الرقم كان ${secretNumber}`;
    resultTime.textContent = finalTime;
    resultAttempts.textContent = maxAttempts === Infinity ? '-' : maxAttempts;
    resultAccuracy.textContent = `${calculateAccuracy()}%`;
    resultTitleEl.classList.add('shake');
    setTimeout(() => resultTitleEl.classList.remove('shake'), 500);
    updateStats(
      false,
      finalTime,
      maxAttempts === Infinity ? 0 : maxAttempts,
      calculateAccuracy()
    );
  }
  function updateStats(win, time, attemptsUsed, accuracy) {
    let stats =
      JSON.parse(STORAGE.getItem('gameStats')) ||
      { wins: 0, losses: 0, totalTime: 0, totalAttempts: 0, games: 0 };
    if (win) stats.wins++;
    else stats.losses++;
    stats.totalTime += parseTimeToSeconds(time);
    stats.totalAttempts += attemptsUsed;
    stats.games++;
    STORAGE.setItem('gameStats', JSON.stringify(stats));
    winRateDisplay.textContent = stats.games
      ? `${Math.round((stats.wins / stats.games) * 100)}%`
      : '0%';
  }
  function parseTimeToSeconds(timeStr) {
    const parts = timeStr.split(':').map(Number);
    return parts[0] * 60 + parts[1];
  }

  /* ====================
     CONFETTI ANIMATION
  ===================== */
  function launchConfetti() {
    confettiContainer.hidden = false;
    for (let i = 0; i < 50; i++) {
      const confetti = DOCUMENT.createElement('div');
      confetti.classList.add('confetti');
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
      confetti.style.animationDuration = 1 + Math.random() * 2 + 's';
      confettiContainer.appendChild(confetti);
    }
    setTimeout(() => {
      confettiContainer.innerHTML = '';
      confettiContainer.hidden = true;
    }, 2500);
  }

  /* ====================
     TUTORIAL / HELP HANDLERS
  ===================== */
  function showTutorial() {
    tutorialOverlay.hidden = false;
  }
  function hideTutorial() {
    tutorialOverlay.hidden = true;
  }

  /* ====================
     EVENT LISTENERS
  ===================== */
  function setupEventListeners() {
    themeBtn.addEventListener('click', toggleTheme);
    languageBtn.addEventListener('click', toggleLanguage);
    volumeBtn.addEventListener('click', toggleSound);
    helpBtn.addEventListener('click', showTutorial);
    tutorialCloseBtn.addEventListener('click', hideTutorial);
    difficultyBtns.forEach(btn => {
      btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
    });
    submitBtn.addEventListener('click', handleGuessSubmit);
    resetBtn.addEventListener('click', resetGame);
    digitInputs[digitInputs.length - 1].addEventListener('keydown', e => {
      if (e.key === 'Enter' && !submitBtn.disabled) {
        handleGuessSubmit();
      }
    });
  }

  // Initialize the game
  initializeGame();
});
