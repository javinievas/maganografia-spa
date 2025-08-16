import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// === Utilidades de audio (sonidos suaves sin archivos externos) ===
function useBeep() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  function getCtx() {
    if (!audioCtxRef.current) {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  }

  const beep = (freq = 660, durationMs = 80, type: OscillatorType = "sine", gain = 0.03) => {
    const ctx = getCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + durationMs / 1000);
  };

  const success = () => beep(880, 70, "triangle", 0.04);
  const error = () => beep(220, 120, "sawtooth", 0.05);
  const keyTap = () => beep(520, 30, "sine", 0.02);

  return { success, error, keyTap };
}

// === Definición de niveles ===
const LEVELS: { name: string; chars: string; description?: string }[] = [
  { name: "Nivel 1", chars: "asdfjklñ", description: "Teclas base" },
  { name: "Nivel 2", chars: "asdfjklñgh", description: "Añade g h" },
  { name: "Nivel 3", chars: "asdfjklñghqwertyuiop", description: "Fila superior letras" },
  { name: "Nivel 4", chars: "asdfjklñghqwertyuiop´+", description: "Acentos y más" },
  { name: "Nivel 5", chars: "asdfjklñghqwertyuiop´+zxcvbnm", description: "Fila inferior letras" },
  { name: "Nivel 6", chars: "asdfjklñghqwertyuiop´+zxcvbnm,.-", description: "Símbolos básicos" },
  { name: "Nivel 7", chars: "asdfjklñghqwertyuiop´+zxcvbnm,.-º1234567890", description: "Números y º" },
  { name: "Nivel 8 (final)", chars: "asdfjklñghqwertyuiop´+zxcvbnm,.-º1234567890¡!¿?@#$%&/()=", description: "Símbolos extra" },
];

// === Distribución del teclado visual (QWERTY ES simplificado) ===
const KEYBOARD_ROWS: string[][] = [
  ["º", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "´", "+"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "-"],
];

const EXTRA_KEYS = ["¡", "!", "¿", "?", "@", "#", "$", "%", "&", "/", "(", ")", "="];

// Normaliza teclas de eventos (p. ej., acento muerto en algunos navegadores)
function normalizeKey(k: string): string {
  if (k === "Dead") return "´"; // tecla de acento suele reportar "Dead"
  if (k === " ") return " ";
  return k;
}

// Genera una secuencia aleatoria para el nivel
function generateSequence(chars: string, length = 30): string {
  const arr = [] as string[];
  for (let i = 0; i < length; i++) {
    const c = chars[Math.floor(Math.random() * chars.length)];
    arr.push(c);
  }
  return arr.join("");
}

// Guarda/carga preferencias simples
const LS_KEYS = {
  THEME: "typing_es_theme",
  UNLOCKED: "typing_es_unlocked",
};

export default function App() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEYS.THEME) === "dark";
    } catch { return false; }
  });

  const [unlocked, setUnlocked] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem(LS_KEYS.UNLOCKED));
      return Number.isFinite(v) ? Math.max(0, Math.min(LEVELS.length - 1, v)) : 0;
    } catch { return 0; }
  });

  const [level, setLevel] = useState<number>(0);
  const [sequence, setSequence] = useState<string>(() => generateSequence(LEVELS[0].chars));
  const [pos, setPos] = useState<number>(0);
  const [correct, setCorrect] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [flashGood, setFlashGood] = useState<string | null>(null);
  const [flashBad, setFlashBad] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finished, setFinished] = useState<boolean>(false);

  const { success, error, keyTap } = useBeep();

  const targetChar = sequence[pos] || "";
  const allowedSet = useMemo(() => new Set(LEVELS[level].chars.split("")), [level]);
  const accuracy = pos === 0 ? 100 : Math.round((correct / pos) * 100);
  const elapsedMin = useMemo(() => (startTime ? (Date.now() - startTime) / 60000 : 0), [startTime, pos]);
  const wpm = useMemo(() => (elapsedMin > 0 ? Math.round((correct / 5) / elapsedMin) : 0), [elapsedMin, correct]);

  // Gestión de teclado
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (finished) return;
      const k = normalizeKey(e.key);
      if (!k) return;
      if (!startTime) setStartTime(Date.now());

      setLastKey(k);
      keyTap();

      setPos((prevPos) => {
        const expected = sequence[prevPos];
        if (!expected) return prevPos;

        if (k === expected) {
          setCorrect((c) => c + 1);
          setFlashGood(k);
          setTimeout(() => setFlashGood(null), 120);
          success();
          const next = prevPos + 1;
          if (next >= sequence.length) {
            setFinished(true);
          }
          return next;
        } else {
          setMistakes((m) => m + 1);
          setFlashBad(k);
          setTimeout(() => setFlashBad(null), 180);
          error();
          return prevPos; // no avanza si es incorrecto
        }
      });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sequence, finished, startTime, success, error, keyTap]);

  // Al completar, desbloquea siguiente si precisión >= 85%
  useEffect(() => {
    if (finished) {
      const pass = accuracy >= 85;
      if (pass && level < LEVELS.length - 1) {
        const nu = Math.max(unlocked, level + 1);
        setUnlocked(nu);
        try { localStorage.setItem(LS_KEYS.UNLOCKED, String(nu)); } catch {}
      }
    }
  }, [finished]);

  // Manejo de tema
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.THEME, dark ? "dark" : "light"); } catch {}
  }, [dark]);

  function restartLevel() {
    setSequence(generateSequence(LEVELS[level].chars));
    setPos(0); setCorrect(0); setMistakes(0); setFinished(false); setStartTime(null);
  }

  function goToLevel(idx: number) {
    setLevel(idx);
    setSequence(generateSequence(LEVELS[idx].chars));
    setPos(0); setCorrect(0); setMistakes(0); setFinished(false); setStartTime(null);
  }

  // Clases de colores (modo claro/oscuro)
  const bg = dark ? "bg-slate-900" : "bg-slate-50";
  const fg = dark ? "text-slate-100" : "text-slate-800";
  const panel = dark ? "bg-slate-800" : "bg-white";
  const keyBg = dark ? "bg-slate-700" : "bg-slate-100";

  return (
    <div className={`${dark ? "dark" : ""}`}>
      <div className={`min-h-screen ${bg} ${fg} transition-colors duration-300`}> 
        {/* Cabecera */}
        <header className="max-w-5xl mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-400 to-lime-400 shadow-md" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Aprende Mecanografía (QWERTY ES)</h1>
              <p className="text-xs sm:text-sm opacity-70">Progresivo, divertido y pensado para niños</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark((d) => !d)}
              className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:scale-[1.02] active:scale-[0.98] transition shadow"
              aria-label="Cambiar tema"
            >
              {dark ? "🌙" : "☀️"}
            </button>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="max-w-5xl mx-auto px-4 grid gap-4">
          {/* Panel superior: práctica */}
          <section className={`${panel} rounded-2xl shadow p-4 sm:p-6 grid gap-4`}>
            {/* Selector de nivel y estado */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm opacity-70">Nivel:</label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((lv, idx) => {
                  const locked = idx > unlocked;
                  return (
                    <button
                      key={lv.name}
                      disabled={locked}
                      onClick={() => goToLevel(idx)}
                      className={`px-3 py-1.5 rounded-xl border text-sm shadow-sm transition ${
                        idx === level ? "bg-sky-200/80 dark:bg-sky-700/50 border-sky-400" : "bg-transparent border-slate-300 dark:border-slate-600"
                      } ${locked ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                      title={lv.description}
                    >
                      {lv.name}
                    </button>
                  );
                })}
              </div>
              <div className="ml-auto flex items-center gap-3 text-sm">
                <div className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700">Precisión: <b>{accuracy}%</b></div>
                <div className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700">WPM: <b>{wpm}</b></div>
                <button onClick={restartLevel} className="px-3 py-1.5 rounded-xl bg-lime-300/80 dark:bg-lime-700/60 shadow hover:scale-[1.02] active:scale-[0.98]">Reiniciar</button>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-sky-400 to-lime-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((pos / sequence.length) * 100)}%` }}
                transition={{ type: "spring", stiffness: 90, damping: 20 }}
              />
            </div>

            {/* Texto objetivo */}
            <div className="text-2xl sm:text-3xl leading-relaxed font-mono select-none">
              {sequence.split("").map((c, i) => {
                const isCurrent = i === pos;
                const typed = i < pos;
                return (
                  <span key={i} className={`px-[2px] sm:px-[3px] rounded ${
                    typed ? "text-emerald-600 dark:text-emerald-400" : ""
                  } ${isCurrent ? "bg-yellow-200 dark:bg-yellow-700" : ""}`}>
                    {c}
                  </span>
                );
              })}
            </div>

            {/* Leyenda de ayuda */}
            <div className="text-sm opacity-70 -mt-1">Escribid la secuencia. Tecla objetivo resaltada en amarillo. Permitidas en este nivel: <b>{[...allowedSet].join(" ")}</b></div>
          </section>

          {/* Panel inferior: teclado visual */}
          <section className={`${panel} rounded-2xl shadow p-3 sm:p-4`}> 
            <div className="grid gap-2">
              {KEYBOARD_ROWS.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-1 sm:gap-2">
                  {row.map((k) => {
                    const activeInLevel = allowedSet.has(k);
                    const isTarget = k === targetChar;
                    const wasGood = flashGood === k;
                    const wasBad = flashBad === k;
                    return (
                      <motion.div
                        key={k}
                        className={`min-w-[30px] sm:min-w-[42px] px-2 py-2 sm:px-3 sm:py-3 text-center rounded-2xl border ${keyBg} ${
                          isTarget ? "border-yellow-400" : "border-slate-300 dark:border-slate-600"
                        } ${activeInLevel ? "ring-2 ring-sky-300 dark:ring-sky-600" : "opacity-60"}`}
                        animate={{
                          scale: wasGood ? 1.08 : wasBad ? 0.95 : 1,
                          backgroundColor: wasGood
                            ? "#86efac" // verde 300
                            : wasBad
                            ? "#fca5a5" // rojo 300
                            : undefined,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 15, duration: 0.15 }}
                      >
                        <span className="font-semibold select-none">{k}</span>
                      </motion.div>
                    );
                  })}
                </div>
              ))}

              {/* Extras */}
              <div className="flex justify-center flex-wrap gap-1 sm:gap-2 mt-1">
                {EXTRA_KEYS.map((k) => {
                  const activeInLevel = allowedSet.has(k);
                  const isTarget = k === targetChar;
                  const wasGood = flashGood === k;
                  const wasBad = flashBad === k;
                  return (
                    <motion.div
                      key={k}
                      className={`min-w-[30px] sm:min-w-[38px] px-2 py-2 text-center rounded-2xl border ${keyBg} ${
                        isTarget ? "border-yellow-400" : "border-slate-300 dark:border-slate-600"
                      } ${activeInLevel ? "ring-2 ring-sky-300 dark:ring-sky-600" : "opacity-30"}`}
                      animate={{
                        scale: wasGood ? 1.08 : wasBad ? 0.95 : 1,
                        backgroundColor: wasGood
                          ? "#86efac"
                          : wasBad
                          ? "#fca5a5"
                          : undefined,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, duration: 0.15 }}
                    >
                      <span className="font-semibold select-none">{k}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Estado inferior */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="opacity-70">Última tecla: <b>{lastKey ?? ""}</b></div>
              <div className="flex items-center gap-3">
                <div className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700">Correctas: <b>{correct}</b></div>
                <div className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700">Errores: <b>{mistakes}</b></div>
                <div className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700">Total: <b>{sequence.length}</b></div>
              </div>
            </div>
          </section>
        </main>

        {/* Modal de finalización */}
        <AnimatePresence>
          {finished && (
            <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={`${panel} rounded-3xl shadow-xl p-6 max-w-md w-full text-center`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                <h2 className="text-2xl font-bold mb-2">¡Buen trabajo!</h2>
                <p className="opacity-80 mb-4">Habéis terminado el {LEVELS[level].name}. Precisión: <b>{accuracy}%</b> · WPM: <b>{wpm}</b></p>
                {accuracy >= 85 ? (
                  <p className="mb-4">Nivel superado. {level < LEVELS.length - 1 ? "Se desbloquea el siguiente." : "¡Habéis completado todos los niveles!"}</p>
                ) : (
                  <p className="mb-4">Para superar el nivel, alcanzad al menos <b>85%</b> de precisión.</p>
                )}
                <div className="flex gap-2 justify-center">
                  <button onClick={restartLevel} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 shadow">Reintentar</button>
                  {accuracy >= 85 && level < LEVELS.length - 1 && (
                    <button onClick={() => goToLevel(level + 1)} className="px-4 py-2 rounded-xl bg-lime-400 dark:bg-lime-700 text-slate-900 dark:text-white shadow">Siguiente nivel →</button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pie */}
        <footer className="max-w-5xl mx-auto px-4 py-6 text-xs opacity-60 text-center">
          Consejo: colocad los dedos índice en <b>F</b> y <b>J</b> (con guías) y mantened la postura.
        </footer>
      </div>
    </div>
  );
}
