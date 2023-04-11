const guessInput = document.getElementById("guess");
const submitBtn = document.getElementById("submit-btn");
const message = document.getElementById("message");
const guessesGrid = document.getElementById("guesses-grid");

let hiddenNumber = generateHiddenNumber();
let attempts = 5;

guessInput.addEventListener("input", () => {
  submitBtn.disabled = !isValidGuess(guessInput.value);
});

submitBtn.addEventListener("click", () => {
  const guess = guessInput.value;
  const feedback = compareGuess(hiddenNumber, guess);

  if (feedback === "+4") {
    message.textContent = "Congratulations! You've won the game!";
    submitBtn.disabled = true;
  } else {
    attempts--;

    if (attempts === 0) {
      message.textContent = `Game over! The hidden number was ${hiddenNumber}.`;
      submitBtn.disabled = true;
    } else {
      addToGuessesGrid(guess, feedback);
    }
  }

  guessInput.value = "";
  submitBtn.disabled = true;
});

function generateHiddenNumber() {
  let number = "";
  while (number.length < 4) {
    const randomDigit = Math.floor(Math.random() * 10);
    if (!number.includes(randomDigit)) {
      number += randomDigit;
    }
  }
  return number;
}

function isValidGuess(guess) {
  return guess.length === 4 && new Set(guess).size === 4 && /^\d+$/.test(guess);
}

function compareGuess(hiddenNumber, guess) {
  let correctDigits = 0;
  let misplacedDigits = 0;

  for (let i = 0; i < 4; i++) {
    if (hiddenNumber[i] === guess[i]) {
      correctDigits++;
    } else if (hiddenNumber.includes(guess[i])) {
      misplacedDigits++;
    }
  }

  return `+${correctDigits}, -${misplacedDigits}`;
}

function addToGuessesGrid(guess, feedback) {
  const guessElement = document.createElement("div");
  guessElement.textContent = `${guess} (${feedback})`;
  guessesGrid.appendChild(guessElement);
  message.textContent = `Remaining attempts: ${attempts}.`;
}
