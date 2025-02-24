import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Volume2, VolumeX, HelpCircle, ChevronRight, RefreshCw } from 'lucide-react';

// Main App Component
const GuessMasterApp = () => {
  // Game Logic States
  const [secretNumber, setSecretNumber] = useState('');
  const [digits, setDigits] = useState(['', '', '', '']);
  const [guessHistory, setGuessHistory] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [gameStats, setGameStats] = useState({ totalGames: 0, wins: 0 });
  const [winRate, setWinRate] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  // Keep it as a string
  const [feedbackMessage, setFeedbackMessage] = useState('Enter 4 unique digits');

  // UI States
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState('easy');
  const [showTutorial, setShowTutorial] = useState(false);

  // Timer States
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Input refs for digit fields
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Determine text direction based on language
  const isRTL = language === 'ar';

  // --- Utility Functions ---
  // Generate a secret 4-digit number with unique digits
  const generateSecretNumber = () => {
    let number = '';
    while (number.length < 4) {
      const digit = String(Math.floor(Math.random() * 10));
      if (!number.includes(digit)) number += digit;
    }
    return number;
  };

  // Compare the guess with the secret number and return feedback array
  // 'correct' if digit is in correct position,
  // 'misplaced' if digit exists but in wrong position,
  // 'incorrect' otherwise.
  const compareGuess = (guess, secret) => {
    return guess.split('').map((digit, index) => {
      if (digit === secret[index]) return 'correct';
      if (secret.includes(digit)) return 'misplaced';
      return 'incorrect';
    });
  };

  // Determine if digits array is valid (no state updates to avoid infinite re-render)
  const isInputValid = (digitsArray) => {
    if (digitsArray.some((d) => d === '')) {
      return false;
    }
    if (new Set(digitsArray).size !== 4) {
      return false;
    }
    return true;
  };

  // Get maximum attempts based on difficulty
  const getMaxAttempts = () => {
    switch (difficulty) {
      case 'hard':
        return 3;
      case 'medium':
        return 5;
      case 'easy':
        return Infinity;
      default:
        return Infinity;
    }
  };

  // Format timer from seconds to MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- Effects ---
  // Set secret number and attempts when starting a new game or when difficulty changes
  useEffect(() => {
    setSecretNumber(generateSecretNumber());
    const maxAttempts = getMaxAttempts();
    setRemainingAttempts(maxAttempts === Infinity ? null : maxAttempts);
  }, [difficulty]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // --- Input Handlers ---
  // Update feedback message while user types (avoiding repeated setState in render)
  const handleFeedbackMessage = (newDigits) => {
    if (newDigits.some((d) => d === '')) {
      setFeedbackMessage('Enter 4 unique digits');
    } else if (new Set(newDigits).size !== 4) {
      setFeedbackMessage('All digits must be unique!');
    } else {
      setFeedbackMessage('Ready to submit your guess!');
    }
  };

  // Handle digit changes ensuring only one digit is allowed and uniqueness is maintained.
  const handleDigitChange = (index, value) => {
    // Allow empty value or a single digit that is not already entered
    if (value === '' || (/^\d$/.test(value) && !digits.includes(value))) {
      const newDigits = [...digits];
      newDigits[index] = value;
      setDigits(newDigits);

      // Start timer on first valid input if not already running
      if (!isTimerRunning && value !== '') {
        setIsTimerRunning(true);
      }

      // Auto-focus next input if value entered
      if (value !== '' && index < 3) {
        inputRefs[index + 1].current.focus();
      }

      // Update feedback message based on new digits
      handleFeedbackMessage(newDigits);
    }
  };

  // Clear all digit inputs
  const clearInput = () => {
    setDigits(['', '', '', '']);
    inputRefs[0].current.focus();
    setFeedbackMessage('Enter 4 unique digits');
  };

  // --- Game Handlers ---
  // Submit the current guess and check against the secret number
  const submitGuess = () => {
    if (!isInputValid(digits)) {
      return;
    }

    const guess = digits.join('');
    const feedback = compareGuess(guess, secretNumber);
    const isCorrect = feedback.every((f) => f === 'correct');

    const newGuess = {
      digits: [...digits],
      feedback,
      correct: isCorrect,
    };

    setGuessHistory([newGuess, ...guessHistory]);
    setAttempts(attempts + 1);

    // Update remaining attempts if limited
    if (remainingAttempts !== null) {
      setRemainingAttempts(remainingAttempts - 1);
    }

    // Check win/loss conditions
    if (isCorrect) {
      handleWin();
    } else if (remainingAttempts !== null && remainingAttempts <= 1) {
      handleGameOver();
    } else {
      clearInput();
    }
  };

  // Handle winning the game
  const handleWin = () => {
    setIsTimerRunning(false);
    setGameWon(true);
    setShowGameOver(true);
    // Update stats
    const newStats = {
      totalGames: gameStats.totalGames + 1,
      wins: gameStats.wins + 1,
    };
    setGameStats(newStats);
    setWinRate(Math.round((newStats.wins / newStats.totalGames) * 100));
  };

  // Handle game over (loss)
  const handleGameOver = () => {
    setIsTimerRunning(false);
    setGameWon(false);
    setShowGameOver(true);
    // Update stats
    const newStats = {
      totalGames: gameStats.totalGames + 1,
      wins: gameStats.wins,
    };
    setGameStats(newStats);
    setWinRate(Math.round((newStats.wins / newStats.totalGames) * 100));
  };

  // Start a new game by resetting all game-related states
  const startNewGame = () => {
    clearInput();
    setGuessHistory([]);
    setTimer(0);
    setAttempts(0);
    setShowGameOver(false);
    setGameWon(false);
    setIsTimerRunning(false);
    setSecretNumber(generateSecretNumber());
    const maxAttempts = getMaxAttempts();
    setRemainingAttempts(maxAttempts === Infinity ? null : maxAttempts);
  };

  // --- UI Handlers ---
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // --- Translations ---
  const getText = (key) => {
    const translations = {
      title: { en: 'Guess Master', ar: 'سيد التخمين' },
      easy: { en: 'Easy', ar: 'سهل' },
      medium: { en: 'Medium', ar: 'متوسط' },
      hard: { en: 'Hard', ar: 'صعب' },
      attempts: { en: 'Attempts', ar: 'المحاولات' },
      unlimited: { en: 'Unlimited', ar: 'غير محدود' },
      remaining: { en: 'Remaining', ar: 'متبقي' },
      timer: { en: 'Timer', ar: 'الوقت' },
      winRate: { en: 'Win Rate', ar: 'معدل الفوز' },
      submit: { en: 'Submit', ar: 'إرسال' },
      clear: { en: 'Clear', ar: 'مسح' },
      history: { en: 'History', ar: 'التاريخ' },
      congratulations: { en: 'Congratulations!', ar: 'تهانينا!' },
      gameOver: { en: 'Game Over', ar: 'انتهت اللعبة' },
      playAgain: { en: 'Play Again', ar: 'العب مرة أخرى' },
      finalTime: { en: 'Final Time', ar: 'الوقت النهائي' },
      finalAttempts: { en: 'Attempts Used', ar: 'المحاولات المستخدمة' },
      accuracy: { en: 'Accuracy', ar: 'الدقة' },
      howToPlay: { en: 'How to Play', ar: 'كيفية اللعب' },
      close: { en: 'Close', ar: 'إغلاق' },
      tutorial1: {
        en: 'Guess a 4-digit number with all digits being unique.',
        ar: 'خمن رقمًا مكونًا من 4 أرقام، جميع الأرقام فريدة.'
      },
      tutorial2: {
        en: 'After each guess, you will receive feedback:',
        ar: 'بعد كل تخمين، ستحصل على ملاحظات:'
      },
      tutorial3: {
        en: 'Green: Correct digit in the correct position',
        ar: 'أخضر: رقم صحيح في المكان الصحيح'
      },
      tutorial4: {
        en: 'Orange: Correct digit in the wrong position',
        ar: 'برتقالي: رقم صحيح في المكان الخطأ'
      },
      tutorial5: {
        en: 'Red: Incorrect digit',
        ar: 'أحمر: رقم غير صحيح'
      },
      credit: {
        en: 'Designed by Guess Master Team',
        ar: 'صممه فريق سيد التخمين'
      },
    };

    return translations[key][language] || key;
  };

  // --- Animation Components ---
  const AnimatedBackground = () => (
    <div
      className={`fixed inset-0 overflow-hidden -z-10 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-blue-50'
      }`}
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"
          style={{
            backgroundColor:
              i % 2 === 0
                ? theme === 'dark'
                  ? '#4338ca'
                  : '#60a5fa'
                : theme === 'dark'
                ? '#7e22ce'
                : '#34d399',
            width: `${Math.random() * 30 + 10}%`,
            height: `${Math.random() * 30 + 10}%`,
            top: `${Math.random() * 70}%`,
            left: `${Math.random() * 70}%`,
            animationDelay: `${i * 2}s`,
            animationDuration: `${20 + i * 5}s`,
          }}
        />
      ))}
    </div>
  );

  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none">
      {[...Array(100)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            backgroundColor: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981'][
              i % 4
            ],
            top: '-10px',
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 3 + 2}s`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`min-h-screen flex flex-col font-sans ${
        theme === 'dark' ? 'text-white' : 'text-gray-800'
      } transition-colors duration-300`}
    >
      <AnimatedBackground />

      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={
              theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
            }
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {language === 'en' ? 'AR' : 'EN'}
          </button>
          <button
            onClick={toggleSound}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
        <button
          onClick={() => setShowTutorial(true)}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Help"
        >
          <HelpCircle size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 pb-8 max-w-lg mx-auto w-full">
        {/* Title */}
        <div className="my-6 text-center">
          <h1 className="text-4xl font-bold mb-2 relative inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              {getText('title')}
            </span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
            <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full animate-ping delay-300"></span>
          </h1>
        </div>

        {/* Difficulty Selector */}
        <div className="w-full mb-8">
          <div className="flex justify-between border rounded-lg overflow-hidden">
            {['easy', 'medium', 'hard'].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`flex-1 py-2 text-center transition-colors ${
                  difficulty === level
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div>{getText(level)}</div>
                <div className="text-xs mt-1">
                  {level === 'easy'
                    ? getText('unlimited')
                    : level === 'medium'
                    ? '5'
                    : '3'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Game Status Panel */}
        <div className="grid grid-cols-3 gap-4 w-full mb-6">
          <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">{getText('attempts')}</div>
            <div className="font-medium">
              {remainingAttempts === null
                ? `${attempts}`
                : `${remainingAttempts} ${getText('remaining')}`}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">{getText('timer')}</div>
            <div className="font-medium">{formatTime(timer)}</div>
          </div>
          <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">{getText('winRate')}</div>
            <div className="font-medium">{winRate}%</div>
          </div>
        </div>

        {/* Digit Input Section */}
        <div className="w-full mb-8">
          <div className="flex justify-between gap-2 mb-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                className={`w-16 h-16 text-center text-2xl font-bold rounded-lg border-2 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span
                className={`${
                  feedbackMessage.includes('Ready')
                    ? 'text-green-500'
                    : feedbackMessage.includes('All digits must')
                    ? 'text-red-500'
                    : 'text-yellow-500'
                }`}
              >
                {feedbackMessage || 'Enter 4 unique digits'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearInput}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                {getText('clear')}
              </button>
              <button
                onClick={submitGuess}
                disabled={!isInputValid(digits)}
                className={`px-4 py-2 rounded-lg ${
                  isInputValid(digits)
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                } transition-colors flex items-center gap-1`}
              >
                {getText('submit')}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Guess History */}
        {guessHistory.length > 0 && (
          <div className="w-full mb-4">
            <h2 className="text-lg font-semibold mb-2">{getText('history')}</h2>
            <div className="space-y-3">
              {guessHistory.map((guess, guessIndex) => (
                <div
                  key={guessIndex}
                  className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg"
                >
                  <div className="flex justify-between gap-2">
                    {guess.digits.map((digit, digitIndex) => (
                      <div
                        key={digitIndex}
                        className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded-lg ${{
                          correct: 'bg-green-500 text-white',
                          misplaced: 'bg-yellow-500 text-white',
                          incorrect: 'bg-red-500 text-white',
                        }[guess.feedback[digitIndex]]}`}
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-sm text-gray-500 dark:text-gray-400">
        {getText('credit')}
      </footer>

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl ${{
              true: 'text-right',
              false: 'text-left',
            }[isRTL]}`}
          >
            <h2 className="text-xl font-bold mb-4">{getText('howToPlay')}</h2>
            <div className="space-y-3 mb-6">
              <p>{getText('tutorial1')}</p>
              <p>{getText('tutorial2')}</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                  <span>{getText('tutorial3')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
                  <span>{getText('tutorial4')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                  <span>{getText('tutorial5')}</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              {getText('close')}
            </button>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {showGameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          {gameWon && <Confetti />}
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl ${{
              true: 'text-right',
              false: 'text-left',
            }[isRTL]}`}
          >
            <h2 className="text-2xl font-bold mb-4 text-center">
              {gameWon ? (
                <span className="text-green-500">{getText('congratulations')}</span>
              ) : (
                <span className="text-red-500">{getText('gameOver')}</span>
              )}
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span>{getText('finalTime')}</span>
                <span className="font-bold">{formatTime(timer)}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span>{getText('finalAttempts')}</span>
                <span className="font-bold">{attempts}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span>{getText('accuracy')}</span>
                <span className="font-bold">
                  {attempts > 0 ? Math.round((1 / attempts) * 100) : 0}%
                </span>
              </div>
            </div>

            <button
              onClick={startNewGame}
              className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              {getText('playAgain')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Global CSS styles for animations and inputs
const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes blob {
      0% {
        transform: translate(0, 0) scale(1);
      }
      33% {
        transform: translate(30%, 20%) scale(1.1);
      }
      66% {
        transform: translate(-20%, 10%) scale(0.9);
      }
      100% {
        transform: translate(0, 0) scale(1);
      }
    }

    @keyframes confetti {
      0% {
        transform: translateY(0) rotate(0);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }

    .animate-blob {
      animation: blob 25s infinite alternate;
    }

    .animate-confetti {
      animation: confetti 5s ease-in-out forwards;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    input[type='number'] {
      -moz-appearance: textfield;
    }
  `}</style>
);

// Quick Manual Tests (Additional)
// 1) Type only 3 unique digits => feedbackMessage: 'Enter 4 unique digits'
// 2) Type 4 digits but repeated => feedbackMessage: 'All digits must be unique!'
// 3) Type 4 unique digits => feedbackMessage: 'Ready to submit your guess!'
// 4) Submit guess => Expect guess history to appear
// 5) Hard mode => Only 3 attempts. On 3rd guess if wrong => Game Over

const App = () => {
  return (
    <>
      <GlobalStyles />
      <GuessMasterApp />
    </>
  );
};

export default App;
