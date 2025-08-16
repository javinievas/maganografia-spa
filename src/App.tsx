import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, RotateCcw, Trophy, Star } from 'lucide-react';

const LEVELS = [
  { id: 1, keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'ñ'], name: "Nivel 1" },
  { id: 2, keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'], name: "Nivel 2" },
  { id: 3, keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'], name: "Nivel 3" },
  { id: 4, keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '´', '+', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'], name: "Nivel 4" },
  { id: 5, keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '´', '+', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ', 'z', 'x', 'c', 'v', 'b', 'n', 'm'], name: "Nivel 5" },
  { id: 6, keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '´', '+', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'], name: "Nivel 6" },
  { id: 7, keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'º', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '´', '+', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'], name: "Nivel 7" },
  { id: 8, keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'º', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '´', '+', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-', '¡', '!', '?', '¿', '@', '#', '$', '%', '&', '/', '(', ')', '='], name: "Nivel 8" }
];

const KEYBOARD_LAYOUT = [
  [
    { key: 'º', label: 'º' },
    { key: '1', label: '1' },
    { key: '2', label: '2' },
    { key: '3', label: '3' },
    { key: '4', label: '4' },
    { key: '5', label: '5' },
    { key: '6', label: '6' },
    { key: '7', label: '7' },
    { key: '8', label: '8' },
    { key: '9', label: '9' },
    { key: '0', label: '0' },
    { key: "'", label: "'" },
    { key: '¡', label: '¡' },
    { key: '¿', label: '¿' }
  ],
  [
    { key: 'q', label: 'Q' },
    { key: 'w', label: 'W' },
    { key: 'e', label: 'E' },
    { key: 'r', label: 'R' },
    { key: 't', label: 'T' },
    { key: 'y', label: 'Y' },
    { key: 'u', label: 'U' },
    { key: 'i', label: 'I' },
    { key: 'o', label: 'O' },
    { key: 'p', label: 'P' },
    { key: '´', label: '´' },
    { key: '+', label: '+' },
    { key: '}', label: '}' }
  ],
  [
    { key: 'a', label: 'A' },
    { key: 's', label: 'S' },
    { key: 'd', label: 'D' },
    { key: 'f', label: 'F' },
    { key: 'g', label: 'G' },
    { key: 'h', label: 'H' },
    { key: 'j', label: 'J' },
    { key: 'k', label: 'K' },
    { key: 'l', label: 'L' },
    { key: 'ñ', label: 'Ñ' },
    { key: '{', label: '{' },
    { key: '}', label: '}' }
  ],
  [
    { key: 'z', label: 'Z' },
    { key: 'x', label: 'X' },
    { key: 'c', label: 'C' },
    { key: 'v', label: 'V' },
    { key: 'b', label: 'B' },
    { key: 'n', label: 'N' },
    { key: 'm', label: 'M' },
    { key: ',', label: ',' },
    { key: '.', label: '.' },
    { key: '-', label: '-' },
    { key: '_', label: '_' }
  ],
  [
    { key: ' ', label: 'ESPACIO', wide: true }
  ]
];

const generateExercise = (levelKeys, length = 5) => {
  let exercise = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * levelKeys.length);
    exercise += levelKeys[randomIndex];
  }
  return exercise;
};

const App = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [exercise, setExercise] = useState('');
  const [userInput, setUserInput] = useState('');
  const [activeKeys, setActiveKeys] = useState([]);
  const [correctKeys, setCorrectKeys] = useState([]);
  const [incorrectKeys, setIncorrectKeys] = useState([]);
  const [pressedKey, setPressedKey] = useState('');
  const [progress, setProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [completedLevels, setCompletedLevels] = useState([1]);
  const [startTime, setStartTime] = useState(null);
  const [accuracy, setAccuracy] = useState(100);
  const [wpm, setWpm] = useState(0);

  const currentLevelData = LEVELS.find(level => level.id === currentLevel);
  const levelKeys = currentLevelData?.keys || [];

  const generateNewExercise = useCallback(() => {
    const newExercise = generateExercise(levelKeys, 5 + currentLevel);
    setExercise(newExercise);
    setUserInput('');
    setActiveKeys(newExercise.split(''));
    setCorrectKeys([]);
    setIncorrectKeys([]);
    setPressedKey('');
    setStartTime(Date.now());
  }, [currentLevel, levelKeys]);

  useEffect(() => {
    generateNewExercise();
  }, [currentLevel, generateNewExercise]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      setPressedKey(key);
      
      // Reset pressed key after animation
      setTimeout(() => setPressedKey(''), 150);

      if (userInput.length >= exercise.length) return;

      const expectedChar = exercise[userInput.length];
      const newInput = userInput + key;

      if (key === expectedChar) {
        setCorrectKeys(prev => [...prev, key]);
        // Play correct sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 523.25; // C5
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      } else {
        setIncorrectKeys(prev => [...prev, key]);
        // Play error sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 220; // A3
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
      }

      setUserInput(newInput);

      if (newInput.length === exercise.length) {
        const isCorrect = newInput === exercise;
        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000 / 60; // minutes
        const newWpm = Math.round(exercise.length / 5 / timeTaken) || 0;
        const newAccuracy = Math.round((exercise.length - incorrectKeys.length) / exercise.length * 100) || 0;
        
        setWpm(newWpm);
        setAccuracy(newAccuracy);

        if (isCorrect) {
          const newProgress = Math.min(100, progress + (100 / 5));
          setProgress(newProgress);
          
          if (newProgress >= 100) {
            setShowCelebration(true);
            setTimeout(() => {
              if (currentLevel < LEVELS.length) {
                const nextLevel = currentLevel + 1;
                setCurrentLevel(nextLevel);
                setCompletedLevels(prev => [...prev, nextLevel]);
                setProgress(0);
              }
              setShowCelebration(false);
            }, 3000);
          } else {
            setTimeout(generateNewExercise, 1000);
          }
        } else {
          setTimeout(() => {
            setUserInput('');
            setCorrectKeys([]);
            setIncorrectKeys([]);
          }, 1000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userInput, exercise, startTime, progress, currentLevel, incorrectKeys, generateNewExercise]);

  const resetLevel = () => {
    setProgress(0);
    setAccuracy(100);
    setWpm(0);
    generateNewExercise();
  };

  const getKeyStatus = (key) => {
    if (activeKeys.includes(key)) {
      if (correctKeys.includes(key) && exercise[correctKeys.length - 1] === key) {
        return 'correct';
      }
      if (incorrectKeys.includes(key)) {
        return 'incorrect';
      }
      return 'active';
    }
    if (pressedKey === key) {
      return 'pressed';
    }
    return 'inactive';
  };

  const renderKeyboard = () => {
    return KEYBOARD_LAYOUT.map((row, rowIndex) => (
      <div key={rowIndex} className="flex justify-center gap-1 mb-2">
        {row.map((keyObj) => {
          const status = getKeyStatus(keyObj.key);
          const isWide = keyObj.wide;
          
          return (
            <motion.button
              key={keyObj.key}
              animate={{
                scale: status === 'pressed' ? 0.9 : 1,
                backgroundColor: status === 'correct' ? '#4ade80' : 
                               status === 'incorrect' ? '#f87171' : 
                               status === 'active' ? '#fbbf24' : 
                               status === 'pressed' ? '#c084fc' : 
                               darkMode ? '#374151' : '#e5e7eb'
              }}
              transition={{ duration: 0.15 }}
              className={`
                ${isWide ? 'w-64' : 'w-12 h-12'}
                rounded-lg font-bold text-lg flex items-center justify-center transition-all duration-200
                ${darkMode ? 'text-white' : 'text-gray-800'}
                ${status === 'correct' ? 'shadow-lg shadow-green-300' : ''}
                ${status === 'incorrect' ? 'shadow-lg shadow-red-300' : ''}
                ${status === 'active' ? 'shadow-lg shadow-yellow-200' : ''}
              `}
            >
              {keyObj.label}
            </motion.button>
          );
        })}
      </div>
    ));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-900'}`}>
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-600">Aprende a Escribir</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full ${darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-yellow-400'}`}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button
            onClick={resetLevel}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </header>

      {/* Progress and Level Info */}
      <div className="px-6 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-semibold">{currentLevelData?.name}</h2>
          <span className="text-lg font-medium">Nivel {currentLevel} de {LEVELS.length}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <motion.div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Stats */}
        <div className="flex justify-between text-sm">
          <span>Exactitud: {accuracy}%</span>
          <span>PPM: {wpm}</span>
        </div>
      </div>

      {/* Exercise Display */}
      <div className="px-6 mb-8">
        <div className={`text-center p-8 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-4xl font-mono mb-6">
            {exercise.split('').map((char, index) => (
              <span
                key={index}
                className={`
                  inline-block mx-1 px-2 py-1 rounded
                  ${index < userInput.length
                    ? userInput[index] === char
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                    : index === userInput.length
                    ? 'bg-yellow-200 text-yellow-800 animate-pulse'
                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                  }
                `}
              >
                {char === ' ' ? '␣' : char}
              </span>
            ))}
          </div>
          
          <div className="text-xl">
            Escribe: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
              {userInput}
            </span>
          </div>
          
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Usa tu teclado físico para escribir las letras que aparecen arriba
          </p>
        </div>
      </div>

      {/* Keyboard */}
      <div className="px-4 pb-8">
        <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {renderKeyboard()}
        </div>
      </div>

      {/* Level Navigation */}
      <div className="px-6 mb-8">
        <div className="flex flex-wrap justify-center gap-2">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => {
                setCurrentLevel(level.id);
                setProgress(0);
                setAccuracy(100);
                setWpm(0);
              }}
              disabled={!completedLevels.includes(level.id) && level.id !== currentLevel}
              className={`
                px-4 py-2 rounded-full font-medium transition-all
                ${level.id === currentLevel 
                  ? 'bg-purple-500 text-white shadow-lg' 
                  : completedLevels.includes(level.id)
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {level.id}
            </button>
          ))}
        </div>
      </div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 p-8 rounded-3xl text-center text-white shadow-2xl"
            >
              <Trophy size={64} className="mx-auto mb-4 text-yellow-300" />
              <h2 className="text-4xl font-bold mb-2">¡Felicidades!</h2>
              <p className="text-2xl mb-4">¡Has completado el {currentLevelData?.name}!</p>
              <div className="flex justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 0 }}
                    animate={{ y: [0, -20, 0] }}
                    transition={{ delay: i * 0.2, duration: 0.6 }}
                  >
                    <Star size={32} className="text-yellow-300" fill="currentColor" />
                  </motion.div>
                ))}
              </div>
              {currentLevel < LEVELS.length && (
                <p className="text-xl mt-4">¡Prepárate para el siguiente nivel!</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;