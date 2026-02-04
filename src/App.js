import React, { useState, useEffect, useRef } from "react";
import {
  Ruler,
  Scale,
  Clock,
  Thermometer,
  Beaker,
  CheckCircle,
  XCircle,
  BookOpen,
  Gamepad2,
  Trophy,
  RefreshCw,
  Calculator,
  FlaskConical,
  User,
  Save,
  AlertTriangle,
  Sun,
  Snowflake,
  Target,
  ClipboardList,
  Database,
  MousePointer2,
  ArrowRight,
  Play,
  Square,
  Lightbulb,
  Award,
  Wifi,
  WifiOff,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// =================================================================
// ⚙️ CONFIGURACIÓN DE FIREBASE
// =================================================================
const firebaseConfig = {
  // PEGA AQUÍ TUS DATOS DE FIREBASE MANUALMENTE EN CODESANDBOX
apiKey: "AIzaSyA0Rr410c9pBr-FvcPrqzMlfrZ8np2iZHo",
  authDomain: "fisica-lab---medidas.firebaseapp.com",
  projectId: "fisica-lab---medidas",
  storageBucket: "fisica-lab---medidas.firebasestorage.app",
  messagingSenderId: "10101520168",
  appId: "1:10101520168:web:83b05851d452b0fbe0821d",
  measurementId: "G-Q1VTR0XPPX"
};

// =================================================================
// 🔧 SISTEMA DE INICIALIZACIÓN
// =================================================================
let app, auth, db, appId;
let isConfigured = false;
let localQuizResults = [];
let localPracticeResults = [];

try {
  const configToUse =
    typeof __firebase_config !== "undefined"
      ? JSON.parse(__firebase_config)
      : firebaseConfig;

  if (!configToUse.apiKey || configToUse.apiKey === "TU_API_KEY_AQUI") {
    console.warn(
      "⚠️ AVISO: Firebase no está configurado. La app funcionará en MODO OFFLINE."
    );
  } else {
    app = initializeApp(configToUse);
    auth = getAuth(app);
    db = getFirestore(app);
    isConfigured = true;
  }
  appId = typeof __app_id !== "undefined" ? __app_id : "fisica-lab-v3";
} catch (e) {
  console.error("Error al iniciar Firebase:", e);
}

// =================================================================
// 📚 DATOS EDUCATIVOS
// =================================================================
const educationalData = [
  {
    id: "length",
    magnitude: "Longitud",
    definition: "Distancia entre dos puntos.",
    unit: "Metro (m)",
    otherUnits: "km, cm, mm",
    instrument: "Cinta Métrica / Regla",
    icon: <Ruler size={40} />,
    color: "bg-blue-100 text-blue-700 border-blue-300",
    examples: [
      "Distancia entre ciudades (km)",
      "Altura (m)",
      "Largo lápiz (cm)",
    ],
    tip: "1 m = 100 cm",
  },
  {
    id: "mass",
    magnitude: "Masa",
    definition: "Cantidad de materia.",
    unit: "Kilogramo (kg)",
    otherUnits: "g, t, lb",
    instrument: "Balanza",
    icon: <Scale size={40} />,
    color: "bg-green-100 text-green-700 border-green-300",
    examples: ["Saco de arroz (kg)", "Manzana (g)", "Camión (t)"],
    tip: "Masa ≠ Peso",
  },
  {
    id: "time",
    magnitude: "Tiempo",
    definition: "Duración de eventos.",
    unit: "Segundo (s)",
    otherUnits: "min, h, día",
    instrument: "Cronómetro",
    icon: <Clock size={40} />,
    color: "bg-purple-100 text-purple-700 border-purple-300",
    examples: ["Película (h)", "Recreo (min)", "Carrera (s)"],
    tip: "1 min = 60 s",
  },
  {
    id: "temp",
    magnitude: "Temperatura",
    definition: "Nivel térmico.",
    unit: "Kelvin (K)",
    otherUnits: "°C, °F",
    instrument: "Termómetro",
    icon: <Thermometer size={40} />,
    color: "bg-red-100 text-red-700 border-red-300",
    examples: ["Hielo (0°C)", "Cuerpo (37°C)", "Ebullición (100°C)"],
    tip: "0°C = 273.15 K",
  },
  {
    id: "volume",
    magnitude: "Volumen",
    definition: "Espacio ocupado.",
    unit: "m³",
    otherUnits: "Litro (L), ml",
    instrument: "Probeta",
    icon: <Beaker size={40} />,
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    examples: ["Botella (L)", "Jeringa (ml)", "Tanque (m³)"],
    tip: "1 L = 1000 ml",
  },
];

const quizQuestions = [
  {
    q: "Para medir el ancho de un cuaderno usas:",
    options: ["Balanza", "Regla", "Termómetro"],
    a: "Regla",
    exp: "Mide longitud.",
  },
  {
    q: "Instrumento para medir la masa:",
    options: ["Probeta", "Cronómetro", "Balanza"],
    a: "Balanza",
    exp: "Compara masas.",
  },
  {
    q: "Unidad base de temperatura en el SI:",
    options: ["Celsius", "Fahrenheit", "Kelvin"],
    a: "Kelvin",
    exp: "Es la escala científica.",
  },
  {
    q: "¿Cuántos centímetros hay en 1 metro?",
    options: ["10", "100", "1000"],
    a: "100",
    exp: "Centi = cien.",
  },
  {
    q: "El instrumento para medir volumen exacto es:",
    options: ["Vaso", "Probeta", "Cuchara"],
    a: "Probeta",
    exp: "Tiene escala graduada.",
  },
  {
    q: "Unidad para medir la duración de una carrera:",
    options: ["Segundo", "Metro", "Kilogramo"],
    a: "Segundo",
    exp: "Unidad de tiempo.",
  },
  {
    q: "¿Qué pesa más, 1kg de hierro o 1kg de algodón?",
    options: ["Hierro", "Algodón", "Iguales"],
    a: "Iguales",
    exp: "Ambos son 1kg de masa.",
  },
  {
    q: "Símbolo del Kilogramo:",
    options: ["K", "kg", "kl"],
    a: "kg",
    exp: "k minúscula, g minúscula.",
  },
  {
    q: "Temperatura de congelación del agua:",
    options: ["100°C", "0°C", "32°C"],
    a: "0°C",
    exp: "Punto de fusión del hielo.",
  },
  {
    q: "1 Litro equivale a:",
    options: ["100 ml", "1000 ml", "10 ml"],
    a: "1000 ml",
    exp: "Mili = milésima parte.",
  },
];

// --- COMPONENTES ---

const Navigation = ({ activeTab, setActiveTab }) => (
  <nav className="flex flex-wrap justify-center gap-2 p-4 bg-white shadow-sm sticky top-0 z-20 overflow-x-auto">
    <button
      onClick={() => setActiveTab("learn")}
      className={`whitespace-nowrap px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${
        activeTab === "learn"
          ? "bg-indigo-600 text-white"
          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
      }`}
    >
      <BookOpen size={18} /> Aprender
    </button>
    <button
      onClick={() => setActiveTab("lab")}
      className={`whitespace-nowrap px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${
        activeTab === "lab"
          ? "bg-indigo-600 text-white"
          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
      }`}
    >
      <FlaskConical size={18} /> Laboratorio
    </button>
    <button
      onClick={() => setActiveTab("practice")}
      className={`whitespace-nowrap px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${
        activeTab === "practice"
          ? "bg-indigo-600 text-white"
          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
      }`}
    >
      <Target size={18} /> Práctica
    </button>
    <button
      onClick={() => setActiveTab("quiz")}
      className={`whitespace-nowrap px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${
        activeTab === "quiz"
          ? "bg-indigo-600 text-white"
          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
      }`}
    >
      <Gamepad2 size={18} /> Desafío
    </button>
    <button
      onClick={() => setActiveTab("records")}
      className={`whitespace-nowrap px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${
        activeTab === "records"
          ? "bg-indigo-600 text-white"
          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
      }`}
    >
      <Database size={18} /> Registros
    </button>
    <button
      onClick={() => setActiveTab("tools")}
      className={`whitespace-nowrap px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${
        activeTab === "tools"
          ? "bg-indigo-600 text-white"
          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
      }`}
    >
      <Calculator size={18} /> Conversor
    </button>
  </nav>
);

const UserRegistration = ({ onRegister }) => {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim().length > 2 && grade.trim().length > 0) {
      onRegister({ name, grade });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in duration-300">
        <div className="text-center mb-6">
          <User size={48} className="mx-auto text-indigo-600 mb-2" />
          <h2 className="text-2xl font-bold text-gray-800">
            ¡Bienvenido a FisicaLab!
          </h2>
          <p className="text-gray-500">
            Por favor, ingresa tu nombre para comenzar.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Tu nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 outline-none transition-colors text-center text-lg"
            autoFocus
          />
          <input
            type="text"
            placeholder="Grado y Sección (Ej: 5to B)"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full p-3 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 outline-none transition-colors text-center text-lg"
          />
          <button
            type="submit"
            disabled={name.trim().length < 3}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Comenzar
          </button>
        </form>
      </div>
    </div>
  );
};

const LearnSection = () => {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Enciclopedia de Medidas
        </h2>
        <p className="text-gray-600">
          Explora las magnitudes y sus diferentes unidades.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {educationalData.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300 border-2 ${
              selectedItem?.id === item.id
                ? `${item.color} scale-105 shadow-lg`
                : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md"
            }`}
          >
            <div
              className={selectedItem?.id === item.id ? "animate-bounce" : ""}
            >
              {item.icon}
            </div>
            <span className="mt-2 font-semibold text-sm md:text-base">
              {item.magnitude}
            </span>
          </button>
        ))}
      </div>

      {selectedItem ? (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div
            className={`p-6 ${selectedItem.color} bg-opacity-20 flex flex-col md:flex-row items-center gap-4`}
          >
            <div className="p-3 bg-white rounded-full shadow-sm">
              {selectedItem.icon}
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-bold">{selectedItem.magnitude}</h3>
              <p className="opacity-90 font-medium">
                {selectedItem.definition}
              </p>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h4 className="text-xs uppercase tracking-wider text-indigo-500 font-bold mb-1">
                  Unidad Estándar (SI)
                </h4>
                <p className="text-2xl font-mono font-bold text-indigo-700">
                  {selectedItem.unit}
                </p>
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <h4 className="text-xs uppercase tracking-wider text-indigo-500 font-bold mb-1">
                    Otras Unidades Comunes
                  </h4>
                  <p className="text-md font-medium text-indigo-900">
                    {selectedItem.otherUnits}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500 font-bold mb-2">
                  <MousePointer2 size={16} /> Instrumentos Comunes
                </h4>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  {selectedItem.instrument}
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <h4 className="text-xs uppercase tracking-wider text-yellow-600 font-bold mb-1">
                  💡 Tip de Experto
                </h4>
                <p className="text-yellow-800 text-sm italic">
                  "{selectedItem.tip}"
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-3">
                Ejemplos en la vida real
              </h4>
              <ul className="space-y-3">
                {selectedItem.examples.map((ex, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700">{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-16 bg-white/50 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400">
          Selecciona una tarjeta arriba para profundizar
        </div>
      )}
    </div>
  );
};

const LabSection = () => {
  const [mode, setMode] = useState("ruler");
  const [feedback, setFeedback] = useState("");

  // Estados
  const [targetCm, setTargetCm] = useState(5);
  const [userLength, setUserLength] = useState("");
  const [rulerContext, setRulerContext] = useState({
    name: "Lápiz",
    color: "blue",
  });

  const [targetWeight, setTargetWeight] = useState(200);
  const [currentWeight, setCurrentWeight] = useState(0);

  const [targetTemp, setTargetTemp] = useState(20);
  const [userTemp, setUserTemp] = useState("");
  const [tempContext, setTempContext] = useState("Ambiente");

  const [targetVol, setTargetVol] = useState(50);
  const [userVol, setUserVol] = useState("");
  const [volContext, setVolContext] = useState("Agua");

  const [scaleObj, setScaleObj] = useState(null);
  const [scaleReading, setScaleReading] = useState(0);
  const [timerState, setTimerState] = useState({
    running: false,
    time: 0,
    target: 5.0,
  });
  const timerRef = useRef(null);

  const PX_PER_CM = 40;
  const TEMP_MIN = -5;
  const TEMP_MAX = 45;
  const TEMP_RANGE = 50;

  const objectsToWeigh = [
    { name: "Manzana", weight: 150, emoji: "🍎" },
    { name: "Libro", weight: 450, emoji: "📘" },
    { name: "Pluma", weight: 5, emoji: "🪶" },
    { name: "Laptop", weight: 1200, emoji: "💻" },
  ];

  useEffect(() => {
    resetLab();
  }, [mode]);

  useEffect(() => {
    if (timerState.running) {
      const start = Date.now() - timerState.time * 1000;
      timerRef.current = setInterval(
        () =>
          setTimerState((p) => ({ ...p, time: (Date.now() - start) / 1000 })),
        10
      );
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerState.running]);

  const resetLab = () => {
    setFeedback("");
    // Variaciones para Regla
    const rulerItems = [
      { n: "Lápiz", c: "yellow" },
      { n: "Cable", c: "gray" },
      { n: "Cuerda", c: "green" },
      { n: "Varilla", c: "blue" },
    ];
    const rItem = rulerItems[Math.floor(Math.random() * rulerItems.length)];
    setRulerContext({ name: rItem.n, color: rItem.c });
    setTargetCm(Math.floor(Math.random() * 8) + 2);
    setUserLength("");

    // Balance
    setTargetWeight(
      Math.floor(Math.random() * 10) * 100 +
        Math.floor(Math.random() * 5) * 10 +
        50
    );
    setCurrentWeight(0);

    // Variaciones Termómetro
    const tempItems = ["Día Caluroso", "Agua Fría", "Interior", "Refrigerador"];
    setTempContext(tempItems[Math.floor(Math.random() * tempItems.length)]);
    setTargetTemp(Math.floor(Math.random() * 40) - 2);
    setUserTemp("");

    // Variaciones Volumen
    const volItems = ["Agua", "Aceite", "Jugo", "Poción"];
    setVolContext(volItems[Math.floor(Math.random() * volItems.length)]);
    setTargetVol((Math.floor(Math.random() * 8) + 1) * 10);
    setUserVol("");

    setScaleObj(null);
    setScaleReading(0);
    setTimerState({
      running: false,
      time: 0,
      target: (Math.random() * 5 + 3).toFixed(1),
    });
  };

  // Handlers
  const addWeight = (w) => setCurrentWeight((p) => p + w);
  const checkBalance = () => {
    if (currentWeight === targetWeight) setFeedback("CORRECT_BALANCE");
    else if (currentWeight < targetWeight) setFeedback("LIGHT");
    else setFeedback("HEAVY");
  };
  const checkRuler = () => {
    if (parseInt(userLength) === targetCm) setFeedback("CORRECT_RULER");
    else setFeedback(`WRONG_RULER: Era ${targetCm} cm`);
  };
  const checkTemp = () => {
    if (parseInt(userTemp) === targetTemp) setFeedback("CORRECT_TEMP");
    else setFeedback(`WRONG_TEMP: Era ${targetTemp}°C`);
  };
  const checkVolume = () => {
    if (parseInt(userVol) === targetVol) setFeedback("CORRECT_VOL");
    else setFeedback(`WRONG_VOL: Era ${targetVol} ml`);
  };
  const weighObject = (obj) => {
    setScaleObj(obj);
    setScaleReading(0);
    setFeedback("WEIGHING");
    setTimeout(() => {
      setScaleReading(obj.weight);
      setFeedback("WEIGHED");
    }, 800);
  };
  const toggleTimer = () => {
    if (timerState.running) {
      setTimerState((p) => ({ ...p, running: false }));
      const diff = Math.abs(timerState.time - parseFloat(timerState.target));
      if (diff < 0.3) setFeedback("CORRECT_TIME");
      else setFeedback(`WRONG_TIME: Te pasaste por ${diff.toFixed(2)}s`);
    } else {
      setTimerState((p) => ({ ...p, time: 0, running: true }));
      setFeedback("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { id: "ruler", l: "Regla", c: "blue" },
          { id: "balance", l: "Balanza", c: "green" },
          { id: "temp", l: "Termómetro", c: "red" },
          { id: "scale", l: "Báscula", c: "emerald" },
          { id: "time", l: "Cronómetro", c: "purple" },
          { id: "vol", l: "Probeta", c: "yellow" },
        ].map((b) => (
          <button
            key={b.id}
            onClick={() => setMode(b.id)}
            className={`px-4 py-2 rounded-xl font-bold border-2 ${
              mode === b.id
                ? `bg-${b.c}-100 border-${b.c}-500 text-${b.c}-700`
                : "bg-white border-gray-200"
            }`}
          >
            {b.l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 min-h-[450px] p-8 relative flex flex-col items-center justify-center">
        <button
          onClick={resetLab}
          className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 transition-colors"
          title="Reiniciar"
        >
          <RefreshCw size={24} />
        </button>

        {mode === "ruler" && (
          <div className="w-full flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2 text-gray-700">
              Mide el objeto:{" "}
              <span className="text-blue-600">{rulerContext.name}</span>
            </h3>
            <p className="text-sm text-gray-400 mb-6">(Ejercicio aleatorio)</p>
            <div className="relative w-full max-w-2xl h-32 bg-slate-50 rounded-xl border overflow-x-auto mb-8">
              <div className="absolute top-4 left-4 min-w-[800px] h-full">
                <div
                  className={`absolute top-0 left-0 h-10 rounded-sm shadow z-10 bg-${rulerContext.color}-500 border border-${rulerContext.color}-700`}
                  style={{ width: `${targetCm * PX_PER_CM}px` }}
                ></div>
                <div className="absolute top-10 left-0 h-16 w-[700px] border-t-2 border-gray-400">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 border-l-2 border-gray-400 h-6 flex flex-col justify-end items-center"
                      style={{ left: `${i * PX_PER_CM}px` }}
                    >
                      <span className="mt-8 text-sm font-bold text-gray-600">
                        {i}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="0"
                className="w-24 p-3 text-2xl font-bold text-center border-2 border-indigo-200 rounded-xl outline-none"
                value={userLength}
                onChange={(e) => setUserLength(e.target.value)}
              />
              <span className="text-xl font-bold text-gray-600">cm</span>
              <button
                onClick={checkRuler}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold ml-2"
              >
                Comprobar
              </button>
            </div>
            {feedback === "CORRECT_RULER" && (
              <div className="mt-6 p-4 bg-green-100 text-green-700 rounded-xl font-bold animate-bounce">
                ¡Exacto!
              </div>
            )}
            {feedback.startsWith("WRONG_RULER") && (
              <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-xl font-bold">
                {feedback.split(":")[1]}
              </div>
            )}
          </div>
        )}

        {mode === "balance" && (
          <div className="flex flex-col items-center animate-in fade-in duration-300 w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-700">
              Equilibra la Balanza
            </h3>
            <div className="relative w-full max-w-md h-40 border-b-4 border-gray-800 mb-8 flex items-end justify-between px-12 bg-white">
              <div
                className="w-24 h-24 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg transition-transform duration-500 z-10"
                style={{
                  transform: `translateY(${
                    feedback === "LIGHT"
                      ? "20px"
                      : feedback === "HEAVY"
                      ? "-20px"
                      : "0px"
                  })`,
                }}
              >
                ?
              </div>
              <div className="absolute left-1/2 bottom-0 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[40px] border-b-gray-800 -translate-x-1/2"></div>
              <div
                className="w-24 flex flex-col-reverse items-center transition-transform duration-500 relative z-10"
                style={{
                  transform: `translateY(${
                    feedback === "HEAVY"
                      ? "20px"
                      : feedback === "LIGHT"
                      ? "-20px"
                      : "0px"
                  })`,
                }}
              >
                <div className="w-full h-4 bg-gray-300 rounded-b-lg border border-gray-400"></div>
                <div className="absolute bottom-6 flex flex-col-reverse items-center gap-1">
                  {currentWeight > 0 && (
                    <div className="bg-gray-400 w-16 h-8 rounded-sm shadow-sm border border-gray-500 flex items-center justify-center text-xs font-bold text-white">
                      {currentWeight}g
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {[500, 100, 50, 10].map((w) => (
                <button
                  key={w}
                  onClick={() => addWeight(w)}
                  className="w-14 h-14 rounded-full bg-gray-200 hover:bg-gray-300 border-2 border-gray-400 font-bold text-gray-700 shadow-sm flex items-center justify-center transition-transform active:scale-95"
                >
                  +{w}
                </button>
              ))}
              <button
                onClick={() => setCurrentWeight(0)}
                className="w-14 h-14 rounded-full bg-red-100 hover:bg-red-200 text-red-600 font-bold flex items-center justify-center border-2 border-red-300"
                title="Vaciar"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <button
              onClick={checkBalance}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md"
            >
              Comprobar
            </button>
            {feedback === "CORRECT_BALANCE" && (
              <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-xl font-bold animate-bounce">
                ¡Equilibrado!
              </div>
            )}
            {feedback === "LIGHT" && (
              <p className="mt-4 text-orange-500 font-bold">
                Falta peso... (Tu lado está arriba)
              </p>
            )}
            {feedback === "HEAVY" && (
              <p className="mt-4 text-red-500 font-bold">
                ¡Te pasaste! (Tu lado está abajo)
              </p>
            )}
          </div>
        )}

        {mode === "temp" && (
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2 text-gray-700">
              Lectura: <span className="text-red-600">{tempContext}</span>
            </h3>
            <p className="text-sm text-gray-400 mb-4">(Contexto aleatorio)</p>
            <div className="flex gap-8 items-center mb-8 h-[300px]">
              <div className="relative w-16 h-full bg-white rounded-full border-2 border-gray-400 shadow-lg flex justify-center">
                <div className="absolute top-4 bottom-16 right-0 w-full">
                  {Array.from({ length: TEMP_RANGE + 1 }, (_, i) => {
                    const val = i + TEMP_MIN;
                    const pct = (i / TEMP_RANGE) * 100;
                    const isMajor = val % 10 === 0;
                    return (
                      <div
                        key={val}
                        className="absolute w-full flex justify-end pr-1"
                        style={{ bottom: `${pct}%`, height: "1px" }}
                      >
                        {isMajor && (
                          <span className="absolute right-8 text-xs text-gray-500 font-mono -translate-y-1/2">
                            {val}
                          </span>
                        )}
                        <div
                          className={`bg-gray-800 ${
                            isMajor ? "w-4 h-0.5" : "w-2 h-px"
                          }`}
                        ></div>
                      </div>
                    );
                  })}
                </div>
                <div
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 w-4 bg-red-600 rounded-t-sm transition-all duration-500"
                  style={{
                    height: `calc((100% - 80px) * ${
                      (targetTemp - TEMP_MIN) / TEMP_RANGE
                    })`,
                  }}
                ></div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-red-600 rounded-full border-2 border-white z-20"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                className="border-2 p-2 rounded-lg w-24 text-center text-xl font-bold"
                value={userTemp}
                onChange={(e) => setUserTemp(e.target.value)}
              />
              <span className="text-2xl font-bold text-gray-400">°C</span>
              <button
                onClick={checkTemp}
                className="bg-red-500 text-white px-6 rounded-lg font-bold"
              >
                Leer
              </button>
            </div>
            {feedback === "CORRECT_TEMP" && (
              <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-xl font-bold">
                ¡Correcto!
              </div>
            )}
            {feedback.startsWith("WRONG_TEMP") && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-xl font-bold">
                {feedback.split(":")[1]}
              </div>
            )}
          </div>
        )}

        {mode === "scale" && (
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-bold mb-8">Báscula Digital</h3>
            <div className="relative flex flex-col items-center">
              <div
                className={`text-6xl transition-all ${
                  scaleObj ? "translate-y-4" : "-translate-y-8 opacity-0"
                }`}
              >
                {scaleObj?.emoji}
              </div>
              <div className="w-64 h-24 bg-gray-200 rounded-xl border-b-8 border-gray-300 flex items-center justify-center z-10 shadow-lg">
                <div className="bg-emerald-900 w-48 h-14 rounded flex items-center justify-end px-4 font-mono text-emerald-400 text-3xl">
                  {scaleReading} <span className="text-sm ml-2">g</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              {objectsToWeigh.map((o, i) => (
                <button
                  key={i}
                  onClick={() => weighObject(o)}
                  className="flex flex-col items-center p-2 bg-gray-50 rounded-lg border hover:scale-105 transition-transform"
                >
                  <span className="text-2xl">{o.emoji}</span>
                  <span className="text-xs font-bold">{o.name}</span>
                </button>
              ))}
            </div>
            {feedback === "WEIGHED" && (
              <div className="mt-6 text-center">
                <p className="text-emerald-700 font-bold text-lg">
                  Masa registrada: {scaleObj.weight} g
                </p>
                <p className="text-xs text-gray-400">Recuerda: Masa ≠ Peso</p>
              </div>
            )}
          </div>
        )}

        {mode === "time" && (
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4">
              Detén en {timerState.target}s
            </h3>
            <div className="text-6xl font-mono mb-8 font-bold text-gray-700">
              {timerState.time.toFixed(2)}s
            </div>
            <button
              onClick={toggleTimer}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl shadow-lg ${
                timerState.running ? "bg-red-500" : "bg-green-500"
              }`}
            >
              {timerState.running ? (
                <Square fill="white" />
              ) : (
                <Play fill="white" />
              )}
            </button>
            {feedback === "CORRECT_TIME" && (
              <div className="mt-6 p-4 bg-green-100 text-green-700 rounded-xl font-bold animate-bounce">
                ¡Increíble! Precisión perfecta.
              </div>
            )}
            {feedback.startsWith("WRONG_TIME") && (
              <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-xl font-bold">
                {feedback.split(":")[1]}
              </div>
            )}
          </div>
        )}

        {mode === "vol" && (
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2">
              Lectura: <span className="text-blue-500">{volContext}</span>
            </h3>
            <div className="relative w-20 h-64 border-x-4 border-b-4 border-gray-400 rounded-b-xl mb-8 bg-white overflow-hidden">
              <div
                className="absolute bottom-0 w-full bg-blue-400 opacity-60 transition-all duration-500 border-t border-blue-600 rounded-t-[100%]"
                style={{ height: `${targetVol}%` }}
              ></div>
              <div className="absolute inset-0 flex flex-col-reverse justify-between py-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div
                    key={i}
                    className="w-full border-t border-gray-400 h-0 relative"
                  >
                    <span className="absolute right-1 -top-2 text-xs text-gray-500">
                      {i * 10}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                className="border-2 p-2 rounded-lg w-20 text-center text-xl font-bold"
                value={userVol}
                onChange={(e) => setUserVol(e.target.value)}
              />
              <span className="text-xl font-bold text-gray-500 mt-2">ml</span>
              <button
                onClick={checkVolume}
                className="bg-yellow-500 text-white px-6 rounded-lg font-bold"
              >
                Leer
              </button>
            </div>
            {feedback === "CORRECT_VOL" && (
              <div className="mt-6 p-4 bg-green-100 text-green-700 rounded-xl font-bold animate-bounce">
                ¡Correcto! {targetVol} ml
              </div>
            )}
            {feedback.startsWith("WRONG_VOL") && (
              <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-xl font-bold">
                {feedback.split(":")[1]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const QuizSection = ({ user, saveResult }) => {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showRes, setShowRes] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleAns = (opt) => {
    if (showRes) return;
    if (opt === quizQuestions[qIdx].a) setScore((s) => s + 1);
    setShowRes(true);
  };

  const next = () => {
    if (qIdx < quizQuestions.length - 1) {
      setQIdx((i) => i + 1);
      setShowRes(false);
    } else {
      setFinished(true);
      saveResult(
        score + (showRes && quizQuestions[qIdx].a ? 0 : 0),
        quizQuestions.length,
        "quiz_results"
      );
    }
  };

  if (finished)
    return (
      <div className="text-center p-8">
        <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold">¡Examen Terminado!</h2>
        <p className="text-xl mt-2">
          Nota: {score} / {quizQuestions.length}
        </p>
        <button
          onClick={() => {
            setQIdx(0);
            setScore(0);
            setFinished(false);
            setShowRes(false);
          }}
          className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg"
        >
          Repetir
        </button>
      </div>
    );

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-lg border p-6">
        <div className="flex justify-between text-sm text-gray-400 font-bold mb-4">
          <span>
            Pregunta {qIdx + 1}/{quizQuestions.length}
          </span>
          <span>Puntos: {score}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-6">
          {quizQuestions[qIdx].q}
        </h3>
        <div className="space-y-3">
          {quizQuestions[qIdx].options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleAns(opt)}
              disabled={showRes}
              className={`w-full p-4 rounded-xl text-left font-medium border-2 ${
                showRes
                  ? opt === quizQuestions[qIdx].a
                    ? "bg-green-100 border-green-500 text-green-800"
                    : "bg-red-50 border-red-200 text-red-400"
                  : "hover:border-indigo-400 bg-white"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {showRes && (
          <button
            onClick={next}
            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
};

const PracticeSection = ({ user, saveResult }) => {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    const pool = [
      { u: "kg", m: "Masa" },
      { u: "m", m: "Longitud" },
      { u: "s", m: "Tiempo" },
      { u: "K", m: "Temperatura" },
      { u: "L", m: "Volumen" },
      { u: "g", m: "Masa" },
      { u: "cm", m: "Longitud" },
      { u: "min", m: "Tiempo" },
      { u: "ml", m: "Volumen" },
      { u: "°C", m: "Temperatura" },
    ];
    setCards(pool.sort(() => Math.random() - 0.5));
  }, [finished]);

  const check = (mag) => {
    if (feedback) return;
    const correct = mag === cards[idx].m;
    setFeedback(correct ? "correct" : "wrong");
    const newScore = score + (correct ? 1 : 0);
    if (correct) setScore(newScore);

    setTimeout(() => {
      setFeedback(null);
      if (idx < 9) setIdx((i) => i + 1);
      else {
        setFinished(true);
        saveResult(newScore, 10, "practice_results");
      }
    }, 1000);
  };

  if (showCert)
    return (
      <div className="max-w-2xl mx-auto p-4 text-center animate-in zoom-in">
        <div className="bg-white border-8 border-double border-indigo-200 p-12 rounded-lg shadow-2xl relative">
          <Award
            size={120}
            className="absolute top-4 right-4 opacity-10 text-indigo-900"
          />
          <h1 className="text-4xl font-serif font-bold text-indigo-900 mb-2">
            CERTIFICADO
          </h1>
          <p className="text-lg text-gray-500 mb-8">Al estudiante</p>
          <h2 className="text-3xl font-bold border-b-2 border-gray-300 pb-2 mb-4 inline-block">
            {user.name}
          </h2>
          <p className="text-gray-600">
            Por completar la práctica de Unidades con un puntaje de:
          </p>
          <div className="text-5xl font-black text-indigo-600 my-6">
            {score}/10
          </div>
          <div className="mt-12 flex justify-between text-xs text-gray-400">
            <span>FisicaLab 3.0</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <button
          onClick={() => setShowCert(false)}
          className="mt-4 text-indigo-600 underline"
        >
          Volver
        </button>
      </div>
    );

  if (finished)
    return (
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">¡Práctica Finalizada!</h2>
        <p className="text-xl mb-6">Aciertos: {score}/10</p>
        {score >= 1 && (
          <button
            onClick={() => setShowCert(true)}
            className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-bold mb-4 flex items-center gap-2 mx-auto"
          >
            <Award /> Ver Certificado
          </button>
        )}
        <button
          onClick={() => {
            setIdx(0);
            setScore(0);
            setFinished(false);
          }}
          className="block w-full bg-indigo-100 text-indigo-700 py-2 rounded-lg font-bold"
        >
          Practicar de nuevo
        </button>
      </div>
    );

  if (cards.length === 0) return <div>Cargando...</div>;

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <p className="text-gray-600 mb-6 px-4 bg-blue-50 p-2 rounded-lg text-sm border border-blue-100">
        Objetivo: Identifica la <strong>Magnitud Física</strong> que corresponde
        al símbolo de la unidad mostrada.
      </p>
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-2 bg-indigo-500 transition-all duration-300"
          style={{ width: `${(idx / 10) * 100}%` }}
        ></div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Tarjeta {idx + 1}/10
        </span>
        <div
          className={`text-6xl font-black my-8 transition-transform ${
            feedback === "correct"
              ? "text-green-500 scale-110"
              : feedback === "wrong"
              ? "text-red-500 shake"
              : "text-gray-800"
          }`}
        >
          {cards[idx].u}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Masa", "Longitud", "Tiempo", "Temperatura", "Volumen"].map((m) => (
            <button
              key={m}
              onClick={() => check(m)}
              className="p-3 border-2 rounded-lg font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const RecordsSection = ({ localData, user }) => {
  const [records, setRecords] = useState({ quiz: [], practice: [] });

  useEffect(() => {
    const load = async () => {
      let q = [...localQuizResults],
        p = [...localPracticeResults];
      if (isConfigured && auth?.currentUser) {
        try {
          const qSnap = await getDocs(
            collection(db, "artifacts", appId, "public", "data", "quiz_results")
          );
          const pSnap = await getDocs(
            collection(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "practice_results"
            )
          );
          q = [...q, ...qSnap.docs.map((d) => d.data())];
          p = [...p, ...pSnap.docs.map((d) => d.data())];
        } catch (e) {
          console.log("Error leyendo firebase", e);
        }
      }
      const sortFn = (a, b) =>
        (b.timestamp?.seconds || b.ts) - (a.timestamp?.seconds || a.ts);
      setRecords({ quiz: q.sort(sortFn), practice: p.sort(sortFn) });
    };
    load();
  }, [localData]); // Recargar si cambian los datos locales

  const Table = ({ title, data, col }) => (
    <div className="bg-white rounded-xl shadow border overflow-hidden mb-6">
      <div
        className={`p-3 bg-${col}-50 border-b border-${col}-100 font-bold text-${col}-800`}
      >
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Grado</th>
              <th className="p-3">Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{r.studentName}</td>
                <td className="p-3 text-gray-500">{r.grade}</td>
                <td className={`p-3 font-bold text-${col}-600`}>
                  {r.score}/{r.total}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-400">
                  Sin datos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Table title="Resultados de Exámenes" data={records.quiz} col="indigo" />
      <Table title="Prácticas Realizadas" data={records.practice} col="green" />
    </div>
  );
};

const ConverterSection = () => {
  const [val, setVal] = useState(1);
  const [type, setType] = useState("length");
  const units = {
    length: {
      l: "Longitud",
      from: "km",
      to: "m",
      f: (v) => v * 1000,
      txt: "x 1000",
    },
    mass: { l: "Masa", from: "kg", to: "g", f: (v) => v * 1000, txt: "x 1000" },
    time: { l: "Tiempo", from: "h", to: "min", f: (v) => v * 60, txt: "x 60" },
    temp: {
      l: "Temperatura",
      from: "°C",
      to: "°F",
      f: (v) => (v * 9) / 5 + 32,
      txt: "(°C × 9/5) + 32",
    },
    vol: {
      l: "Volumen",
      from: "L",
      to: "ml",
      f: (v) => v * 1000,
      txt: "x 1000",
    },
  };
  const curr = units[type];

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-lg border p-8">
        <h2 className="text-2xl font-bold mb-6 flex gap-2">
          <Calculator className="text-indigo-600" /> Conversor
        </h2>
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {Object.keys(units).map((k) => (
            <button
              key={k}
              onClick={() => setType(k)}
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                type === k ? "bg-indigo-600 text-white" : "bg-gray-100"
              }`}
            >
              {units[k].l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-400 block mb-1">
              {curr.from}
            </label>
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
              className="w-full p-3 border-2 rounded-lg text-center text-xl font-bold"
            />
          </div>
          <div className="text-xs text-gray-400 font-mono mt-4">{curr.txt}</div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-400 block mb-1">
              {curr.to}
            </label>
            <div className="w-full p-3 bg-gray-100 rounded-lg text-center text-xl font-bold text-indigo-700">
              {curr.f(val).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState("learn");
  const [user, setUser] = useState(null);
  // Estado local para forzar re-render de registros cuando se guarda algo
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const saveResult = async (score, total, collectionName) => {
    const data = {
      studentName: user.name,
      grade: user.grade,
      score,
      total,
      timestamp: serverTimestamp ? serverTimestamp() : new Date(),
      ts: Date.now() / 1000,
    };

    // Guardar local siempre
    if (collectionName === "quiz_results") localQuizResults.push(data);
    else localPracticeResults.push(data);

    // Intentar guardar en nube
    if (isConfigured && !user.isOffline && auth?.currentUser) {
      try {
        await addDoc(
          collection(db, "artifacts", appId, "public", "data", collectionName),
          data
        );
      } catch (e) {
        console.warn("Fallo guardado nube", e);
      }
    }
    setUpdateTrigger((t) => t + 1); // Actualizar vista de registros
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <header className="bg-indigo-700 text-white p-6 shadow-lg text-center">
          <h1 className="text-3xl font-bold">FisicaLab 3.0</h1>
        </header>
        <UserRegistration onRegister={handleRegister} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-12">
      <header className="bg-indigo-700 text-white p-4 shadow-lg sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Scale size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FisicaLab</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm bg-indigo-800/50 px-3 py-1 rounded-full border border-indigo-600">
            <User size={14} /> {user.name}
          </div>
        </div>
      </header>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="py-6 animate-in fade-in duration-500">
        {activeTab === "learn" && <LearnSection />}
        {activeTab === "lab" && <LabSection />}
        {activeTab === "quiz" && (
          <QuizSection user={user} saveResult={saveResult} />
        )}
        {activeTab === "practice" && (
          <PracticeSection user={user} saveResult={saveResult} />
        )}
        {activeTab === "records" && (
          <RecordsSection
            localData={{
              quiz: localQuizResults,
              practice: localPracticeResults,
            }}
            user={user}
          />
        )}
        {activeTab === "tools" && <ConverterSection />}
      </main>
    </div>
  );
}

