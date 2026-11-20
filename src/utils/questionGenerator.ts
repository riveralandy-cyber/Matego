import { Question, GradeLevel, DifficultyLevel, VisualType, ThematicAxis, LearningObjective } from '../types';
import { MINEDUC_OBJECTIVES } from '../data/mineducCurriculum';

export interface GenerationParams {
  grade: GradeLevel;
  oaCode: string;
  difficulty: DifficultyLevel; // 'facil' | 'medio' | 'dificil' | 'progresivo'
  count: number; // 5 to 30
  excludeSignatures?: Set<string> | string[];
}

// -------------------------------------------------------------
// Utilities and Randomization Helpers
// -------------------------------------------------------------
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function uniqueMcOptions(correct: string, candidates: string[], fallbackPool: string[] = []): string[] {
  const seen = new Set<string>([correct]);
  const distractors: string[] = [];
  for (const c of [...candidates, ...fallbackPool]) {
    if (c && !seen.has(c)) {
      seen.add(c);
      distractors.push(c);
      if (distractors.length === 3) break;
    }
  }
  return shuffle([correct, ...distractors]);
}

function numberToSpanishWords(num: number): string {
  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'cero';
  if (n === 100) return 'cien';

  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const veintes = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  const decenas = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const under1000 = (x: number, isApocope = false): string => {
    if (x === 0) return '';
    if (x === 100) return 'cien';
    const c = Math.floor(x / 100);
    const rest = x % 100;
    const parts: string[] = [];
    if (c > 0) parts.push(centenas[c]);
    if (rest > 0) {
      if (rest < 10) {
        parts.push(isApocope && rest === 1 ? 'un' : unidades[rest]);
      } else if (rest < 20) {
        parts.push(especiales[rest - 10]);
      } else if (rest < 30) {
        parts.push(isApocope && rest === 21 ? 'veintiún' : veintes[rest - 20]);
      } else {
        const d = Math.floor(rest / 10);
        const u = rest % 10;
        if (u === 0) {
          parts.push(decenas[d]);
        } else {
          parts.push(`${decenas[d]} y ${isApocope && u === 1 ? 'un' : unidades[u]}`);
        }
      }
    }
    return parts.join(' ');
  };

  if (n < 1000) return under1000(n);
  if (n < 1000000) {
    const miles = Math.floor(n / 1000);
    const rem = n % 1000;
    const milesTxt = miles === 1 ? 'mil' : `${under1000(miles, true)} mil`;
    return rem === 0 ? milesTxt : `${milesTxt} ${under1000(rem)}`;
  }
  return n.toLocaleString('es-CL');
}

function formatCLP(amount: number): string {
  return `$${Math.round(amount).toLocaleString('es-CL')}`;
}

function formatDec(n: number): string {
  return n.toString().replace('.', ',');
}

// Chilean names & authentic local contexts (Escuela Ricardo Silva Arriagada, Arica, Azapa, SLEP Chinchorro)
const CHILEAN_NAMES = [
  'Camila', 'Tomás', 'Florencia', 'Diego', 'Martina', 'Benjamín',
  'Sofía', 'Lucas', 'Javiera', 'Vicente', 'Isidora', 'Agustín',
  'Catalina', 'Mateo', 'Emilia', 'Joaquín', 'Valentina', 'Matías',
  'Antonia', 'Sebastián', 'Renata', 'Alonso', 'Maite', 'Gabriel'
];

const CHILEAN_PLACES = [
  'el Terminal Asoagro de Arica',
  'la feria libre del barrio',
  'el almacén Don Pedro',
  'el Valle de Azapa',
  'la biblioteca de la escuela',
  'el patio techado de la escuela',
  'la librería del centro',
  'el quiosco escolar'
];

export type TopicKey =
  | 'conteo_secuencias'
  | 'ordinales'
  | 'lectura_escritura_numeros'
  | 'comparacion_orden'
  | 'estimacion_redondeo'
  | 'valor_posicional_descomposicion'
  | 'calculo_mental_estrategias'
  | 'adicion_sustraccion'
  | 'multiplicacion'
  | 'division'
  | 'operaciones_combinadas'
  | 'factores_multiplos_primos'
  | 'fracciones'
  | 'decimales'
  | 'razones_proporciones'
  | 'porcentajes'
  | 'enteros'
  | 'potencias_raices'
  | 'patrones_algebra'
  | 'ecuaciones_inecuaciones'
  | 'expresiones_algebraicas_funciones'
  | 'ubicacion_espacial_coordenadas'
  | 'figuras_2d'
  | 'cuerpos_3d'
  | 'lineas_angulos'
  | 'transformaciones_isometricas'
  | 'teorema_pitagoras'
  | 'tiempo_calendario_reloj'
  | 'longitud_distancia'
  | 'perimetro'
  | 'area'
  | 'volumen_capacidad_masa'
  | 'tablas_graficos_pictogramas'
  | 'estadistica_tendencia_central'
  | 'probabilidad_azar';

/**
 * Classifies ANY MINEDUC learning objective into its exact mathematical topic
 */
export function classifyOATopic(oa: LearningObjective): TopicKey {
  const title = oa.title.toLowerCase();
  const t = (oa.title + ' ' + oa.description + ' ' + (oa.indicators ? oa.indicators.join(' ') : '')).toLowerCase();
  const hasWord = (pattern: string, src = t) =>
    new RegExp(`(?:^|[^a-záéíóúñ])(?:${pattern})(?:[^a-záéíóúñ]|$)`, 'i').test(src);

  // Explicit axis-safe checks first for Datos y Probabilidades, Medición, Geometría, and Patrones/Álgebra
  if (oa.axis === 'datos_probabilidades') {
    if (hasWord('población|muestreo', title)) return 'estadistica_tendencia_central';
    if (hasWord('tablas de frecuencias|gráficos?|pictogramas?|diagramas? de tallo', title)) return 'tablas_graficos_pictogramas';
    if (hasWord('probabilidad(?:es)?|azar|aleatorios?|posibilidad|laplace|principio combinatorio|experimentos?')) {
      return 'probabilidad_azar';
    }
    if (hasWord('promedio|media aritmética|moda|mediana|rango|cuartiles?|percentiles?|cajón|sesgos?|muestreo|muestra')) {
      return 'estadistica_tendencia_central';
    }
    return 'tablas_graficos_pictogramas';
  }

  if (oa.axis === 'medicion') {
    if (hasWord('tiempo|reloj(?:es)?|calendarios?|semanas?|mes(?:es)?|horas?|duración')) {
      return 'tiempo_calendario_reloj';
    }
    if (hasWord('áreas?|superficie|cm²|m²', title) || (!hasWord('volumen|capacidad|peso|masa|kilogramos?|gramos?|litros?', title) && hasWord('áreas?|superficie|cm²|m²'))) {
      return 'area';
    }
    if (hasWord('volumen|volúmenes|capacidad|peso|masa|gramos?|kilogramos?|litros?|cm³|m³')) {
      return 'volumen_capacidad_masa';
    }
    if (hasWord('perímetros?')) {
      return 'perimetro';
    }
    if (hasWord('ángulos?') || hasWord('transportador|rectas paralelas')) {
      return 'lineas_angulos';
    }
    if (hasWord('longitud(?:es)?|distancia|metros?|centímetros?|milímetros?|kilómetros?')) {
      return 'longitud_distancia';
    }
    return 'perimetro';
  }

  if (oa.axis === 'geometria') {
    if (hasWord('pitágoras|pitagoras')) return 'teorema_pitagoras';
    if (hasWord('plano cartesiano|cuadrante|localización|ubicación|coordenadas?|mapa|posición')) {
      if (hasWord('traslaci[oó]n(?:es)?|rotaci[oó]n(?:es)?|reflexi[oó]n(?:es)?|isometr[ií]as?')) {
        return 'transformaciones_isometricas';
      }
      return 'ubicacion_espacial_coordenadas';
    }
    if (hasWord('isometr[ií]as?|isométricas?|simetr[ií]as?|traslaci[oó]n(?:es)?|rotaci[oó]n(?:es)?|reflexi[oó]n(?:es)?|teselados?|congruencia')) {
      return 'transformaciones_isometricas';
    }
    if (hasWord('superficie de cubos|redes|3d|paralelepípedos?|prismas?|cilindros?|pirámides?|aristas?|vistas|red')) {
      return 'cuerpos_3d';
    }
    if (hasWord('ángulos?') || hasWord('rectas paralelas|perpendiculares|líneas rectas|bisectrices?')) {
      if (hasWord('construir y comparar triángulos|construcción y comparación de triángulos')) {
        return 'figuras_2d';
      }
      return 'lineas_angulos';
    }
    return 'figuras_2d';
  }

  if (oa.axis === 'patrones_algebra') {
    if (hasWord('funci[oó]n(?:es)?|términos semejantes|lenguaje algebraico|expresiones con letras|generalizaciones?|productos notables|polinomios?|operaciones algebraicas', title)) {
      return 'expresiones_algebraicas_funciones';
    }
    if (hasWord('proporci[oó]n(?:es)?|proporcionalidad')) return 'razones_proporciones';
    if (hasWord('funci[oó]n(?:es)?|términos semejantes|lenguaje algebraico|expresiones con letras|generalizaciones?|productos notables|polinomios?|operaciones algebraicas')) {
      return 'expresiones_algebraicas_funciones';
    }
    if (hasWord('ecuaci[oó]n(?:es)?|inecuaci[oó]n(?:es)?|igualdad|desigualdad|balanza')) {
      return 'ecuaciones_inecuaciones';
    }
    return 'patrones_algebra';
  }

  // Números y Operaciones: check primary topic in title first when unambiguous
  if (hasWord('operaciones combinadas|papomudas|cuatro operaciones', title)) return 'operaciones_combinadas';
  if (hasWord('multiplicación y división', title) && hasWord('q\\+|fracciones|decimales', t)) {
    return hasWord('fracciones', title) ? 'fracciones' : hasWord('decimales', title) ? 'decimales' : 'fracciones';
  }
  if (hasWord('contar|secuenciar', title)) return 'conteo_secuencias';
  if (hasWord('ordinales?', title)) return 'ordinales';
  if (hasWord('comparar|comparación', title) && !hasWord('decimales?|fracciones?', title)) return 'comparacion_orden';
  if (hasWord('cálculo mental', title)) return 'calculo_mental_estrategias';
  if (hasWord('propiedades del 0 y del 1|propiedad del cero', title)) return 'calculo_mental_estrategias';
  if (hasWord('potencias?|raíz|raíces', title) || hasWord('notación científica')) return 'potencias_raices';
  if (hasWord('números enteros|en z|números racionales', title)) return 'enteros';
  if (hasWord('porcentajes?|variaciones porcentuales', title)) return 'porcentajes';
  if (hasWord('razón|razones', title)) return 'razones_proporciones';
  if (hasWord('decimales?|decimal|milésima|centésimo|décimo', title)) return 'decimales';
  if (hasWord('fracciones?|fracción|números mixtos', title)) return 'fracciones';
  if (hasWord('factores|múltiplos|primos|compuestos', title)) return 'factores_multiplos_primos';
  if (hasWord('multiplicación', title) && !hasWord('división|combinadas', title)) return 'multiplicacion';
  if (hasWord('división', title) && !hasWord('multiplicación|combinadas', title)) return 'division';
  if (hasWord('adición|sustracción|sumar|restar|suma|resta|dinero', title)) return 'adicion_sustraccion';
  if (hasWord('valor posicional|unidades y decenas|descomposición|composición|grandes números', title)) return 'valor_posicional_descomposicion';
  if (hasWord('estimación|estimar|redondeo', title)) return 'estimacion_redondeo';
  if (hasWord('lectura|representación|escritura', title)) return 'lectura_escritura_numeros';

  if (hasWord('números enteros|en z|números racionales')) return 'enteros';
  if (hasWord('porcentajes?|variaciones porcentuales|interés|tanto por ciento|iva')) return 'porcentajes';
  if (hasWord('razón|razones|proporci[oó]n(?:es)?')) return 'razones_proporciones';
  if (hasWord('decimales?|decimal|milésima|centésimo|décimo')) return 'decimales';
  if (hasWord('fracciones?|fracción|números mixtos')) return 'fracciones';
  if (hasWord('múltiplos?|factores?|primos?|compuestos?|mcm|mcd')) return 'factores_multiplos_primos';
  if (hasWord('operaciones combinadas|papomudas|paréntesis|cuatro operaciones|4 operaciones|calculadora')) return 'operaciones_combinadas';
  if (hasWord('división|divisiones|divisores?|dividendos?')) return 'division';
  if (hasWord('multiplicación|multiplicaciones|multiplicar|tablas de multiplicar')) return 'multiplicacion';
  if (hasWord('cálculo mental|dobles|propiedades del 0 y del 1|propiedad del cero')) return 'calculo_mental_estrategias';
  if (hasWord('adición|sustracción|sumar|restar|suma|resta|dinero')) return 'adicion_sustraccion';
  if (hasWord('valor posicional|descomponer|descomposición|composición|decenas?|centenas?|unidades y decenas|grandes números')) return 'valor_posicional_descomposicion';
  if (hasWord('estimación|estimar|redondeo|redondear')) return 'estimacion_redondeo';
  if (hasWord('comparar|ordenar|mayor que|menor que')) return 'comparacion_orden';
  if (hasWord('ordinales?')) return 'ordinales';
  if (hasWord('contar|conteo|secuencias?|secuenciar')) return 'conteo_secuencias';
  if (hasWord('lectura|leer números|representar números|simbólica')) return 'lectura_escritura_numeros';

  return 'adicion_sustraccion';
}

/**
 * Returns grade-appropriate numerical magnitude
 */
function getGradeScope(grade: GradeLevel): { maxDirect: number; step: number; placeValueUnits: string[] } {
  switch (grade) {
    case '1_basico':
      return { maxDirect: 20, step: 2, placeValueUnits: ['unidades', 'decenas'] };
    case '2_basico':
      return { maxDirect: 100, step: 5, placeValueUnits: ['unidades', 'decenas', 'centenas'] };
    case '3_basico':
      return { maxDirect: 1000, step: 10, placeValueUnits: ['unidades', 'decenas', 'centenas', 'unidades de mil'] };
    case '4_basico':
      return { maxDirect: 10000, step: 100, placeValueUnits: ['unidades', 'decenas', 'centenas', 'unidades de mil', 'decenas de mil'] };
    case '5_basico':
    case '6_basico':
      return { maxDirect: 100000, step: 500, placeValueUnits: ['unidades', 'decenas', 'centenas', 'unidades de mil', 'decenas de mil', 'centenas de mil'] };
    case '7_basico':
    case '8_basico':
    default:
      return { maxDirect: 1000000, step: 1000, placeValueUnits: ['unidades', 'decenas', 'centenas', 'unidades de mil', 'decenas de mil', 'centenas de mil', 'millones'] };
  }
}

// -------------------------------------------------------------
// TOPIC GENERATOR ENGINE
// Strictly implements:
// Nivel 1 ('facil'): Ejercitación Básica (cálculo directo, algoritmos y conceptos esenciales)
// Nivel 2 ('medio'): Aplicación Intermedia (incógnitas, relaciones, propiedades, comparaciones)
// Nivel 3 ('dificil'): Resolución de Problemas (situaciones contextualizadas reales con dinero $ CLP o vida escolar)
// -------------------------------------------------------------
type TopicGenerator = (
  level: 'facil' | 'medio' | 'dificil',
  grade: GradeLevel,
  oa: LearningObjective,
  qId: string,
  variant: number
) => Question;

const TOPIC_GENERATORS: Record<TopicKey, TopicGenerator> = {
  // 1. Conteo y Secuencias
  conteo_secuencias: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);
    const name = randChoice(CHILEAN_NAMES);
    const stepChoices =
      grade === '1_basico'
        ? [1, 2, 5]
        : grade === '2_basico'
          ? [2, 3, 5, 10]
          : grade === '3_basico'
            ? [5, 10, 25, 50, 100]
            : [10, 25, 50, 100, 250, 500];
    const step = stepChoices[v % stepChoices.length];
    const maxMult = grade === '1_basico' ? (step === 1 ? 12 : step === 2 ? 6 : 2) : grade === '2_basico' ? 8 : 25;
    const start = randInt(1, Math.max(3, maxMult)) * step;

    if (level === 'facil') {
      const arch = v % 5;
      if (arch === 0 || arch === 1) {
        const num = grade === '1_basico' ? randInt(2, 18) : grade === '2_basico' ? randInt(12, 95) : randInt(105, 980);
        const isSucesor = arch === 0;
        const ans = isSucesor ? num + 1 : num - 1;
        return {
          id: qId,
          prompt: isSucesor
            ? `¿Cuál es el SUCESOR (número inmediatamente siguiente) de ${num}?`
            : `¿Cuál es el ANTECESOR (número inmediatamente anterior) de ${num}?`,
          context: isSucesor ? `${num} ➔ [ ? ]` : `[ ? ] ➔ ${num}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ans.toString(),
          explanation: isSucesor ? `El sucesor de ${num} es ${num} + 1 = ${ans}.` : `El antecesor de ${num} es ${num} - 1 = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (arch === 2) {
        const base = grade === '1_basico' ? randInt(1, 10) : grade === '2_basico' ? randInt(10, 70) : randInt(40, 400);
        const s = grade === '1_basico' ? randChoice([1, 2]) : randChoice([2, 5, 10]);
        const seq = [base, base + s, base + 2 * s, base + 3 * s];
        const next = base + 4 * s;
        return {
          id: qId,
          prompt: `Si contamos hacia adelante de ${s} en ${s}, ¿qué número continúa en la secuencia?`,
          context: `${seq.join(', ')}, [ ? ]`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: next.toString(),
          explanation: `Cada vez sumamos ${s}: ${seq[3]} + ${s} = ${next}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Conteo Progresivo'
        };
      } else if (arch === 3) {
        const s = grade === '1_basico' ? randChoice([1, 2]) : randChoice([2, 5, 10]);
        const top = grade === '1_basico' ? randInt(10, 20) : randInt(40, 95);
        const seq = [top, top - s, top - 2 * s, top - 3 * s];
        const next = top - 4 * s;
        return {
          id: qId,
          prompt: `Si contamos en retroceso de ${s} en ${s}, ¿qué número viene después?`,
          context: `${seq.join(', ')}, [ ? ]`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: next.toString(),
          explanation: `Restamos ${s} en cada paso: ${seq[3]} - ${s} = ${next}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Conteo Regresivo'
        };
      } else {
        const center = grade === '1_basico' ? randInt(3, 18) : grade === '2_basico' ? randInt(15, 95) : randInt(120, 890);
        const askSum = v % 10 >= 5;
        return {
          id: qId,
          prompt: askSum
            ? `¿Cuál número está exactamente entre ${center - 1} y ${center + 1}?`
            : `¿Cuántas unidades hay que avanzar para contar desde ${center} hasta ${center + step}?`,
          context: askSum ? `${center - 1}, [ ? ], ${center + 1}` : `${center} ➔ ${center + step}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (askSum ? center : step).toString(),
          explanation: askSum
            ? `Entre ${center - 1} y ${center + 1} está el ${center}.`
            : `La diferencia entre ${center + step} y ${center} es ${step}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Recta y Orden'
        };
      }
    } else if (level === 'medio') {
      const arch = v % 4;
      const isDesc = arch === 1;
      const s = isDesc ? -step : step;
      const baseStart = isDesc ? start + step * 5 : start;
      const seq = [0, 1, 2, 3, 4].map(i => baseStart + i * s);
      if (arch === 0 || arch === 1) {
        const missIdx = (v % 3) + 1; // 1, 2, or 3
        const missing = seq[missIdx];
        const display = seq.map((n, i) => (i === missIdx ? '___' : n)).join(', ');
        return {
          id: qId,
          prompt: `En la secuencia que ${isDesc ? 'retrocede' : 'avanza'} con un patrón constante, ¿qué número falta en el espacio en blanco?`,
          context: display,
          visualType: 'number_line',
          visualData: { numbers: seq, missing },
          questionType: 'numeric',
          correctAnswer: missing.toString(),
          explanation: `La secuencia cambia de ${Math.abs(s)} en ${Math.abs(s)} (${isDesc ? 'restando' : 'sumando'}): el número faltante es ${missing}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (arch === 2) {
        return {
          id: qId,
          prompt: `¿De cuánto en cuánto avanza la siguiente secuencia numérica?`,
          context: seq.slice(0, 4).join(', '),
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: step.toString(),
          explanation: `Observando dos términos seguidos: ${seq[1]} - ${seq[0]} = ${step}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Regla de Conteo'
        };
      } else {
        const intruderIdx = (v % 3) + 1;
        const wrongVal = seq[intruderIdx] + (step === 1 ? 2 : 1);
        const brokenSeq = seq.map((n, i) => (i === intruderIdx ? wrongVal : n));
        return {
          id: qId,
          prompt: `En esta secuencia se coló un número equivocado que rompe el patrón (+${step}). ¿Cuál es el número intruso?`,
          context: brokenSeq.join(', '),
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(String(wrongVal), brokenSeq.map(String)),
          correctAnswer: String(wrongVal),
          explanation: `El patrón suma ${step} en cada paso, por lo que en esa posición correspondía ${seq[intruderIdx]} en vez de ${wrongVal}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Análisis de Secuencia'
        };
      }
    } else {
      const seq = [start, start + step, start + step * 2, start + step * 3];
      const finalCount = start + step * 4;
      const stories = [
        {
          prompt: `${name} ordena sus stickers coleccionables contando de ${step} en ${step}. Si ya anotó ${seq.join(', ')}, ¿cuál es el siguiente total que anotará?`,
          ctx: `${seq.join(' ➔ ')} ➔ ___`,
          ans: finalCount,
          exp: `Sumamos ${step} al último término: ${seq[3]} + ${step} = ${finalCount}.`
        },
        {
          prompt: `Para el proyecto de reciclaje, el curso junta botellas de ${step} en ${step} cada semana. Llevan ${seq.join(', ')} botellas acumuladas. ¿Cuántas tendrán en la quinta semana?`,
          ctx: `${seq.join(', ')}, ___`,
          ans: finalCount,
          exp: `Siguiendo la secuencia (+${step}), ${seq[3]} + ${step} = ${finalCount} botellas.`
        },
        {
          prompt: `${name} ahorra monedas en su alcancía. Al contar de ${step} en ${step} obtuvo ${seq.join(', ')} pesos. ¿Cuánto dinero tendrá al agregar un grupo más de ${step}?`,
          ctx: `${seq.join(', ')}, ?`,
          ans: finalCount,
          exp: `${seq[3]} + ${step} = ${finalCount}.`
        },
        {
          prompt: `En un juego de saltos sobre la recta numérica, una rana parte en ${start + step * 5} y retrocede de ${step} en ${step}: ${start + step * 5}, ${start + step * 4}, ${start + step * 3}. ¿En qué número cae en el cuarto salto?`,
          ctx: `${start + step * 5}, ${start + step * 4}, ${start + step * 3}, ?`,
          ans: start + step * 2,
          exp: `Restamos ${step} cada vez: ${start + step * 3} - ${step} = ${start + step * 2}.`
        },
        {
          prompt: `Un libro tiene capítulos cada ${step} páginas. Si un capítulo comienza en la página ${start}, los siguientes comienzan en ${start + step} y ${start + step * 2}. ¿En qué página inicia el quinto capítulo?`,
          ctx: `${start}, ${start + step}, ${start + step * 2}, ..., ?`,
          ans: finalCount,
          exp: `Avanzando 4 intervalos de ${step}: ${start} + 4 × ${step} = ${finalCount}.`
        }
      ];
      const chosen = stories[v % stories.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        context: chosen.ctx,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 2. Números Ordinales
  ordinales: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);
    const allOrdinals = [
      { num: '1º', word: 'primero', pos: 1 },
      { num: '2º', word: 'segundo', pos: 2 },
      { num: '3º', word: 'tercero', pos: 3 },
      { num: '4º', word: 'cuarto', pos: 4 },
      { num: '5º', word: 'quinto', pos: 5 },
      { num: '6º', word: 'sexto', pos: 6 },
      { num: '7º', word: 'séptimo', pos: 7 },
      { num: '8º', word: 'octavo', pos: 8 },
      { num: '9º', word: 'noveno', pos: 9 },
      { num: '10º', word: 'décimo', pos: 10 },
      { num: '11º', word: 'undécimo', pos: 11 },
      { num: '12º', word: 'duodécimo', pos: 12 },
      { num: '13º', word: 'decimotercero', pos: 13 },
      { num: '14º', word: 'decimocuarto', pos: 14 },
      { num: '15º', word: 'decimoquinto', pos: 15 }
    ];
    const pool = grade === '1_basico' ? allOrdinals.slice(0, 10) : allOrdinals;
    const item = pool[Math.floor(v / 5) % pool.length];
    const allWords = pool.map(o => o.word);
    const allNums = pool.map(o => o.num);
    const contextObj = randChoice(['fila para el almuerzo', 'carrera de atletismo', 'lista de lectura', 'fila de entrada', 'turnos del juego']);

    if (level === 'facil') {
      const arch = v % 5;
      if (arch === 0) {
        return {
          id: qId,
          prompt: `¿Cómo se escribe con palabras el número ordinal ${item.num}?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(item.word, shuffle(allWords)),
          correctAnswer: item.word,
          explanation: `El símbolo ${item.num} corresponde a "${item.word}".`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (arch === 1) {
        return {
          id: qId,
          prompt: `¿Qué símbolo numérico representa la posición "${item.word}"?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(item.num, shuffle(allNums)),
          correctAnswer: item.num,
          explanation: `La palabra "${item.word}" se abrevia con el símbolo ${item.num}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Lectura de Ordinales'
        };
      } else if (arch === 2) {
        const isNext = item.pos < pool.length;
        const target = pool.find(o => o.pos === (isNext ? item.pos + 1 : item.pos - 1))!;
        return {
          id: qId,
          prompt: isNext
            ? `En una ${contextObj}, ¿qué lugar ordinal viene inmediatamente DESPUÉS del ${item.word} (${item.num})?`
            : `En una ${contextObj}, ¿qué lugar ordinal está inmediatamente ANTES del ${item.word} (${item.num})?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(target.word, shuffle(allWords.filter(w => w !== item.word))),
          correctAnswer: target.word,
          explanation: isNext
            ? `Después del ${item.pos}º viene el ${target.pos}º (${target.word}).`
            : `Antes del ${item.pos}º está el ${target.pos}º (${target.word}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Orden Secuencial'
        };
      } else if (arch === 3) {
        const idxA = Math.floor(v / 5) % (pool.length - 2);
        const ordA = pool[idxA];
        const ordB = pool[idxA + 2];
        const mid = pool[idxA + 1];
        return {
          id: qId,
          prompt: `¿Qué posición ordinal se encuentra justo entre el ${ordA.word} (${ordA.num}) y el ${ordB.word} (${ordB.num})?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(mid.word, [ordA.word, ordB.word, ...shuffle(allWords)]),
          correctAnswer: mid.word,
          explanation: `Entre el ${ordA.num} y el ${ordB.num} está el ${mid.num} (${mid.word}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Posición Intermedia'
        };
      } else {
        const name = randChoice(CHILEAN_NAMES);
        return {
          id: qId,
          prompt: `${name} llegó en el ${item.word} lugar en una ${contextObj}. ¿Cuántas personas llegaron ANTES que ${name}?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (item.pos - 1).toString(),
          explanation: `Si ocupa el ${item.pos}º puesto, hay ${item.pos - 1} persona${item.pos - 1 === 1 ? '' : 's'} delante.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Conteo Ordinal'
        };
      }
    } else if (level === 'medio') {
      const arch = v % 4;
      if (arch === 0) {
        const delta = randInt(1, 3);
        const goBack = item.pos > delta + 1;
        const targetPos = goBack ? item.pos - delta : item.pos + delta;
        const targetOrd = pool.find(o => o.pos === targetPos)!;
        return {
          id: qId,
          prompt: goBack
            ? `Si una persona está en el ${item.word} (${item.num}) lugar de una fila y cede ${delta} ${delta === 1 ? 'puesto avanzando hacia adelante? No, retrocede' : 'puestos retrocediendo'} — si retrocede ${delta} ${delta === 1 ? 'lugar' : 'lugares'} hacia el inicio, ¿en qué posición queda?`
            : `Si un estudiante está en el ${item.word} (${item.num}) lugar de una fila y pasa ${delta} ${delta === 1 ? 'puesto' : 'puestos'} más atrás en la fila, ¿en qué lugar queda?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(targetOrd.word, [item.word, ...shuffle(allWords)]),
          correctAnswer: targetOrd.word,
          explanation: goBack
            ? `De la posición ${item.pos} retrocedemos ${delta}: ${item.pos} - ${delta} = ${targetPos} (${targetOrd.word}).`
            : `De la posición ${item.pos} avanzamos ${delta} lugares atrás: ${item.pos} + ${delta} = ${targetPos} (${targetOrd.word}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Desplazamiento en Fila'
        };
      } else if (arch === 1) {
        const totalFila = pool.length;
        const posDesdeInicio = randInt(2, totalFila - 1);
        const ordInicio = pool.find(o => o.pos === posDesdeInicio)!;
        const puestosDetras = totalFila - posDesdeInicio;
        return {
          id: qId,
          prompt: `En una fila de ${totalFila} niños para el quiosco escolar, ${randChoice(CHILEAN_NAMES)} ocupa el ${ordInicio.word} (${ordInicio.num}) lugar desde el inicio. ¿Cuántos niños hay detrás de él/ella?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: puestosDetras.toString(),
          explanation: `${totalFila} - ${posDesdeInicio} = ${puestosDetras} niños están detrás.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (arch === 2) {
        const posA = randInt(1, Math.floor(pool.length / 2));
        const posB = randInt(posA + 2, pool.length);
        const ordA = pool.find(o => o.pos === posA)!;
        const ordB = pool.find(o => o.pos === posB)!;
        const between = posB - posA - 1;
        return {
          id: qId,
          prompt: `En una fila de libros numerados en orden, un diccionario está en el ${ordA.word} (${ordA.num}) lugar y un atlas en el ${ordB.word} (${ordB.num}) lugar. ¿Cuántos libros hay ENTRE el diccionario y el atlas?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: between.toString(),
          explanation: `Entre la posición ${posA} y la ${posB} hay ${posB} - ${posA} - 1 = ${between} libros.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Conteo entre Posiciones'
        };
      } else {
        const basePos = randInt(3, pool.length - 2);
        const stepPos = randChoice([1, 2]);
        const target = pool.find(o => o.pos === basePos + stepPos)!;
        const cur = pool.find(o => o.pos === basePos)!;
        return {
          id: qId,
          prompt: `Un ascensor está en el ${cur.word} (${cur.num}) piso y sube ${stepPos} ${stepPos === 1 ? 'piso' : 'pisos'} más. ¿En qué piso se detiene?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(target.word, [cur.word, ...shuffle(allWords)]),
          correctAnswer: target.word,
          explanation: `${basePos} + ${stepPos} = ${target.pos}, que corresponde al ${target.word} (${target.num}) piso.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Pisos y Orden'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const total = pool.length;
      const refPos = randInt(3, total - 1);
      const refOrd = pool.find(o => o.pos === refPos)!;
      const before = v % 2 === 0;
      const ansPos = before ? refPos - 1 : refPos + 1;
      const ansOrd = pool.find(o => o.pos === ansPos)!;
      const stories = [
        {
          prompt: `En la carrera escolar del colegio compitieron ${total} estudiantes. ${name} llegó a la meta justo ${before ? 'antes' : 'después'} del ${refOrd.word} (${refOrd.num}) lugar. ¿En qué lugar llegó ${name}?`,
          ans: ansOrd.word,
          exp: `El lugar inmediatamente ${before ? 'anterior' : 'posterior'} al ${refOrd.word} (${refOrd.num}) es el ${ansOrd.word} (${ansOrd.num}).`
        },
        {
          prompt: `En un edificio de ${total} pisos, la sala de música está justo ${before ? 'un piso abajo' : 'un piso arriba'} del ${refOrd.word} (${refOrd.num}) piso. ¿En qué piso queda la sala de música?`,
          ans: ansOrd.word,
          exp: `${before ? 'Debajo' : 'Arriba'} del ${refOrd.num} piso está el ${ansOrd.num} (${ansOrd.word}) piso.`
        },
        {
          prompt: `${name} subió ${refPos - 1} vagones desde la locomotora y luego avanzó ${before ? '0' : '2'} — espera: en un tren de ${total} vagones, el vagón comedor está justo ${before ? 'antes' : 'después'} del ${refOrd.word} (${refOrd.num}) vagón. ¿Cuál es su número ordinal?`,
          ans: ansOrd.word,
          exp: `Inmediatamente ${before ? 'antes' : 'después'} del ${refOrd.word} (${refOrd.num}) está el ${ansOrd.word} (${ansOrd.num}).`
        },
        {
          prompt: `En la premiación de lectura escolar se entregaron ${total} diplomas en orden. ${name} subió al escenario inmediatamente ${before ? 'antes' : 'después'} de quien recibió el ${refOrd.word} (${refOrd.num}) diploma. ¿Qué lugar ordinal tuvo ${name}?`,
          ans: ansOrd.word,
          exp: `Corresponde al ${ansOrd.word} (${ansOrd.num}) diploma.`
        }
      ];
      // Clean phrasing for vagón story
      stories[2].prompt = `En un tren de ${total} vagones numerados desde la locomotora, el vagón comedor está justo ${before ? 'antes' : 'después'} del ${refOrd.word} (${refOrd.num}) vagón. ¿Qué posición ocupa el vagón comedor?`;
      const chosen = stories[v % stories.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: uniqueMcOptions(chosen.ans, [refOrd.word, ...shuffle(allWords)]),
        correctAnswer: chosen.ans,
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 3. Lectura y Escritura de Números
  lectura_escritura_numeros: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);
    const scope = getGradeScope(grade);
    const minN = grade === '1_basico' ? 2 : grade === '2_basico' ? 11 : grade === '3_basico' ? 105 : 1005;
    const n = randInt(minN, scope.maxDirect);
    const words = numberToSpanishWords(n);

    if (level === 'facil') {
      const arch = v % 4;
      if (arch === 0) {
        return {
          id: qId,
          prompt: `Escribe en cifras el siguiente número leído con palabras:`,
          context: `"${words}"`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: n.toString(),
          explanation: `La lectura "${words}" se escribe en cifras como ${n}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Escritura en Cifras'
        };
      } else if (arch === 1) {
        const d1 = n + 10;
        const d2 = Math.max(1, n - 1);
        const d3 = n >= 100 ? Number(n.toString().split('').reverse().join('')) : n + 2;
        return {
          id: qId,
          prompt: `¿Cómo se lee correctamente el número ${n.toLocaleString('es-CL')}?`,
          context: n.toLocaleString('es-CL'),
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(
            words,
            [numberToSpanishWords(d1), numberToSpanishWords(d2), numberToSpanishWords(d3)],
            [numberToSpanishWords(n + 5), numberToSpanishWords(n + 12)]
          ),
          correctAnswer: words,
          explanation: `El número ${n.toLocaleString('es-CL')} se lee "${words}".`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Lectura de Números'
        };
      } else if (arch === 2) {
        const d = Math.floor((n % 100) / 10);
        const u = n % 10;
        const c = Math.floor((n % 1000) / 100);
        const um = Math.floor(n / 1000);
        const descParts = [
          um > 0 ? `${um} unidad${um > 1 ? 'es' : ''} de mil` : '',
          c > 0 ? `${c} centena${c > 1 ? 's' : ''}` : '',
          d > 0 ? `${d} decena${d > 1 ? 's' : ''}` : '',
          u > 0 ? `${u} unidad${u > 1 ? 'es' : ''}` : '',
        ].filter(Boolean);
        return {
          id: qId,
          prompt: `¿Qué número se representa con ${descParts.join(', ')}?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: n.toString(),
          explanation: `Juntando cada posición formamos exactamente el número ${n}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Representación Simbólica'
        };
      } else {
        const exactN = grade === '1_basico' ? randInt(10, 20) : grade === '2_basico' ? randInt(20, 99) : randChoice([105, 208, 304, 409, 502, 607, 1040, 2050, 3008, 4070].filter(x => x <= scope.maxDirect));
        const exactWords = numberToSpanishWords(exactN);
        const fake1 = exactN < 100 ? exactN + 10 : exactN + 100;
        const fake2 = exactN < 100 ? Math.max(1, exactN - 10) : exactN * 10;
        const fake3 = Number(exactN.toString().replace('0', '')) || exactN + 1;
        return {
          id: qId,
          prompt: `Selecciona la escritura en cifras correcta para "${exactWords}":`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(exactN.toString(), [fake1.toString(), fake2.toString(), fake3.toString()], [(exactN + 3).toString()]),
          correctAnswer: exactN.toString(),
          explanation: `"${exactWords}" corresponde exactamente a ${exactN}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Lectura y Cifras'
        };
      }
    } else if (level === 'medio') {
      const arch = v % 4;
      if (arch === 0) {
        const d = Math.floor(n / 10) * 10;
        const u = n % 10;
        return {
          id: qId,
          prompt: `¿Qué número se forma al componer ${d} y ${u}?`,
          context: `${d} + ${u} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: n.toString(),
          explanation: `${d} + ${u} = ${n}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (arch === 1) {
        const d1 = randInt(1, grade === '1_basico' ? 1 : 9);
        const d2 = randInt(0, 9);
        const d3 = grade === '1_basico' || grade === '2_basico' ? null : randInt(1, 9);
        const digits = d3 !== null ? [d1, d2, d3] : [d1, d2];
        const sortedDesc = [...digits].sort((a, b) => b - a);
        const maxNum = Number(sortedDesc.join(''));
        const askMax = v % 8 < 4;
        const nonZero = digits.filter(x => x > 0).sort((a, b) => a - b);
        const zeros = digits.filter(x => x === 0);
        const minNum = nonZero.length > 0 ? Number([nonZero[0], ...zeros, ...nonZero.slice(1)].join('')) : maxNum;
        return {
          id: qId,
          prompt: `Usando todas las tarjetas con los dígitos { ${digits.join(', ')} } una sola vez, ¿cuál es el ${askMax ? 'MAYOR' : 'MENOR'} número que se puede formar?`,
          context: `Tarjetas: [ ${digits.join(' ] [ ')} ]`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (askMax ? maxNum : minNum).toString(),
          explanation: askMax
            ? `Ordenando los dígitos de mayor a menor obtenemos ${maxNum}.`
            : `Ordenando de menor a mayor (sin partir con 0) obtenemos ${minNum}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Formación de Números'
        };
      } else if (arch === 2) {
        const tens = Math.floor(n / 10);
        const units = n % 10;
        const askTens = v % 2 === 0;
        return {
          id: qId,
          prompt: `El número "${words}" tiene un cero o cifra específica. ¿Cuál dígito está en la posición de las ${askTens ? 'DECENAS' : 'UNIDADES'} de ${n}?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (askTens ? tens % 10 : units).toString(),
          explanation: `En ${n}, las unidades son ${units} y el dígito de las decenas es ${tens % 10}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Escritura y Posición'
        };
      } else {
        const partA = Math.floor(n / 2);
        const partB = n - partA;
        return {
          id: qId,
          prompt: `En una boleta dice "${words}". Si se descompone como ${partA} + ___, ¿qué número falta?`,
          context: `"${words}" = ${partA} + [ ? ]`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: partB.toString(),
          explanation: `"${words}" equivale a ${n}. Restamos ${n} - ${partA} = ${partB}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Equivalencias Numéricas'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const extra = grade === '1_basico' ? randInt(1, 5) : grade === '2_basico' ? randChoice([10, 20, 30]) : randChoice([100, 200, 500, 1000]);
      const safeN = grade === '1_basico' ? Math.min(n, 15) : grade === '2_basico' ? Math.min(n, 70) : n;
      const safeWords = numberToSpanishWords(safeN);
      const stories = [
        {
          prompt: `${name} anotó en su libreta que reunió "${safeWords}" pesos y luego recibió ${formatCLP(extra)} más. ¿Cuánto dinero tiene ahora en total?`,
          ans: safeN + extra,
          exp: `"${safeWords}" equivale a ${safeN}. Sumando ${extra}: ${safeN} + ${extra} = ${safeN + extra}.`
        },
        {
          prompt: `En un cheque simbólico de la kermesse escolar dice: Páguese la cantidad de "${safeWords} pesos". ¿Qué número en cifras debe registrar la tesorera?`,
          ans: safeN,
          exp: `"${safeWords}" escrito en cifras es ${safeN}.`
        },
        {
          prompt: `El número de entrada para la rifa de la escuela de ${name} es el sucesor de "${safeWords}". ¿Cuál es el número de su boleto en cifras?`,
          ans: safeN + 1,
          exp: `"${safeWords}" es ${safeN}, y su sucesor es ${safeN} + 1 = ${safeN + 1}.`
        },
        {
          prompt: `El letrero de kilometraje de la carretera marca "${safeWords}" km. Si el bus avanza ${extra} km más, ¿qué número marcará el letrero?`,
          ans: safeN + extra,
          exp: `${safeN} + ${extra} = ${safeN + extra} km.`
        }
      ];
      const chosen = stories[v % stories.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 4. Comparación y Orden (>, <, =)
  comparacion_orden: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);
    const scope = getGradeScope(grade);
    const minV = grade === '1_basico' ? 2 : grade === '2_basico' ? 12 : 30;
    const a = randInt(minV, scope.maxDirect);
    let b = randInt(minV, scope.maxDirect);
    while (b === a) b = randInt(minV, scope.maxDirect);

    if (level === 'facil') {
      const arch = v % 4;
      if (arch === 0) {
        const useEqual = v % 8 === 4;
        const rightVal = useEqual ? a : b;
        const sign = useEqual ? '=' : a > rightVal ? '>' : '<';
        return {
          id: qId,
          prompt: `¿Qué signo de comparación corresponde entre ${a} y ${rightVal}?`,
          context: `${a}  ___  ${rightVal}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: ['>', '<', '='],
          correctAnswer: sign,
          explanation: useEqual
            ? `${a} y ${rightVal} representan exactamente la misma cantidad (=).`
            : `${a} es ${a > rightVal ? 'mayor que (>)' : 'menor que (<)'} ${rightVal}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Signos de Comparación'
        };
      } else if (arch === 1) {
        const mayor = Math.max(a, b);
        const menor = Math.min(a, b);
        const askMax = v % 2 === 0;
        return {
          id: qId,
          prompt: askMax
            ? `¿Cuál de los siguientes números es MAYOR: ${a} o ${b}?`
            : `¿Cuál de los siguientes números es MENOR: ${a} o ${b}?`,
          context: `${a}   vs   ${b}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (askMax ? mayor : menor).toString(),
          explanation: `Al comparar ${a} y ${b}, ${mayor} es mayor y ${menor} es menor.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Comparación Directa'
        };
      } else if (arch === 2) {
        const ref = randInt(minV + 2, Math.max(minV + 5, scope.maxDirect - 5));
        const askGreater = v % 3 !== 0;
        const ans = askGreater ? ref + randInt(1, 5) : Math.max(1, ref - randInt(1, 5));
        const d1 = ref;
        const d2 = askGreater ? Math.max(1, ref - randInt(1, 4)) : ref + randInt(1, 4);
        const d3 = askGreater ? Math.max(0, ref - randInt(5, 8)) : ref + randInt(5, 8);
        return {
          id: qId,
          prompt: askGreater
            ? `¿Cuál de estos números es ESTRICTAMENTE MAYOR que ${ref}?`
            : `¿Cuál de estos números es ESTRICTAMENTE MENOR que ${ref}?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans.toString(), [d1.toString(), d2.toString(), d3.toString()], [(ans + 1).toString()]),
          correctAnswer: ans.toString(),
          explanation: `${ans} es ${askGreater ? 'mayor' : 'menor'} que ${ref}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Selección por Orden'
        };
      } else {
        const n1 = Math.min(a, b);
        const n2 = Math.max(a, b);
        const correct = `${n1} < ${n2}`;
        return {
          id: qId,
          prompt: `¿Cuál expresión matemática es VERDADERA?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${n1} > ${n2}`, `${n2} < ${n1}`, `${n1} = ${n2}`]),
          correctAnswer: correct,
          explanation: `${n1} es menor que ${n2}, por eso ${n1} < ${n2} es verdadera.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Afirmaciones de Orden'
        };
      }
    } else if (level === 'medio') {
      const baseSet = new Set<number>([a, b]);
      while (baseSet.size < 4) {
        baseSet.add(randInt(minV, scope.maxDirect));
      }
      const list = shuffle(Array.from(baseSet));
      const sortedAsc = [...list].sort((x, y) => x - y);
      const sortedDesc = [...list].sort((x, y) => y - x);
      const arch = v % 4;
      if (arch === 0) {
        return {
          id: qId,
          prompt: `Entre los siguientes números: ${list.join(', ')}, ¿cuál es el MENOR de todos?`,
          context: list.join(' · '),
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: sortedAsc[0].toString(),
          explanation: `Ordenados de menor a mayor (${sortedAsc.join(' < ')}), el menor es ${sortedAsc[0]}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (arch === 1) {
        return {
          id: qId,
          prompt: `Observa el grupo de números: ${list.join(', ')}. ¿Cuál es el MAYOR de todos?`,
          context: list.join(' · '),
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: sortedDesc[0].toString(),
          explanation: `El valor más alto de la lista es ${sortedDesc[0]}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Mayor de un Conjunto'
        };
      } else if (arch === 2) {
        const ascOrder = sortedAsc.join(' < ');
        return {
          id: qId,
          prompt: `¿Cuál alternativa ordena los números { ${list.join(', ')} } correctamente de MENOR a MAYOR?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ascOrder, [
            sortedDesc.join(' < '),
            [sortedAsc[0], sortedAsc[2], sortedAsc[1], sortedAsc[3]].join(' < '),
            [sortedAsc[1], sortedAsc[0], sortedAsc[2], sortedAsc[3]].join(' < ')
          ]),
          correctAnswer: ascOrder,
          explanation: `De menor a mayor es ${ascOrder}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Ordenar Cantidades'
        };
      } else {
        const low = sortedAsc[0];
        const high = sortedAsc[2];
        const mid = sortedAsc[1];
        return {
          id: qId,
          prompt: `¿Cuál de estos números está ubicado entre ${low} y ${high}?`,
          context: `${low} < [ ? ] < ${high}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(mid.toString(), [
            Math.max(1, low - 1).toString(),
            (high + 2).toString(),
            sortedAsc[3].toString()
          ], [(high + 5).toString()]),
          correctAnswer: mid.toString(),
          explanation: `${low} < ${mid} < ${high}, por lo que ${mid} está entre ambos.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Recta Numérica'
        };
      }
    } else {
      const name1 = randChoice(CHILEAN_NAMES);
      const name2 = randChoice(CHILEAN_NAMES.filter(n => n !== name1));
      const diff = Math.abs(a - b);
      const maxVal = Math.max(a, b);
      const minVal = Math.min(a, b);
      const stories = [
        {
          prompt: `En una colecta escolar, ${name1} reunió ${formatCLP(a)} y ${name2} reunió ${formatCLP(b)}. ¿Cuánto dinero más reunió quien juntó la mayor cantidad?`,
          ans: diff.toString(),
          exp: `La diferencia es ${formatCLP(maxVal)} - ${formatCLP(minVal)} = ${formatCLP(diff)}.`
        },
        {
          prompt: `En el campeonato matemático, ${name1} obtuvo ${a} puntos y ${name2} obtuvo ${b} puntos. ¿Cuántos puntos de diferencia hubo entre ambos?`,
          ans: diff.toString(),
          exp: `${maxVal} - ${minVal} = ${diff} puntos de diferencia.`
        },
        {
          prompt: `Tres amigos comparan sus pasos diarios: ${name1} dio ${a} pasos, ${name2} dio ${b} pasos y Lucas dio ${minVal + 1 === maxVal ? maxVal + 3 : Math.floor((a + b) / 2)} pasos. ¿Cuál fue la cantidad MENOR de pasos?`,
          ans: minVal.toString(),
          exp: `El menor registro de pasos es ${minVal}.`
        },
        {
          prompt: `En la feria libre, una malla de limones cuesta ${formatCLP(a)} y una bandeja de frutillas cuesta ${formatCLP(b)}. ¿Cuál es el precio del producto MÁS CARO?`,
          ans: maxVal.toString(),
          exp: `Al comparar ${formatCLP(a)} y ${formatCLP(b)}, el mayor precio es ${formatCLP(maxVal)}.`
        }
      ];
      const chosen = stories[v % stories.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans,
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 5. Estimación y Redondeo
  estimacion_redondeo: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);
    if (grade === '1_basico') {
      const arch = v % 4;
      const name = randChoice(CHILEAN_NAMES);
      if (level === 'facil') {
        if (arch === 0) {
          const n = randChoice([1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19]);
          const ans = Math.round(n / 10) * 10;
          return {
            id: qId,
            prompt: `¿A qué decena (0, 10 o 20) está más cerca el número ${n}?`,
            context: `${n} ➔ ___`,
            visualType: 'none',
            questionType: 'multiple_choice',
            options: uniqueMcOptions(ans.toString(), ['0', '10', '20', '15']),
            correctAnswer: ans.toString(),
            explanation: `El número ${n} está más cerca de ${ans}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Estimación hasta 20'
          };
        } else if (arch === 1) {
          const target = randChoice([5, 10, 20]);
          const good = target === 5 ? randChoice([4, 6]) : target === 10 ? randChoice([9, 11]) : randChoice([18, 19]);
          const opts = target === 5 ? ['16', '19', '20'] : target === 10 ? ['1', '2', '20'] : ['2', '5', '9'];
          return {
            id: qId,
            prompt: `¿Cuál de estos números está MÁS CERCA de ${target}?`,
            visualType: 'none',
            questionType: 'multiple_choice',
            options: uniqueMcOptions(good.toString(), opts),
            correctAnswer: good.toString(),
            explanation: `${good} está a solo ${Math.abs(good - target)} unidad${Math.abs(good - target) === 1 ? '' : 'es'} de ${target}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Estimación con Referente'
          };
        } else if (arch === 2) {
          const ref = randChoice([4, 5, 6, 8, 10]);
          const ans = ref * 2;
          return {
            id: qId,
            prompt: `El frasco A tiene ${ref} bolitas. El frasco B tiene aproximadamente el DOBLE que el frasco A. ¿Cuántas bolitas estimas que hay en el frasco B?`,
            visualType: 'none',
            questionType: 'multiple_choice',
            options: uniqueMcOptions(ans.toString(), ['2', Math.max(1, ref - 3).toString(), Math.min(20, ans + 5).toString(), '1']),
            correctAnswer: ans.toString(),
            explanation: `El doble de ${ref} es ${ans}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Estimación con Referente'
          };
        } else {
          const total = randChoice([10, 12, 14, 16, 18, 20]);
          const ans = total / 2;
          return {
            id: qId,
            prompt: `Una caja llena tiene ${total} lápices. Si se ve aproximadamente la MITAD de la caja llena, ¿cuántos lápices estimas que quedan?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: ans.toString(),
            explanation: `La mitad de ${total} es ${ans} lápices.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Estimación con Referente'
          };
        }
      } else {
        const scenarios = [
          () => {
            const ref = randInt(5, 10);
            const delta = randInt(2, 5);
            const item = randChoice(['chapitas', 'bolitas', 'lápices', 'láminas']);
            return {
              prompt: `${name} tiene ${ref} ${item} en una mano y un grupo casi igual, pero con ${delta} más, en la otra. ¿Cuántas ${item} tiene en el segundo grupo?`,
              ans: (ref + delta).toString(),
              exp: `${ref} + ${delta} = ${ref + delta}.`
            };
          },
          () => {
            const c1 = randChoice([5, 6, 8, 10]);
            const c2 = randChoice([4, 5, 8, 10]);
            const total = c1 + c2;
            return {
              prompt: `En una bolsa hay cerca de ${c1} dulces y en otra cerca de ${c2} dulces. ¿Cuántos dulces estimas que hay en total?`,
              ans: total.toString(),
              exp: `Sumamos los referentes: ${c1} + ${c2} = ${total} dulces.`
            };
          },
          () => {
            const full = randChoice([14, 16, 18, 20]);
            const less = randInt(3, 7);
            return {
              prompt: `Un estuche lleno guarda ${full} gomas. Si ${name} sacó ${less} gomas, ¿cuántas gomas aproximadamente quedan dentro?`,
              ans: (full - less).toString(),
              exp: `${full} − ${less} = ${full - less} gomas.`
            };
          },
          () => {
            const n = randChoice([3, 4, 7, 8, 12, 13, 17, 18]);
            const ans = Math.round(n / 10) * 10;
            return {
              prompt: `${name} contó ${n} semillas para plantar en el huerto. ¿A cuál número referente está más cercano: 0, 10 o 20?`,
              ans: ans.toString(),
              exp: `${n} está más cerca de ${ans}.`
            };
          }
        ];
        const s = scenarios[v % scenarios.length]();
        return {
          id: qId,
          prompt: s.prompt,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: s.ans,
          explanation: s.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: level === 'medio' ? 'Nivel 2: Aplicación hasta 20' : 'Nivel 3: Resolución hasta 20'
        };
      }
    }

    const maxCap = grade === '2_basico' ? 99 : grade === '3_basico' ? 990 : 8990;
    const n = randInt(21, maxCap);
    const roundedDec = Math.round(n / 10) * 10;
    const nCen = randInt(125, Math.max(250, Math.min(maxCap, 8990)));
    const roundedCen = Math.round(nCen / 100) * 100;

    if (level === 'facil') {
      const arch = grade === '2_basico' ? v % 2 : v % 4;
      if (arch === 0) {
        return {
          id: qId,
          prompt: `Aproxima el número ${n} a la DECENA más cercana:`,
          context: `${n} ➔ ___`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: roundedDec.toString(),
          explanation: `El múltiplo de 10 más cercano a ${n} es ${roundedDec}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Redondeo a la Decena'
        };
      } else if (arch === 1) {
        const targetDec = randChoice([20, 30, 40, 50, 60, 70, 80, 90]);
        const valid = targetDec + randChoice([-3, -2, 1, 3, 4]);
        const wrong1 = targetDec + 12;
        const wrong2 = targetDec - 13;
        const wrong3 = targetDec + 21;
        return {
          id: qId,
          prompt: `¿Cuál de los siguientes números se redondea a ${targetDec} al aproximarlo a la decena más cercana?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(valid.toString(), [wrong1.toString(), wrong2.toString(), wrong3.toString()]),
          correctAnswer: valid.toString(),
          explanation: `${valid} está a solo ${Math.abs(valid - targetDec)} unidades de ${targetDec}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Identificar Redondeo'
        };
      } else if (arch === 2) {
        return {
          id: qId,
          prompt: `Aproxima el número ${nCen} a la CENTENA más cercana:`,
          context: `${nCen} ➔ ___`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: roundedCen.toString(),
          explanation: `La centena exacta más cercana a ${nCen} es ${roundedCen}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Redondeo a la Centena'
        };
      } else {
        const nMil = randInt(1150, 8850);
        const rMil = Math.round(nMil / 1000) * 1000;
        return {
          id: qId,
          prompt: `Redondea el número ${nMil.toLocaleString('es-CL')} a la UNIDAD DE MIL más cercana:`,
          context: `${nMil.toLocaleString('es-CL')} ➔ ___`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: rMil.toString(),
          explanation: `La unidad de mil más cercana a ${nMil} es ${rMil}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Redondeo a Unidad de Mil'
        };
      }
    } else if (level === 'medio') {
      const arch = v % 4;
      const a = randInt(21, 78);
      const b = randInt(18, 69);
      const rA = Math.round(a / 10) * 10;
      const rB = Math.round(b / 10) * 10;
      if (arch === 0) {
        const est = rA + rB;
        return {
          id: qId,
          prompt: `Redondea cada sumando a la decena más cercana y estima el resultado de: ${a} + ${b}`,
          context: `(${rA} + ${rB}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: est.toString(),
          explanation: `${a} ≈ ${rA} y ${b} ≈ ${rB}. Suma estimada = ${est}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Estimar Adición'
        };
      } else if (arch === 1) {
        const big = Math.max(a, b) + 30;
        const small = Math.min(a, b);
        const rBig = Math.round(big / 10) * 10;
        const rSmall = Math.round(small / 10) * 10;
        const est = rBig - rSmall;
        return {
          id: qId,
          prompt: `Redondea ambos números a la decena más cercana para estimar la resta: ${big} - ${small}`,
          context: `(${rBig} - ${rSmall}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: est.toString(),
          explanation: `${big} ≈ ${rBig} y ${small} ≈ ${rSmall}. Diferencia estimada = ${est}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Estimar Sustracción'
        };
      } else if (arch === 2) {
        const c1 = randInt(125, 580);
        const c2 = randInt(120, 490);
        const rc1 = Math.round(c1 / 100) * 100;
        const rc2 = Math.round(c2 / 100) * 100;
        return {
          id: qId,
          prompt: `Estima la suma redondeando cada cantidad a la CENTENA más cercana: ${c1} + ${c2}`,
          context: `(${rc1} + ${rc2}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (rc1 + rc2).toString(),
          explanation: `${c1} ≈ ${rc1} y ${c2} ≈ ${rc2}. Total estimado = ${rc1 + rc2}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Estimar Centenas'
        };
      } else {
        const f1 = randInt(18, 49);
        const f2 = randInt(3, 8);
        const rf1 = Math.round(f1 / 10) * 10;
        return {
          id: qId,
          prompt: `Redondea el primer factor a la decena más cercana y estima el producto: ${f1} × ${f2}`,
          context: `${rf1} × ${f2} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (rf1 * f2).toString(),
          explanation: `${f1} se redondea a ${rf1}. Luego ${rf1} × ${f2} = ${rf1 * f2}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Estimar Productos'
        };
      }
    } else {
      const price1 = randInt(160, 440);
      const price2 = randInt(210, 580);
      const rc1 = Math.round(price1 / 100) * 100;
      const rc2 = Math.round(price2 / 100) * 100;
      const estTotal = rc1 + rc2;
      const asistentes1 = randInt(215, 480);
      const asistentes2 = randInt(315, 590);
      const ra1 = Math.round(asistentes1 / 100) * 100;
      const ra2 = Math.round(asistentes2 / 100) * 100;
      const kmDia1 = randInt(118, 285);
      const kmDia2 = randInt(125, 290);
      const rk1 = Math.round(kmDia1 / 10) * 10;
      const rk2 = Math.round(kmDia2 / 10) * 10;
      const name = randChoice(CHILEAN_NAMES);
      const stories = [
        {
          prompt: `En el almacén escolar Don Pedro, un jugo cuesta ${formatCLP(price1)} y una barra de cereal cuesta ${formatCLP(price2)}. Si redondeas ambos precios a la centena más cercana, ¿cuál es el costo estimado total?`,
          ans: estTotal,
          exp: `${price1} ≈ ${rc1} y ${price2} ≈ ${rc2}. Total estimado: ${formatCLP(estTotal)}.`
        },
        {
          prompt: `Al festival de la escuela asistieron ${asistentes1} apoderados en la mañana y ${asistentes2} en la tarde. Estimando cada número a la centena más cercana, ¿cuántas personas asistieron aproximadamente en total?`,
          ans: ra1 + ra2,
          exp: `${asistentes1} ≈ ${ra1} y ${asistentes2} ≈ ${ra2}. Total aproximado: ${ra1 + ra2}.`
        },
        {
          prompt: `En su viaje por el norte de Chile, ${name} recorrió ${kmDia1} km el sábado y ${kmDia2} km el domingo. Si redondea ambos trayectos a la DECENA más cercana, ¿cuántos kilómetros estima que recorrió?`,
          ans: rk1 + rk2,
          exp: `${kmDia1} ≈ ${rk1} y ${kmDia2} ≈ ${rk2}. Suma estimada: ${rk1 + rk2} km.`
        },
        {
          prompt: `${name} lleva ${formatCLP(1000)} para comprar un cuaderno de ${formatCLP(price1 + 200)}. Redondeando el precio a la centena más cercana, ¿cuánto dinero estima que le quedará de vuelto?`,
          ans: 1000 - Math.round((price1 + 200) / 100) * 100,
          exp: `${price1 + 200} ≈ ${Math.round((price1 + 200) / 100) * 100}. Vuelto estimado: ${1000 - Math.round((price1 + 200) / 100) * 100}.`
        }
      ];
      const chosen = stories[v % stories.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 6. Valor Posicional y Descomposición
  valor_posicional_descomposicion: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);
    const scope = getGradeScope(grade);
    const n =
      grade === '1_basico'
        ? randInt(11, 20)
        : grade === '2_basico'
          ? randInt(21, 99)
          : randInt(125, Math.min(scope.maxDirect, 99850));

    const u = n % 10;
    const dDigit = Math.floor((n % 100) / 10);
    const cDigit = Math.floor((n % 1000) / 100);
    const umDigit = Math.floor((n % 10000) / 1000);

    if (level === 'facil') {
      if (grade === '1_basico') {
        const n1 = randInt(11, 20);
        const u1 = n1 % 10;
        const d1 = Math.floor(n1 / 10);
        const arch1 = v % 4;
        if (arch1 === 0) {
          return {
            id: qId,
            prompt: `¿Qué dígito ocupa el lugar de las UNIDADES en el número ${n1}?`,
            context: `${n1}`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: u1.toString(),
            explanation: `En ${n1}, la cifra de la derecha (${u1}) corresponde a las unidades.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Unidades'
          };
        } else if (arch1 === 1) {
          return {
            id: qId,
            prompt: `¿Cuántas DECENAS completas tiene el número ${n1}?`,
            context: `${n1}`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: d1.toString(),
            explanation: `En ${n1}, el dígito de las decenas es ${d1}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Decenas'
          };
        } else if (arch1 === 2) {
          const uJoin = randInt(1, 9);
          return {
            id: qId,
            prompt: `Si juntas 1 decena (10) y ${uJoin} unidad${uJoin === 1 ? '' : 'es'} suelta${uJoin === 1 ? '' : 's'}, ¿qué número formas?`,
            context: `10 + ${uJoin} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (10 + uJoin).toString(),
            explanation: `1 decena (10) más ${uJoin} unidad${uJoin === 1 ? '' : 'es'} forman ${10 + uJoin}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Composición Aditiva'
          };
        } else {
          const nDec = randInt(11, 19);
          return {
            id: qId,
            prompt: `Descompón el número ${nDec}: ${nDec} = 10 + ___`,
            context: `${nDec} = 10 + ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (nDec - 10).toString(),
            explanation: `${nDec} se descompone en 1 decena (10) y ${nDec - 10} unidades.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Descomposición'
          };
        }
      }

      const arch = grade === '2_basico' ? v % 3 : v % 4;
      if (arch === 0) {
        return {
          id: qId,
          prompt: `¿Qué dígito ocupa el lugar de las UNIDADES en el número ${n}?`,
          context: `${n}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: u.toString(),
          explanation: `En ${n}, la última cifra de la derecha (${u}) corresponde a las unidades.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Unidades'
        };
      } else if (arch === 1) {
        return {
          id: qId,
          prompt: `¿Cuántas DECENAS sueltas (dígito en la posición de las decenas) tiene el número ${n}?`,
          context: `${n}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: dDigit.toString(),
          explanation: `En ${n}, el dígito en el lugar de las decenas es ${dDigit} (equivale a ${dDigit * 10}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Decenas'
        };
      } else if (arch === 2) {
        const val = dDigit * 10;
        return {
          id: qId,
          prompt: `¿Cuál es el VALOR POSICIONAL del dígito de las decenas (${dDigit}) en el número ${n}?`,
          context: `${n}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: val.toString(),
          explanation: `Como ${dDigit} está en las decenas, su valor es ${dDigit} × 10 = ${val}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Valor Posicional'
        };
      } else {
        const askCen = umDigit === 0 || v % 2 === 0;
        const digit = askCen ? cDigit : umDigit;
        const mult = askCen ? 100 : 1000;
        return {
          id: qId,
          prompt: `En el número ${n.toLocaleString('es-CL')}, ¿cuál es el valor posicional del dígito en las ${askCen ? 'CENTENAS' : 'UNIDADES DE MIL'}?`,
          context: n.toLocaleString('es-CL'),
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (digit * mult).toString(),
          explanation: `El dígito es ${digit} en las ${askCen ? 'centenas' : 'unidades de mil'}, por lo que vale ${digit * mult}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Valor Posicional'
        };
      }
    } else if (level === 'medio') {
      const arch = v % 4;
      if (arch === 0) {
        const part = cDigit > 0 ? Math.floor(n / 100) * 100 : dDigit * 10;
        return {
          id: qId,
          prompt: `Completa la descomposición aditiva: ¿Qué número falta en ${n} = ${part} + ___ ?`,
          context: `${n} = ${part} + [ ? ]`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (n - part).toString(),
          explanation: `${n} - ${part} = ${n - part}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Descomposición Aditiva'
        };
      } else if (arch === 1) {
        const part = dDigit * 10 + u;
        const rest = n - part;
        return {
          id: qId,
          prompt: `¿Qué número falta en la descomposición: ${n} = [ ? ] + ${part}?`,
          context: `${n} = [ ? ] + ${part}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: rest.toString(),
          explanation: `${n} - ${part} = ${rest}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Composición'
        };
      } else if (arch === 2) {
        const delta = grade === '1_basico' ? 10 : grade === '2_basico' ? randChoice([10, 20, 30]) : randChoice([100, 200, 1000]);
        const add = v % 2 === 0;
        const ans = add ? n + delta : Math.max(0, n - delta);
        return {
          id: qId,
          prompt: `Si al número ${n} le ${add ? 'agregas' : 'quitas'} ${delta === 1000 ? '1 unidad de mil' : delta >= 100 ? `${delta / 100} centena(s)` : `${delta / 10} decena(s)`}, ¿qué número resulta?`,
          context: `${n} ${add ? '+' : '-'} ${delta} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ans.toString(),
          explanation: `${n} ${add ? '+' : '-'} ${delta} = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Cambio Posicional'
        };
      } else {
        const decVal = Math.floor(n / 10);
        return {
          id: qId,
          prompt: `¿Cuántas decenas COMPLETAS caben en el número ${n}?`,
          context: `${n} = [ ? ] decenas + ${u} unidades`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: decVal.toString(),
          explanation: `Al dividir ${n} entre 10 obtenemos ${decVal} decenas completas (sobran ${u} unidades).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Equivalencias'
        };
      }
    } else {
      const billetes1000 = randInt(1, 8);
      const monedas100 = randInt(2, 9);
      const monedas10 = randInt(1, 9);
      const totalDinero = billetes1000 * 1000 + monedas100 * 100 + monedas10 * 10;
      const cajas100 = randInt(2, 9);
      const bolsas10 = randInt(1, 9);
      const sueltos = randInt(1, 9);
      const name = randChoice(CHILEAN_NAMES);
      const stories = [
        {
          prompt: `${name} tiene ${billetes1000} billetes de $1.000, ${monedas100} monedas de $100 y ${monedas10} monedas de $10. ¿Cuánto dinero tiene en total?`,
          ans: totalDinero,
          exp: `(${billetes1000} × 1.000) + (${monedas100} × 100) + (${monedas10} × 10) = ${formatCLP(totalDinero)}.`
        },
        {
          prompt: `En la bodega escolar hay ${cajas100} cajas de 100 lápices, ${bolsas10} estuches de 10 lápices y ${sueltos} lápices sueltos. ¿Cuántos lápices hay en total?`,
          ans: cajas100 * 100 + bolsas10 * 10 + sueltos,
          exp: `${cajas100 * 100} + ${bolsas10 * 10} + ${sueltos} = ${cajas100 * 100 + bolsas10 * 10 + sueltos} lápices.`
        },
        {
          prompt: `En un juego de puntería, cada ficha azul vale 100 puntos, cada ficha roja vale 10 puntos y cada ficha verde vale 1 punto. Si ${name} obtuvo ${monedas100} azules, ${monedas10} rojas y ${sueltos} verdes, ¿cuál fue su puntaje total?`,
          ans: monedas100 * 100 + monedas10 * 10 + sueltos,
          exp: `${monedas100 * 100} + ${monedas10 * 10} + ${sueltos} = ${monedas100 * 100 + monedas10 * 10 + sueltos} puntos.`
        },
        {
          prompt: `El curso imprimió ${cajas100 * 100 + bolsas10 * 10 + sueltos} entradas para la peña folclórica y las guardó en talonarios de 100 entradas cada uno. ¿Cuántos talonarios completos de 100 lograron llenar?`,
          ans: cajas100,
          exp: `La cifra de las centenas indica ${cajas100} talonarios completos de 100.`
        }
      ];
      const chosen = stories[v % stories.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 7. Cálculo Mental y Estrategias (strictly grade-scoped; NO multiplication in 1°–3° Básico addition/subtraction)
  calculo_mental_estrategias: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);
    const titleLower = oa.title.toLowerCase();
    const name = randChoice(CHILEAN_NAMES);

    // Special branch: Propiedades del 0 y del 1
    if (titleLower.includes('propiedad del cero') || titleLower.includes('propiedades del 0 y del 1')) {
      const isMultDiv = grade !== '1_basico' && grade !== '2_basico' && titleLower.includes('multiplicación');
      if (isMultDiv) {
        const n = randInt(3, 85);
        if (level === 'facil') {
          const arch = v % 4;
          if (arch === 0) {
            return {
              id: qId,
              prompt: `Aplica la propiedad absorbente del 0:`,
              context: `${n} × 0 = ?`,
              visualType: 'none',
              questionType: 'numeric',
              correctAnswer: '0',
              explanation: `Todo número multiplicado por 0 es igual a 0.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 1: Propiedad del 0'
            };
          } else if (arch === 1) {
            return {
              id: qId,
              prompt: `Aplica la propiedad del elemento neutro (1):`,
              context: `${n} × 1 = ?`,
              visualType: 'none',
              questionType: 'numeric',
              correctAnswer: n.toString(),
              explanation: `Todo número multiplicado por 1 mantiene su valor: ${n}.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 1: Propiedad del 1'
            };
          } else if (arch === 2) {
            return {
              id: qId,
              prompt: `Calcula mentalmente multiplicando por 0 a la izquierda:`,
              context: `0 × ${n} = ?`,
              visualType: 'none',
              questionType: 'numeric',
              correctAnswer: '0',
              explanation: `0 veces ${n} es siempre 0.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 1: Propiedad del 0'
            };
          } else {
            return {
              id: qId,
              prompt: `Calcula aplicando la propiedad del 1:`,
              context: `1 × ${n} = ?`,
              visualType: 'none',
              questionType: 'numeric',
              correctAnswer: n.toString(),
              explanation: `1 × ${n} = ${n}.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 1: Propiedad del 1'
            };
          }
        } else if (level === 'medio') {
          const arch = v % 3;
          if (arch === 0) {
            return {
              id: qId,
              prompt: `Calcula aplicando la propiedad del 1 en la división:`,
              context: `${n} ÷ 1 = ?`,
              visualType: 'none',
              questionType: 'numeric',
              correctAnswer: n.toString(),
              explanation: `Todo número dividido por 1 es igual al mismo número: ${n}.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 2: Aplicación Intermedia'
            };
          } else if (arch === 1) {
            return {
              id: qId,
              prompt: `¿Qué número falta en la igualdad: ${n} × [ ? ] = 0?`,
              context: `${n} × [ ? ] = 0`,
              visualType: 'none',
              questionType: 'numeric',
              correctAnswer: '0',
              explanation: `Solo al multiplicar por 0 el producto da 0.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 2: Incógnita del 0'
            };
          } else {
            return {
              id: qId,
              prompt: `¿Qué factor completa correctamente la igualdad: ${n} × [ ? ] = ${n}?`,
              context: `${n} × [ ? ] = ${n}`,
              visualType: 'none',
              questionType: 'numeric',
              correctAnswer: '1',
              explanation: `El elemento neutro de la multiplicación es 1.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 2: Incógnita del 1'
            };
          }
        } else {
          const cajas = randInt(4, 12);
          const stories = [
            {
              prompt: `${name} tiene ${cajas} cajas vacías, cada una con 0 lápices en su interior. ¿Cuántos lápices tiene en total?`,
              ans: 0,
              exp: `${cajas} × 0 = 0 lápices.`
            },
            {
              prompt: `${name} compró 1 estuche que trae ${n} lápices de colores. ¿Cuántos lápices compró en total?`,
              ans: n,
              exp: `1 × ${n} = ${n} lápices.`
            },
            {
              prompt: `Hay ${n} chocolates para repartir por igual en 1 sola bandeja grande. ¿Cuántos chocolates quedan en esa bandeja?`,
              ans: n,
              exp: `${n} ÷ 1 = ${n} chocolates.`
            }
          ];
          const chosen = stories[v % stories.length];
          return {
            id: qId,
            prompt: chosen.prompt,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: chosen.ans.toString(),
            explanation: chosen.exp,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 3: Resolución de Problemas'
          };
        }
      } else {
        // 2° Básico OA 08: Propiedad del cero en adición y sustracción
        const n = randInt(5, 85);
        if (level === 'facil') {
          const arch = v % 3;
          return {
            id: qId,
            prompt: arch === 0 ? `Aplica la propiedad del cero sumando:` : arch === 1 ? `Aplica la propiedad del cero restando:` : `Calcula mentalmente:`,
            context: arch === 0 ? `${n} + 0 = ?` : arch === 1 ? `${n} - 0 = ?` : `0 + ${n} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: n.toString(),
            explanation: `Sumar o restar 0 no cambia el número: el resultado es ${n}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación Básica'
          };
        } else if (level === 'medio') {
          const arch = v % 3;
          return {
            id: qId,
            prompt: `¿Qué número falta para que se cumpla la propiedad del cero?`,
            context: arch === 0 ? `${n} + [ ? ] = ${n}` : arch === 1 ? `${n} - [ ? ] = ${n}` : `[ ? ] + 0 = ${n}`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (arch === 2 ? n : 0).toString(),
            explanation: arch === 2 ? `${n} + 0 = ${n}.` : `El único número neutro aditivo es el 0.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación Intermedia'
          };
        } else {
          const stories = [
            {
              prompt: `${name} juntó ${n} fichas en su estuche y no agregó ni perdió ninguna durante el recreo. ¿Con cuántas fichas terminó?`,
              ans: n,
              exp: `${n} + 0 = ${n} fichas.`
            },
            {
              prompt: `En una bandeja había ${n} empanadas y nadie compró ninguna todavía (0 vendidas). ¿Cuántas empanadas quedan?`,
              ans: n,
              exp: `${n} - 0 = ${n} empanadas.`
            },
            {
              prompt: `${name} anotó ${n} puntos en el primer turno y 0 puntos en el segundo. ¿Cuál es su puntaje total?`,
              ans: n,
              exp: `${n} + 0 = ${n} puntos.`
            }
          ];
          const chosen = stories[v % stories.length];
          return {
            id: qId,
            prompt: chosen.prompt,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: chosen.ans.toString(),
            explanation: chosen.exp,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 3: Resolución de Problemas'
          };
        }
      }
    }

    // 4° Básico OA 02: Cálculo mental para multiplicaciones y divisiones
    if (grade === '4_basico' && (titleLower.includes('multiplicac') || titleLower.includes('division'))) {
      const a = randInt(4, 24);
      if (level === 'facil') {
        const arch = v % 4;
        if (arch === 0) {
          return {
            id: qId,
            prompt: `Aplica cálculo mental doblando: ¿Cuál es el doble de ${a}?`,
            context: `2 × ${a} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (a * 2).toString(),
            explanation: `El doble de ${a} es 2 × ${a} = ${a * 2}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Doblar'
          };
        } else if (arch === 1) {
          const even = a * 2;
          return {
            id: qId,
            prompt: `Calcula mentalmente la MITAD de ${even}:`,
            context: `${even} ÷ 2 = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: a.toString(),
            explanation: `La mitad de ${even} es ${a}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Mitades'
          };
        } else if (arch === 2) {
          const mult10 = randChoice([10, 100]);
          return {
            id: qId,
            prompt: `Aplica la estrategia de multiplicar por ${mult10}:`,
            context: `${a} × ${mult10} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (a * mult10).toString(),
            explanation: `Al multiplicar por ${mult10} agregamos ${mult10 === 10 ? 'un cero' : 'dos ceros'}: ${a * mult10}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Potencias de 10'
          };
        } else {
          const base = randInt(2, 9);
          const d = base * 10;
          const m = randInt(2, 6);
          return {
            id: qId,
            prompt: `Calcula mentalmente multiplicando por una decena exacta:`,
            context: `${d} × ${m} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (d * m).toString(),
            explanation: `${base} × ${m} = ${base * m}, más un cero = ${d * m}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Cálculo Mental'
          };
        }
      } else if (level === 'medio') {
        const arch = v % 3;
        if (arch === 0) {
          const b = randChoice([4, 8]);
          const c = randInt(3, 12);
          return {
            id: qId,
            prompt: `Calcula mentalmente doblando sucesivamente (${b} × ${c}):`,
            context: `${b} × ${c} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (b * c).toString(),
            explanation: `${b} × ${c} = ${b * c}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Doblar y Doblar'
          };
        } else if (arch === 1) {
          const even = randInt(4, 18) * 2;
          const prod = even * 5;
          return {
            id: qId,
            prompt: `Aplica la estrategia de doblar y dividir por 2 (mitad × 10) para resolver:`,
            context: `${even} × 5 = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: prod.toString(),
            explanation: `La mitad de ${even} es ${even / 2}, y ${even / 2} × 10 = ${prod}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Doblar y Dividir'
          };
        } else {
          const q = randInt(4, 14);
          const total = q * 4;
          return {
            id: qId,
            prompt: `Calcula mentalmente sacando mitad de la mitad (${total} ÷ 4):`,
            context: `${total} ÷ 4 = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: q.toString(),
            explanation: `Mitad de ${total} = ${total / 2}; mitad de ${total / 2} = ${q}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Mitad de la Mitad'
          };
        }
      } else {
        const perFriend = randInt(6, 15);
        const friends = randChoice([2, 4, 8]);
        const total = perFriend * friends;
        const unit = randChoice([200, 300, 400, 500]);
        const stories = [
          {
            prompt: `${name} repartió ${total} dulces en partes iguales entre ${friends} amigos. ¿Cuántos dulces recibió cada amigo?`,
            ans: perFriend,
            exp: `${total} ÷ ${friends} = ${perFriend} dulces.`
          },
          {
            prompt: `${name} compró ${friends} jugos a ${formatCLP(unit)} cada uno calculando mentalmente. ¿Cuánto pagó en total?`,
            ans: friends * unit,
            exp: `${friends} × ${unit} = ${formatCLP(friends * unit)}.`
          },
          {
            prompt: `En 10 bolsas iguales hay ${a} bolitas en cada bolsa. ¿Cuántas bolitas hay en total?`,
            ans: a * 10,
            exp: `${a} × 10 = ${a * 10} bolitas.`
          }
        ];
        const chosen = stories[v % stories.length];
        return {
          id: qId,
          prompt: chosen.prompt,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: chosen.ans.toString(),
          explanation: chosen.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      }
    }

    // 1°–3° Básico: Cálculo mental de adición y sustracción (SIN signo ×)
    const isGrade1or2Mental20 = grade === '1_basico' || (grade === '2_basico' && titleLower.includes('hasta 20'));
    if (isGrade1or2Mental20) {
      if (level === 'facil') {
        const arch = v % 4;
        if (arch === 0) {
          const a = randInt(1, 10);
          return {
            id: qId,
            prompt: `Calcula mentalmente usando la estrategia de dobles (sumar dos veces el mismo número):`,
            context: `${a} + ${a} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (a + a).toString(),
            explanation: `El doble de ${a} es ${a} + ${a} = ${a + a}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Dobles'
          };
        } else if (arch === 1) {
          const a = randInt(2, 11);
          const b = randInt(1, Math.min(8, 20 - a));
          return {
            id: qId,
            prompt: `Calcula mentalmente la siguiente suma:`,
            context: `${a} + ${b} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (a + b).toString(),
            explanation: `${a} + ${b} = ${a + b}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Adición Mental'
          };
        } else if (arch === 2) {
          const a = randInt(6, 19);
          const b = randInt(2, Math.min(8, a - 1));
          return {
            id: qId,
            prompt: `Calcula mentalmente contando hacia atrás:`,
            context: `${a} - ${b} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (a - b).toString(),
            explanation: `${a} - ${b} = ${a - b}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Sustracción Mental'
          };
        } else {
          const base = randInt(1, 9);
          return {
            id: qId,
            prompt: `Usa la estrategia de "casi dobles" (doble más 1):`,
            context: `${base} + ${base + 1} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (base + base + 1).toString(),
            explanation: `${base} + ${base} = ${base * 2}, más 1 da ${base * 2 + 1}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Casi Dobles'
          };
        }
      } else if (level === 'medio') {
        const arch = v % 3;
        if (arch === 0) {
          const a = randInt(6, 9);
          const b = randInt(11 - a, 20 - a);
          const sum = a + b;
          return {
            id: qId,
            prompt: `Calcula mentalmente completando primero la decena (10):`,
            context: `${a} + ${b} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: sum.toString(),
            explanation: `Para llegar a 10 desde ${a} faltan ${10 - a}. Luego 10 + ${b - (10 - a)} = ${sum}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Completar el 10'
          };
        } else if (arch === 1) {
          const a = randInt(1, 9);
          return {
            id: qId,
            prompt: `¿Cuánto falta a ${a} para completar exactamente 10?`,
            context: `${a} + [ ? ] = 10`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (10 - a).toString(),
            explanation: `${a} + ${10 - a} = 10.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Amigos del 10'
          };
        } else {
          const total = randInt(12, 19);
          const sub = total - 10 + randInt(1, 4);
          return {
            id: qId,
            prompt: `Resta mentalmente pasando por el 10:`,
            context: `${total} - ${sub} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (total - sub).toString(),
            explanation: `${total} - ${total - 10} = 10, y luego restas lo que falta = ${total - sub}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Bajar al 10'
          };
        }
      } else {
        const start = randInt(10, 18);
        const lost = randInt(2, 6);
        const won = randInt(1, Math.min(5, 20 - (start - lost)));
        const finalCount = start - lost + won;
        const stories = [
          {
            prompt: `${name} tenía ${start} fichas en su mesa. Guardó ${lost} en su estuche y luego su compañera le prestó ${won} más. ¿Cuántas fichas tiene ahora sobre la mesa?`,
            ans: finalCount,
            exp: `${start} - ${lost} = ${start - lost}, y luego + ${won} = ${finalCount}.`
          },
          {
            prompt: `En una caja hay ${lost + 5} lápices rojos y ${lost + 5} lápices azules. Usando dobles mentalmente, ¿cuántos lápices hay?`,
            ans: (lost + 5) * 2,
            exp: `${lost + 5} + ${lost + 5} = ${(lost + 5) * 2} lápices.`
          },
          {
            prompt: `${name} quiere juntar 20 láminas y ya tiene ${start - lost}. ¿Cuántas láminas le faltan?`,
            ans: 20 - (start - lost),
            exp: `20 - ${start - lost} = ${20 - (start - lost)} láminas.`
          }
        ];
        const chosen = stories[v % stories.length];
        return {
          id: qId,
          prompt: chosen.prompt,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: chosen.ans.toString(),
          explanation: chosen.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      }
    }

    // 3° Básico+ estrategias de cálculo mental aditivo
    const a = randInt(12, 68);
    if (level === 'facil') {
      const arch = v % 3;
      if (arch === 0) {
        return {
          id: qId,
          prompt: `Calcula mentalmente el doble sumando dos veces el mismo número:`,
          context: `${a} + ${a} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (a * 2).toString(),
          explanation: `El doble de ${a} es ${a} + ${a} = ${a * 2}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Dobles'
        };
      } else if (arch === 1) {
        const d1 = randInt(2, 8) * 10;
        const d2 = randInt(1, 7) * 10;
        return {
          id: qId,
          prompt: `Suma mentalmente decenas exactas:`,
          context: `${d1} + ${d2} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (d1 + d2).toString(),
          explanation: `${d1 / 10} + ${d2 / 10} decenas = ${(d1 + d2) / 10} decenas = ${d1 + d2}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Decenas Exactas'
        };
      } else {
        const base100 = randInt(15, 85);
        return {
          id: qId,
          prompt: `Calcula mentalmente sumando 10 al número ${base100}:`,
          context: `${base100} + 10 = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (base100 + 10).toString(),
          explanation: `Al sumar 10 aumenta en 1 el dígito de las decenas: ${base100 + 10}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Sumar 10'
        };
      }
    } else if (level === 'medio') {
      const arch = v % 3;
      const b = randInt(15, 55);
      if (arch === 0) {
        return {
          id: qId,
          prompt: `Calcula mentalmente descomponiendo en decenas y unidades:`,
          context: `${a} + ${b} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (a + b).toString(),
          explanation: `${a} + ${b} = ${a + b}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Descomposición'
        };
      } else if (arch === 1) {
        return {
          id: qId,
          prompt: `Usa la estrategia "sumar 9 es como sumar 10 y restar 1":`,
          context: `${a} + 9 = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (a + 9).toString(),
          explanation: `${a} + 10 = ${a + 10}, y ${a + 10} - 1 = ${a + 9}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Compensación'
        };
      } else {
        const part = randInt(25, 85);
        return {
          id: qId,
          prompt: `¿Cuánto falta a ${part} para completar exactamente 100?`,
          context: `${part} + [ ? ] = 100`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (100 - part).toString(),
          explanation: `100 - ${part} = ${100 - part}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Completar 100'
        };
      }
    } else {
      const ini = randChoice([40, 50, 60, 80, 100]);
      const rest = randInt(12, 28);
      const gain = randInt(5, 19);
      const stories = [
        {
          prompt: `${name} tenía ${ini} láminas. En el recreo intercambió y entregó ${rest}, pero después consiguió ${gain} nuevas. ¿Cuántas láminas tiene ahora?`,
          ans: ini - rest + gain,
          exp: `${ini} - ${rest} = ${ini - rest}. Luego ${ini - rest} + ${gain} = ${ini - rest + gain}.`
        },
        {
          prompt: `En una caja hay ${a} bolitas verdes y ${a} bolitas rojas. Calcula mentalmente con dobles: ¿cuántas bolitas hay en total?`,
          ans: a * 2,
          exp: `${a} + ${a} = ${a * 2} bolitas.`
        },
        {
          prompt: `Para juntar 100 puntos en un juego, ${name} ya tiene ${rest + gain}. ¿Cuántos puntos le faltan?`,
          ans: 100 - (rest + gain),
          exp: `100 - ${rest + gain} = ${100 - (rest + gain)} puntos.`
        }
      ];
      const chosen = stories[v % stories.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 8. Adición y Sustracción (estrictamente ajustado al ámbito numérico de cada curso)
  adicion_sustraccion: (level, grade, oa, qId, variant) => {
    const scope = getGradeScope(grade);
    const titleLower = oa.title.toLowerCase();

    let a: number;
    let b: number;
    if (grade === '1_basico') {
      a = randInt(2, 13);
      b = randInt(1, Math.min(10, 20 - a));
    } else if (grade === '2_basico') {
      a = randInt(12, 65);
      b = randInt(5, Math.min(35, 100 - a));
    } else {
      a = randInt(25, Math.floor(scope.maxDirect * 0.65));
      b = randInt(15, Math.floor(scope.maxDirect * 0.35));
    }
    const sum = a + b;
    const v = Math.abs(variant);

    // Relación inversa entre adición y sustracción (1° OA 10, 2° OA 10, 3° OA 07)
    if (titleLower.includes('inversa') || titleLower.includes('familia de operaciones')) {
      if (level === 'facil') {
        const arch = v % 3;
        return {
          id: qId,
          prompt: arch === 0
            ? `Si sabes que ${a} + ${b} = ${sum}, ¿cuánto es ${sum} - ${b}?`
            : arch === 1
              ? `Si sabes que ${a} + ${b} = ${sum}, ¿cuánto es ${sum} - ${a}?`
              : `Si sabes que ${sum} - ${b} = ${a}, ¿cuánto es ${a} + ${b}?`,
          context: arch === 0 ? `${sum} - ${b} = ?` : arch === 1 ? `${sum} - ${a} = ?` : `${a} + ${b} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (arch === 0 ? a : arch === 1 ? b : sum).toString(),
          explanation: `Por familia de operaciones de ${a}, ${b} y ${sum}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Relación Inversa'
        };
      } else if (level === 'medio') {
        const arch = v % 3;
        return {
          id: qId,
          prompt: `Completa la familia de operaciones usando la relación inversa:`,
          context: arch === 0
            ? `${sum} - ${a} = ${b}   →   ${b} + [ ? ] = ${sum}`
            : arch === 1
              ? `${a} + ${b} = ${sum}   →   ${sum} - [ ? ] = ${a}`
              : `[ ? ] - ${b} = ${a}   (sabiendo que ${a} + ${b} = ${sum})`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (arch === 0 ? a : arch === 1 ? b : sum).toString(),
          explanation: `Usando la operación inversa entre ${a}, ${b} y ${sum}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Familia de Operaciones'
        };
      } else {
        const name = randChoice(CHILEAN_NAMES);
        const inverseStories = [
          {
            prompt: `${name} tenía ${a} láminas en su álbum y recibió algunas más hasta completar ${sum} en total. ¿Cuántas láminas recibió?`,
            ans: b,
            exp: `Usando la operación inversa: ${sum} - ${a} = ${b} láminas.`
          },
          {
            prompt: `Un libro tiene ${sum} páginas. Si ${name} ya leyó ${a} páginas, ¿cuántas páginas le faltan por leer?`,
            ans: b,
            exp: `Como ${a} + ${b} = ${sum}, le faltan ${sum} - ${a} = ${b} páginas.`
          },
          {
            prompt: `Después de regalar ${b} bolitas, a ${name} le quedaron ${a} bolitas en su bolsa. ¿Cuántas bolitas tenía al principio?`,
            ans: sum,
            exp: `Sumamos las que quedaron con las que regaló: ${a} + ${b} = ${sum} bolitas.`
          },
          {
            prompt: `En una caja había ${sum} lápices. Si después de repartir algunos quedaron ${a}, ¿cuántos lápices se repartieron?`,
            ans: b,
            exp: `Comprobamos por la inversa: ${sum} - ${a} = ${b} lápices.`
          }
        ];
        const chosen = inverseStories[v % inverseStories.length];
        return {
          id: qId,
          prompt: chosen.prompt,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: chosen.ans.toString(),
          explanation: chosen.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      }
    }

    if (level === 'facil') {
      const arch = v % 4;
      if (arch === 0) {
        return {
          id: qId,
          prompt: `Resuelve la siguiente adición:`,
          context: `${a} + ${b} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: sum.toString(),
          explanation: `${a} + ${b} = ${sum}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Adición'
        };
      } else if (arch === 1) {
        return {
          id: qId,
          prompt: `Resuelve la siguiente sustracción:`,
          context: `${sum} - ${b} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: a.toString(),
          explanation: `${sum} - ${b} = ${a}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Sustracción'
        };
      } else if (arch === 2) {
        const p1 = Math.max(1, Math.floor(a / 2));
        const p2 = a - p1;
        return {
          id: qId,
          prompt: `Suma los tres números:`,
          context: `${p1} + ${p2} + ${b} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: sum.toString(),
          explanation: `${p1} + ${p2} = ${a}, y ${a} + ${b} = ${sum}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Tres Sumandos'
        };
      } else {
        const big = Math.max(a, b);
        const small = Math.min(a, b);
        const c = grade === '1_basico' ? randInt(1, Math.min(4, 20 - big)) : randInt(2, 15);
        const total = big - small + c;
        return {
          id: qId,
          prompt: `Calcula paso a paso de izquierda a derecha:`,
          context: `${big} - ${small} + ${c} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: total.toString(),
          explanation: `${big} - ${small} = ${big - small}, y ${big - small} + ${c} = ${total}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Suma y Resta'
        };
      }
    } else if (level === 'medio') {
      const variantType = v % 4;
      if (variantType === 0) {
        return {
          id: qId,
          prompt: `¿Qué número falta en la casilla para que la igualdad sea correcta?`,
          context: `${a} + [ ? ] = ${sum}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: b.toString(),
          explanation: `Para encontrar el número faltante restamos: ${sum} - ${a} = ${b}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (variantType === 1) {
        return {
          id: qId,
          prompt: `¿Qué número falta al inicio para completar la suma?`,
          context: `[ ? ] + ${b} = ${sum}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: a.toString(),
          explanation: `Restamos ${sum} - ${b} = ${a}, porque ${a} + ${b} = ${sum}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (variantType === 2) {
        return {
          id: qId,
          prompt: `¿Qué número falta en la siguiente sustracción?`,
          context: `${sum} - [ ? ] = ${a}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: b.toString(),
          explanation: `${sum} - ${b} = ${a}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        return {
          id: qId,
          prompt: `Calcula el minuendo desconocido de la resta:`,
          context: `[ ? ] - ${b} = ${a}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: sum.toString(),
          explanation: `Sumamos el sustraendo y la diferencia: ${a} + ${b} = ${sum}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Término Desconocido'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      if (grade === '1_basico' || grade === '2_basico') {
        const grade12Stories = [
          {
            prompt: `${name} tenía ${sum} láminas repetidas y le regaló ${b} a su compañero de banco. ¿Cuántas láminas le quedaron?`,
            ans: a,
            exp: `Restamos las láminas regaladas: ${sum} - ${b} = ${a}.`
          },
          {
            prompt: `En un árbol del patio había ${a} pajaritos y llegaron ${b} más a posarse en las ramas. ¿Cuántos pajaritos hay en total?`,
            ans: sum,
            exp: `Sumamos ambas cantidades: ${a} + ${b} = ${sum} pajaritos.`
          },
          {
            prompt: `En la biblioteca de aula hay ${sum} libros de cuentos, pero ${b} fueron prestados hoy. ¿Cuántos libros quedaron en el estante?`,
            ans: a,
            exp: `Calculamos la diferencia: ${sum} - ${b} = ${a} libros.`
          },
          {
            prompt: `${name} recolectó ${a} tapitas azules y ${b} tapitas rojas para la clase de Arte. ¿Cuántas tapitas juntó en total?`,
            ans: sum,
            exp: `Sumamos las tapitas de ambos colores: ${a} + ${b} = ${sum}.`
          },
          {
            prompt: `En un frasco hay ${sum} galletas de avena. Si entre dos hermanos se comen ${b} galletas en la once, ¿cuántas galletas quedan en el frasco?`,
            ans: a,
            exp: `Restamos: ${sum} - ${b} = ${a} galletas.`
          },
          {
            prompt: `En una bandeja hay ${a} manzanas verdes y ${b} manzanas rojas. ¿Cuántas manzanas hay en la bandeja?`,
            ans: sum,
            exp: `Sumamos: ${a} + ${b} = ${sum} manzanas.`
          }
        ];
        const chosen = grade12Stories[v % grade12Stories.length];
        return {
          id: qId,
          prompt: chosen.prompt,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: chosen.ans.toString(),
          explanation: chosen.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      }

      const place = randChoice(CHILEAN_PLACES);
      const pesoTotal = sum * 10;
      const pesoGasto = b * 10;
      const pesoVuelto = a * 10;
      const higherStories = [
        {
          prompt: `${name} fue a ${place} con ${formatCLP(pesoTotal)}. Si gastó ${formatCLP(pesoGasto)} en frutas y útiles, ¿cuánto dinero le quedó de vuelto?`,
          ans: pesoVuelto,
          exp: `${formatCLP(pesoTotal)} - ${formatCLP(pesoGasto)} = ${formatCLP(pesoVuelto)}.`
        },
        {
          prompt: `Un camión que salió del Terminal Asoagro cargó ${a} kg de papas en la mañana y ${b} kg de zanahorias en la tarde. ¿Cuántos kilogramos transporta en total?`,
          ans: sum,
          exp: `${a} kg + ${b} kg = ${sum} kg.`
        },
        {
          prompt: `A la función de teatro escolar asistieron ${sum} personas en total. Si ${b} eran estudiantes, ¿cuántos adultos asistieron?`,
          ans: a,
          exp: `${sum} - ${b} = ${a} adultos.`
        },
        {
          prompt: `${name} ahorró ${formatCLP(pesoVuelto)} en marzo y ${formatCLP(pesoGasto)} en abril para comprar un libro. ¿Cuánto dinero ahorró entre los dos meses?`,
          ans: pesoTotal,
          exp: `${formatCLP(pesoVuelto)} + ${formatCLP(pesoGasto)} = ${formatCLP(pesoTotal)}.`
        },
        {
          prompt: `La meta de lectura anual del curso es leer ${sum} páginas. Si ya han leído ${a} páginas, ¿cuántas páginas les faltan para cumplir la meta?`,
          ans: b,
          exp: `${sum} - ${a} = ${b} páginas restantes.`
        }
      ];
      const chosen = higherStories[v % higherStories.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 9. Multiplicación (respeta dígitos exactos por curso + 4 arquetipos por nivel)
  multiplicacion: (level, grade, oa, qId, variant) => {
    const titleLower = oa.title.toLowerCase();
    const v = Math.abs(variant);

    let a: number;
    let b: number;
    if (grade === '2_basico') {
      a = randChoice([2, 5, 10]);
      b = randInt(2, 10);
    } else if (grade === '3_basico') {
      a = randInt(2, 10);
      b = randInt(2, 10);
    } else if (grade === '4_basico' || titleLower.includes('tres dígitos')) {
      // Estricto 3 dígitos (105..899) por 1 dígito (2..9)
      a = randInt(105, 899);
      b = randInt(2, 9);
    } else if (titleLower.includes('dos dígitos')) {
      // 5° Básico OA 03: dos dígitos por dos dígitos
      a = randInt(12, 85);
      b = randInt(12, 48);
    } else {
      a = randInt(110, 490);
      b = randInt(3, 12);
    }
    const prod = a * b;

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        const swapDisplay = v % 8 >= 4 && grade !== '4_basico';
        const left = swapDisplay ? b : a;
        const right = swapDisplay ? a : b;
        return {
          id: qId,
          prompt: `Resuelve la siguiente multiplicación:`,
          context: `${left} × ${right} = ?`,
          visualType: grade === '3_basico' ? 'grid_multiplication' : 'none',
          visualData: { rows: Math.min(left, 9), cols: Math.min(right, 9) },
          questionType: 'numeric',
          correctAnswer: prod.toString(),
          explanation: `${left} × ${right} = ${prod}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (fType === 1) {
        if (grade === '2_basico' || grade === '3_basico') {
          const veces = Math.min(b, 6);
          const sumaStr = Array(veces).fill(a).join(' + ');
          return {
            id: qId,
            prompt: `¿Qué multiplicación representa exactamente la suma iterada ${sumaStr}?`,
            context: sumaStr,
            visualType: 'none',
            questionType: 'multiple_choice',
            options: uniqueMcOptions(`${veces} × ${a}`, [`${veces + 1} × ${a}`, `${veces} × ${a + 1}`, `${a} + ${veces}`, `${veces - 1} × ${a}`]),
            correctAnswer: `${veces} × ${a}`,
            explanation: `El número ${a} se suma ${veces} veces, lo que corresponde a ${veces} × ${a}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Suma Iterada'
          };
        }
        return {
          id: qId,
          prompt: `Selecciona el resultado correcto al multiplicar ${a} por ${b}:`,
          context: `${a} × ${b}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(
            prod.toString(),
            [(prod + b).toString(), (Math.max(1, prod - a)).toString(), (prod + 10).toString(), (a * (b + 1)).toString()]
          ),
          correctAnswer: prod.toString(),
          explanation: `${a} × ${b} = ${prod}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (fType === 2) {
        const rows = grade === '2_basico' ? a : randInt(2, 8);
        const cols = grade === '2_basico' ? b : randInt(3, 9);
        const gridProd = rows * cols;
        if (grade === '2_basico' || grade === '3_basico') {
          return {
            id: qId,
            prompt: `Observa la matriz de puntos (${rows} filas con ${cols} puntos en cada una). ¿Cuántos puntos hay en total?`,
            visualType: 'grid_multiplication',
            visualData: { rows, cols },
            questionType: 'numeric',
            correctAnswer: gridProd.toString(),
            explanation: `${rows} filas × ${cols} columnas = ${gridProd} puntos.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Representación en Arreglo'
          };
        }
        const mult10 = randChoice([2, 3, 4, 5, 6, 7, 8, 9]) * 10;
        const factor = randInt(3, 9);
        return {
          id: qId,
          prompt: `Calcula mentalmente el producto con múltiplo de 10:`,
          context: `${mult10} × ${factor} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (mult10 * factor).toString(),
          explanation: `Multiplicamos ${mult10 / 10} × ${factor} = ${(mult10 / 10) * factor} y agregamos un cero: ${mult10 * factor}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Cálculo con Decenas'
        };
      } else {
        const vecesTxt = b === 2 ? 'el doble de' : b === 3 ? 'el triple de' : `${b} veces`;
        return {
          id: qId,
          prompt: `¿Cuánto es ${vecesTxt} ${a}?`,
          context: `${b} × ${a} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: prod.toString(),
          explanation: `${b} × ${a} = ${prod}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        return {
          id: qId,
          prompt: `¿Cuál es el factor desconocido que completa la multiplicación?`,
          context: `[ ? ] × ${b} = ${prod}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: a.toString(),
          explanation: `Dividiendo el producto entre el factor conocido: ${prod} ÷ ${b} = ${a}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (mType === 1) {
        return {
          id: qId,
          prompt: `Encuentra el número faltante para que se cumpla la igualdad:`,
          context: `${a} × [ ? ] = ${prod}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: b.toString(),
          explanation: `El factor faltante es ${b}, ya que ${a} × ${b} = ${prod}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (mType === 2) {
        const extra = randInt(12, 95);
        const total = prod + extra;
        return {
          id: qId,
          prompt: `Calcula el producto y luego suma ${extra} unidades:`,
          context: `(${a} × ${b}) + ${extra} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: total.toString(),
          explanation: `Primero ${a} × ${b} = ${prod}. Luego ${prod} + ${extra} = ${total}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const c1 = Math.floor(a / 10) * 10 || a;
        const c2 = a - c1;
        if (c2 > 0 && grade !== '2_basico') {
          return {
            id: qId,
            prompt: `Aplica la propiedad distributiva: (${c1} × ${b}) + (${c2} × ${b}) es equivalente a multiplicar:`,
            visualType: 'none',
            questionType: 'multiple_choice',
            options: uniqueMcOptions(`${a} × ${b}`, [`${a + 10} × ${b}`, `${c1} × ${b + c2}`, `${a} × ${b + 1}`, `${c1 + b} × ${c2}`]),
            correctAnswer: `${a} × ${b}`,
            explanation: `Por propiedad distributiva, (${c1} × ${b}) + (${c2} × ${b}) = (${c1} + ${c2}) × ${b} = ${a} × ${b}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Propiedad Distributiva'
          };
        }
        const less = randInt(3, Math.max(4, Math.min(18, prod - 1)));
        return {
          id: qId,
          prompt: `Calcula el producto de ${a} × ${b} y luego resta ${less}:`,
          context: `(${a} × ${b}) - ${less} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (prod - less).toString(),
          explanation: `${a} × ${b} = ${prod}, menos ${less} es igual a ${prod - less}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const scenarios = [
        {
          prompt: `En una librería escolar, ${name} compró ${b} cuadernos universitarios a ${formatCLP(a)} cada uno. ¿Cuánto dinero pagó en total?`,
          exp: `${b} cuadernos × ${formatCLP(a)} = ${formatCLP(prod)}.`
        },
        {
          prompt: `Un agricultor del Valle de Azapa embaló ${b} cajones con ${a} tomates en cada cajón para llevar al Terminal Asoagro. ¿Cuántos tomates embaló en total?`,
          exp: `${b} cajones × ${a} tomates = ${prod} tomates.`
        },
        {
          prompt: `Durante el entrenamiento de atletismo, ${name} dio ${b} vueltas completas a una pista que mide ${a} metros. ¿Cuántos metros recorrió en total?`,
          exp: `${b} vueltas × ${a} metros = ${prod} metros.`
        },
        {
          prompt: `En la biblioteca de la escuela hay ${b} estantes grandes, y en cada estante se ordenaron ${a} libros. ¿Cuántos libros hay en total en esos estantes?`,
          exp: `${b} estantes × ${a} libros = ${prod} libros.`
        },
        {
          prompt: `Para una jornada escolar se imprimieron ${b} cuadernillos de trabajo, cada uno con ${a} páginas. ¿Cuántas páginas se imprimieron en total?`,
          exp: `${b} cuadernillos × ${a} páginas = ${prod} páginas.`
        },
        {
          prompt: `Un camión repartidor transporta ${b} cajas cerradas de mercadería. Si cada caja contiene exactamente ${a} paquetes de galletas, ¿cuántos paquetes lleva el camión?`,
          exp: `${b} cajas × ${a} paquetes = ${prod} paquetes.`
        },
        {
          prompt: `${name} ahorró exactamente ${formatCLP(a)} cada semana durante ${b} semanas seguidas para comprar una mochila. ¿Cuánto dinero reunió en total?`,
          exp: `${b} semanas × ${formatCLP(a)} = ${formatCLP(prod)}.`
        },
        {
          prompt: `En ${b} sectores de las graderías del Estadio Carlos Dittborn de Arica se instalaron ${a} asientos por sector. ¿Cuántos asientos hay en total?`,
          exp: `${b} sectores × ${a} asientos = ${prod} asientos.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: prod.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 10. División (4 arquetipos por nivel y amplio espacio paramétrico)
  division: (level, grade, oa, qId, variant) => {
    const divisor = grade === '3_basico' ? randInt(2, 9) : randInt(3, 12);
    const cociente = grade === '3_basico' ? randInt(3, 12) : randInt(11, 85);
    const dividendo = divisor * cociente;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        return {
          id: qId,
          prompt: `Calcula el cociente de la siguiente división exacta:`,
          context: `${dividendo} ÷ ${divisor} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: cociente.toString(),
          explanation: `${dividendo} ÷ ${divisor} = ${cociente} porque ${divisor} × ${cociente} = ${dividendo}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (fType === 1) {
        const dPart = randChoice([2, 3, 4, 5]);
        const res = grade === '3_basico' ? randInt(3, 15) : randInt(12, 65);
        const total = dPart * res;
        const word = dPart === 2 ? 'la mitad' : dPart === 3 ? 'la tercera parte' : dPart === 4 ? 'la cuarta parte' : 'la quinta parte';
        return {
          id: qId,
          prompt: `¿Cuánto es ${word} de ${total}?`,
          context: `${total} ÷ ${dPart} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: res.toString(),
          explanation: `${word.charAt(0).toUpperCase() + word.slice(1)} se obtiene dividiendo por ${dPart}: ${total} ÷ ${dPart} = ${res}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Partes Iguales'
        };
      } else if (fType === 2) {
        return {
          id: qId,
          prompt: `Sabiendo que ${divisor} × ${cociente} = ${dividendo}, ¿cuál es el resultado de ${dividendo} ÷ ${divisor}?`,
          context: `${dividendo} ÷ ${divisor}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(
            cociente.toString(),
            [(cociente + 1).toString(), (Math.max(1, cociente - 1)).toString(), divisor.toString(), (cociente + divisor).toString()]
          ),
          correctAnswer: cociente.toString(),
          explanation: `La división es la operación inversa a la multiplicación: ${dividendo} ÷ ${divisor} = ${cociente}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Relación con Multiplicación'
        };
      } else {
        return {
          id: qId,
          prompt: `Si repartes ${dividendo} elementos en ${divisor} grupos exactamente iguales, ¿cuántos quedan en cada grupo?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: cociente.toString(),
          explanation: `${dividendo} ÷ ${divisor} = ${cociente} elementos por grupo.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Reparto Equitativo'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        const resto = randInt(1, divisor - 1);
        const divConResto = dividendo + resto;
        return {
          id: qId,
          prompt: `Al dividir ${divConResto} entre ${divisor}, ¿cuál es el RESTO (sobrante)?`,
          context: `${divConResto} ÷ ${divisor}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: resto.toString(),
          explanation: `${divisor} × ${cociente} = ${dividendo}. Por lo tanto, ${divConResto} - ${dividendo} = ${resto} de resto.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: División con Resto'
        };
      } else if (mType === 1) {
        return {
          id: qId,
          prompt: `Encuentra el divisor que hace verdadera la igualdad:`,
          context: `${dividendo} ÷ [ ? ] = ${cociente}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: divisor.toString(),
          explanation: `${dividendo} ÷ ${divisor} = ${cociente}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Término Faltante'
        };
      } else if (mType === 2) {
        return {
          id: qId,
          prompt: `¿Cuál es el dividendo desconocido en la siguiente división exacta?`,
          context: `[ ? ] ÷ ${divisor} = ${cociente}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: dividendo.toString(),
          explanation: `Multiplicamos divisor por cociente: ${divisor} × ${cociente} = ${dividendo}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Término Faltante'
        };
      } else {
        const resto = randInt(1, divisor - 1);
        const total = dividendo + resto;
        return {
          id: qId,
          prompt: `En una división, el divisor es ${divisor}, el cociente es ${cociente} y el resto es ${resto}. ¿Cuál es el dividendo?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: total.toString(),
          explanation: `Dividendo = (${divisor} × ${cociente}) + ${resto} = ${dividendo} + ${resto} = ${total}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Algoritmo de la División'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const place = randChoice(CHILEAN_PLACES);
      const scenarios = [
        {
          prompt: `El profesor de matemáticas de la escuela debe repartir ${dividendo} guías de ejercicios en partes iguales entre ${divisor} grupos de estudiantes. ¿Cuántas guías recibe cada grupo?`,
          exp: `${dividendo} guías ÷ ${divisor} grupos = ${cociente} guías por grupo.`
        },
        {
          prompt: `${name} quiere guardar ${dividendo} láminas de colección en ${divisor} sobres, poniendo la misma cantidad en cada uno. ¿Cuántas láminas irá en cada sobre?`,
          exp: `${dividendo} ÷ ${divisor} = ${cociente} láminas en cada sobre.`
        },
        {
          prompt: `Una cuerda de ${dividendo} metros de largo se cortó en ${divisor} trozos iguales para una actividad deportiva. ¿Cuánto mide cada trozo en metros?`,
          exp: `${dividendo} m ÷ ${divisor} = ${cociente} metros por trozo.`
        },
        {
          prompt: `Entre ${divisor} amigos pagaron en partes iguales una cuenta en ${place} de ${formatCLP(dividendo * 10)}. ¿Cuánto pagó cada amigo?`,
          ans: cociente * 10,
          exp: `${formatCLP(dividendo * 10)} ÷ ${divisor} = ${formatCLP(cociente * 10)} cada uno.`
        },
        {
          prompt: `En una cosecha de naranjas en Azapa se recolectaron ${dividendo} frutas y se empacaron equitativamente en ${divisor} mallas. ¿Cuántas naranjas hay en cada malla?`,
          exp: `${dividendo} ÷ ${divisor} = ${cociente} naranjas por malla.`
        },
        {
          prompt: `Un libro tiene ${dividendo} páginas y ${name} planea leerlo completo en ${divisor} días, avanzando la misma cantidad cada día. ¿Cuántas páginas debe leer diariamente?`,
          exp: `${dividendo} páginas ÷ ${divisor} días = ${cociente} páginas diarias.`
        },
        {
          prompt: `Se envasaron ${dividendo} litros de aceite de oliva de Azapa en bidones de ${divisor} litros cada uno. ¿Cuántos bidones se llenaron exactamente?`,
          exp: `${dividendo} ÷ ${divisor} = ${cociente} bidones.`
        },
        {
          prompt: `En una jornada deportiva participaron ${dividendo} estudiantes organizados en equipos de ${divisor} jugadores. ¿Cuántos equipos completos se formaron?`,
          exp: `${dividendo} ÷ ${divisor} = ${cociente} equipos.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: (chosen.ans ?? cociente).toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 11. Operaciones Combinadas (4 arquetipos por nivel)
  operaciones_combinadas: (level, grade, oa, qId, variant) => {
    const a = randInt(8, 45);
    const b = randInt(2, 9);
    const c = randInt(2, 8);
    const d = randInt(2, 6);
    const mult = b * c;
    const ans = a + mult;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        return {
          id: qId,
          prompt: `Resuelve respetando la prioridad de las operaciones (primero la multiplicación):`,
          context: `${a} + ${b} × ${c} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ans.toString(),
          explanation: `Primero multiplicamos ${b} × ${c} = ${mult}. Luego sumamos ${a} + ${mult} = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Prioridad Adición/Multiplicación'
        };
      } else if (fType === 1) {
        const startVal = mult + randInt(5, 30);
        const subAns = startVal - mult;
        return {
          id: qId,
          prompt: `Resuelve respetando PAPOMUDAS (primero multiplica, luego resta):`,
          context: `${startVal} - ${b} × ${c} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: subAns.toString(),
          explanation: `Primero ${b} × ${c} = ${mult}. Luego ${startVal} - ${mult} = ${subAns}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Prioridad Sustracción/Multiplicación'
        };
      } else if (fType === 2) {
        const prod2 = d * randInt(2, 7);
        const sumProds = mult + prod2;
        const p2f = prod2 / d;
        return {
          id: qId,
          prompt: `Calcula ambas multiplicaciones y luego suma sus resultados:`,
          context: `(${b} × ${c}) + (${d} × ${p2f}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: sumProds.toString(),
          explanation: `${b} × ${c} = ${mult} y ${d} × ${p2f} = ${prod2}. Al sumar: ${mult} + ${prod2} = ${sumProds}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Dos Productos'
        };
      } else {
        const divAns = c + a;
        return {
          id: qId,
          prompt: `Resuelve primero la división y luego suma:`,
          context: `${mult} ÷ ${b} + ${a} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: divAns.toString(),
          explanation: `Primero ${mult} ÷ ${b} = ${c}. Luego ${c} + ${a} = ${divAns}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Prioridad División/Suma'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        const bigA = b + randInt(4, 24);
        const parenthesisAns = (bigA - b) * c;
        return {
          id: qId,
          prompt: `Resuelve la operación combinada con paréntesis:`,
          context: `(${bigA} - ${b}) × ${c} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: parenthesisAns.toString(),
          explanation: `Primero el paréntesis (${bigA} - ${b} = ${bigA - b}). Luego multiplicamos: ${bigA - b} × ${c} = ${parenthesisAns}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Paréntesis y Producto'
        };
      } else if (mType === 1) {
        const coc = randInt(4, 15);
        const total = b * coc;
        const subtract = randInt(1, coc - 1);
        return {
          id: qId,
          prompt: `Resuelve respetando la prioridad entre división y sustracción:`,
          context: `${total} ÷ ${b} - ${subtract} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (coc - subtract).toString(),
          explanation: `Primero ${total} ÷ ${b} = ${coc}. Luego ${coc} - ${subtract} = ${coc - subtract}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: División y Resta'
        };
      } else if (mType === 2) {
        const q = randInt(4, 14);
        const total = b * q;
        const p1 = randInt(5, total - 5);
        const p2 = total - p1;
        return {
          id: qId,
          prompt: `Resuelve primero la suma dentro del paréntesis y luego divide:`,
          context: `(${p1} + ${p2}) ÷ ${b} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: q.toString(),
          explanation: `${p1} + ${p2} = ${total}. Luego ${total} ÷ ${b} = ${q}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Paréntesis y División'
        };
      } else {
        const bigC = d + randInt(2, 7);
        const res = a + b * (bigC - d);
        return {
          id: qId,
          prompt: `Aplica PAPOMUDAS paso a paso (paréntesis, multiplicación y finalmente adición):`,
          context: `${a} + ${b} × (${bigC} - ${d}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: res.toString(),
          explanation: `Paréntesis: ${bigC} - ${d} = ${bigC - d}. Producto: ${b} × ${bigC - d} = ${b * (bigC - d)}. Suma: ${a} + ${b * (bigC - d)} = ${res}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: PAPOMUDAS Completo'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const scenarios = [
        () => {
          const pLapiz = randChoice([250, 300, 350, 400]);
          const cantLapices = randInt(3, 7);
          const pCuaderno = randChoice([1200, 1500, 1800, 2100]);
          const total = pCuaderno + pLapiz * cantLapices;
          return {
            prompt: `En la librería, ${name} compró 1 cuaderno a ${formatCLP(pCuaderno)} y ${cantLapices} lápices a ${formatCLP(pLapiz)} cada uno. ¿Cuánto pagó en total?`,
            context: `${pCuaderno} + (${cantLapices} × ${pLapiz}) = ?`,
            ans: total,
            exp: `${cantLapices} × ${pLapiz} = ${cantLapices * pLapiz}. Sumado al cuaderno: ${formatCLP(total)}.`
          };
        },
        () => {
          const cajas = randInt(3, 7);
          const porCaja = randInt(8, 16);
          const regalados = randInt(4, 12);
          const quedan = cajas * porCaja - regalados;
          return {
            prompt: `${name} tenía ${cajas} cajas con ${porCaja} plumones cada una y entregó ${regalados} plumones al taller de arte. ¿Cuántos plumones le quedaron?`,
            context: `(${cajas} × ${porCaja}) - ${regalados} = ?`,
            ans: quedan,
            exp: `${cajas} × ${porCaja} = ${cajas * porCaja} plumones. Menos ${regalados} = ${quedan} plumones.`
          };
        },
        () => {
          const billete = randChoice([5000, 10000, 20000]);
          const cant = randInt(2, 5);
          const precio = randChoice([650, 800, 950, 1100]);
          const vuelto = billete - cant * precio;
          return {
            prompt: `En el quiosco escolar, ${name} compró ${cant} jugos naturales a ${formatCLP(precio)} cada uno y pagó con un billete de ${formatCLP(billete)}. ¿Cuánto vuelto recibió?`,
            context: `${billete} - (${cant} × ${precio}) = ?`,
            ans: vuelto,
            exp: `Gasto: ${cant} × ${precio} = ${formatCLP(cant * precio)}. Vuelto: ${formatCLP(billete)} - ${formatCLP(cant * precio)} = ${formatCLP(vuelto)}.`
          };
        },
        () => {
          const buses = randInt(2, 5);
          const ninosPorBus = randInt(18, 28);
          const adultos = randInt(4, 10);
          const totalPersonas = buses * ninosPorBus + adultos;
          return {
            prompt: `A un paseo al Morro de Arica fueron ${buses} buses con ${ninosPorBus} estudiantes cada uno, más ${adultos} profesores acompañantes. ¿Cuántas personas viajaron en total?`,
            context: `(${buses} × ${ninosPorBus}) + ${adultos} = ?`,
            ans: totalPersonas,
            exp: `Estudiantes: ${buses} × ${ninosPorBus} = ${buses * ninosPorBus}. Total con profesores: ${totalPersonas} personas.`
          };
        },
        () => {
          const aTotal = randInt(32, 80);
          const bExtra = randInt(8, 20);
          const grupos = randChoice([3, 4, 5]);
          const exactSum = Math.floor((aTotal + bExtra) / grupos) * grupos;
          const adjExtra = exactSum - aTotal;
          const porGrupo = exactSum / grupos;
          return {
            prompt: `Se juntaron ${aTotal} libros de una campaña y ${adjExtra} libros donados por apoderados. Si el total se reparte en partes iguales entre ${grupos} cursos, ¿cuántos libros recibe cada curso?`,
            context: `(${aTotal} + ${adjExtra}) ÷ ${grupos} = ?`,
            ans: porGrupo,
            exp: `Total de libros: ${aTotal} + ${adjExtra} = ${exactSum}. Al dividir en ${grupos} cursos: ${porGrupo} libros por curso.`
          };
        },
        () => {
          const pA = randChoice([450, 600, 750]);
          const cA = randInt(2, 4);
          const pB = randChoice([300, 500, 800]);
          const cB = randInt(2, 5);
          return {
            prompt: `${name} compró en la feria ${cA} kg de naranjas a ${formatCLP(pA)} el kilo y ${cB} kg de manzanas a ${formatCLP(pB)} el kilo. ¿Cuánto gastó en total?`,
            context: `(${cA} × ${pA}) + (${cB} × ${pB}) = ?`,
            ans: cA * pA + cB * pB,
            exp: `Naranjas: ${formatCLP(cA * pA)}. Manzanas: ${formatCLP(cB * pB)}. Total: ${formatCLP(cA * pA + cB * pB)}.`
          };
        }
      ];
      const chosen = scenarios[v % scenarios.length]();
      return {
        id: qId,
        prompt: chosen.prompt,
        context: chosen.context,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 12. Factores, Múltiplos y Primos
  factores_multiplos_primos: (level, grade, oa, qId, variant) => {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30, 32, 33, 34, 35, 36, 39, 40, 42, 44, 45, 46, 48, 49];
    const v = Math.abs(variant);
    const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        const isP = v % 8 < 4;
        const chosen = isP ? randChoice(primes) : randChoice(composites);
        return {
          id: qId,
          prompt: `¿El número ${chosen} es un número PRIMO o COMPUESTO?`,
          context: `${chosen}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: ['Primo', 'Compuesto'],
          correctAnswer: isP ? 'Primo' : 'Compuesto',
          explanation: isP ? `${chosen} solo es divisible por 1 y por sí mismo (es primo).` : `${chosen} tiene más de dos divisores (es compuesto).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Números Primos y Compuestos'
        };
      } else if (fType === 1) {
        const p = randChoice(primes.slice(1));
        const compShuffled = shuffle(composites).slice(0, 3);
        return {
          id: qId,
          prompt: `¿Cuál de los siguientes números es un número PRIMO?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(p.toString(), compShuffled.map(String)),
          correctAnswer: p.toString(),
          explanation: `${p} solo tiene dos divisores positivos: 1 y ${p}. Los demás son números compuestos.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Identificación de Primos'
        };
      } else if (fType === 2) {
        const baseK = randInt(4, 12);
        const multAns = baseK * randInt(3, 9);
        const nonMults = [multAns + 1, multAns + 2, multAns - 1, multAns + 3].filter(n => n % baseK !== 0);
        return {
          id: qId,
          prompt: `¿Cuál de las siguientes alternativas corresponde a un MÚLTIPLO de ${baseK}?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(multAns.toString(), nonMults.map(String)),
          correctAnswer: multAns.toString(),
          explanation: `${multAns} = ${baseK} × ${multAns / baseK}, por lo que es un múltiplo exacto de ${baseK}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Múltiplos'
        };
      } else {
        const target = randChoice([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48]);
        const divs: number[] = [];
        for (let d = 2; d <= target / 2; d++) {
          if (target % d === 0) divs.push(d);
        }
        const correctDiv = randChoice(divs);
        const nonDivs: number[] = [];
        for (let d = 2; d <= target; d++) {
          if (target % d !== 0) nonDivs.push(d);
        }
        const wrongDivs = shuffle(nonDivs).slice(0, 3);
        return {
          id: qId,
          prompt: `¿Cuál de los siguientes números es un DIVISOR exacto de ${target}?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correctDiv.toString(), wrongDivs.map(String)),
          correctAnswer: correctDiv.toString(),
          explanation: `${target} ÷ ${correctDiv} = ${target / correctDiv} (división exacta sin resto).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Divisores'
        };
      }
    } else if (level === 'medio') {
      let a = randInt(3, 14);
      let b = randInt(3, 15);
      while (b === a) b = randInt(3, 15);
      const lcm = (a * b) / gcd(a, b);
      const mType = v % 4;
      if (mType === 0) {
        return {
          id: qId,
          prompt: `Calcula el Mínimo Común Múltiplo (mcm) entre ${a} y ${b}:`,
          context: `mcm(${a}, ${b}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: lcm.toString(),
          explanation: `El menor múltiplo común positivo entre ${a} y ${b} es ${lcm}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Mínimo Común Múltiplo'
        };
      } else if (mType === 1) {
        const k = randInt(2, 5);
        const x = a * k;
        const y = b * k;
        const gVal = gcd(x, y);
        return {
          id: qId,
          prompt: `Calcula el Máximo Común Divisor (MCD) entre ${x} y ${y}:`,
          context: `MCD(${x}, ${y}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: gVal.toString(),
          explanation: `El mayor divisor común que divide exactamente a ${x} y ${y} es ${gVal}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Máximo Común Divisor'
        };
      } else if (mType === 2) {
        const baseK = randInt(4, 12);
        const limit = randInt(25, 85);
        const nextMult = (Math.floor(limit / baseK) + 1) * baseK;
        return {
          id: qId,
          prompt: `¿Cuál es el PRIMER múltiplo de ${baseK} que es estrictamente mayor que ${limit}?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: nextMult.toString(),
          explanation: `${baseK} × ${nextMult / baseK} = ${nextMult}, siendo el primer múltiplo mayor que ${limit}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Búsqueda de Múltiplos'
        };
      } else {
        const factorOpts = [
          { num: 12, ans: '2 × 2 × 3', wrong: ['2 × 6', '3 × 4', '2 × 3 × 3'] },
          { num: 18, ans: '2 × 3 × 3', wrong: ['2 × 9', '3 × 6', '2 × 2 × 3'] },
          { num: 20, ans: '2 × 2 × 5', wrong: ['4 × 5', '2 × 10', '2 × 5 × 5'] },
          { num: 24, ans: '2 × 2 × 2 × 3', wrong: ['4 × 6', '2 × 3 × 4', '2 × 2 × 6'] },
          { num: 30, ans: '2 × 3 × 5', wrong: ['5 × 6', '3 × 10', '2 × 2 × 5'] },
          { num: 36, ans: '2 × 2 × 3 × 3', wrong: ['4 × 9', '6 × 6', '2 × 3 × 6'] },
          { num: 42, ans: '2 × 3 × 7', wrong: ['6 × 7', '2 × 21', '3 × 14'] },
          { num: 45, ans: '3 × 3 × 5', wrong: ['5 × 9', '3 × 15', '2 × 3 × 5'] },
        ];
        const picked = factorOpts[v % factorOpts.length];
        return {
          id: qId,
          prompt: `¿Cuál es la descomposición en factores PRIMOS del número ${picked.num}?`,
          context: `${picked.num}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(picked.ans, picked.wrong),
          correctAnswer: picked.ans,
          explanation: `Todos los factores en ${picked.ans} son números primos cuyo producto es ${picked.num}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Factorización Prima'
        };
      }
    } else {
      const a = randInt(3, 12);
      let b = randInt(4, 14);
      while (b === a) b = randInt(4, 14);
      const lcm = (a * b) / gcd(a, b);
      const name = randChoice(CHILEAN_NAMES);
      const scenarios = [
        {
          prompt: `Dos buses escolares salen de la escuela. La micro A sale cada ${a} minutos y la micro B cada ${b} minutos. Si salieron juntos a las 08:00, ¿en cuántos minutos volverán a coincidir en la salida?`,
          ans: lcm,
          exp: `El mínimo común múltiplo de ${a} y ${b} es ${lcm} minutos.`
        },
        {
          prompt: `En el patio escolar hay dos luces decorativas que parpadean: la luz verde se enciende cada ${a} segundos y la luz azul cada ${b} segundos. Si coincidieron recién, ¿en cuántos segundos volverán a encenderse al mismo tiempo?`,
          ans: lcm,
          exp: `mcm(${a}, ${b}) = ${lcm} segundos.`
        },
        {
          prompt: `${name} riega las plantas de la huerta cada ${a} días y abona el suelo cada ${b} días. Si hoy hizo ambas tareas, ¿en cuántos días volverán a coincidir?`,
          ans: lcm,
          exp: `mcm(${a}, ${b}) = ${lcm} días.`
        },
        {
          prompt: `En la escuela, el taller de robótica se realiza cada ${a} días y el taller de música cada ${b} días. Si hoy coincidieron ambos talleres, ¿después de cuántos días volverán a coincidir?`,
          ans: lcm,
          exp: `El menor múltiplo común de ${a} y ${b} es ${lcm} días.`
        },
        {
          prompt: `Dos relojes de laboratorio emiten una señal sonora: uno cada ${a} minutos y otro cada ${b} minutos. Si sonaron juntos al mediodía, ¿cuántos minutos pasarán hasta que vuelvan a sonar juntos?`,
          ans: lcm,
          exp: `mcm(${a}, ${b}) = ${lcm} minutos.`
        },
        {
          prompt: `Se quieren cortar dos cintas de ${a * 4} cm y ${b * 4} cm en trozos iguales de la MAYOR longitud posible sin que sobre cinta. ¿Cuántos centímetros debe medir cada trozo?`,
          ans: gcd(a * 4, b * 4),
          exp: `El Máximo Común Divisor entre ${a * 4} y ${b * 4} es ${gcd(a * 4, b * 4)} cm.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 13. Fracciones (4 arquetipos por nivel + opciones siempre únicas)
  fracciones: (level, grade, oa, qId, variant) => {
    const den = randChoice([3, 4, 5, 6, 8, 9, 10, 12]);
    const num1 = randInt(1, den - 2);
    const num2 = randInt(1, den - num1);
    const sumNum = num1 + num2;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        const correct = `${sumNum}/${den}`;
        return {
          id: qId,
          prompt: `Calcula la suma de fracciones con igual denominador:`,
          context: `${num1}/${den} + ${num2}/${den} = ?`,
          visualType: 'fraction_bar',
          visualData: { numerator: sumNum, denominator: den },
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${sumNum}/${den * 2}`, `${num1}/${den}`, `${sumNum + 1}/${den}`, `${Math.max(1, sumNum - 1)}/${den}`]),
          correctAnswer: correct,
          explanation: `Se suman los numeradores (${num1} + ${num2} = ${sumNum}) y se conserva el denominador común (${den}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Adición de Fracciones'
        };
      } else if (fType === 1) {
        const bigN = randInt(2, den);
        const smallN = randInt(1, bigN - 1);
        const diffNum = bigN - smallN;
        const correct = `${diffNum}/${den}`;
        return {
          id: qId,
          prompt: `Calcula la resta de fracciones con igual denominador:`,
          context: `${bigN}/${den} - ${smallN}/${den} = ?`,
          visualType: 'fraction_bar',
          visualData: { numerator: diffNum, denominator: den },
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${diffNum}/${den * 2}`, `${bigN}/${den}`, `${diffNum + 1}/${den}`, `${bigN + smallN}/${den}`]),
          correctAnswer: correct,
          explanation: `Se restan los numeradores (${bigN} - ${smallN} = ${diffNum}) y se mantiene el denominador (${den}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Sustracción de Fracciones'
        };
      } else if (fType === 2) {
        const shaded = randInt(1, den - 1);
        const correct = `${shaded}/${den}`;
        return {
          id: qId,
          prompt: `Observa la barra dividida en ${den} partes iguales. ¿Qué fracción representa la parte sombreada?`,
          visualType: 'fraction_bar',
          visualData: { numerator: shaded, denominator: den },
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${den - shaded}/${den}`, `${shaded}/${den + 1}`, `${den}/${shaded}`, `${Math.max(1, shaded - 1)}/${den}`, `${shaded + 1}/${den}`]),
          correctAnswer: correct,
          explanation: `Hay ${shaded} partes sombreadas de un total de ${den} partes iguales: ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Representación Gráfica'
        };
      } else {
        const part = randInt(1, den - 1);
        const rest = den - part;
        const correct = `${rest}/${den}`;
        return {
          id: qId,
          prompt: `Si ya está sombreado ${part}/${den} de un entero, ¿qué fracción falta para completar el entero (1)?`,
          context: `${part}/${den} + [ ? ] = ${den}/${den}`,
          visualType: 'fraction_bar',
          visualData: { numerator: part, denominator: den },
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${part}/${den}`, `${rest}/${den * 2}`, `${Math.max(1, rest - 1)}/${den}`, `${rest + 1}/${den}`]),
          correctAnswer: correct,
          explanation: `El entero equivale a ${den}/${den}. Restamos: ${den}/${den} - ${part}/${den} = ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Fracción Complementaria'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        const bigN = randInt(3, den);
        const nA = randInt(1, bigN - 2);
        const nB = bigN - nA;
        const correct = `${nB}/${den}`;
        return {
          id: qId,
          prompt: `¿Qué fracción falta para completar la igualdad?`,
          context: `${nA}/${den} + [ ? ] = ${bigN}/${den}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${nB}/${den * 2}`, `${bigN}/${den}`, `${nB + 1}/${den}`, `${Math.max(1, nB - 1)}/${den}`, `${nA}/${den + 1}`]),
          correctAnswer: correct,
          explanation: `${bigN}/${den} - ${nA}/${den} = ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Término Faltante'
        };
      } else if (mType === 1) {
        const dSub = randChoice([3, 4, 5, 6, 8]);
        const nSub = randInt(1, dSub - 1);
        const mult = randInt(3, 12);
        const total = dSub * mult;
        const ans = nSub * mult;
        return {
          id: qId,
          prompt: `Calcula la fracción de una cantidad entera: ¿cuánto es ${nSub}/${dSub} de ${total}?`,
          context: `${nSub}/${dSub} de ${total} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ans.toString(),
          explanation: `Dividimos ${total} entre ${dSub} (= ${mult}) y multiplicamos por ${nSub}: ${mult} × ${nSub} = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Fracción de un Número'
        };
      } else if (mType === 2) {
        const entero = randInt(1, 5);
        const dMix = randChoice([2, 3, 4, 5, 6, 8]);
        const nMix = randInt(1, dMix - 1);
        const impNum = entero * dMix + nMix;
        const correct = `${impNum}/${dMix}`;
        return {
          id: qId,
          prompt: `Convierte el número mixto ${entero} ${nMix}/${dMix} a fracción impropia:`,
          context: `${entero} ${nMix}/${dMix}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${entero + nMix}/${dMix}`, `${impNum + 1}/${dMix}`, `${entero * nMix}/${dMix}`, `${impNum}/${dMix + 1}`]),
          correctAnswer: correct,
          explanation: `(${entero} × ${dMix}) + ${nMix} = ${impNum}, manteniendo el denominador ${dMix}: ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Números Mixtos'
        };
      } else {
        const baseD = randChoice([2, 3, 4, 5, 6]);
        const baseN = randInt(1, baseD - 1);
        const k = randChoice([2, 3, 4, 5]);
        const correct = `${baseN * k}/${baseD * k}`;
        return {
          id: qId,
          prompt: `¿Cuál de las siguientes fracciones es EQUIVALENTE a ${baseN}/${baseD}?`,
          context: `${baseN}/${baseD}`,
          visualType: 'fraction_bar',
          visualData: { numerator: baseN, denominator: baseD },
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [
            `${baseN * k + 1}/${baseD * k}`,
            `${baseN + k}/${baseD + k}`,
            `${baseN * k}/${baseD * (k + 1)}`,
            `${baseD}/${baseN}`
          ]),
          correctAnswer: correct,
          explanation: `Al amplificar ${baseN}/${baseD} por ${k} (numerador y denominador × ${k}) se obtiene ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Fracciones Equivalentes'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const bigS = randInt(3, den);
      const nA = randInt(1, bigS - 2);
      const nB = bigS - nA;
      const sumFrac = `${bigS}/${den}`;
      const diffFrac = `${nB}/${den}`;
      const remainFrac = `${den - bigS}/${den}`;
      const scenarios = [
        {
          prompt: `En el taller de cocina escolar, ${name} usó ${nA}/${den} kg de harina para preparar pan amasado y ${nB}/${den} kg para queques. ¿Qué fracción de kilogramo de harina utilizó en total?`,
          ans: sumFrac,
          opts: [sumFrac, `${bigS}/${den * 2}`, `${nA}/${den}`, `${bigS + 1}/${den}`, `1/${den + 1}`],
          exp: `${nA}/${den} + ${nB}/${den} = ${sumFrac} kg de harina en total.`
        },
        {
          prompt: `Una botella contenía ${sumFrac} litros de jugo natural de maracuyá. Si ${name} bebió ${nA}/${den} litros después de clases, ¿qué fracción de litro quedó en la botella?`,
          ans: diffFrac,
          opts: [diffFrac, sumFrac, `${nB}/${den * 2}`, `${nB + 1}/${den}`, `1/${den + 1}`],
          exp: `Restamos lo que bebió: ${sumFrac} - ${nA}/${den} = ${diffFrac} litros.`
        },
        {
          prompt: `Para pintar un mural en la escuela, ${name} pintó ${nA}/${den} del muro en la mañana y ${nB}/${den} en la tarde. ¿Qué fracción del mural pintó en total?`,
          ans: sumFrac,
          opts: [sumFrac, diffFrac, `${bigS}/${den + 2}`, `${nA}/${den * 2}`, `${bigS - 1}/${den}`],
          exp: `Sumamos ambas partes: ${nA}/${den} + ${nB}/${den} = ${sumFrac} del mural.`
        },
        {
          prompt: `De una pizza dividida en ${den} porciones iguales, ${name} comió ${nA}/${den} y su hermano comió ${nB}/${den}. ¿Qué fracción de la pizza comieron entre los dos?`,
          ans: sumFrac,
          opts: [sumFrac, `${sumFrac === '1/1' ? '2/2' : remainFrac}`, `${bigS}/${den * 2}`, `${bigS + 1}/${den}`, `${nA}/${den}`],
          exp: `${nA}/${den} + ${nB}/${den} = ${sumFrac} de la pizza.`
        },
        {
          prompt: `Un tanque de agua tiene ${bigS}/${den} de su capacidad ocupada. ¿Qué fracción falta llenar para completar el tanque entero (${den}/${den})?`,
          ans: bigS < den ? remainFrac : `0/${den}`,
          opts: [bigS < den ? remainFrac : `0/${den}`, `${bigS}/${den}`, `1/${den + 1}`, `${bigS}/${den * 2}`, `${Math.max(1, den - nA)}/${den}`],
          exp: `${den}/${den} - ${bigS}/${den} = ${bigS < den ? remainFrac : `0/${den}`}.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: uniqueMcOptions(chosen.ans, chosen.opts),
        correctAnswer: chosen.ans,
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 14. Decimales (4 arquetipos por nivel)
  decimales: (level, grade, oa, qId, variant) => {
    const a = randInt(11, 89) / 10;
    let b = randInt(11, 69) / 10;
    if (a === b) b = Math.round((b + 0.3) * 10) / 10;
    const sum = Math.round((a + b) * 10) / 10;
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    const diff = Math.round((big - small) * 10) / 10;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        return {
          id: qId,
          prompt: `Resuelve la suma de números decimales:`,
          context: `${formatDec(a)} + ${formatDec(b)} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: formatDec(sum),
          explanation: `Alineando la coma decimal: ${formatDec(a)} + ${formatDec(b)} = ${formatDec(sum)}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Adición Decimal'
        };
      } else if (fType === 1) {
        return {
          id: qId,
          prompt: `Resuelve la resta de números decimales:`,
          context: `${formatDec(big)} - ${formatDec(small)} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: formatDec(diff),
          explanation: `Alineando la coma decimal: ${formatDec(big)} - ${formatDec(small)} = ${formatDec(diff)}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Sustracción Decimal'
        };
      } else if (fType === 2) {
        const baseInt = randInt(1, 9);
        const cand = [baseInt + 0.09, baseInt + 0.45, baseInt + 0.5, baseInt + 0.12].sort((x, y) => y - x);
        const top = cand[0];
        return {
          id: qId,
          prompt: `¿Cuál de los siguientes números decimales es el MAYOR?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(formatDec(top), cand.slice(1).map(formatDec)),
          correctAnswer: formatDec(top),
          explanation: `Al comparar décimos y centésimos, ${formatDec(top)} tiene el mayor valor.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Orden de Decimales'
        };
      } else {
        const dNum = randInt(1, 9);
        const isCent = v % 8 >= 4;
        const val = isCent ? randInt(11, 95) / 100 : dNum / 10;
        const strFrac = isCent ? `${Math.round(val * 100)}/100` : `${dNum}/10`;
        const ans = formatDec(val);
        return {
          id: qId,
          prompt: `¿Qué número decimal equivale a la fracción ${strFrac}?`,
          context: `${strFrac} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ans,
          explanation: `${strFrac} equivale a ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Fracción a Decimal'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        const mult = randInt(2, 8);
        const prod = Math.round(a * mult * 10) / 10;
        return {
          id: qId,
          prompt: `Calcula la multiplicación de un decimal por un número entero:`,
          context: `${formatDec(a)} × ${mult} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: formatDec(prod),
          explanation: `${formatDec(a)} × ${mult} = ${formatDec(prod)}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Multiplicación Decimal'
        };
      } else if (mType === 1) {
        const dec2 = randInt(12, 98) / 100 + randInt(1, 5);
        const factor = randChoice([10, 100]);
        const prod = Math.round(dec2 * factor * 100) / 100;
        return {
          id: qId,
          prompt: `Multiplica desplazando la coma decimal:`,
          context: `${formatDec(Math.round(dec2 * 100) / 100)} × ${factor} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: formatDec(prod),
          explanation: `Al multiplicar por ${factor}, la coma se corre ${factor === 10 ? '1 lugar' : '2 lugares'} a la derecha: ${formatDec(prod)}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Potencias de 10'
        };
      } else if (mType === 2) {
        return {
          id: qId,
          prompt: `¿Qué número decimal falta para completar la igualdad?`,
          context: `${formatDec(small)} + [ ? ] = ${formatDec(big)}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: formatDec(diff),
          explanation: `Restamos ${formatDec(big)} - ${formatDec(small)} = ${formatDec(diff)}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Término Faltante'
        };
      } else {
        const divK = randChoice([2, 4, 5]);
        const qVal = randInt(12, 45) / 10;
        const dividend = Math.round(qVal * divK * 10) / 10;
        return {
          id: qId,
          prompt: `Calcula la división de un decimal por un entero:`,
          context: `${formatDec(dividend)} ÷ ${divK} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: formatDec(qVal),
          explanation: `${formatDec(dividend)} ÷ ${divK} = ${formatDec(qVal)}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: División Decimal'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const mult = randInt(2, 6);
      const prod = Math.round(a * mult * 10) / 10;
      const scenarios = [
        {
          prompt: `En la feria de Azapa, ${name} compró ${formatDec(a)} kg de aceitunas y luego su hermano compró ${formatDec(b)} kg más. ¿Cuántos kilogramos compraron entre los dos?`,
          ans: formatDec(sum),
          exp: `${formatDec(a)} kg + ${formatDec(b)} kg = ${formatDec(sum)} kg en total.`
        },
        {
          prompt: `Una cinta tricolor para las Fiestas Patrias medía ${formatDec(big)} metros. Si se cortaron ${formatDec(small)} metros para decorar la sala, ¿cuántos metros de cinta quedaron?`,
          ans: formatDec(diff),
          exp: `${formatDec(big)} m - ${formatDec(small)} m = ${formatDec(diff)} m.`
        },
        {
          prompt: `${name} trotó ${formatDec(a)} km cada día durante ${mult} días seguidos por el borde costero de Arica. ¿Cuántos kilómetros recorrió en total?`,
          ans: formatDec(prod),
          exp: `${formatDec(a)} km × ${mult} días = ${formatDec(prod)} km.`
        },
        {
          prompt: `Una botella grande tiene ${formatDec(big)} litros de agua y una jarra tiene ${formatDec(small)} litros. ¿Cuál es la diferencia de capacidad en litros entre ambos envases?`,
          ans: formatDec(diff),
          exp: `${formatDec(big)} - ${formatDec(small)} = ${formatDec(diff)} litros.`
        },
        {
          prompt: `En salto largo escolar, ${name} saltó ${formatDec(big)} metros y su mejor amigo saltó ${formatDec(small)} metros. ¿Por cuántos metros ganó ${name}?`,
          ans: formatDec(diff),
          exp: `${formatDec(big)} m - ${formatDec(small)} m = ${formatDec(diff)} m.`
        },
        {
          prompt: `Una tabla de madera de ${formatDec(sum)} metros se divide en 2 partes: una mide ${formatDec(a)} metros. ¿Cuánto mide la otra parte?`,
          ans: formatDec(b),
          exp: `${formatDec(sum)} - ${formatDec(a)} = ${formatDec(b)} metros.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans,
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 15. Razones y Proporciones (garantiza a !== b y 4 arquetipos por nivel)
  razones_proporciones: (level, grade, oa, qId, variant) => {
    const a = randInt(2, 7);
    let b = randInt(2, 9);
    while (b === a) b = randInt(2, 9);
    const factor = randInt(3, 10);
    const aExt = a * factor;
    const bExt = b * factor;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        const correct = `${a}:${b}`;
        return {
          id: qId,
          prompt: `En una sala de clases hay ${a} niños por cada ${b} niñas. ¿Cuál es la razón de niños a niñas?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${b}:${a}`, `${a + b}:${a}`, `${a}:${a + b}`, `${a + 1}:${b}`]),
          correctAnswer: correct,
          explanation: `La razón compara en el orden pedido: ${a} es a ${b} (${correct}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Escritura de Razones'
        };
      } else if (fType === 1) {
        const total = a + b;
        const correct = `${a}:${total}`;
        return {
          id: qId,
          prompt: `En una caja hay ${a} pelotas rojas y ${b} pelotas azules. ¿Cuál es la razón entre las pelotas rojas y el TOTAL de pelotas?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${a}:${b}`, `${b}:${total}`, `${total}:${a}`, `${b}:${a}`]),
          correctAnswer: correct,
          explanation: `El total es ${a} + ${b} = ${total}. Por lo tanto, rojas es al total como ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Razón Parte-Todo'
        };
      } else if (fType === 2) {
        const k = randInt(2, 5);
        const correct = `${a * k}:${b * k}`;
        return {
          id: qId,
          prompt: `¿Cuál de las siguientes razones es EQUIVALENTE a ${a}:${b}?`,
          context: `${a}:${b}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${a * k}:${b}`, `${a + k}:${b + k}`, `${b * k}:${a * k}`, `${a}:${b * k}`]),
          correctAnswer: correct,
          explanation: `Multiplicando ambos términos por ${k}: ${a}×${k} : ${b}×${k} = ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Razones Equivalentes'
        };
      } else {
        const gcd2 = (x: number, y: number): number => (y === 0 ? x : gcd2(y, x % y));
        const g = gcd2(a, b);
        const sa = a / g;
        const sb = b / g;
        const k = randInt(2, 5);
        const bigA = sa * k;
        const bigB = sb * k;
        const correct = `${sa}:${sb}`;
        return {
          id: qId,
          prompt: `Al simplificar al máximo la razón ${bigA}:${bigB}, ¿qué razón resulta?`,
          context: `${bigA}:${bigB}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${sb}:${sa}`, `${sa + 1}:${sb}`, `${sa}:${sb + 1}`, `${bigA}:${sb}`]),
          correctAnswer: correct,
          explanation: `Dividiendo ambos términos por ${k}: ${bigA}÷${k} : ${bigB}÷${k} = ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Simplificación de Razones'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        return {
          id: qId,
          prompt: `Encuentra el valor de x en la siguiente proporción directa:`,
          context: `${a} / ${b} = ${aExt} / x`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: bExt.toString(),
          explanation: `Multiplicando cruzado: x = (${b} × ${aExt}) ÷ ${a} = ${bExt}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Proporción Directa'
        };
      } else if (mType === 1) {
        const unit = randChoice([250, 350, 450, 600, 750, 900]);
        const qty = randInt(3, 8);
        return {
          id: qId,
          prompt: `Si ${qty} cuadernos iguales cuestan en total ${formatCLP(qty * unit)}, ¿cuál es la razón unitaria (precio de 1 cuaderno)?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: unit.toString(),
          explanation: `Dividimos el total por la cantidad: ${formatCLP(qty * unit)} ÷ ${qty} = ${formatCLP(unit)} por unidad.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Valor Unitario'
        };
      } else if (mType === 2) {
        const k1 = 1;
        const k2 = 2;
        const k3 = 3;
        const kTarget = randInt(4, 9);
        return {
          id: qId,
          prompt: `Observa la tabla de proporcionalidad directa. ¿Qué número debe ir en "?"?`,
          visualType: 'table_data',
          visualData: {
            title: 'Tabla Proporcional',
            headers: ['Cantidad', String(a * k1), String(a * k2), String(a * k3), String(a * kTarget)],
            rows: [['Costo ($)', String(b * k1 * 100), String(b * k2 * 100), String(b * k3 * 100), '?']],
          },
          questionType: 'numeric',
          correctAnswer: (b * kTarget * 100).toString(),
          explanation: `Cada ${a} unidades cuestan $${b * 100}. Para ${a * kTarget} unidades (${kTarget} veces), el valor es ${b * 100} × ${kTarget} = $${b * kTarget * 100}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Tablas Proporcionales'
        };
      } else {
        const speed = randInt(4, 9) * 10;
        const hrs = randInt(2, 6);
        return {
          id: qId,
          prompt: `Un bus avanza a una rapidez constante de ${speed} km por cada 1 hora. ¿Cuántos kilómetros recorrerá en ${hrs} horas?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (speed * hrs).toString(),
          explanation: `Proporción directa: ${speed} × ${hrs} = ${speed * hrs} km.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Proporcionalidad Directa'
        };
      }
    } else {
      const scenarios = [
        {
          prompt: `Para preparar jugo en el casino escolar se usan ${a} cucharadas de concentrado por cada ${b} litros de agua. Si se quieren preparar ${bExt} litros de agua, ¿cuántas cucharadas de concentrado se necesitan?`,
          ans: aExt,
          exp: `Como el agua aumentó ×${factor} (${b} × ${factor} = ${bExt}), se necesitan ${a} × ${factor} = ${aExt} cucharadas.`
        },
        {
          prompt: `En la clase de Artes, la mezcla perfecta de pintura lleva ${a} gotas de azul por cada ${b} gotas de amarillo. Si usaron ${aExt} gotas de azul, ¿cuántas gotas de amarillo deben agregar?`,
          ans: bExt,
          exp: `${a} × ${factor} = ${aExt}, por lo tanto de amarillo se usan ${b} × ${factor} = ${bExt} gotas.`
        },
        {
          prompt: `Un ciclista avanza ${a} kilómetros cada ${b} minutos a rapidez constante. Al mantener el mismo ritmo durante ${bExt} minutos, ¿cuántos kilómetros recorrerá?`,
          ans: aExt,
          exp: `En ${bExt} min (${factor} veces el tiempo), recorre ${a} × ${factor} = ${aExt} km.`
        },
        {
          prompt: `En una receta familiar de sopaipillas se ocupan ${a} tazas de zapallo por cada ${b} tazas de harina. Si hay ${bExt} tazas de harina, ¿cuántas tazas de zapallo corresponden?`,
          ans: aExt,
          exp: `La proporción es ${a}:${b}. Multiplicando por ${factor}: ${aExt} tazas de zapallo.`
        },
        {
          prompt: `Un plano a escala indica que ${a} cm en el mapa equivalen a ${b} kilómetros reales. Si dos localidades están separadas por ${aExt} cm en el mapa, ¿a cuántos kilómetros reales están?`,
          ans: bExt,
          exp: `${aExt} es ${factor} veces ${a}. Por lo tanto, ${b} × ${factor} = ${bExt} km.`
        },
        {
          prompt: `Una impresora de la escuela imprime ${a} páginas cada ${b} segundos. ¿Cuántas páginas imprimirá en ${bExt} segundos manteniendo el ritmo?`,
          ans: aExt,
          exp: `En ${bExt} segundos (${factor} veces ${b}), imprime ${a} × ${factor} = ${aExt} páginas.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 16. Porcentajes (amplio espacio paramétrico y 4 arquetipos por nivel)
  porcentajes: (level, grade, oa, qId, variant) => {
    const pct = randChoice([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90]);
    const base = pct % 10 === 0
      ? randInt(2, 60) * 1000
      : randInt(1, 35) * 2000;
    const result = (base * pct) / 100;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        return {
          id: qId,
          prompt: `Calcula el ${pct}% de ${formatCLP(base)}:`,
          context: `${pct}% de ${formatCLP(base)} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: result.toString(),
          explanation: `(${base} × ${pct}) ÷ 100 = ${formatCLP(result)}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Cálculo de Porcentaje'
        };
      } else if (fType === 1) {
        const fracPairs: { p: number; f: string; w: string[] }[] = [
          { p: 50, f: '1/2', w: ['1/4', '1/5', '2/5'] },
          { p: 25, f: '1/4', w: ['1/2', '1/5', '3/4'] },
          { p: 20, f: '1/5', w: ['1/4', '1/10', '2/5'] },
          { p: 10, f: '1/10', w: ['1/5', '1/20', '1/4'] },
          { p: 75, f: '3/4', w: ['2/3', '1/4', '4/5'] },
          { p: 40, f: '2/5', w: ['1/4', '3/5', '2/10'] },
          { p: 60, f: '3/5', w: ['2/3', '3/4', '1/6'] },
          { p: 80, f: '4/5', w: ['3/4', '4/10', '5/6'] }
        ];
        const chosen = fracPairs[v % fracPairs.length];
        return {
          id: qId,
          prompt: `¿Qué fracción irreductible representa exactamente al ${chosen.p}%?`,
          context: `${chosen.p}% = ?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(chosen.f, chosen.w),
          correctAnswer: chosen.f,
          explanation: `${chosen.p}% es ${chosen.p}/100, que simplificado al máximo equivale a ${chosen.f}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Porcentaje y Fracción'
        };
      } else if (fType === 2) {
        const decVal = formatDec(pct / 100);
        return {
          id: qId,
          prompt: `¿Qué número decimal equivale exactamente al ${pct}%?`,
          context: `${pct}%`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(
            decVal,
            [formatDec(pct / 10), formatDec(pct / 1000), formatDec(Math.max(0.05, (pct + 10) / 100)), formatDec(Math.max(0.02, (pct - 5) / 100))]
          ),
          correctAnswer: decVal,
          explanation: `Para expresar ${pct}% como decimal se divide por 100: ${pct} ÷ 100 = ${decVal}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Porcentaje y Decimal'
        };
      } else {
        const total = randChoice([50, 100, 200, 400]);
        const targetPct = randChoice([10, 15, 20, 25, 30, 40, 50, 60, 75, 80]);
        const part = (total * targetPct) / 100;
        return {
          id: qId,
          prompt: `Si ${part} estudiantes de un grupo de ${total} votaron por una propuesta, ¿qué PORCENTAJE (%) representan?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: targetPct.toString(),
          explanation: `(${part} ÷ ${total}) × 100 = ${targetPct}%.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Hallar el Porcentaje'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        const discounted = base - result;
        return {
          id: qId,
          prompt: `Un artículo tiene un precio de ${formatCLP(base)} y un descuento del ${pct}%. ¿Cuál es el precio final a pagar?`,
          context: `${formatCLP(base)} - ${pct}% = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: discounted.toString(),
          explanation: `El descuento es de ${formatCLP(result)}. Precio final: ${base} - ${result} = ${formatCLP(discounted)}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Descuentos'
        };
      } else if (mType === 1) {
        const increased = base + result;
        return {
          id: qId,
          prompt: `Un servicio cuesta ${formatCLP(base)} sin recargo. Si sube un ${pct}%, ¿cuál es su nuevo valor final?`,
          context: `${formatCLP(base)} + ${pct}% = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: increased.toString(),
          explanation: `El recargo es de ${formatCLP(result)}. Total: ${base} + ${result} = ${formatCLP(increased)}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Recargos y Aumentos'
        };
      } else if (mType === 2) {
        const cleanPct = randChoice([10, 20, 25, 50]);
        const cleanBase = randInt(2, 30) * 1000;
        const cleanPart = (cleanBase * cleanPct) / 100;
        return {
          id: qId,
          prompt: `Si el ${cleanPct}% de un precio corresponde a ${formatCLP(cleanPart)}, ¿cuál es el precio total (100%)?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: cleanBase.toString(),
          explanation: `(${cleanPart} × 100) ÷ ${cleanPct} = ${formatCLP(cleanBase)}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Cálculo del 100%'
        };
      } else {
        return {
          id: qId,
          prompt: `Una chaqueta marcada en ${formatCLP(base)} está rebajada en un ${pct}%. ¿Cuánto dinero corresponde al descuento?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: result.toString(),
          explanation: `El ${pct}% de ${formatCLP(base)} es (${base} × ${pct}) ÷ 100 = ${formatCLP(result)}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Cálculo de Rebaja'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const discounted = base - result;
      const increased = base + result;
      const smallTotal = pct % 10 === 0 ? randInt(4, 25) * 20 : randInt(2, 15) * 40;
      const smallPart = Math.round((smallTotal * pct) / 100);
      const scenarios = [
        {
          prompt: `En la librería escolar, ${name} vio una mochila de ${formatCLP(base)} que tenía un cartel de oferta del ${pct}% de descuento. ¿Cuánto dinero se ahorra al comprar la mochila?`,
          ans: result,
          exp: `El ahorro corresponde al descuento: ${pct}% de ${formatCLP(base)} = ${formatCLP(result)}.`
        },
        {
          prompt: `Un par de zapatillas cuesta ${formatCLP(base)} en una tienda de Arica. Si hoy tienen un ${pct}% de descuento por liquidación, ¿cuánto se pagará en caja finalmente?`,
          ans: discounted,
          exp: `Descuento: ${formatCLP(result)}. Precio final: ${formatCLP(base)} - ${formatCLP(result)} = ${formatCLP(discounted)}.`
        },
        {
          prompt: `Un balón deportivo cuesta ${formatCLP(base)} antes de aplicar un recargo del ${pct}%. ¿Cuál será su nuevo precio después del aumento?`,
          ans: increased,
          exp: `Aumento: ${formatCLP(result)}. Nuevo valor: ${formatCLP(base)} + ${formatCLP(result)} = ${formatCLP(increased)}.`
        },
        {
          prompt: `En una encuesta a ${smallTotal} estudiantes de la escuela, el ${pct}% eligió taller de robótica. ¿Cuántos estudiantes eligieron robótica?`,
          ans: smallPart,
          exp: `${pct}% de ${smallTotal} = (${smallTotal} × ${pct}) ÷ 100 = ${smallPart} estudiantes.`
        },
        {
          prompt: `Un curso de ${smallTotal} estudiantes asistió a una jornada deportiva. Si exactamente ${smallPart} estudiantes ganaron medalla, ¿qué porcentaje del curso obtuvo medalla?`,
          ans: pct,
          exp: `(${smallPart} ÷ ${smallTotal}) × 100 = ${pct}%.`
        },
        {
          prompt: `El arriendo mensual de una cancha era ${formatCLP(base)}. Si este año aumentó en un ${pct}%, ¿cuál es el monto de dinero del aumento?`,
          ans: result,
          exp: `${pct}% de ${formatCLP(base)} = ${formatCLP(result)}.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 17. Números Enteros (Z)
  // Respeta estrictamente el OA:
  // - 7° Básico OA 01: Adición y sustracción en Z (SIN multiplicaciones ni divisiones)
  // - 8° Básico OA 01: Multiplicación y división en Z
  enteros: (level, grade, oa, qId, variant) => {
    const negA = randInt(-16, -2);
    const negC = randInt(-14, -2);
    const posB = randInt(3, 19);
    const v = Math.abs(variant);
    const titleLower = oa.title.toLowerCase();
    const isMultDivZ =
      titleLower.includes('multiplicación') ||
      titleLower.includes('división') ||
      (grade === '8_basico' && !titleLower.includes('adición') && !titleLower.includes('sustracción'));

    if (!isMultDivZ) {
      // 7° Básico OA 01: Exclusivamente Adición y Sustracción de Números Enteros
      if (level === 'facil') {
        const mode = v % 4;
        if (mode === 0) {
          const ans = negA + posB;
          return {
            id: qId,
            prompt: `Resuelve la siguiente adición de números enteros:`,
            context: `(${negA}) + ${posB} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: ans.toString(),
            explanation: `Signos distintos se restan sus valores absolutos (${Math.max(Math.abs(negA), posB)} - ${Math.min(Math.abs(negA), posB)}) y se conserva el signo del de mayor valor absoluto: (${negA}) + ${posB} = ${ans}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación Básica'
          };
        } else if (mode === 1) {
          const ans = posB + negA;
          return {
            id: qId,
            prompt: `Resuelve la siguiente adición de números enteros:`,
            context: `${posB} + (${negA}) = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: ans.toString(),
            explanation: `Sumar (${negA}) equivale a restar ${Math.abs(negA)}: ${posB} - ${Math.abs(negA)} = ${ans}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación Básica'
          };
        } else if (mode === 2) {
          const ans = negA + negC;
          return {
            id: qId,
            prompt: `Resuelve la siguiente adición de dos números negativos:`,
            context: `(${negA}) + (${negC}) = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: ans.toString(),
            explanation: `Al sumar dos enteros negativos se suman sus valores absolutos y se conserva el signo negativo: -(${Math.abs(negA)} + ${Math.abs(negC)}) = ${ans}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación Básica'
          };
        } else {
          const small = randInt(2, 10);
          const large = small + randInt(3, 12);
          const ans = small - large;
          return {
            id: qId,
            prompt: `Resuelve la siguiente sustracción de números enteros:`,
            context: `${small} - ${large} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: ans.toString(),
            explanation: `Como el sustraendo (${large}) es mayor que el minuendo (${small}), la diferencia es negativa: ${small} - ${large} = ${ans}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación Básica'
          };
        }
      } else if (level === 'medio') {
        const mode = v % 4;
        if (mode === 0) {
          const ans = posB - negA;
          return {
            id: qId,
            prompt: `Resuelve la siguiente sustracción con un número negativo:`,
            context: `${posB} - (${negA}) = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: ans.toString(),
            explanation: `Restar un número negativo equivale a sumar su inverso aditivo (opuesto): ${posB} + ${Math.abs(negA)} = ${ans}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación Intermedia'
          };
        } else if (mode === 1) {
          const ans = negA - negC;
          return {
            id: qId,
            prompt: `Calcula la sustracción entre números enteros negativos:`,
            context: `(${negA}) - (${negC}) = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: ans.toString(),
            explanation: `Restar (${negC}) equivale a sumar +${Math.abs(negC)}: ${negA} + ${Math.abs(negC)} = ${ans}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación Intermedia'
          };
        } else if (mode === 2) {
          const target = randInt(-6, 8);
          const missing = target - negA;
          return {
            id: qId,
            prompt: `¿Qué número entero falta en la casilla para que se cumpla la igualdad?`,
            context: `(${negA}) + [ ? ] = ${target}`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: missing.toString(),
            explanation: `Para llegar desde ${negA} hasta ${target}, calculamos ${target} - (${negA}) = ${missing}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación Intermedia'
          };
        } else {
          const c = randInt(2, 9);
          const ans = negA + posB - c;
          return {
            id: qId,
            prompt: `Resuelve de izquierda a derecha esta operación de adición y sustracción en Z:`,
            context: `(${negA}) + ${posB} - ${c} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: ans.toString(),
            explanation: `Primero (${negA}) + ${posB} = ${negA + posB}. Luego ${negA + posB} - ${c} = ${ans}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación Intermedia'
          };
        }
      } else {
        const tInicial = randInt(-9, -1);
        const subida = randInt(5, 16);
        const tFinal = tInicial + subida;
        const tMax = randInt(7, 16);
        const tMin = randInt(-7, -1);
        const pisoSub = randInt(-4, -1);
        const pisosSube = randInt(5, 9);
        const buzProf = randInt(10, 24);
        const buzSube = randInt(3, 8);
        const scenarios = [
          {
            prompt: `En la madrugada, la temperatura en Putre era de ${tInicial}°C. Al mediodía, la temperatura subió ${subida}°C. ¿Qué temperatura marcó el termómetro al mediodía?`,
            ans: tFinal,
            exp: `${tInicial}°C + ${subida}°C = ${tFinal}°C.`
          },
          {
            prompt: `En la cordillera se registró una temperatura máxima de ${tMax}°C y una mínima de ${tMin}°C. ¿Cuál fue la variación (diferencia) de temperatura en grados entre ambos registros?`,
            ans: tMax - tMin,
            exp: `La diferencia es ${tMax} - (${tMin}) = ${tMax} + ${Math.abs(tMin)} = ${tMax - tMin}°C.`
          },
          {
            prompt: `Un ascensor está en el estacionamiento subterráneo piso ${pisoSub}. Si sube ${pisosSube} pisos, ¿a qué piso llega?`,
            ans: pisoSub + pisosSube,
            exp: `${pisoSub} + ${pisosSube} = piso ${pisoSub + pisosSube}.`
          },
          {
            prompt: `Un buzo en las costas de Arica se encuentra a ${buzProf} metros bajo el nivel del mar (-${buzProf} m) y asciende ${buzSube} metros. ¿A qué profundidad (número entero negativo) queda?`,
            ans: -buzProf + buzSube,
            exp: `(-${buzProf}) + ${buzSube} = ${-buzProf + buzSube} m.`
          },
          {
            prompt: `En la cuenta del centro de alumnos había ${formatCLP(posB * 1000)} y se realizó un gasto de ${formatCLP((Math.abs(negA) + posB) * 1000)}. ¿Cuál es el saldo resultante en miles de pesos?`,
            ans: negA,
            exp: `${posB} - ${Math.abs(negA) + posB} = ${negA}.`
          }
        ];
        const chosen = scenarios[v % scenarios.length];
        return {
          id: qId,
          prompt: chosen.prompt,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: chosen.ans.toString(),
          explanation: chosen.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      }
    }

    // 8° Básico OA 01: Multiplicación y División de Números Enteros en Z
    const f1 = randInt(2, 9);
    const f2 = randInt(2, 9);
    if (level === 'facil') {
      const mode = v % 3;
      if (mode === 0) {
        const prod = -f1 * f2;
        return {
          id: qId,
          prompt: `Calcula la multiplicación de números enteros aplicando la regla de los signos:`,
          context: `(-${f1}) × ${f2} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: prod.toString(),
          explanation: `Negativo por positivo da negativo: (-${f1}) × ${f2} = ${prod}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (mode === 1) {
        const prod = f1 * f2;
        return {
          id: qId,
          prompt: `Calcula la multiplicación de dos enteros negativos:`,
          context: `(-${f1}) × (-${f2}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: prod.toString(),
          explanation: `Por regla de los signos, negativo por negativo da positivo: (-${f1}) × (-${f2}) = ${prod}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else {
        const prod = -f1 * f2;
        return {
          id: qId,
          prompt: `Calcula el producto de números enteros:`,
          context: `${f1} × (-${f2}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: prod.toString(),
          explanation: `Positivo por negativo da negativo: ${f1} × (-${f2}) = ${prod}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      }
    } else if (level === 'medio') {
      const mode = v % 3;
      const prod = f1 * f2;
      if (mode === 0) {
        return {
          id: qId,
          prompt: `Calcula la división exacta de números enteros:`,
          context: `(-${prod}) ÷ ${f1} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (-f2).toString(),
          explanation: `Negativo dividido por positivo da negativo: (-${prod}) ÷ ${f1} = -${f2}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (mode === 1) {
        return {
          id: qId,
          prompt: `Calcula la división exacta de dos números negativos:`,
          context: `(-${prod}) ÷ (-${f1}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: f2.toString(),
          explanation: `Negativo dividido por negativo da positivo: (-${prod}) ÷ (-${f1}) = ${f2}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        return {
          id: qId,
          prompt: `¿Qué factor entero falta para que se cumpla la multiplicación?`,
          context: `(-${f1}) × [ ? ] = ${prod}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (-f2).toString(),
          explanation: `Como el producto es positivo (${prod}) y un factor es negativo (-${f1}), el otro factor debe ser negativo: -${f2}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const bajaHora = randInt(2, 5);
      const horas = randInt(3, 6);
      const descMin = randInt(4, 9);
      const mins = randInt(3, 7);
      const cuotas = randInt(4, 6);
      const montoCuota = randInt(3, 9);
      const scenarios = [
        {
          prompt: `Una cámara frigorífica en Arica disminuye su temperatura ${bajaHora}°C cada hora (-${bajaHora}°C/h). ¿Cuál es la variación total de temperatura luego de ${horas} horas?`,
          ans: -bajaHora * horas,
          exp: `(-${bajaHora}) × ${horas} = ${-bajaHora * horas}°C.`
        },
        {
          prompt: `Un robot submarino desciende ${descMin} metros por minuto (-${descMin} m/min) desde la superficie. ¿A qué profundidad (número negativo) estará después de ${mins} minutos?`,
          ans: -descMin * mins,
          exp: `(-${descMin}) × ${mins} = ${-descMin * mins} metros.`
        },
        {
          prompt: `Una deuda de -${cuotas * montoCuota} puntos en un juego se reparte en partes iguales entre ${cuotas} participantes. ¿Cuántos puntos negativos corresponde a cada participante?`,
          ans: -montoCuota,
          exp: `(-${cuotas * montoCuota}) ÷ ${cuotas} = -${montoCuota} puntos.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 18. Potencias y Raíces (ampliado a bases 2..15 y 4 arquetipos por nivel)
  potencias_raices: (level, grade, oa, qId, variant) => {
    const base = randChoice([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const exp = base === 10 ? randInt(2, 6) : base <= 3 ? randInt(2, 5) : base <= 5 ? randInt(2, 3) : 2;
    const potVal = Math.pow(base, exp);
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        return {
          id: qId,
          prompt: `Calcula el valor de la siguiente potencia:`,
          context: `${base}^${exp} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: potVal.toString(),
          explanation: `${base}^${exp} significa multiplicar ${base} por sí mismo ${exp} veces: ${potVal}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Cálculo de Potencias'
        };
      } else if (fType === 1) {
        const exp10 = randInt(2, 6);
        return {
          id: qId,
          prompt: `Calcula el valor de esta potencia de base 10:`,
          context: `10^${exp10} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: Math.pow(10, exp10).toString(),
          explanation: `10^${exp10} equivale al número 1 seguido de ${exp10} ceros: ${Math.pow(10, exp10).toLocaleString('es-CL')}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Potencias de 10'
        };
      } else if (fType === 2) {
        const bRep = randInt(2, 9);
        const eRep = randInt(3, 5);
        const prodStr = Array(eRep).fill(bRep).join(' × ');
        const correct = `${bRep}^${eRep}`;
        return {
          id: qId,
          prompt: `¿Qué potencia representa la multiplicación iterada ${prodStr}?`,
          context: prodStr,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${eRep}^${bRep}`, `${bRep}^${eRep + 1}`, `${bRep} × ${eRep}`, `${bRep}^${eRep - 1}`]),
          correctAnswer: correct,
          explanation: `La base es ${bRep} y se multiplica ${eRep} veces, por lo tanto se escribe ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Notación Exponencial'
        };
      } else {
        const sq = randInt(3, 15);
        return {
          id: qId,
          prompt: `¿Cuál es el valor de ${sq} elevado al cuadrado (${sq}²)?`,
          context: `${sq}² = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (sq * sq).toString(),
          explanation: `${sq}² = ${sq} × ${sq} = ${sq * sq}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Cuadrados Perfectos'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        const root = randInt(2, 16);
        const sq = root * root;
        return {
          id: qId,
          prompt: `Calcula la raíz cuadrada exacta:`,
          context: `√${sq} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: root.toString(),
          explanation: `√${sq} = ${root} porque ${root}² = ${root} × ${root} = ${sq}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Raíces Cuadradas'
        };
      } else if (mType === 1) {
        const b1 = randChoice([2, 3, 4, 5]);
        const e1 = randInt(1, 3);
        const e2 = randInt(1, 3);
        const ans = Math.pow(b1, e1 + e2);
        return {
          id: qId,
          prompt: `Aplica la propiedad de multiplicación de potencias de igual base y calcula el resultado:`,
          context: `${b1}^${e1} × ${b1}^${e2} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ans.toString(),
          explanation: `Se conserva la base y se suman los exponentes: ${b1}^(${e1}+${e2}) = ${b1}^${e1 + e2} = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Propiedades de Potencias'
        };
      } else if (mType === 2) {
        const b1 = randChoice([2, 3, 4, 5, 6]);
        const eDiff = randInt(1, 3);
        const e2 = randInt(1, 3);
        const e1 = e2 + eDiff;
        const ans = Math.pow(b1, eDiff);
        return {
          id: qId,
          prompt: `Aplica la propiedad de división de potencias de igual base y calcula el valor:`,
          context: `${b1}^${e1} ÷ ${b1}^${e2} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ans.toString(),
          explanation: `Se conserva la base y se restan exponentes: ${b1}^(${e1}-${e2}) = ${b1}^${eDiff} = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: División de Potencias'
        };
      } else {
        const r1 = randInt(2, 10);
        const r2 = randInt(2, 10);
        return {
          id: qId,
          prompt: `Calcula la suma de estas dos raíces cuadradas exactas:`,
          context: `√${r1 * r1} + √${r2 * r2} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (r1 + r2).toString(),
          explanation: `√${r1 * r1} = ${r1} y √${r2 * r2} = ${r2}. Sumamos: ${r1} + ${r2} = ${r1 + r2}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Operatoria con Raíces'
        };
      }
    } else {
      const lado = randInt(4, 18);
      const area = lado * lado;
      const arista = randInt(2, 7);
      const volCubo = arista * arista * arista;
      const dias = randInt(3, 6);
      const bacterias = Math.pow(2, dias);
      const cajas = randInt(3, 7);
      const name = randChoice(CHILEAN_NAMES);
      const scenarios = [
        {
          prompt: `El patio de juegos de la escuela tiene forma cuadrada y su área total es de ${area} m². ¿Cuánto mide cada uno de sus lados?`,
          ans: lado,
          exp: `Como el área del cuadrado es lado², calculamos la raíz cuadrada: √${area} = ${lado} metros.`
        },
        {
          prompt: `Una célula en laboratorio se duplica cada hora. Si al inicio había 1 célula y transcurren ${dias} horas, ¿cuántas células habrá (2^${dias})?`,
          ans: bacterias,
          exp: `2^${dias} = ${bacterias} células.`
        },
        {
          prompt: `Una caja cúbica para guardar material didáctico tiene una arista de ${arista} dm. ¿Cuál es su volumen total en dm³ (${arista}³)?`,
          ans: volCubo,
          exp: `${arista}³ = ${arista} × ${arista} × ${arista} = ${volCubo} dm³.`
        },
        {
          prompt: `En una bodega escolar hay ${cajas} estantes, cada estante tiene ${cajas} cajas y cada caja guarda ${cajas} plumones. ¿Cuántos plumones hay en total?`,
          ans: Math.pow(cajas, 3),
          exp: `${cajas}³ = ${cajas} × ${cajas} × ${cajas} = ${Math.pow(cajas, 3)} plumones.`
        },
        {
          prompt: `${name} debe cercar un jardín cuadrado cuya superficie es ${area} m². ¿Cuántos metros mide todo su perímetro?`,
          ans: lado * 4,
          exp: `Lado = √${area} = ${lado} m. Perímetro = 4 × ${lado} = ${lado * 4} m.`
        },
        {
          prompt: `En una cadena de mensajes informativos de la escuela, cada persona reenvía la noticia a 3 apoderados por ronda. ¿Cuántas personas la reciben exactamente en la ronda ${dias <= 4 ? dias : 4}?`,
          ans: Math.pow(3, dias <= 4 ? dias : 4),
          exp: `3^${dias <= 4 ? dias : 4} = ${Math.pow(3, dias <= 4 ? dias : 4)} personas.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 19. Patrones y Álgebra (4 arquetipos por nivel)
  patrones_algebra: (level, grade, oa, qId, variant) => {
    const start = randInt(2, 28);
    const step = randInt(3, 14);
    const seq = [start, start + step, start + step * 2, start + step * 3];
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        return {
          id: qId,
          prompt: `Identifica la regla de formación de la secuencia: ${seq.join(', ')}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(`Sumar ${step}`, [`Sumar ${step + 1}`, `Restar ${step}`, `Multiplicar por ${step}`, `Sumar ${Math.max(1, step - 1)}`]),
          correctAnswer: `Sumar ${step}`,
          explanation: `Cada término se obtiene sumando ${step} al anterior (${start} + ${step} = ${start + step}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Reglas Ascendentes'
        };
      } else if (fType === 1) {
        const decStep = randInt(3, 12);
        const topVal = randInt(4, 15) + decStep * 4;
        const seqDesc = [topVal, topVal - decStep, topVal - decStep * 2, topVal - decStep * 3];
        return {
          id: qId,
          prompt: `Identifica la regla de formación de esta secuencia descendente: ${seqDesc.join(', ')}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(`Restar ${decStep}`, [`Sumar ${decStep}`, `Restar ${decStep + 1}`, `Restar ${Math.max(1, decStep - 1)}`, `Dividir por ${decStep}`]),
          correctAnswer: `Restar ${decStep}`,
          explanation: `Cada término disminuye en ${decStep} respecto del anterior (${topVal} - ${decStep} = ${topVal - decStep}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Reglas Descendentes'
        };
      } else if (fType === 2) {
        const multK = randChoice([2, 3, 4]);
        const s0 = randInt(1, 5);
        const seqM = [s0, s0 * multK, s0 * multK * multK, s0 * multK * multK * multK];
        return {
          id: qId,
          prompt: `¿Cuál es el patrón multiplicativo que genera la secuencia ${seqM.join(', ')}?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(`Multiplicar por ${multK}`, [`Sumar ${multK}`, `Multiplicar por ${multK + 1}`, `Sumar ${seqM[1] - seqM[0]}`, `Multiplicar por ${Math.max(2, multK - 1)}`]),
          correctAnswer: `Multiplicar por ${multK}`,
          explanation: `Cada número se multiplica por ${multK} para obtener el siguiente (${s0} × ${multK} = ${s0 * multK}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Patrones Multiplicativos'
        };
      } else {
        const missingVal = start + step * 2;
        return {
          id: qId,
          prompt: `¿Qué número falta en el casillero para completar el patrón?`,
          context: `${seq[0]}, ${seq[1]}, [ ? ], ${seq[3]}, ${start + step * 4}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: missingVal.toString(),
          explanation: `El patrón avanza sumando ${step}. Por lo tanto: ${seq[1]} + ${step} = ${missingVal}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Completar Secuencias'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        const nextVal = start + step * 4;
        return {
          id: qId,
          prompt: `Continúa el patrón numérico y encuentra el siguiente número:`,
          context: `${seq.join(', ')}, [ ? ]`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: nextVal.toString(),
          explanation: `Sumando ${step} al último término (${start + step * 3} + ${step}) da ${nextVal}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Secuencias Ascendentes'
        };
      } else if (mType === 1) {
        const decStep = randInt(4, 15);
        const endVal = randInt(5, 25);
        const seqDesc = [endVal + decStep * 4, endVal + decStep * 3, endVal + decStep * 2, endVal + decStep];
        return {
          id: qId,
          prompt: `Descubre la regla descendente y encuentra el número que sigue:`,
          context: `${seqDesc.join(', ')}, [ ? ]`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: endVal.toString(),
          explanation: `Cada vez se resta ${decStep}: ${seqDesc[3]} - ${decStep} = ${endVal}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Secuencias Descendentes'
        };
      } else if (mType === 2) {
        const mul = randInt(2, 6);
        const add = randInt(1, 9);
        const xTarget = randInt(5, 10);
        const ans = mul * xTarget + add;
        return {
          id: qId,
          prompt: `Observa la tabla de Entrada y Salida. Si la regla continúa igual, ¿qué número corresponde en "?"?`,
          visualType: 'table_data',
          visualData: {
            title: 'Máquina de Patrones',
            headers: ['Entrada', '1', '2', '3', String(xTarget)],
            rows: [['Salida', String(mul * 1 + add), String(mul * 2 + add), String(mul * 3 + add), '?']],
          },
          questionType: 'numeric',
          correctAnswer: ans.toString(),
          explanation: `La regla de la máquina es multiplicar la entrada por ${mul} y sumar ${add}: (${xTarget} × ${mul}) + ${add} = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Tablas Entrada-Salida'
        };
      } else {
        const mul = randInt(2, 5);
        const add = randInt(1, 7);
        const correctRule = `Multiplicar por ${mul} y sumar ${add}`;
        return {
          id: qId,
          prompt: `¿Qué regla transforma cada valor de Entrada (n) en su Salida en la siguiente tabla?`,
          visualType: 'table_data',
          visualData: {
            title: 'Tabla Entrada → Salida',
            headers: ['Entrada (n)', '1', '2', '3', '4'],
            rows: [['Salida', String(mul + add), String(mul * 2 + add), String(mul * 3 + add), String(mul * 4 + add)]],
          },
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correctRule, [
            `Sumar ${mul + add}`,
            `Multiplicar por ${mul + 1} y sumar ${add}`,
            `Multiplicar por ${mul} y restar ${add}`,
            `Multiplicar por ${mul}`
          ]),
          correctAnswer: correctRule,
          explanation: `Al probar n = 1, 2, 3: (${mul} × n) + ${add} produce exactamente los valores de salida.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Regla en Tablas'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const ahorroSemanal = randChoice([300, 400, 500, 750, 1000, 1200]);
      const semanas = randInt(3, 9);
      const total = ahorroSemanal * semanas;
      const pagInicial = randInt(4, 15);
      const pagDia = randInt(3, 8);
      const diaBuscado = randInt(4, 8);
      const paginasDia = pagInicial + (diaBuscado - 1) * pagDia;
      const fig1 = randInt(3, 7);
      const pasoF = randInt(2, 5);
      const posF = randInt(4, 8);
      const fosfTotal = fig1 + (posF - 1) * pasoF;
      const kmDia1 = randInt(2, 6);
      const kmExtra = randInt(1, 4);
      const diaRun = randInt(4, 8);
      const scenarios = [
        {
          prompt: `${name} ahorra en su alcancía escolar siguiendo un patrón constante: cada viernes guarda ${formatCLP(ahorroSemanal)}. Si mantiene este patrón durante ${semanas} semanas seguidas, ¿cuánto dinero habrá reunido?`,
          ans: total,
          exp: `${semanas} semanas × ${formatCLP(ahorroSemanal)} = ${formatCLP(total)}.`
        },
        {
          prompt: `Para el concurso de lectura, ${name} leyó ${pagInicial} páginas el lunes y cada día lee ${pagDia} páginas más que el día anterior (${pagInicial}, ${pagInicial + pagDia}, ${pagInicial + pagDia * 2}...). ¿Cuántas páginas leerá el día ${diaBuscado}?`,
          ans: paginasDia,
          exp: `Día ${diaBuscado}: ${pagInicial} + (${diaBuscado - 1} × ${pagDia}) = ${paginasDia} páginas.`
        },
        {
          prompt: `En una secuencia con palitos de helado, la figura 1 tiene ${fig1} palitos y cada nueva figura agrega ${pasoF} palitos (${fig1}, ${fig1 + pasoF}, ${fig1 + pasoF * 2}...). ¿Cuántos palitos tendrá la figura ${posF}?`,
          ans: fosfTotal,
          exp: `${fig1} + (${posF - 1} × ${pasoF}) = ${fosfTotal} palitos.`
        },
        {
          prompt: `Un atleta escolar entrenó corriendo ${kmDia1} vueltas el primer día y aumentó ${kmExtra} vueltas cada día. ¿Cuántas vueltas corrió el día ${diaRun}?`,
          ans: kmDia1 + (diaRun - 1) * kmExtra,
          exp: `${kmDia1} + (${diaRun - 1} × ${kmExtra}) = ${kmDia1 + (diaRun - 1) * kmExtra} vueltas.`
        },
        {
          prompt: `En un auditorio de Arica, la fila 1 tiene ${fig1 + 5} butacas y cada fila hacia atrás agrega ${pasoF} butacas más. ¿Cuántas butacas hay en la fila ${posF}?`,
          ans: (fig1 + 5) + (posF - 1) * pasoF,
          exp: `${fig1 + 5} + (${posF - 1} × ${pasoF}) = ${(fig1 + 5) + (posF - 1) * pasoF} butacas.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 20. Ecuaciones e Inecuaciones
  ecuaciones_inecuaciones: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);
    const titleDesc = `${oa.title} ${oa.description}`.toLowerCase();
    const mentionsInequality = /inecuaci|desigualdad/.test(titleDesc);
    const mentionsEquation = /(?:^|[^a-záéíóúñ])(?:ecuaci[oó]n(?:es)?|igualdad(?:es)?)/.test(titleDesc);
    const isInequalityOnly = mentionsInequality && !mentionsEquation;
    const supportsInequality = mentionsInequality;

    // For OAs that cover both (e.g. 4° Básico OA 14, 5° OA 15, 7° OA 09, 1°/2° Básico),
    // alternate evenly between equations and inequalities so every evaluation covers both.
    const useInequality = isInequalityOnly || (supportsInequality && v % 2 === 1);
    const subIdx = supportsInequality && !isInequalityOnly ? Math.floor(v / 2) : v;

    const isLowerPrimary = grade === '1_basico' || grade === '2_basico'; // scope 0..20
    const isOneStep100 = grade === '3_basico' || grade === '4_basico' || grade === '5_basico'; // 1-step +, -, 0..100
    const name = randChoice(CHILEAN_NAMES);
    const place = randChoice(CHILEAN_PLACES);

    // ------------------------------------------------------------------
    // A. INECUACIONES (Desigualdades con < y >)
    // ------------------------------------------------------------------
    if (useInequality) {
      if (isLowerPrimary) {
        const isLt = subIdx % 2 === 0;
        const op = isLt ? '<' : '>';
        const otherOp = isLt ? '>' : '<';
        const a = randInt(2, 8);
        const threshold = randInt(5, 11);
        const limit = a + threshold; // <= 19 (scope 0..20)

        if (level === 'facil') {
          const valid = isLt ? threshold - randInt(1, 3) : threshold + randInt(1, 4);
          const d1 = randInt(1, 2);
          const d2 = randInt(1, 2);
          const opts = isLt
            ? [valid, threshold, threshold + d1, threshold + d1 + d2]
            : [valid, threshold, threshold - 1, threshold - 3];
          return {
            id: qId,
            prompt: `Observa la balanza en desequilibrio (x + ${a} ${op} ${limit}). ¿Qué valor puede tener "x" para que se cumpla?`,
            context: `x + ${a} ${op} ${limit}`,
            visualType: 'balance_equation',
            visualData: { left: `x + ${a}`, right: limit.toString(), operator: op },
            questionType: 'multiple_choice',
            options: shuffle(opts.map(String)),
            correctAnswer: valid.toString(),
            explanation: `Si x = ${valid}, entonces ${valid} + ${a} = ${valid + a}, que sí es ${isLt ? 'menor' : 'mayor'} que ${limit}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Inecuaciones en Balanza'
          };
        } else if (level === 'medio') {
          return {
            id: qId,
            prompt: `¿Qué expresión representa los posibles valores de x en la desigualdad x + ${a} ${op} ${limit}?`,
            context: `x + ${a} ${op} ${limit}`,
            visualType: 'none',
            questionType: 'multiple_choice',
            options: shuffle([`x ${op} ${threshold}`, `x ${otherOp} ${threshold}`, `x = ${threshold}`, `x ${op} ${limit + a}`]),
            correctAnswer: `x ${op} ${threshold}`,
            explanation: `Restamos ${a} a ambos lados: x ${op} ${limit} - ${a}, por lo tanto x ${op} ${threshold}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación Intermedia'
          };
        } else {
          const ans = isLt ? threshold - 1 : threshold + 1;
          return {
            id: qId,
            prompt: `${name} tiene ${a} lápices y junta "x" más, reuniendo ${isLt ? 'menos de' : 'más de'} ${limit} lápices (x + ${a} ${op} ${limit}). ¿Cuál es el ${isLt ? 'MAYOR' : 'MENOR'} número natural de lápices que puede representar x?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: ans.toString(),
            explanation: `x + ${a} ${op} ${limit} ➔ x ${op} ${threshold}. El ${isLt ? 'mayor' : 'menor'} número natural posible es ${ans}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 3: Resolución de Problemas'
          };
        }
      }

      // 3° a 5° Básico (especialmente 4° Básico OA 14: inecuaciones de un paso con + y -, ámbito 0 al 100)
      if (isOneStep100) {
        const format = subIdx % 3;
        const isLt = Math.floor(subIdx / 3) % 2 === 0;
        const op = isLt ? '<' : '>';
        const otherOp = isLt ? '>' : '<';

        if (level === 'facil') {
          if (format === 0) {
            // Balanza en desequilibrio pictórica (0..100)
            const a = randInt(8, 35);
            const threshold = randInt(10, 46);
            const limit = a + threshold; // <= 81
            const valid = isLt ? threshold - randInt(2, 6) : threshold + randInt(2, 8);
            const d1 = randInt(1, 3);
            const d2 = randInt(2, 4);
            const opts = isLt
              ? [valid, threshold, threshold + d1, threshold + d1 + d2]
              : [valid, threshold, threshold - d1, threshold - d1 - d2];

            return {
              id: qId,
              prompt: `Observa la balanza en desequilibrio (x + ${a} ${op} ${limit}). ¿Cuál valor de "x" hace verdadera esta inecuación?`,
              context: `x + ${a} ${op} ${limit}`,
              visualType: 'balance_equation',
              visualData: { left: `x + ${a}`, right: limit.toString(), operator: op },
              questionType: 'multiple_choice',
              options: shuffle(opts.map(String)),
              correctAnswer: valid.toString(),
              explanation: `Al probar x = ${valid}, obtenemos ${valid} + ${a} = ${valid + a}, que es ${isLt ? 'menor' : 'mayor'} que ${limit}. Desde ${threshold} hacia ${isLt ? 'arriba' : 'abajo'} la desigualdad no se cumple.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 1: Inecuaciones en Balanza'
            };
          } else if (format === 1) {
            // Comprobación simbólica de inecuación con adición (0..100)
            const a = randInt(11, 40);
            const threshold = randInt(10, 45);
            const limit = a + threshold; // <= 85
            const exprLeft = Math.floor(subIdx / 6) % 2 === 0 ? `x + ${a}` : `${a} + x`;
            const valid = isLt ? threshold - randInt(2, 6) : threshold + randInt(2, 8);
            const d1 = randInt(1, 3);
            const d2 = randInt(2, 5);
            const opts = isLt
              ? [valid, threshold, threshold + d1, threshold + d1 + d2]
              : [valid, threshold, threshold - d1, threshold - d1 - d2];

            return {
              id: qId,
              prompt: `¿Cuál de los siguientes valores de x satisface la inecuación de un paso?`,
              context: `${exprLeft} ${op} ${limit}`,
              visualType: 'none',
              questionType: 'multiple_choice',
              options: shuffle(opts.map(String)),
              correctAnswer: valid.toString(),
              explanation: `Reemplazando x = ${valid}: ${valid + a} ${op} ${limit} es verdadero (la solución general es x ${op} ${threshold}).`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 1: Ejercitación de Inecuaciones'
            };
          } else {
            // Comprobación simbólica de inecuación con sustracción (0..100)
            const a = randInt(5, 24);
            const rhs = randInt(12, 42);
            const threshold = a + rhs; // <= 66
            const valid = isLt ? a + randInt(2, rhs - 2) : threshold + randInt(2, 9);
            const d1 = randInt(1, 3);
            const d2 = randInt(2, 5);
            const opts = isLt
              ? [valid, threshold, threshold + d1, threshold + d1 + d2]
              : [valid, threshold, threshold - d1, threshold - d1 - d2];

            return {
              id: qId,
              prompt: `¿Qué valor de x hace VERDADERA la siguiente inecuación?`,
              context: `x - ${a} ${op} ${rhs}`,
              visualType: 'none',
              questionType: 'multiple_choice',
              options: shuffle(opts.map(String)),
              correctAnswer: valid.toString(),
              explanation: `Al sustituir x = ${valid}: ${valid} - ${a} = ${valid - a}, que es ${isLt ? 'menor' : 'mayor'} que ${rhs} (solución: x ${op} ${threshold}).`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 1: Ejercitación de Inecuaciones'
            };
          }
        } else if (level === 'medio') {
          if (format === 0) {
            // Mayor o menor número natural que satisface la inecuación (0..100)
            const useSub = Math.floor(subIdx / 6) % 2 === 1;
            const ask = isLt ? 'MAYOR' : 'MENOR';
            if (!useSub) {
              const a = randInt(12, 42);
              const threshold = randInt(12, 44);
              const limit = a + threshold; // <= 86
              const ans = isLt ? threshold - 1 : threshold + 1;
              const showBal = Math.floor(subIdx / 3) % 2 === 0;
              return {
                id: qId,
                prompt: `Resuelve la inecuación (x + ${a} ${op} ${limit}). Si "x" es un número natural, ¿cuál es el ${ask} valor que puede tomar x?`,
                context: `x + ${a} ${op} ${limit}`,
                visualType: showBal ? 'balance_equation' : 'none',
                visualData: showBal ? { left: `x + ${a}`, right: limit.toString(), operator: op } : undefined,
                questionType: 'numeric',
                correctAnswer: ans.toString(),
                explanation: `Restamos ${a} a ambos lados: x ${op} ${limit} - ${a}, es decir, x ${op} ${threshold}. El ${ask.toLowerCase()} número natural que cumple esto es ${ans}.`,
                oaCode: oa.code,
                difficulty: level,
                categoryLabel: 'Nivel 2: Aplicación de Inecuaciones'
              };
            } else {
              const a = randInt(7, 26);
              const rhs = randInt(12, 48);
              const threshold = a + rhs; // <= 74
              const ans = isLt ? threshold - 1 : threshold + 1;
              return {
                id: qId,
                prompt: `Resuelve la inecuación (x - ${a} ${op} ${rhs}). Si "x" es un número natural, ¿cuál es el ${ask} valor que puede tomar x?`,
                context: `x - ${a} ${op} ${rhs}`,
                visualType: 'none',
                questionType: 'numeric',
                correctAnswer: ans.toString(),
                explanation: `Sumamos ${a} a ambos lados: x ${op} ${rhs} + ${a}, es decir, x ${op} ${threshold}. El ${ask.toLowerCase()} número natural que cumple esto es ${ans}.`,
                oaCode: oa.code,
                difficulty: level,
                categoryLabel: 'Nivel 2: Aplicación de Inecuaciones'
              };
            }
          } else if (format === 1) {
            // Despeje simbólico de inecuación de un paso (0..100)
            const useSub = Math.floor(subIdx / 6) % 2 === 1;
            if (!useSub) {
              const a = randInt(9, 28);
              const sol = randInt(10, 34);
              const limit = a + sol; // <= 62, limit + a <= 90
              return {
                id: qId,
                prompt: `Al resolver la inecuación de un paso, ¿qué expresión representa su conjunto solución?`,
                context: `x + ${a} ${op} ${limit}`,
                visualType: 'none',
                questionType: 'multiple_choice',
                options: shuffle([`x ${op} ${sol}`, `x ${otherOp} ${sol}`, `x ${op} ${limit + a}`, `x = ${sol}`]),
                correctAnswer: `x ${op} ${sol}`,
                explanation: `Despejamos x restando ${a} en ambos lados: x ${op} ${limit} - ${a} ➔ x ${op} ${sol}.`,
                oaCode: oa.code,
                difficulty: level,
                categoryLabel: 'Nivel 2: Despeje de Inecuaciones'
              };
            } else {
              const a = randInt(6, 20);
              const rhs = randInt(25, 46);
              const sol = rhs + a; // <= 66
              return {
                id: qId,
                prompt: `Al resolver la inecuación de un paso, ¿qué expresión representa su conjunto solución?`,
                context: `x - ${a} ${op} ${rhs}`,
                visualType: 'none',
                questionType: 'multiple_choice',
                options: shuffle([`x ${op} ${sol}`, `x ${otherOp} ${sol}`, `x ${op} ${rhs - a}`, `x = ${sol}`]),
                correctAnswer: `x ${op} ${sol}`,
                explanation: `Despejamos x sumando ${a} en ambos lados: x ${op} ${rhs} + ${a} ➔ x ${op} ${sol}.`,
                oaCode: oa.code,
                difficulty: level,
                categoryLabel: 'Nivel 2: Despeje de Inecuaciones'
              };
            }
          } else {
            // ¿Qué valor NO pertenece al conjunto solución? (0..100)
            const a = randInt(10, 35);
            const threshold = randInt(14, 42);
            const limit = a + threshold; // <= 77
            const wrong = threshold;
            const valids = isLt
              ? [threshold - 2, threshold - 5, threshold - 9]
              : [threshold + 2, threshold + 5, threshold + 9];
            return {
              id: qId,
              prompt: `¿Cuál de los siguientes valores NO pertenece al conjunto solución de la inecuación ${a} + x ${op} ${limit}?`,
              context: `${a} + x ${op} ${limit}`,
              visualType: 'none',
              questionType: 'multiple_choice',
              options: shuffle([wrong, ...valids].map(String)),
              correctAnswer: wrong.toString(),
              explanation: `Al reemplazar x = ${wrong}: ${a} + ${wrong} = ${limit}, y ${limit} no es ${isLt ? 'menor' : 'mayor'} que ${limit}.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 2: Comprobación de Inecuaciones'
            };
          }
        } else {
          // Nivel 3 (dificil): Problemas cotidianos y pictóricos de inecuaciones (0..100)
          const scenarioIdx = subIdx % 4;
          if (scenarioIdx === 0) {
            const balLt = Math.floor(subIdx / 4) % 2 === 0;
            const balOp = balLt ? '<' : '>';
            const a = randInt(14, 38);
            const threshold = randInt(12, 44);
            const limit = a + threshold; // <= 82
            const ans = balLt ? threshold - 1 : threshold + 1;
            const ask = balLt ? 'MAYOR' : 'MENOR';
            return {
              id: qId,
              prompt: `Observa la balanza en desequilibrio. Si "x" es un número natural de kilogramos, ¿cuál es el ${ask} peso entero que puede tener la caja "x"?`,
              visualType: 'balance_equation',
              visualData: { left: `x + ${a}`, right: limit.toString(), operator: balOp },
              questionType: 'numeric',
              correctAnswer: ans.toString(),
              explanation: `La balanza muestra x + ${a} ${balOp} ${limit} ➔ x ${balOp} ${threshold}. El ${ask.toLowerCase()} entero posible es ${ans} kg.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 3: Problemas con Inecuaciones'
            };
          } else if (scenarioIdx === 1) {
            const a = randInt(15, 42);
            const threshold = randInt(12, 40);
            const limit = a + threshold; // <= 82
            const ans = threshold - 1;
            return {
              id: qId,
              prompt: `${name} ya tiene ${a} láminas de un álbum. Si después de comprar "x" láminas nuevas sigue teniendo menos de ${limit} láminas en total (x + ${a} < ${limit}), ¿cuál es el MAYOR número de láminas que pudo comprar?`,
              visualType: 'none',
              questionType: 'numeric',
              correctAnswer: ans.toString(),
              explanation: `Planteamos x + ${a} < ${limit} ➔ x < ${limit} - ${a} ➔ x < ${threshold}. El mayor número natural menor que ${threshold} es ${ans}.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 3: Problemas con Inecuaciones'
            };
          } else if (scenarioIdx === 2) {
            const a = randInt(18, 45);
            const threshold = randInt(10, 38);
            const limit = a + threshold; // <= 83
            const ans = threshold + 1;
            return {
              id: qId,
              prompt: `Para ganar un premio en ${place}, ${name} debe superar los ${limit} puntos. Si ya lleva ${a} puntos y le falta su último turno de "x" puntos (x + ${a} > ${limit}), ¿cuál es el MENOR puntaje natural que necesita en su último turno?`,
              visualType: 'none',
              questionType: 'numeric',
              correctAnswer: ans.toString(),
              explanation: `Planteamos x + ${a} > ${limit} ➔ x > ${limit} - ${a} ➔ x > ${threshold}. El menor número natural mayor que ${threshold} es ${ans}.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 3: Problemas con Inecuaciones'
            };
          } else {
            const useSubStory = Math.floor(subIdx / 4) % 2 === 1;
            const storyLt = Math.floor(subIdx / 8) % 2 === 0;
            const sOp = storyLt ? '<' : '>';
            const sOther = storyLt ? '>' : '<';
            const a = randInt(9, 28);
            const rhs = randInt(18, 55);
            if (useSubStory) {
              const correct = `x - ${a} ${sOp} ${rhs}`;
              return {
                id: qId,
                prompt: `${name} tenía "x" bolitas, regaló ${a} y le quedaron ${storyLt ? 'menos de' : 'más de'} ${rhs} bolitas. ¿Cuál inecuación modela correctamente esta situación?`,
                visualType: 'none',
                questionType: 'multiple_choice',
                options: shuffle([correct, `x + ${a} ${sOp} ${rhs}`, `x - ${a} ${sOther} ${rhs}`, `x - ${a} = ${rhs}`]),
                correctAnswer: correct,
                explanation: `Si tenía "x" y regaló ${a}, queda (x - ${a}). Como es ${storyLt ? 'menor' : 'mayor'} que ${rhs}, la inecuación es ${correct}.`,
                oaCode: oa.code,
                difficulty: level,
                categoryLabel: 'Nivel 3: Modelamiento de Inecuaciones'
              };
            } else {
              const total = rhs + a; // <= 83
              const correct = `x + ${a} ${sOp} ${total}`;
              return {
                id: qId,
                prompt: `${name} ahorró "x" monedas y recibió ${a} más, juntando ${storyLt ? 'menos de' : 'más de'} ${total} monedas. ¿Qué inecuación representa esta situación?`,
                visualType: 'none',
                questionType: 'multiple_choice',
                options: shuffle([correct, `x - ${a} ${sOp} ${total}`, `x + ${a} ${sOther} ${total}`, `x + ${a} = ${total}`]),
                correctAnswer: correct,
                explanation: `Sumar ${a} monedas a "x" da (x + ${a}), y al ser ${storyLt ? 'menos' : 'más'} que ${total}, se expresa como ${correct}.`,
                oaCode: oa.code,
                difficulty: level,
                categoryLabel: 'Nivel 3: Modelamiento de Inecuaciones'
              };
            }
          }
        }
      }

      // 6° a 8° Básico: Inecuaciones lineales de 1 y 2 pasos (ax + b < c, ax - b > c)
      const isLt = subIdx % 2 === 0;
      const op = isLt ? '<' : '>';
      const otherOp = isLt ? '>' : '<';
      const m = randInt(2, 5);
      const threshold = randInt(4, 12);
      const a = randInt(3, 15);
      const c = m * threshold + a;

      if (level === 'facil') {
        const valid = isLt ? threshold - randInt(1, 2) : threshold + randInt(1, 3);
        const opts = isLt
          ? [valid, threshold, threshold + 1, threshold + 3]
          : [valid, threshold, threshold - 1, threshold - 2];
        return {
          id: qId,
          prompt: `¿Cuál de los siguientes valores de x satisface la inecuación ${m}x ${op} ${m * threshold}?`,
          context: `${m}x ${op} ${m * threshold}`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: shuffle(opts.map(String)),
          correctAnswer: valid.toString(),
          explanation: `Dividiendo por ${m} obtenemos x ${op} ${threshold}. Solo ${valid} cumple esa condición.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación de Inecuaciones'
        };
      } else if (level === 'medio') {
        if (subIdx % 2 === 0) {
          return {
            id: qId,
            prompt: `Resuelve la inecuación lineal y selecciona su conjunto solución:`,
            context: `${m}x + ${a} ${op} ${c}`,
            visualType: 'none',
            questionType: 'multiple_choice',
            options: shuffle([`x ${op} ${threshold}`, `x ${otherOp} ${threshold}`, `x = ${threshold}`, `x ${op} ${threshold + m}`]),
            correctAnswer: `x ${op} ${threshold}`,
            explanation: `${m}x ${op} ${c} - ${a} = ${m * threshold} ➔ x ${op} ${threshold}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación de Inecuaciones'
          };
        } else {
          const ans = isLt ? threshold - 1 : threshold + 1;
          const ask = isLt ? 'MAYOR' : 'MENOR';
          return {
            id: qId,
            prompt: `¿Cuál es el ${ask} número entero que satisface la inecuación ${m}x + ${a} ${op} ${c}?`,
            context: `${m}x + ${a} ${op} ${c}`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: ans.toString(),
            explanation: `${m}x ${op} ${c} - ${a} = ${m * threshold} ➔ x ${op} ${threshold}. El ${ask.toLowerCase()} entero que cumple es ${ans}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación de Inecuaciones'
          };
        }
      } else {
        const precioUnit = randInt(400, 900);
        const envio = randInt(500, 1500);
        const maxUnidades = randInt(4, 9);
        const tope = maxUnidades * precioUnit + envio + 200;
        return {
          id: qId,
          prompt: `${name} quiere comprar "x" cuadernos a ${formatCLP(precioUnit)} cada uno más un despacho fijo de ${formatCLP(envio)}. Si su presupuesto debe ser menor a ${formatCLP(tope)} (${precioUnit}x + ${envio} < ${tope}), ¿cuál es la MAYOR cantidad entera de cuadernos que puede comprar?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: maxUnidades.toString(),
          explanation: `${precioUnit}x < ${tope} - ${envio} = ${tope - envio} ➔ x < ${((tope - envio) / precioUnit).toFixed(2).replace('.', ',')}. La mayor cantidad entera es ${maxUnidades}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Problemas con Inecuaciones'
        };
      }
    }

    // ------------------------------------------------------------------
    // B. ECUACIONES (Igualdades con =)
    // ------------------------------------------------------------------
    if (isLowerPrimary) {
      const x = randInt(2, 10);
      const a = randInt(2, 9);
      const b = x + a; // <= 19
      if (level === 'facil') {
        const isAdd = subIdx % 2 === 0;
        const showBal = Math.floor(subIdx / 2) % 2 === 0;
        return {
          id: qId,
          prompt: isAdd && showBal
            ? `Observa la balanza en equilibrio. ¿Cuál es el valor de "x"?`
            : `Resuelve la ecuación de un paso: encuentra el valor de x:`,
          context: isAdd ? `x + ${a} = ${b}` : `x - ${a} = ${x}`,
          visualType: isAdd && showBal ? 'balance_equation' : 'none',
          visualData: isAdd && showBal ? { left: `x + ${a}`, right: b.toString(), operator: '=' } : undefined,
          questionType: 'numeric',
          correctAnswer: isAdd ? x.toString() : b.toString(),
          explanation: isAdd
            ? `Restamos ${a}: x = ${b} - ${a} = ${x}.`
            : `Sumamos ${a}: x = ${x} + ${a} = ${b}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (level === 'medio') {
        const isAdd = subIdx % 2 === 0;
        return {
          id: qId,
          prompt: `Encuentra el valor desconocido de x en la igualdad:`,
          context: isAdd ? `${a} + x = ${b}` : `${b} - x = ${a}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: x.toString(),
          explanation: `Como ${a} + ${x} = ${b}, el valor de x es ${x}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        return {
          id: qId,
          prompt: `${name} pensó en un número secreto. Si le suma ${a}, obtiene ${b}. ¿Cuál es el número secreto?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: x.toString(),
          explanation: `x + ${a} = ${b} ➔ x = ${b} - ${a} = ${x}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      }
    }

    if (isOneStep100) {
      // 3° a 5° Básico: Ecuaciones de un paso (+ y -), ámbito 0 al 100
      const x = randInt(9, 46);
      const a = randInt(8, 44);
      const b = x + a; // 17..90 <= 100

      if (level === 'facil') {
        const fmt = subIdx % 3;
        if (fmt === 0) {
          return {
            id: qId,
            prompt: `Observa la balanza en equilibrio. ¿Cuál es el valor de la incógnita "x"?`,
            context: `x + ${a} = ${b}`,
            visualType: 'balance_equation',
            visualData: { left: `x + ${a}`, right: b.toString(), operator: '=' },
            questionType: 'numeric',
            correctAnswer: x.toString(),
            explanation: `Para mantener el equilibrio restamos ${a} en ambos platillos: x = ${b} - ${a} = ${x}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ecuaciones en Balanza'
          };
        } else if (fmt === 1) {
          return {
            id: qId,
            prompt: `Resuelve la ecuación de un paso: encuentra el valor de x:`,
            context: `x + ${a} = ${b}`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: x.toString(),
            explanation: `Restamos ${a} a ambos lados: x = ${b} - ${a} = ${x}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación de Ecuaciones'
          };
        } else {
          return {
            id: qId,
            prompt: `Resuelve la ecuación de un paso: encuentra el valor de x:`,
            context: `x - ${a} = ${x}`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: b.toString(),
            explanation: `Sumamos ${a} a ambos lados: x = ${x} + ${a} = ${b}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación de Ecuaciones'
          };
        }
      } else if (level === 'medio') {
        const fmt = subIdx % 3;
        if (fmt === 0) {
          return {
            id: qId,
            prompt: `Determina el valor de la incógnita x en la ecuación de un paso:`,
            context: `${a} + x = ${b}`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: x.toString(),
            explanation: `Restamos ${a} a ${b}: x = ${b} - ${a} = ${x}. Comprobación: ${a} + ${x} = ${b}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación de Ecuaciones'
          };
        } else if (fmt === 1) {
          return {
            id: qId,
            prompt: `Determina el valor de la incógnita x en la siguiente sustracción:`,
            context: `${b} - x = ${a}`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: x.toString(),
            explanation: `Si ${b} - x = ${a}, entonces x = ${b} - ${a} = ${x}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación de Ecuaciones'
          };
        } else {
          const d1 = x + randInt(4, 9);
          const d2 = Math.max(1, x - randInt(3, 6));
          const d3 = b + a;
          return {
            id: qId,
            prompt: `¿Qué valor de "x" mantiene exactamente en equilibrio la siguiente balanza?`,
            context: `${a} + x = ${b}`,
            visualType: 'balance_equation',
            visualData: { left: `${a} + x`, right: b.toString(), operator: '=' },
            questionType: 'multiple_choice',
            options: shuffle([x, d1, d2, d3].map(String)),
            correctAnswer: x.toString(),
            explanation: `${a} + ${x} = ${b}, por lo que x = ${b} - ${a} = ${x}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Comprobación en Balanza'
          };
        }
      } else {
        const pesoExtra = randInt(12, 38);
        const pesoCaja = randInt(10, 48);
        const pesoTotal = pesoCaja + pesoExtra; // <= 86
        const scenarios: {
          prompt: string;
          ans: number;
          exp: string;
          visualType?: VisualType;
          visualData?: any;
        }[] = [
          {
            prompt: `${name} pensó en un número secreto. Si le suma ${a}, el resultado es ${b}. ¿Cuál es el número secreto en el que pensó ${name}?`,
            ans: x,
            exp: `Planteamos la ecuación: x + ${a} = ${b} ➔ x = ${b} - ${a} = ${x}.`
          },
          {
            prompt: `En una balanza en equilibrio, el platillo izquierdo tiene una caja de masa "x" más ${pesoExtra} kg, y el platillo derecho marca ${pesoTotal} kg. ¿Cuántos kg pesa la caja "x"?`,
            ans: pesoCaja,
            exp: `x + ${pesoExtra} = ${pesoTotal} ➔ x = ${pesoTotal} - ${pesoExtra} = ${pesoCaja} kg.`,
            visualType: 'balance_equation',
            visualData: { left: `x + ${pesoExtra}`, right: pesoTotal.toString(), operator: '=' }
          },
          {
            prompt: `${name} llevó $${b} a ${place}, gastó "x" pesos en una colación y le quedaron $${a} de vuelto. ¿Cuánto costó la colación?`,
            ans: x,
            exp: `${b} - x = ${a} ➔ x = ${b} - ${a} = $${x}.`
          },
          {
            prompt: `${name} tenía "x" láminas de un álbum, regaló ${a} a un compañero y le quedaron ${x} láminas. ¿Cuántas láminas tenía al principio?`,
            ans: b,
            exp: `x - ${a} = ${x} ➔ x = ${x} + ${a} = ${b} láminas.`
          }
        ];
        const chosen = scenarios[subIdx % scenarios.length];
        return {
          id: qId,
          prompt: chosen.prompt,
          visualType: chosen.visualType || 'none',
          visualData: chosen.visualData,
          questionType: 'numeric',
          correctAnswer: chosen.ans.toString(),
          explanation: chosen.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Problemas con Ecuaciones'
        };
      }
    }

    // 6° a 8° Básico: Ecuaciones lineales de 1 y 2 pasos
    const x = randInt(3, 14);
    const a = randInt(4, 18);
    const b = x + a;

    if (level === 'facil') {
      const isAdd = subIdx % 2 === 0;
      const rhs = isAdd ? b : x;
      return {
        id: qId,
        prompt: `Resuelve la ecuación de un paso: encuentra el valor de x:`,
        context: isAdd ? `x + ${a} = ${rhs}` : `x - ${a} = ${x}`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: isAdd ? x.toString() : (x + a).toString(),
        explanation: isAdd
          ? `Restamos ${a} a ambos lados: x = ${rhs} - ${a} = ${x}.`
          : `Sumamos ${a} a ambos lados: x = ${x} + ${a} = ${x + a}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const m = randInt(2, 5);
      const c = m * x + a;
      return {
        id: qId,
        prompt: `Resuelve la ecuación de dos pasos:`,
        context: `${m}x + ${a} = ${c}`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: x.toString(),
        explanation: `${m}x = ${c} - ${a} = ${m * x}. Luego: x = ${m * x} ÷ ${m} = ${x}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const precioCuaderno = randInt(400, 900);
      const vuelto = randInt(200, 600);
      const billete = precioCuaderno + vuelto;
      const pesoExtra = randInt(3, 9);
      const pesoTotal = x + pesoExtra;
      const scenarios = [
        {
          prompt: `${name} pensó en un número secreto. Si le suma ${a}, el resultado es ${b}. ¿Cuál es el número secreto en el que pensó ${name}?`,
          ans: x,
          exp: `Planteamos la ecuación: x + ${a} = ${b} ➔ x = ${b} - ${a} = ${x}.`
        },
        {
          prompt: `En una balanza en equilibrio, el platillo izquierdo tiene una caja de masa "x" más ${pesoExtra} kg, y el platillo derecho marca ${pesoTotal} kg en total. ¿Cuántos kg pesa la caja "x"?`,
          ans: x,
          exp: `x + ${pesoExtra} = ${pesoTotal} ➔ x = ${pesoTotal} - ${pesoExtra} = ${x} kg.`
        },
        {
          prompt: `${name} compró un artículo que costaba "x" pesos y además pagó $${vuelto} por un lápiz, gastando exactamente $${billete} en total. ¿Cuánto costó el artículo?`,
          ans: precioCuaderno,
          exp: `x + ${vuelto} = ${billete} ➔ x = ${billete} - ${vuelto} = $${precioCuaderno}.`
        },
        {
          prompt: `El doble de la edad de un perro más ${a} años es igual a ${2 * x + a} años. ¿Cuántos años tiene el perro?`,
          ans: x,
          exp: `2x + ${a} = ${2 * x + a} ➔ 2x = ${2 * x} ➔ x = ${x} años.`
        }
      ];
      const chosen = scenarios[subIdx % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 21. Expresiones Algebraicas y Funciones (4 arquetipos por nivel)
  expresiones_algebraicas_funciones: (level, grade, oa, qId, variant) => {
    const xVal = randInt(2, 11);
    const m = randInt(2, 8);
    const n = randInt(1, 14);
    const res = m * xVal + n;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        return {
          id: qId,
          prompt: `Valoriza la expresión algebraica si x = ${xVal}:`,
          context: `${m}x + ${n} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: res.toString(),
          explanation: `Reemplazamos x por ${xVal}: (${m} × ${xVal}) + ${n} = ${m * xVal} + ${n} = ${res}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Valorización Positiva'
        };
      } else if (fType === 1) {
        const subN = randInt(1, Math.max(2, m * xVal - 1));
        const subRes = m * xVal - subN;
        return {
          id: qId,
          prompt: `Calcula el valor numérico de la expresión si x = ${xVal}:`,
          context: `${m}x - ${subN} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: subRes.toString(),
          explanation: `(${m} × ${xVal}) - ${subN} = ${m * xVal} - ${subN} = ${subRes}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Valorización con Resta'
        };
      } else if (fType === 2) {
        const verbalModes = [
          { desc: `El doble de un número x aumentado en ${n}`, ans: `2x + ${n}`, wrong: [`x + ${n + 2}`, `2(x - ${n})`, `x² + ${n}`] },
          { desc: `El triple de un número x disminuido en ${n}`, ans: `3x - ${n}`, wrong: [`3x + ${n}`, `x - ${n * 3}`, `${n} - 3x`] },
          { desc: `${m} veces un número x más ${n}`, ans: `${m}x + ${n}`, wrong: [`x + ${m + n}`, `${m}(x + ${n})`, `${n}x + ${m}`] },
          { desc: `Un número x aumentado en ${n}`, ans: `x + ${n}`, wrong: [`${n}x`, `x - ${n}`, `2x + ${n}`] },
        ];
        const picked = verbalModes[Math.floor(v / 4) % verbalModes.length];
        return {
          id: qId,
          prompt: `¿Qué expresión algebraica traduce la frase: "${picked.desc}"?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(picked.ans, picked.wrong),
          correctAnswer: picked.ans,
          explanation: `La expresión que modela exactamente la frase es ${picked.ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Lenguaje Algebraico'
        };
      } else {
        const a = randInt(2, 9);
        const b = randInt(2, 9);
        const correct = `${a + b}x`;
        return {
          id: qId,
          prompt: `Reduce los términos semejantes en la expresión algebraica:`,
          context: `${a}x + ${b}x = ?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`${a * b}x`, `${a + b}x²`, `${Math.max(1, Math.abs(a - b))}x`, `${a + b + 1}x`]),
          correctAnswer: correct,
          explanation: `Sumamos los coeficientes manteniendo la letra: (${a} + ${b})x = ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Términos Semejantes'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        return {
          id: qId,
          prompt: `Dada la función afín f(x) = ${m}x + ${n}, calcula f(${xVal}):`,
          context: `f(${xVal}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: res.toString(),
          explanation: `f(${xVal}) = ${m}(${xVal}) + ${n} = ${res}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Evaluación de Funciones'
        };
      } else if (mType === 1) {
        const subN = randInt(1, m * xVal - 1);
        const subRes = m * xVal - subN;
        return {
          id: qId,
          prompt: `Dada la función f(x) = ${m}x - ${subN}, ¿cuál es el valor de f(${xVal})?`,
          context: `f(${xVal}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: subRes.toString(),
          explanation: `f(${xVal}) = ${m}(${xVal}) - ${subN} = ${subRes}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Evaluación de Funciones'
        };
      } else if (mType === 2) {
        return {
          id: qId,
          prompt: `La tabla representa valores de la función f(x) = ${m}x + ${n}. ¿Qué valor debe ir en "?"?`,
          visualType: 'table_data',
          visualData: {
            title: `f(x) = ${m}x + ${n}`,
            headers: ['x', '1', '2', '3', String(xVal)],
            rows: [['f(x)', String(m + n), String(m * 2 + n), String(m * 3 + n), '?']],
          },
          questionType: 'numeric',
          correctAnswer: res.toString(),
          explanation: `f(${xVal}) = ${m}(${xVal}) + ${n} = ${res}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Tablas Funcionales'
        };
      } else {
        return {
          id: qId,
          prompt: `Si f(x) = ${m}x + ${n}, ¿para qué valor de entrada x se obtiene f(x) = ${res}?`,
          context: `${m}x + ${n} = ${res}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: xVal.toString(),
          explanation: `${m}x = ${res} - ${n} = ${m * xVal}, por lo tanto x = ${m * xVal} ÷ ${m} = ${xVal}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Preimagen de una Función'
        };
      }
    } else {
      const bajada = randChoice([600, 800, 1000, 1200]);
      const km = randInt(3, 10);
      const valorKm = randChoice([400, 500, 600, 700]);
      const costoMin = randChoice([150, 200, 250, 300]);
      const minutos = randInt(5, 14);
      const precioUni = randChoice([1200, 1500, 2000, 2500]);
      const despacho = randChoice([1000, 1500, 2000]);
      const cant = randInt(2, 7);
      const scenarios = [
        {
          prompt: `Un taxi colectivo en Arica cobra una tarifa fija de ${formatCLP(bajada)} más ${formatCLP(valorKm)} por cada kilómetro recorrido. Si una familia viaja ${km} kilómetros hasta la playa Chinchorro, ¿cuánto pagará en total?`,
          ans: bajada + km * valorKm,
          exp: `Tarifa = ${bajada} + (${km} × ${valorKm}) = ${formatCLP(bajada + km * valorKm)}.`
        },
        {
          prompt: `Una máquina expendedora de copias cobra ${formatCLP(costoMin)} por cada página impresa más ${formatCLP(300)} de uso del escáner. Si un estudiante imprime ${minutos} páginas y usa una vez el escáner, ¿cuánto paga?`,
          ans: costoMin * minutos + 300,
          exp: `f(${minutos}) = ${costoMin}(${minutos}) + 300 = ${formatCLP(costoMin * minutos + 300)}.`
        },
        {
          prompt: `Una tienda escolar cobra ${formatCLP(precioUni)} por cada polera deportiva más un cargo fijo de ${formatCLP(despacho)} por estampado grupal. Si se encargan ${cant} poleras iguales, ¿cuál es el costo total?`,
          ans: precioUni * cant + despacho,
          exp: `${precioUni} × ${cant} + ${despacho} = ${formatCLP(precioUni * cant + despacho)}.`
        },
        {
          prompt: `Un estanque de riego en Azapa parte con ${bajada} litros de agua y recibe ${valorKm} litros adicionales por hora. ¿Cuántos litros tendrá después de ${km} horas?`,
          ans: bajada + valorKm * km,
          exp: `${bajada} + (${valorKm} × ${km}) = ${bajada + valorKm * km} litros.`
        },
        {
          prompt: `Un gimnasio cobra matrícula de ${formatCLP(despacho)} y ${formatCLP(precioUni)} por mes. ¿Cuánto habrá pagado una persona tras asistir ${cant} meses?`,
          ans: despacho + precioUni * cant,
          exp: `${despacho} + (${precioUni} × ${cant}) = ${formatCLP(despacho + precioUni * cant)}.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 22. Ubicación Espacial y Coordenadas (cuadrícula 0..12, 4 arquetipos por nivel)
  ubicacion_espacial_coordenadas: (level, grade, oa, qId, variant) => {
    const x = randInt(1, 11);
    let y = randInt(1, 11);
    if (x === y) y = (y % 11) + 1;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        return {
          id: qId,
          prompt: `En el par ordenado (${x}, ${y}), ¿cuál es el valor de la coordenada del eje X (horizontal)?`,
          context: `(${x}, ${y})`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: x.toString(),
          explanation: `En un par ordenado (x, y), el primer número siempre corresponde al eje X (${x}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Lectura Eje X'
        };
      } else if (fType === 1) {
        return {
          id: qId,
          prompt: `En el par ordenado (${x}, ${y}), ¿cuál es el valor de la coordenada del eje Y (vertical)?`,
          context: `(${x}, ${y})`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: y.toString(),
          explanation: `En un par ordenado (x, y), el segundo número siempre corresponde al eje Y (${y}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Lectura Eje Y'
        };
      } else if (fType === 2) {
        const correct = `(${x}, ${y})`;
        return {
          id: qId,
          prompt: `Si partes en el origen (0, 0), avanzas ${x} unidades a la derecha y subes ${y} unidades, ¿en qué par ordenado quedas?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`(${y}, ${x})`, `(${x + 1}, ${y})`, `(${x}, ${y + 1})`, `(${x + y}, 0)`]),
          correctAnswer: correct,
          explanation: `Avanzar a la derecha da x = ${x} y subir da y = ${y}, formando el punto ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Pares Ordenados'
        };
      } else {
        const moveY = randInt(1, 3);
        const correct = `(${x}, ${y + moveY})`;
        return {
          id: qId,
          prompt: `Desde el punto (${x}, ${y}), te mueves ${moveY} ${moveY === 1 ? 'cuadro' : 'cuadros'} hacia ARRIBA en el plano cartesiano. ¿Cuál es tu nueva posición?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [`(${x + moveY}, ${y})`, `(${x}, ${Math.max(0, y - moveY)})`, `(${y + moveY}, ${x})`, `(${x + 1}, ${y + 1})`]),
          correctAnswer: correct,
          explanation: `Subir suma al eje Y: (${x}, ${y} + ${moveY}) = ${correct}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Movimientos Básicos'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      const dx = randInt(2, 7);
      const dy = randInt(2, 7);
      if (mType === 0) {
        return {
          id: qId,
          prompt: `Si el punto A se ubica en (${x}, ${y}) y se traslada ${dx} unidades hacia la derecha, ¿cuál será su nueva coordenada X?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (x + dx).toString(),
          explanation: `Hacia la derecha se suma en el eje X: ${x} + ${dx} = ${x + dx}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Traslación Horizontal'
        };
      } else if (mType === 1) {
        return {
          id: qId,
          prompt: `Si el punto B está en (${x}, ${y}) y se traslada ${dy} unidades hacia arriba, ¿cuál será su nueva coordenada Y?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (y + dy).toString(),
          explanation: `Hacia arriba se suma en el eje Y: ${y} + ${dy} = ${y + dy}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Traslación Vertical'
        };
      } else if (mType === 2) {
        const startX = x + dx;
        return {
          id: qId,
          prompt: `Un punto en (${startX}, ${y}) retrocede ${dx} unidades hacia la izquierda. ¿Cuál es su nueva coordenada X?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: x.toString(),
          explanation: `Hacia la izquierda se resta en el eje X: ${startX} - ${dx} = ${x}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Retroceso en Eje X'
        };
      } else {
        const dist = randInt(3, 9);
        const horiz = v % 2 === 0;
        const p2 = horiz ? `(${x + dist}, ${y})` : `(${x}, ${y + dist})`;
        return {
          id: qId,
          prompt: `¿Cuántas unidades de distancia hay en línea recta entre el punto (${x}, ${y}) y el punto ${p2}?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: dist.toString(),
          explanation: horiz
            ? `Como ambos tienen la misma altura Y = ${y}, restamos X: ${x + dist} - ${x} = ${dist} unidades.`
            : `Como ambos tienen la misma posición X = ${x}, restamos Y: ${y + dist} - ${y} = ${dist} unidades.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Distancia en el Plano'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const dx = randInt(2, 6);
      const dy = randInt(2, 5);
      const nx = x + dx;
      let ny = y + dy;
      if (nx === ny) ny += 1;
      const ansStr = `(${nx}, ${ny})`;
      const wrong1 = `(${ny}, ${nx})`;
      const wrong2 = `(${nx}, ${Math.max(0, y - dy)})`;
      const wrong3 = `(${Math.max(0, x - dx)}, ${ny})`;
      const wrong4 = `(${nx + 1}, ${ny})`;
      const scenarios = [
        `En el plano del patio de la escuela, ${name} se encuentra en el punto (${x}, ${y}). Camina ${dx} cuadros al este (+X) y ${dy} cuadros al norte (+Y). ¿En qué coordenada final se ubicará?`,
        `En un mapa del tesoro de Arica, la brújula marca la posición (${x}, ${y}). Si debes moverte ${dx} unidades a la derecha y ${dy} unidades hacia arriba, ¿en qué punto está el tesoro?`,
        `Un robot programado por estudiantes de la escuela parte en (${x}, ${y}) y avanza ${dx} pasos en el eje horizontal X y ${dy} pasos en el eje vertical Y. ¿Cuál es su nueva ubicación?`,
        `En una cuadrícula de ajedrez, ${name} ubica una ficha en (${x}, ${y}) y la desplaza según el vector (+${dx}, +${dy}). ¿En qué coordenada termina la ficha?`
      ];
      return {
        id: qId,
        prompt: scenarios[v % scenarios.length],
        visualType: 'none',
        questionType: 'multiple_choice',
        options: uniqueMcOptions(ansStr, [wrong1, wrong2, wrong3, wrong4]),
        correctAnswer: ansStr,
        explanation: `Nueva coordenada X: ${x} + ${dx} = ${nx}. Nueva coordenada Y: ${y} + ${dy} = ${ny}. Punto final: ${ansStr}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 23. Figuras 2D (gran variedad combinatoria: polígonos, ángulos, radio/diámetro, perímetros)
  figuras_2d: (level, grade, oa, qId, variant) => {
    const shapes = [
      { name: 'Triángulo', plural: 'triángulos', sides: 3, vertices: 3, intSum: 180 },
      { name: 'Cuadrado', plural: 'cuadrados', sides: 4, vertices: 4, intSum: 360 },
      { name: 'Rectángulo', plural: 'rectángulos', sides: 4, vertices: 4, intSum: 360 },
      { name: 'Rombo', plural: 'rombos', sides: 4, vertices: 4, intSum: 360 },
      { name: 'Trapecio', plural: 'trapecios', sides: 4, vertices: 4, intSum: 360 },
      { name: 'Pentágono', plural: 'pentágonos', sides: 5, vertices: 5, intSum: 540 },
      { name: 'Hexágono', plural: 'hexágonos', sides: 6, vertices: 6, intSum: 720 },
      { name: 'Heptágono', plural: 'heptágonos', sides: 7, vertices: 7, intSum: 900 },
      { name: 'Octágono', plural: 'octágonos', sides: 8, vertices: 8, intSum: 1080 },
      { name: 'Decágono', plural: 'decágonos', sides: 10, vertices: 10, intSum: 1440 },
      { name: 'Dodecágono', plural: 'dodecágonos', sides: 12, vertices: 12, intSum: 1800 }
    ];
    const v = Math.abs(variant);
    const s = shapes[v % shapes.length];

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        const k = randInt(2, 9);
        return {
          id: qId,
          prompt: `Un ${s.name.toLowerCase()} tiene ${s.sides} lados. ¿Cuántos lados suman en total ${k} ${s.plural} separados?`,
          visualType: s.name === 'Cuadrado' ? 'geometry_shape' : s.name === 'Pentágono' ? 'geometry_shape' : 'none',
          visualData: s.name === 'Cuadrado'
            ? { shape: 'cuadrado', width: 5, height: 5, unit: 'cm' }
            : s.name === 'Pentágono'
              ? { shape: 'pentagono' }
              : undefined,
          questionType: 'numeric',
          correctAnswer: (k * s.sides).toString(),
          explanation: `Cada ${s.name.toLowerCase()} tiene ${s.sides} lados. ${k} × ${s.sides} = ${k * s.sides} lados.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Propiedades de Polígonos'
        };
      } else if (fType === 1) {
        const lado = randInt(2, 16);
        const regShapes = [
          { name: 'triángulo equilátero', sides: 3 },
          { name: 'cuadrado', sides: 4 },
          { name: 'pentágono regular', sides: 5 },
          { name: 'hexágono regular', sides: 6 },
          { name: 'octágono regular', sides: 8 },
        ];
        const rs = regShapes[Math.floor(v / 4) % regShapes.length];
        return {
          id: qId,
          prompt: `Si cada lado de un ${rs.name} mide ${lado} cm, ¿cuánto mide la suma de todos sus lados (contorno)?`,
          visualType: rs.sides === 4 ? 'geometry_shape' : rs.sides === 5 ? 'geometry_shape' : 'none',
          visualData: rs.sides === 4 ? { shape: 'cuadrado', width: lado, height: lado, unit: 'cm' } : rs.sides === 5 ? { shape: 'pentagono' } : undefined,
          questionType: 'numeric',
          correctAnswer: (rs.sides * lado).toString(),
          explanation: `Un ${rs.name} tiene ${rs.sides} lados iguales de ${lado} cm: ${rs.sides} × ${lado} = ${rs.sides * lado} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Lados Iguales'
        };
      } else if (fType === 2) {
        const radius = randInt(3, 25);
        return {
          id: qId,
          prompt: `Observa el círculo cuyo radio mide ${radius} cm. ¿Cuánto mide su DIÁMETRO en centímetros?`,
          visualType: 'geometry_shape',
          visualData: { shape: 'circulo', radius, unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: (radius * 2).toString(),
          explanation: `El diámetro equivale al doble del radio: 2 × ${radius} = ${radius * 2} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Elementos del Círculo'
        };
      } else {
        const k = randInt(2, 8);
        return {
          id: qId,
          prompt: `¿Cuántos vértices (esquinas) tienen en total ${k} ${s.plural}?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (k * s.vertices).toString(),
          explanation: `Cada ${s.name.toLowerCase()} posee ${s.vertices} vértices. ${k} × ${s.vertices} = ${k * s.vertices} vértices.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Vértices en Polígonos'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        const a = randInt(32, 78);
        const b = randInt(34, 75);
        const c = 180 - a - b;
        return {
          id: qId,
          prompt: `Observa el triángulo ABC. Si dos de sus ángulos interiores miden ${a}° y ${b}°, ¿cuántos grados mide el ángulo desconocido x?`,
          visualType: 'angle_figure',
          visualData: { kind: 'triangle_angles', a, b },
          questionType: 'numeric',
          correctAnswer: c.toString(),
          explanation: `La suma interior de un triángulo es siempre 180°: 180° - (${a}° + ${b}°) = ${c}°.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Ángulos en Triángulos'
        };
      } else if (mType === 1) {
        const a1 = randInt(60, 110);
        const a2 = randInt(70, 115);
        const a3 = randInt(55, 105);
        const a4 = 360 - (a1 + a2 + a3);
        return {
          id: qId,
          prompt: `En un cuadrilátero, tres ángulos interiores miden ${a1}°, ${a2}° y ${a3}°. Como los 4 ángulos suman 360°, ¿cuánto mide el cuarto ángulo?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: a4.toString(),
          explanation: `360° - (${a1}° + ${a2}° + ${a3}°) = 360° - ${a1 + a2 + a3}° = ${a4}°.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Ángulos en Cuadriláteros'
        };
      } else if (mType === 2) {
        const diam = randInt(4, 30) * 2;
        return {
          id: qId,
          prompt: `Si el diámetro completo de una rueda circular mide ${diam} cm, ¿cuántos centímetros mide su RADIO?`,
          visualType: 'geometry_shape',
          visualData: { shape: 'circulo', radius: diam / 2, unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: (diam / 2).toString(),
          explanation: `El radio es la mitad del diámetro: ${diam} ÷ 2 = ${diam / 2} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Círculo y Radio'
        };
      } else {
        const types = [
          { q: '¿Cómo se clasifica un triángulo que tiene TODOS sus tres lados de igual longitud?', a: 'Equilátero', opts: ['Equilátero', 'Isósceles', 'Escaleno', 'Rectángulo'], exp: 'Un triángulo con tres lados iguales se llama equilátero.' },
          { q: '¿Cómo se clasifica un triángulo que tiene exactamente DOS lados de igual longitud?', a: 'Isósceles', opts: ['Isósceles', 'Equilátero', 'Escaleno', 'Obtusángulo'], exp: 'Un triángulo con dos lados iguales se llama isósceles.' },
          { q: '¿Cómo se clasifica un triángulo cuyos tres lados tienen medidas TODAS distintas?', a: 'Escaleno', opts: ['Escaleno', 'Isósceles', 'Equilátero', 'Regular'], exp: 'Un triángulo con todos sus lados de distinta medida se llama escaleno.' },
          { q: '¿Qué cuadrilátero tiene 4 ángulos rectos y todos sus 4 lados de igual medida?', a: 'Cuadrado', opts: ['Cuadrado', 'Trapecio', 'Romboide', 'Pentágono'], exp: 'El cuadrado posee 4 ángulos de 90° y 4 lados iguales.' },
          { q: '¿Qué cuadrilátero tiene solo UN par de lados paralelos?', a: 'Trapecio', opts: ['Trapecio', 'Cuadrado', 'Rectángulo', 'Rombo'], exp: 'El trapecio tiene exactamente un par de lados opuestos paralelos.' },
          { q: '¿Cuál es el nombre del polígono que tiene exactamente 6 lados y 6 vértices?', a: 'Hexágono', opts: ['Hexágono', 'Pentágono', 'Heptágono', 'Octágono'], exp: 'El polígono de 6 lados se llama hexágono.' }
        ];
        const chosen = types[Math.floor(v / 4) % types.length];
        return {
          id: qId,
          prompt: chosen.q,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(chosen.a, chosen.opts),
          correctAnswer: chosen.a,
          explanation: chosen.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Clasificación de Figuras'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const countFig = randInt(3, 12);
      const chosenShape = shapes[v % shapes.length];
      const totalPalitos = countFig * chosenShape.sides;
      const ladoM = randInt(4, 15);
      const scenarios = [
        {
          prompt: `${name} está armando figuras geométricas con palitos de fósforo para su maqueta escolar. Si construyó ${countFig} ${chosenShape.plural} independientes (sin compartir lados), ¿cuántos fósforos necesitó en total?`,
          ans: totalPalitos,
          exp: `Cada ${chosenShape.name.toLowerCase()} usa ${chosenShape.sides} fósforos. ${countFig} × ${chosenShape.sides} = ${totalPalitos} fósforos.`
        },
        {
          prompt: `En la clase de Artes, los estudiantes recortaron ${countFig} cartulinas con forma de ${chosenShape.name.toLowerCase()}. ¿Cuántos vértices (esquinas) suman en total todas las figuras?`,
          ans: countFig * chosenShape.vertices,
          exp: `Cada ${chosenShape.name.toLowerCase()} tiene ${chosenShape.vertices} vértices. ${countFig} × ${chosenShape.vertices} = ${countFig * chosenShape.vertices} vértices.`
        },
        {
          prompt: `Se quiere bordear con cinta un espejo circular cuyo radio mide ${ladoM} cm. ¿Cuántos centímetros mide su diámetro completo?`,
          ans: ladoM * 2,
          exp: `Diámetro = 2 × radio = 2 × ${ladoM} = ${ladoM * 2} cm.`
        },
        {
          prompt: `Un letrero de seguridad vial tiene forma de ${chosenShape.name.toLowerCase()} regular con todos sus lados iguales de ${ladoM} cm. ¿Cuántos centímetros mide todo su contorno?`,
          ans: chosenShape.sides * ladoM,
          exp: `${chosenShape.sides} lados × ${ladoM} cm = ${chosenShape.sides * ladoM} cm.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 24. Cuerpos 3D (catálogo amplio + conteos combinados + visuales 3D)
  cuerpos_3d: (level, grade, oa, qId, variant) => {
    const bodies = [
      { name: 'Cubo', plural: 'cubos', faces: 6, edges: 12, vertices: 8 },
      { name: 'Paralelepípedo (prisma rectangular)', plural: 'paralelepípedos', faces: 6, edges: 12, vertices: 8 },
      { name: 'Prisma triangular', plural: 'prismas triangulares', faces: 5, edges: 9, vertices: 6 },
      { name: 'Prisma pentagonal', plural: 'prismas pentagonales', faces: 7, edges: 15, vertices: 10 },
      { name: 'Prisma hexagonal', plural: 'prismas hexagonales', faces: 8, edges: 18, vertices: 12 },
      { name: 'Pirámide de base cuadrada', plural: 'pirámides de base cuadrada', faces: 5, edges: 8, vertices: 5 },
      { name: 'Pirámide triangular (tetraedro)', plural: 'pirámides triangulares', faces: 4, edges: 6, vertices: 4 },
      { name: 'Pirámide pentagonal', plural: 'pirámides pentagonales', faces: 6, edges: 10, vertices: 6 }
    ];
    const v = Math.abs(variant);
    const b = bodies[v % bodies.length];

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        return {
          id: qId,
          prompt: `¿Cuántas CARAS planas tiene un ${b.name}?`,
          visualType: b.name.includes('Cubo') || b.name.includes('Paralelepípedo') ? 'cube_prism' : 'none',
          visualData: b.name.includes('Cubo')
            ? { kind: 'prism', length: 4, width: 4, height: 4, unit: 'cm' }
            : b.name.includes('Paralelepípedo')
              ? { kind: 'prism', length: 6, width: 4, height: 3, unit: 'cm' }
              : undefined,
          questionType: 'numeric',
          correctAnswer: b.faces.toString(),
          explanation: `El cuerpo geométrico ${b.name} tiene ${b.faces} caras planas.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Caras de Cuerpos 3D'
        };
      } else if (fType === 1) {
        const k = randInt(2, 7);
        return {
          id: qId,
          prompt: `Si juntas ${k} ${b.plural} separados sobre una mesa, ¿cuántas CARAS suman en total?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (k * b.faces).toString(),
          explanation: `Cada ${b.name.toLowerCase()} tiene ${b.faces} caras. ${k} × ${b.faces} = ${k * b.faces} caras.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Conteo de Caras'
        };
      } else if (fType === 2) {
        const roundBank = [
          { q: '¿Cuál de los siguientes cuerpos geométricos es un CUERPO REDONDO (tiene superficie curva y puede rodar)?', a: 'Cilindro', wrong: ['Cubo', 'Prisma triangular', 'Pirámide cuadrada'], exp: 'El cilindro, el cono y la esfera tienen superficies curvas.' },
          { q: '¿Qué figura geométrica forma cada una de las 6 caras de un cubo?', a: 'Cuadrado', wrong: ['Triángulo', 'Rectángulo distinto', 'Círculo'], exp: 'Las 6 caras de un cubo son cuadrados congruentes.' },
          { q: '¿Cuál de estos cuerpos NO tiene caras planas ni vértices?', a: 'Esfera', wrong: ['Cono', 'Cilindro', 'Cubo'], exp: 'La esfera es completamente curva, sin caras planas ni vértices.' },
          { q: '¿Cuántas bases circulares planas tiene un cilindro?', a: '2 bases', wrong: ['1 base', '3 bases', 'Ninguna'], exp: 'Un cilindro posee 2 bases circulares iguales (superior e inferior).' },
          { q: '¿Qué cuerpo geométrico tiene 1 base circular y 1 cúspide (vértice superior)?', a: 'Cono', wrong: ['Cilindro', 'Esfera', 'Pirámide cuadrada'], exp: 'El cono tiene 1 cara basal circular y termina en una cúspide.' },
          { q: '¿Cuántos caras planas tiene un dado común con forma de cubo?', a: '6 caras', wrong: ['4 caras', '8 caras', '12 caras'], exp: 'Un cubo tiene exactamente 6 caras cuadradas.' },
        ];
        const picked = roundBank[Math.floor(v / 4) % roundBank.length];
        return {
          id: qId,
          prompt: picked.q,
          visualType: picked.a === 'Cilindro' ? 'cube_prism' : 'none',
          visualData: picked.a === 'Cilindro' ? { kind: 'cylinder', radius: 3, height: 6, unit: 'cm' } : undefined,
          questionType: 'multiple_choice',
          options: uniqueMcOptions(picked.a, picked.wrong),
          correctAnswer: picked.a,
          explanation: picked.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Cuerpos Poliedros y Redondos'
        };
      } else {
        const k = randInt(2, 6);
        return {
          id: qId,
          prompt: `Si construyes ${k} ${b.plural}, ¿cuántos VÉRTICES tendrán en total?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (k * b.vertices).toString(),
          explanation: `Cada uno tiene ${b.vertices} vértices: ${k} × ${b.vertices} = ${k * b.vertices} vértices.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Conteo de Vértices'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        return {
          id: qId,
          prompt: `¿Cuántos VÉRTICES (esquinas) tiene un ${b.name}?`,
          visualType: b.name.includes('Cubo') || b.name.includes('Paralelepípedo') ? 'cube_prism' : 'none',
          visualData: b.name.includes('Cubo') || b.name.includes('Paralelepípedo') ? { kind: 'prism', length: 5, width: 3, height: 4, unit: 'cm' } : undefined,
          questionType: 'numeric',
          correctAnswer: b.vertices.toString(),
          explanation: `El cuerpo ${b.name} tiene ${b.vertices} vértices en total.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Vértices 3D'
        };
      } else if (mType === 1) {
        return {
          id: qId,
          prompt: `¿Cuántas ARISTAS (bordes donde se unen las caras) tiene un ${b.name}?`,
          visualType: b.name.includes('Cubo') || b.name.includes('Paralelepípedo') ? 'cube_prism' : 'none',
          visualData: b.name.includes('Cubo') || b.name.includes('Paralelepípedo') ? { kind: 'prism', length: 5, width: 4, height: 3, unit: 'cm' } : undefined,
          questionType: 'numeric',
          correctAnswer: b.edges.toString(),
          explanation: `El cuerpo ${b.name} tiene ${b.edges} aristas en total.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aristas 3D'
        };
      } else if (mType === 2) {
        const k = randInt(2, 6);
        return {
          id: qId,
          prompt: `¿Cuántas ARISTAS suman en conjunto ${k} ${b.plural}?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (k * b.edges).toString(),
          explanation: `Cada uno tiene ${b.edges} aristas: ${k} × ${b.edges} = ${k * b.edges} aristas.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Conteo de Aristas'
        };
      } else {
        const ansSum = b.faces + b.vertices;
        return {
          id: qId,
          prompt: `Si sumas el número de CARAS más el número de VÉRTICES de un ${b.name}, ¿qué resultado obtienes?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ansSum.toString(),
          explanation: `${b.name} tiene ${b.faces} caras y ${b.vertices} vértices. ${b.faces} + ${b.vertices} = ${ansSum}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Relación Caras y Vértices'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const cajas = randInt(2, 8);
      const scenarios = [
        {
          prompt: `Para su proyecto de arte escolar, ${name} quiere armar ${cajas} cajas con forma de cubo usando cartulina. ¿Cuántos cuadrados idénticos debe recortar en total para formar todas las caras?`,
          ans: cajas * 6,
          exp: `Cada cubo tiene 6 caras cuadradas. ${cajas} × 6 = ${cajas * 6} cuadrados.`
        },
        {
          prompt: `${name} está construyendo el esqueleto de un ${b.name} usando bolitas de plasticina para cada vértice y bombillas para cada arista. ¿Cuántas bombillas (aristas) necesita?`,
          ans: b.edges,
          exp: `Un ${b.name} posee exactamente ${b.edges} aristas.`
        },
        {
          prompt: `Si ${name} arma ${cajas} pirámides de base cuadrada usando bolitas de masa en cada vértice, ¿cuántas bolitas de masa necesitará en total?`,
          ans: cajas * 5,
          exp: `Cada pirámide de base cuadrada tiene 5 vértices. ${cajas} × 5 = ${cajas * 5} vértices.`
        },
        {
          prompt: `Un grupo de estudiantes construye ${cajas} ${b.plural} con varillas de madera. ¿Cuántas varillas necesitan en total para todas las aristas?`,
          ans: cajas * b.edges,
          exp: `Cada uno requiere ${b.edges} varillas. ${cajas} × ${b.edges} = ${cajas * b.edges} aristas.`
        },
        {
          prompt: `Para armar la red de un ${b.name}, ¿cuántas caras planas en total debe dibujar y recortar ${name}?`,
          ans: b.faces,
          exp: `Un ${b.name} se arma con una red de ${b.faces} caras planas.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 25. Líneas y Ángulos (con visualizaciones de ángulos y paralelas)
  lineas_angulos: (level, grade, oa, qId, variant) => {
    const a1 = randInt(15, 82);
    const comp = 90 - a1;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        return {
          id: qId,
          prompt: `¿Cómo se clasifica un ángulo que mide ${a1}° (mayor que 0° y menor que 90°)?`,
          visualType: 'angle_figure',
          visualData: { kind: 'angle_arc', degrees: a1, label: `${a1}°` },
          questionType: 'multiple_choice',
          options: uniqueMcOptions('Ángulo Agudo', ['Ángulo Recto', 'Ángulo Obtuso', 'Ángulo Llano']),
          correctAnswer: 'Ángulo Agudo',
          explanation: `Todo ángulo mayor que 0° y menor que 90° se clasifica como ángulo agudo.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Clasificación de Ángulos'
        };
      } else if (fType === 1) {
        const obt = randInt(95, 172);
        return {
          id: qId,
          prompt: `Observa la abertura del ángulo que mide ${obt}°. ¿Cómo se clasifica?`,
          visualType: 'angle_figure',
          visualData: { kind: 'angle_arc', degrees: obt, label: `${obt}°` },
          questionType: 'multiple_choice',
          options: uniqueMcOptions('Ángulo Obtuso', ['Ángulo Agudo', 'Ángulo Recto', 'Ángulo Completo']),
          correctAnswer: 'Ángulo Obtuso',
          explanation: `Todo ángulo mayor que 90° y menor que 180° es un ángulo obtuso.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Clasificación de Ángulos'
        };
      } else if (fType === 2) {
        const pairLines = [
          { q: 'Las líneas de los rieles rectos del tren nunca se cruzan y mantienen siempre la misma distancia. ¿Cómo son entre sí?', a: 'Paralelas', w: ['Perpendiculares', 'Secantes oblicuas', 'Curvas'], exp: 'Las rectas paralelas nunca se intersecan y conservan la misma separación.' },
          { q: 'Una esquina perfecta de un cuaderno forma un ángulo de 90°. Las rectas que forman sus bordes son:', a: 'Perpendiculares', w: ['Paralelas', 'Oblicuas', 'Circulares'], exp: 'Dos rectas que se cortan formando exactamente 90° son perpendiculares.' },
          { q: 'Dos calles que se cruzan formando una X con ángulos distintos de 90° representan rectas:', a: 'Secantes oblicuas', w: ['Paralelas', 'Perpendiculares', 'Coincidentes'], exp: 'Se intersecan en un punto sin formar ángulo recto.' },
          { q: 'Los peldaños horizontales de una escalera de mano están ubicados de forma:', a: 'Paralela entre sí', w: ['Perpendicular entre sí', 'Secante', 'Cruzada'], exp: 'Los peldaños mantienen la misma distancia y dirección sin cruzarse.' }
        ];
        const picked = pairLines[Math.floor(v / 4) % pairLines.length];
        return {
          id: qId,
          prompt: picked.q,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(picked.a, picked.w),
          correctAnswer: picked.a,
          explanation: picked.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Posición de Rectas'
        };
      } else {
        const turns = [
          { desc: 'un cuarto (1/4) de vuelta completa', deg: 90, exp: '360° ÷ 4 = 90° (ángulo recto).' },
          { desc: 'media (1/2) vuelta completa', deg: 180, exp: '360° ÷ 2 = 180° (ángulo llano o extendido).' },
          { desc: 'tres cuartos (3/4) de vuelta completa', deg: 270, exp: '3 × 90° = 270°.' },
          { desc: 'una vuelta completa', deg: 360, exp: 'Una circunferencia completa mide 360°.' }
        ];
        const picked = turns[Math.floor(v / 4) % turns.length];
        return {
          id: qId,
          prompt: `¿Cuántos grados mide un ángulo equivalente a ${picked.desc}?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: picked.deg.toString(),
          explanation: picked.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Medida de Giros'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        return {
          id: qId,
          prompt: `¿Cuál es el ángulo COMPLEMENTARIO de ${a1}° (la suma de ambos debe ser 90°)?`,
          context: `${a1}° + [ ? ] = 90°`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: comp.toString(),
          explanation: `90° - ${a1}° = ${comp}°.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Ángulos Complementarios'
        };
      } else if (mType === 1) {
        const ang = randInt(35, 165);
        return {
          id: qId,
          prompt: `¿Cuál es el ángulo SUPLEMENTARIO de ${ang}° (la suma de ambos debe ser 180°)?`,
          context: `${ang}° + [ ? ] = 180°`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (180 - ang).toString(),
          explanation: `180° - ${ang}° = ${180 - ang}°.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Ángulos Suplementarios'
        };
      } else if (mType === 2) {
        const a = randInt(28, 76);
        const b = randInt(32, 74);
        const ans = 180 - a - b;
        return {
          id: qId,
          prompt: `Calcula la medida del ángulo interior desconocido x en el triángulo ABC:`,
          visualType: 'angle_figure',
          visualData: { kind: 'triangle_angles', a, b },
          questionType: 'numeric',
          correctAnswer: ans.toString(),
          explanation: `180° - (${a}° + ${b}°) = ${ans}°.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Triángulos y Ángulos'
        };
      } else {
        const acute = randInt(34, 78);
        return {
          id: qId,
          prompt: `Las rectas L1 y L2 son paralelas (L1 // L2) cortadas por la transversal T. Si α = ${acute}°, ¿cuánto mide el ángulo suplementario adyacente (180° - α)?`,
          visualType: 'angle_figure',
          visualData: { kind: 'transversal', acute },
          questionType: 'numeric',
          correctAnswer: (180 - acute).toString(),
          explanation: `Como son ángulos suplementarios sobre la recta, suman 180°: 180° - ${acute}° = ${180 - acute}°.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Paralelas y Transversal'
        };
      }
    } else {
      const a2 = randInt(35, 72);
      const a3 = 180 - (a1 + a2);
      const angRectoPart = randInt(22, 68);
      const extSup = randInt(25, 145);
      const scenarios = [
        {
          prompt: `En una estructura triangular del techo de la escuela, dos de sus ángulos interiores miden ${a1}° y ${a2}°. Como la suma de los tres ángulos interiores es siempre 180°, ¿cuánto mide el tercer ángulo?`,
          ans: a3,
          exp: `180° - (${a1}° + ${a2}°) = 180° - ${a1 + a2}° = ${a3}°.`
        },
        {
          prompt: `Al abrir una puerta que forma un ángulo recto (90°) con el marco, esta ya se abrió ${angRectoPart}°. ¿Cuántos grados faltan para completar los 90°?`,
          ans: 90 - angRectoPart,
          exp: `90° - ${angRectoPart}° = ${90 - angRectoPart}°.`
        },
        {
          prompt: `Sobre una línea recta (180°) se apoya una rampa formando un ángulo de ${extSup}° por un lado. ¿Cuánto mide el ángulo suplementario del otro lado?`,
          ans: 180 - extSup,
          exp: `180° - ${extSup}° = ${180 - extSup}°.`
        },
        {
          prompt: `Dos rectas se cortan formando un ángulo de ${a1}°. ¿Cuánto mide el ángulo opuesto por el vértice a ese ángulo?`,
          ans: a1,
          exp: `Los ángulos opuestos por el vértice tienen exactamente la misma medida: ${a1}°.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 26. Transformaciones Isométricas (simetría, traslación vectorial, reflexión y rotaciones variadas)
  transformaciones_isometricas: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);
    const x = randInt(1, 9);
    const y = randInt(1, 9);
    const dx = randInt(2, 6);
    const dy = randInt(2, 6);

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        const symShapes = [
          { name: 'cuadrado', axes: 4 },
          { name: 'rectángulo (no cuadrado)', axes: 2 },
          { name: 'triángulo equilátero', axes: 3 },
          { name: 'triángulo isósceles (no equilátero)', axes: 1 },
          { name: 'pentágono regular', axes: 5 },
          { name: 'hexágono regular', axes: 6 },
          { name: 'letra mayúscula A', axes: 1 },
          { name: 'letra mayúscula H', axes: 2 }
        ];
        const sh = symShapes[Math.floor(v / 4) % symShapes.length];
        return {
          id: qId,
          prompt: `¿Cuántos ejes de simetría tiene un(a) ${sh.name}?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: sh.axes.toString(),
          explanation: `Un(a) ${sh.name} tiene exactamente ${sh.axes} ${sh.axes === 1 ? 'eje' : 'ejes'} de simetría.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejes de Simetría'
        };
      } else if (fType === 1) {
        const moves = [
          { ctx: 'un ascensor subiendo en línea recta desde el 1° al 4° piso', ans: 'Traslación', exp: 'Moverse en línea recta sin girar ni voltear es una traslación.' },
          { desc: 'la imagen reflejada de los árboles en las aguas tranquilas de una laguna', ctx: 'el reflejo de un paisaje en un espejo o laguna', ans: 'Reflexión', exp: 'El efecto espejo respecto de una línea corresponde a una reflexión.' },
          { ctx: 'las aspas de un molino girando alrededor de su eje central', ans: 'Rotación', exp: 'El giro alrededor de un punto fijo es una rotación.' },
          { ctx: 'un cajón deslizándose hacia afuera en línea recta', ans: 'Traslación', exp: 'Deslizar un objeto manteniendo orientación y forma es traslación.' },
          { ctx: 'el minutero de un reloj avanzando 15 minutos alrededor del centro', ans: 'Rotación', exp: 'La manecilla gira un ángulo alrededor de un centro fijo.' },
          { ctx: 'doblar una hoja por la mitad y recortar un corazón simétrico', ans: 'Reflexión', exp: 'Las dos mitades coinciden exactamente como espejo respecto del pliegue (eje de simetría).' }
        ];
        const chosen = moves[Math.floor(v / 4) % moves.length];
        return {
          id: qId,
          prompt: `¿Qué transformación isométrica representa "${chosen.ctx}"?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(chosen.ans, ['Traslación', 'Rotación', 'Reflexión', 'Ampliación']),
          correctAnswer: chosen.ans,
          explanation: chosen.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Reconocer Transformaciones'
        };
      } else if (fType === 2) {
        return {
          id: qId,
          prompt: `Si trasladas el punto (${x}, ${y}) exactamente ${dx} unidades hacia la derecha, ¿cuál es su nueva coordenada X?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (x + dx).toString(),
          explanation: `En la traslación hacia la derecha sumamos a X: ${x} + ${dx} = ${x + dx}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Traslación Simple'
        };
      } else {
        const g1 = randChoice([45, 90, 180]);
        const g2 = randChoice([45, 90]);
        return {
          id: qId,
          prompt: `Si una figura gira ${g1}° en sentido horario y luego otros ${g2}° en el mismo sentido, ¿cuántos grados rotó en total?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (g1 + g2).toString(),
          explanation: `${g1}° + ${g2}° = ${g1 + g2}°.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Giros Básicos'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        const nx = x + dx;
        let ny = y + dy;
        if (nx === ny) ny += 1;
        const ans = `(${nx}, ${ny})`;
        return {
          id: qId,
          prompt: `Si el vértice A está en (${x}, ${y}) y se le aplica el vector de traslación (${dx}, ${dy}), ¿cuál es la nueva ubicación A'?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, [`(${ny}, ${nx})`, `(${x - dx}, ${y - dy})`, `(${nx}, ${y})`, `(${x}, ${ny})`]),
          correctAnswer: ans,
          explanation: `A' = (${x} + ${dx}, ${y} + ${dy}) = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Vector de Traslación'
        };
      } else if (mType === 1) {
        const overX = Math.floor(v / 4) % 2 === 0;
        const rx = overX ? x : -x;
        const ry = overX ? -y : y;
        const ans = `(${rx}, ${ry})`;
        return {
          id: qId,
          prompt: `Al reflejar el punto (${x}, ${y}) respecto al eje ${overX ? 'X (horizontal)' : 'Y (vertical)'}, ¿cuáles son sus nuevas coordenadas?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, [`(${-rx}, ${-ry})`, `(${-x}, ${-y})`, `(${ry}, ${rx})`, `(${y}, ${x})`]),
          correctAnswer: ans,
          explanation: overX
            ? `Al reflejar respecto del eje X se mantiene X (${x}) y cambia el signo de Y (-${y}): ${ans}.`
            : `Al reflejar respecto del eje Y cambia el signo de X (-${x}) y se mantiene Y (${y}): ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Reflexión en Ejes'
        };
      } else if (mType === 2) {
        const defs = [
          { q: '¿Qué transformación isométrica traslada todos los puntos de una figura en una misma dirección y distancia sin rotarla ni deformarla?', a: 'Traslación', exp: 'El movimiento recto según un vector se llama traslación.' },
          { q: '¿Qué transformación isométrica hace girar una figura alrededor de un punto fijo llamado centro, según un ángulo determinado?', a: 'Rotación', exp: 'El giro alrededor de un centro en cierto ángulo se llama rotación.' },
          { q: '¿Qué transformación isométrica produce una imagen en espejo respecto a una recta llamada eje de simetría?', a: 'Reflexión', exp: 'El efecto espejo respecto de un eje se llama reflexión o simetría axial.' },
          { q: '¿Qué cualidad conservan SIEMPRE la traslación, la rotación y la reflexión?', a: 'Forma y tamaño', exp: 'Son isometrías: conservan las medidas de lados, ángulos, forma y tamaño.' }
        ];
        const chosen = defs[Math.floor(v / 4) % defs.length];
        return {
          id: qId,
          prompt: chosen.q,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(chosen.a, ['Traslación', 'Rotación', 'Reflexión', 'Homotecia', 'Solo el color', 'Solo el perímetro']),
          correctAnswer: chosen.a,
          explanation: chosen.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Conceptos de Isometría'
        };
      } else {
        const g1 = randChoice([30, 45, 60, 90, 120]);
        const g2 = randChoice([30, 45, 60, 90, 135]);
        return {
          id: qId,
          prompt: `Si una figura rota primero ${g1}° y luego ${g2}° más en sentido horario respecto al mismo centro, ¿cuál es el ángulo total de giro?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (g1 + g2).toString(),
          explanation: `Las rotaciones en igual sentido se suman: ${g1}° + ${g2}° = ${g1 + g2}°.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Composición de Rotaciones'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const g1 = randChoice([30, 45, 60, 90, 120]);
      const g2 = randChoice([45, 90, 135, 180]);
      const scenarios = [
        {
          prompt: `${name} diseñó el emblema escolar y rotó una figura en ${g1}° en sentido horario. Si luego la vuelve a rotar otros ${g2}° en el mismo sentido, ¿cuál es el giro total acumulado en grados?`,
          ans: (g1 + g2).toString(),
          exp: `${g1}° + ${g2}° = ${g1 + g2}° de rotación total.`
        },
        {
          prompt: `Para diseñar una baldosa, un triángulo con vértice en (${x}, ${y}) se traslada ${dx} cuadros a la derecha y luego otros ${dy} cuadros a la derecha. ¿Cuál es la coordenada X final de ese vértice?`,
          ans: (x + dx + dy).toString(),
          exp: `${x} + ${dx} + ${dy} = ${x + dx + dy}.`
        },
        {
          prompt: `Un polígono regular de ${randChoice([4, 5, 6, 8, 9, 10, 12])} lados gira exactamente sobre su centro hasta coincidir nuevamente consigo mismo por primera vez tras un giro menor a 360°. Si la suma completa es 360° y en un hexágono regular cada paso es 60°, ¿cuánto suman 2 giros consecutivos de 60° + ${g1}°?`,
          ans: (120 + g1).toString(),
          exp: `120° + ${g1}° = ${120 + g1}°.`
        },
        {
          prompt: `Un espejo divide una cuadrícula verticalmente en x = 0. Si ${name} coloca una marca en (${x}, ${y}), refleja al otro lado obteniendo (-${x}, ${y}). ¿Cuál es la distancia horizontal total entre ambas marcas?`,
          ans: (2 * x).toString(),
          exp: `Desde -${x} hasta +${x} hay ${x} + ${x} = ${2 * x} unidades.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans,
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 27. Teorema de Pitágoras (16 ternas pitagóricas + 4 arquetipos por nivel)
  teorema_pitagoras: (level, grade, oa, qId, variant) => {
    const triplets = [
      { a: 3, b: 4, c: 5 },
      { a: 6, b: 8, c: 10 },
      { a: 9, b: 12, c: 15 },
      { a: 12, b: 16, c: 20 },
      { a: 15, b: 20, c: 25 },
      { a: 18, b: 24, c: 30 },
      { a: 21, b: 28, c: 35 },
      { a: 24, b: 32, c: 40 },
      { a: 5, b: 12, c: 13 },
      { a: 10, b: 24, c: 26 },
      { a: 15, b: 36, c: 39 },
      { a: 20, b: 48, c: 52 },
      { a: 8, b: 15, c: 17 },
      { a: 16, b: 30, c: 34 },
      { a: 24, b: 45, c: 51 },
      { a: 7, b: 24, c: 25 },
      { a: 14, b: 48, c: 50 },
      { a: 9, b: 40, c: 41 },
      { a: 11, b: 60, c: 61 },
      { a: 12, b: 35, c: 37 },
      { a: 20, b: 21, c: 29 },
      { a: 28, b: 45, c: 53 },
      { a: 33, b: 56, c: 65 }
    ];
    const v = Math.abs(variant);
    const tri = triplets[Math.floor(v / 4) % triplets.length];

    if (level === 'facil') {
      const fType = v % 4;
      if (fType === 0) {
        return {
          id: qId,
          prompt: `En un triángulo rectángulo cuyos catetos miden ${tri.a} cm y ${tri.b} cm, ¿cuánto mide su hipotenusa c?`,
          context: `c² = ${tri.a}² + ${tri.b}²`,
          visualType: 'geometry_shape',
          visualData: { shape: 'triangulo_rectangulo', legA: tri.a, legB: tri.b, unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: tri.c.toString(),
          explanation: `c² = ${tri.a * tri.a} + ${tri.b * tri.b} = ${tri.c * tri.c}. Por lo tanto c = √${tri.c * tri.c} = ${tri.c} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Cálculo de Hipotenusa'
        };
      } else if (fType === 1) {
        const cSq = tri.c * tri.c;
        return {
          id: qId,
          prompt: `Los catetos de un triángulo rectángulo miden ${tri.a} cm y ${tri.b} cm. ¿Cuál es el valor de c² (la suma de los cuadrados de los catetos)?`,
          context: `${tri.a}² + ${tri.b}² = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: cSq.toString(),
          explanation: `${tri.a}² + ${tri.b}² = ${tri.a * tri.a} + ${tri.b * tri.b} = ${cSq}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Suma de Cuadrados'
        };
      } else if (fType === 2) {
        const correct = `${tri.a}, ${tri.b} y ${tri.c}`;
        return {
          id: qId,
          prompt: `¿Cuál de las siguientes ternas de medidas forma exactamente un triángulo RECTÁNGULO (cumple a² + b² = c²)?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(correct, [
            `${tri.a}, ${tri.b} y ${tri.c + 2}`,
            `${tri.a + 1}, ${tri.b} y ${tri.c}`,
            `${tri.a}, ${tri.b + 2} y ${tri.c}`,
            `${tri.a + 2}, ${tri.b + 2} y ${tri.c}`
          ]),
          correctAnswer: correct,
          explanation: `${tri.a}² + ${tri.b}² = ${tri.a * tri.a} + ${tri.b * tri.b} = ${tri.c * tri.c} = ${tri.c}².`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ternas Pitagóricas'
        };
      } else {
        const perim = tri.a + tri.b + tri.c;
        return {
          id: qId,
          prompt: `Un triángulo rectángulo tiene catetos de ${tri.a} cm y ${tri.b} cm. Calcula primero su hipotenusa y luego indica su PERÍMETRO total:`,
          visualType: 'geometry_shape',
          visualData: { shape: 'triangulo_rectangulo', legA: tri.a, legB: tri.b, unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: perim.toString(),
          explanation: `La hipotenusa mide ${tri.c} cm. Perímetro = ${tri.a} + ${tri.b} + ${tri.c} = ${perim} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Perímetro con Pitágoras'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 4;
      if (mType === 0) {
        return {
          id: qId,
          prompt: `En un triángulo rectángulo, la hipotenusa mide ${tri.c} m y uno de sus catetos mide ${tri.a} m. ¿Cuánto mide el otro cateto?`,
          context: `b² = ${tri.c}² - ${tri.a}²`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: tri.b.toString(),
          explanation: `b² = ${tri.c * tri.c} - ${tri.a * tri.a} = ${tri.b * tri.b}. Cateto = √${tri.b * tri.b} = ${tri.b} m.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Cálculo de Cateto'
        };
      } else if (mType === 1) {
        return {
          id: qId,
          prompt: `Si la hipotenusa mide ${tri.c} cm y un cateto mide ${tri.b} cm, ¿cuánto mide el cateto restante?`,
          context: `a² = ${tri.c}² - ${tri.b}²`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: tri.a.toString(),
          explanation: `a² = ${tri.c * tri.c} - ${tri.b * tri.b} = ${tri.a * tri.a}. Cateto = ${tri.a} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Cálculo de Cateto'
        };
      } else if (mType === 2) {
        const evenPair = triplets.filter(t => (t.a * t.b) % 2 === 0);
        const t = evenPair[Math.floor(v / 4) % evenPair.length];
        const area = (t.a * t.b) / 2;
        return {
          id: qId,
          prompt: `En un triángulo rectángulo, la hipotenusa mide ${t.c} cm y un cateto mide ${t.a} cm. Halla el otro cateto y calcula el ÁREA del triángulo en cm²:`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: area.toString(),
          explanation: `El otro cateto es ${t.b} cm (porque ${t.a}²+${t.b}²=${t.c}²). Área = (${t.a} × ${t.b}) ÷ 2 = ${area} cm².`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Área con Pitágoras'
        };
      } else {
        const perim = tri.a + tri.b + tri.c;
        return {
          id: qId,
          prompt: `Un triángulo rectángulo tiene hipotenusa de ${tri.c} m y un cateto de ${tri.a} m. ¿Cuál es su perímetro total en metros?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: perim.toString(),
          explanation: `El cateto faltante mide ${tri.b} m. Perímetro = ${tri.a} + ${tri.b} + ${tri.c} = ${perim} m.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Perímetro con Cateto Faltante'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const scenarios = [
        {
          prompt: `Una escalera de ${tri.c} metros de largo está apoyada contra una pared vertical de la escuela. Si la base de la escalera está separada a ${tri.a} metros de la pared, ¿a qué altura del suelo llega la parte superior?`,
          ans: tri.b,
          exp: `Altura² = ${tri.c}² - ${tri.a}² = ${tri.b * tri.b}. Altura = ${tri.b} metros.`
        },
        {
          prompt: `La cancha rectangular de la escuela mide ${tri.a} metros de ancho por ${tri.b} metros de largo. Si un estudiante cruza en línea recta por su diagonal, ¿cuántos metros recorre?`,
          ans: tri.c,
          exp: `Diagonal² = ${tri.a}² + ${tri.b}² = ${tri.c * tri.c}. Diagonal = ${tri.c} metros.`
        },
        {
          prompt: `Un mástil vertical de ${tri.b} metros de altura se afirma al suelo mediante un cable tenso anclado a ${tri.a} metros de su base. ¿Cuál es el largo del cable?`,
          ans: tri.c,
          exp: `Cable² = ${tri.a}² + ${tri.b}² = ${tri.c * tri.c}. Cable = ${tri.c} metros.`
        },
        {
          prompt: `${name} camina ${tri.a} km hacia el norte y luego ${tri.b} km hacia el este. ¿Cuál es la distancia en línea recta desde su punto de partida hasta su ubicación actual?`,
          ans: tri.c,
          exp: `d² = ${tri.a}² + ${tri.b}² = ${tri.c * tri.c} ➔ d = ${tri.c} km.`
        },
        {
          prompt: `Una rampa de acceso mide ${tri.c} metros de longitud inclinada y salva una altura vertical de ${tri.a} metros. ¿Cuántos metros mide su base horizontal sobre el suelo?`,
          ans: tri.b,
          exp: `Base² = ${tri.c}² - ${tri.a}² = ${tri.b * tri.b} ➔ Base = ${tri.b} metros.`
        },
        {
          prompt: `Una pantalla rectangular mide ${tri.a} pulgadas de alto y ${tri.b} pulgadas de ancho. ¿De cuántas pulgadas es su diagonal?`,
          ans: tri.c,
          exp: `Diagonal = √(${tri.a}² + ${tri.b}²) = ${tri.c} pulgadas.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 28. Tiempo, Calendario y Reloj
  tiempo_calendario_reloj: (level, grade, oa, qId, variant) => {
    const h = randInt(8, 16);
    const m = randChoice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
    const v = Math.abs(variant);
    const fmt = (hh: number, mm: number) => `${hh}:${mm < 10 ? '0' + mm : mm}`;

    if (level === 'facil') {
      const sub = v % 4;
      if (sub === 0) {
        const hrs = randInt(2, 10);
        return {
          id: qId,
          prompt: `¿A cuántos minutos equivalen exactamente ${hrs} horas completas?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (hrs * 60).toString(),
          explanation: `Cada hora tiene 60 minutos. ${hrs} × 60 = ${hrs * 60} minutos.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 1) {
        const mins = randInt(2, 9);
        return {
          id: qId,
          prompt: `Realiza la conversión: ¿cuántos segundos hay en ${mins} minutos completos?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (mins * 60).toString(),
          explanation: `1 minuto equivale a 60 segundos. ${mins} × 60 = ${mins * 60} segundos.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 2) {
        if (v % 8 < 4) {
          const sem = randInt(2, 9);
          return {
            id: qId,
            prompt: `¿Cuántos días completos hay en ${sem} semanas?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (sem * 7).toString(),
            explanation: `Cada semana tiene 7 días. ${sem} × 7 = ${sem * 7} días.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación Básica'
          };
        } else {
          const dias = randInt(2, 5);
          return {
            id: qId,
            prompt: `¿Cuántas horas hay en ${dias} días completos?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (dias * 24).toString(),
            explanation: `Cada día tiene 24 horas. ${dias} × 24 = ${dias * 24} horas.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación Básica'
          };
        }
      } else {
        const hrs = randInt(1, 4);
        const extraM = randChoice([10, 15, 20, 25, 30, 40, 45, 50]);
        const ans = hrs * 60 + extraM;
        return {
          id: qId,
          prompt: `Convierte a minutos la duración de ${hrs} hora${hrs > 1 ? 's' : ''} y ${extraM} minutos:`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ans.toString(),
          explanation: `${hrs} h = ${hrs * 60} min. Sumamos ${extraM} min = ${ans} minutos.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      }
    } else if (level === 'medio') {
      const sub = v % 4;
      if (sub === 0) {
        const durMin = randChoice([20, 25, 35, 40, 45, 50, 75]);
        const endM = (m + durMin) % 60;
        const endH = h + Math.floor((m + durMin) / 60);
        const ans = fmt(endH, endM);
        const cands = [
          fmt(endH + 1, endM),
          fmt(endH, (endM + 10) % 60),
          fmt(endH - 1, endM),
          fmt(h, (m + 15) % 60),
        ];
        return {
          id: qId,
          prompt: `Un taller escolar comenzó a las ${fmt(h, m)} y duró ${durMin} minutos. ¿A qué hora terminó?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, cands, ['10:00', '12:30', '14:15', '16:45']),
          correctAnswer: ans,
          explanation: `A partir de las ${fmt(h, m)}, sumando ${durMin} minutos termina a las ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 1) {
        const h1 = randInt(8, 13);
        const m1 = randChoice([0, 10, 15, 20, 30, 45]);
        const diff = randChoice([35, 45, 55, 65, 75, 85, 95, 110]);
        const endTotal = h1 * 60 + m1 + diff;
        const h2 = Math.floor(endTotal / 60);
        const m2 = endTotal % 60;
        return {
          id: qId,
          prompt: `Una clase de educación física comenzó a las ${fmt(h1, m1)} y finalizó a las ${fmt(h2, m2)}. ¿Cuántos minutos duró la clase?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: diff.toString(),
          explanation: `Desde las ${fmt(h1, m1)} hasta las ${fmt(h2, m2)} transcurren exactamente ${diff} minutos.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 2) {
        const hrs = randInt(1, 3);
        const mins = randChoice([15, 20, 25, 30, 40, 45, 50]);
        const totalM = hrs * 60 + mins;
        const ans = `${hrs} h y ${mins} min`;
        const cands = [
          `${hrs + 1} h y ${mins} min`,
          `${hrs} h y ${mins === 30 ? 45 : 30} min`,
          `${Math.max(1, hrs - 1)} h y ${mins + 5} min`,
          `${hrs + 2} h y ${mins} min`,
        ];
        return {
          id: qId,
          prompt: `Una película infantil dura ${totalM} minutos en total. ¿Cómo se expresa esa duración en horas y minutos?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, cands),
          correctAnswer: ans,
          explanation: `${totalM} min = ${hrs * 60} min (${hrs} h) + ${mins} min = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const startDay = randInt(4, 18);
        const waitDays = randInt(5, 12);
        const mes = randChoice(['abril', 'mayo', 'agosto', 'octubre', 'noviembre']);
        return {
          id: qId,
          prompt: `Si hoy es ${startDay} de ${mes} y faltan exactamente ${waitDays} días para la feria científica escolar, ¿qué día de ${mes} se realizará la feria?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (startDay + waitDays).toString(),
          explanation: `Sumamos los días: ${startDay} + ${waitDays} = ${startDay + waitDays} de ${mes}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const ida = randInt(25, 48);
      const vuelta = randInt(30, 55);
      const semanas = randInt(3, 7);
      const diasExtra = randInt(2, 6);
      const diasLectura = randInt(3, 6);
      const minDia = randChoice([15, 20, 25, 30, 35]);
      const startH = randInt(9, 14);
      const startM = randChoice([10, 15, 20, 30, 45]);
      const part1 = randChoice([35, 40, 45]);
      const breakM = randChoice([10, 15]);
      const part2 = randChoice([30, 35, 40]);
      const totalActo = part1 + breakM + part2;
      const endTotalM = startH * 60 + startM + totalActo;
      const endActo = fmt(Math.floor(endTotalM / 60), endTotalM % 60);
      const scenarios = [
        {
          prompt: `${name} viajó en bus desde Arica hasta el Valle de Azapa. El viaje de ida duró ${ida} minutos y el de vuelta duró ${vuelta} minutos. ¿Cuántos minutos en total estuvo viajando en el bus?`,
          type: 'numeric' as const,
          ans: (ida + vuelta).toString(),
          exp: `${ida} min + ${vuelta} min = ${ida + vuelta} minutos en total.`
        },
        {
          prompt: `Un proyecto de ciencias escolares dura ${semanas} semanas y ${diasExtra} días adicionales. ¿Cuántos días dura el proyecto en total?`,
          type: 'numeric' as const,
          ans: (semanas * 7 + diasExtra).toString(),
          exp: `${semanas} semanas × 7 días = ${semanas * 7} días. Más ${diasExtra} días = ${semanas * 7 + diasExtra} días.`
        },
        {
          prompt: `${name} leyó durante ${diasLectura} días seguidos, dedicando ${minDia} minutos cada día a su libro favorito. ¿Cuántos minutos leyó en total?`,
          type: 'numeric' as const,
          ans: (diasLectura * minDia).toString(),
          exp: `${diasLectura} días × ${minDia} minutos = ${diasLectura * minDia} minutos.`
        },
        {
          prompt: `El acto cívico comenzó a las ${fmt(startH, startM)}. Tuvo una primera parte de ${part1} min, un intermedio de ${breakM} min y un cierre de ${part2} min. ¿A qué hora terminó?`,
          type: 'multiple_choice' as const,
          ans: endActo,
          opts: uniqueMcOptions(endActo, [
            fmt(Math.floor((endTotalM + 15) / 60), (endTotalM + 15) % 60),
            fmt(Math.floor((endTotalM - 15) / 60), (endTotalM - 15) % 60),
            fmt(Math.floor((endTotalM + 30) / 60), (endTotalM + 30) % 60),
          ]),
          exp: `Duración total = ${part1} + ${breakM} + ${part2} = ${totalActo} min. Desde ${fmt(startH, startM)} llega a las ${endActo}.`
        },
        {
          prompt: `${name} entrena atletismo ${diasLectura} días por semana durante ${semanas} semanas, ${minDia} minutos cada sesión. ¿Cuántos minutos entrena en total?`,
          type: 'numeric' as const,
          ans: (diasLectura * semanas * minDia).toString(),
          exp: `Sesiones totales: ${diasLectura} × ${semanas} = ${diasLectura * semanas}. Por ${minDia} min = ${diasLectura * semanas * minDia} min.`
        },
        {
          prompt: `Un recorrido turístico sale a las ${fmt(startH, startM)} y llega a destino a las ${endActo}. ¿Cuántos minutos en total dura el recorrido?`,
          type: 'numeric' as const,
          ans: totalActo.toString(),
          exp: `De ${fmt(startH, startM)} a ${endActo} transcurren ${totalActo} minutos.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: chosen.type,
        ...(chosen.type === 'multiple_choice' ? { options: (chosen as { opts: string[] }).opts } : {}),
        correctAnswer: chosen.ans,
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 29. Longitud y Distancia
  longitud_distancia: (level, grade, oa, qId, variant) => {
    const meters = randInt(2, 24);
    const cm = meters * 100;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const sub = v % 4;
      if (sub === 0) {
        return {
          id: qId,
          prompt: `Realiza la conversión métrica: ¿a cuántos centímetros (cm) equivalen ${meters} metros (m)?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: cm.toString(),
          explanation: `1 metro equivale a 100 centímetros. Por lo tanto, ${meters} m × 100 = ${cm} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 1) {
        const km = randInt(2, 15);
        return {
          id: qId,
          prompt: `¿A cuántos metros (m) equivalen exactamente ${km} kilómetros (km)?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (km * 1000).toString(),
          explanation: `1 kilómetro equivale a 1.000 metros. ${km} × 1.000 = ${km * 1000} m.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 2) {
        const c = randInt(3, 45);
        return {
          id: qId,
          prompt: `Convierte ${c} centímetros (cm) a milímetros (mm):`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (c * 10).toString(),
          explanation: `Cada centímetro tiene 10 milímetros. ${c} × 10 = ${c * 10} mm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else {
        const exactM = randInt(2, 18);
        const totalCm = exactM * 100;
        return {
          id: qId,
          prompt: `¿A cuántos metros (m) equivalen ${totalCm.toLocaleString('es-CL')} centímetros (cm)?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: exactM.toString(),
          explanation: `Dividimos por 100: ${totalCm} ÷ 100 = ${exactM} metros.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      }
    } else if (level === 'medio') {
      const sub = v % 4;
      if (sub === 0) {
        const km = randInt(2, 9);
        const extraM = randChoice([150, 250, 340, 400, 550, 700, 820]);
        const totalM = km * 1000 + extraM;
        return {
          id: qId,
          prompt: `Convierte a metros la distancia de ${km} kilómetros y ${extraM} metros:`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: totalM.toString(),
          explanation: `${km} km = ${km * 1000} m. Sumando ${extraM} m da ${totalM} metros.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 1) {
        const mPart = randInt(2, 12);
        const cmPart = randInt(15, 95);
        const totalCm = mPart * 100 + cmPart;
        return {
          id: qId,
          prompt: `Expresa en centímetros la medida de ${mPart} metros y ${cmPart} centímetros:`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: totalCm.toString(),
          explanation: `${mPart} m = ${mPart * 100} cm. Sumamos ${cmPart} cm = ${totalCm} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 2) {
        const baseM = randInt(2, 8);
        const ans = `${baseM + 1} m`;
        const cands = [
          `${baseM * 100 + 25} cm`,
          `${baseM * 1000 - 100} mm`,
          `${baseM} m y 40 cm`,
        ];
        return {
          id: qId,
          prompt: `¿Cuál de las siguientes medidas de longitud es la MAYOR?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, cands),
          correctAnswer: ans,
          explanation: `${ans} equivale a ${(baseM + 1) * 100} cm, superando a todas las demás opciones.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const tablaM = randInt(2, 6);
        const corteCm = randInt(35, 165);
        const queda = tablaM * 100 - corteCm;
        return {
          id: qId,
          prompt: `A un listón de madera de ${tablaM} metros de largo se le cortan ${corteCm} centímetros. ¿Cuántos centímetros de listón quedan?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: queda.toString(),
          explanation: `${tablaM} m = ${tablaM * 100} cm. Restamos ${corteCm} cm: ${tablaM * 100} − ${corteCm} = ${queda} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const d1 = randInt(450, 980);
      const d2 = randInt(220, 560);
      const d3 = randInt(150, 380);
      const cintaM = randInt(3, 7);
      const corteCm = randInt(45, 185);
      const vueltas = randInt(3, 6);
      const pista = randChoice([200, 250, 300, 400]);
      const metaKm = randInt(3, 6);
      const avKm = randInt(1, metaKm - 1);
      const avM = randChoice([250, 400, 500, 750]);
      const parts = randChoice([4, 5, 8, 10]);
      const rolloM = randChoice([2, 4, 6, 8]);
      const scenarios = [
        {
          prompt: `En la clase de educación física de la escuela, ${name} corrió ${d1} metros y luego caminó otros ${d2} metros para enfriar. ¿Cuántos metros recorrió en total?`,
          ans: d1 + d2,
          exp: `${d1} m + ${d2} m = ${d1 + d2} metros.`
        },
        {
          prompt: `${name} tenía una cuerda de ${cintaM} metros de largo para un circuito y cortó ${corteCm} cm. ¿Cuántos centímetros de cuerda quedaron?`,
          ans: cintaM * 100 - corteCm,
          exp: `${cintaM} m = ${cintaM * 100} cm. Restamos ${corteCm} cm = ${cintaM * 100 - corteCm} cm.`
        },
        {
          prompt: `Un atleta da ${vueltas} vueltas alrededor de una pista que mide ${pista} metros por vuelta. ¿Cuántos metros corre en total?`,
          ans: pista * vueltas,
          exp: `${vueltas} × ${pista} m = ${pista * vueltas} metros.`
        },
        {
          prompt: `La meta de una cicletada familiar en Arica es recorrer ${metaKm} km. Si ${name} ya avanzó ${avKm} km y ${avM} m, ¿cuántos metros le faltan para llegar a la meta?`,
          ans: metaKm * 1000 - (avKm * 1000 + avM),
          exp: `Meta: ${metaKm * 1000} m. Avanzado: ${avKm * 1000 + avM} m. Faltan ${metaKm * 1000 - (avKm * 1000 + avM)} metros.`
        },
        {
          prompt: `En una caminata por el Valle de Azapa se recorrieron tres tramos: ${d1} m, ${d2} m y ${d3} m. ¿Cuál fue la distancia total recorrida en metros?`,
          ans: d1 + d2 + d3,
          exp: `${d1} + ${d2} + ${d3} = ${d1 + d2 + d3} metros.`
        },
        {
          prompt: `${name} corta un rollo de cinta de ${rolloM} metros en ${parts} trozos exactamente iguales. ¿Cuántos centímetros mide cada trozo?`,
          ans: (rolloM * 100) / parts,
          exp: `${rolloM} m = ${rolloM * 100} cm. Dividido en ${parts} trozos = ${(rolloM * 100) / parts} cm cada uno.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 30. Perímetro
  perimetro: (level, grade, oa, qId, variant) => {
    const a = randInt(5, 19);
    const b = randInt(3, Math.min(a - 1, 13));
    const perimRec = 2 * (a + b);
    const v = Math.abs(variant);

    if (level === 'facil') {
      const sub = v % 4;
      if (sub === 0) {
        return {
          id: qId,
          prompt: `Calcula el PERÍMETRO de un rectángulo que mide ${a} cm de largo y ${b} cm de ancho:`,
          context: `P = 2 × (${a} + ${b})`,
          visualType: 'geometry_shape',
          visualData: { shape: 'rectangulo', width: a, height: b, unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: perimRec.toString(),
          explanation: `El perímetro es la suma de todos los lados: ${a} + ${b} + ${a} + ${b} = ${perimRec} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 1) {
        const lado = randInt(4, 18);
        return {
          id: qId,
          prompt: `Calcula el PERÍMETRO de un cuadrado cuyo lado mide ${lado} cm:`,
          visualType: 'geometry_shape',
          visualData: { shape: 'cuadrado', width: lado, height: lado, unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: (lado * 4).toString(),
          explanation: `Los 4 lados del cuadrado son iguales: 4 × ${lado} = ${lado * 4} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 2) {
        const l1 = randInt(5, 14);
        const l2 = randInt(6, 15);
        const l3 = randInt(7, 16);
        return {
          id: qId,
          prompt: `Un triángulo tiene lados que miden ${l1} cm, ${l2} cm y ${l3} cm. ¿Cuál es su perímetro en cm?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (l1 + l2 + l3).toString(),
          explanation: `Sumamos los tres lados: ${l1} + ${l2} + ${l3} = ${l1 + l2 + l3} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else {
        const lados = randChoice([5, 6, 8]);
        const nombres: Record<number, string> = { 5: 'pentágono regular', 6: 'hexágono regular', 8: 'octágono regular' };
        const medida = randInt(3, 12);
        return {
          id: qId,
          prompt: `¿Cuál es el perímetro de un ${nombres[lados]} (${lados} lados iguales) si cada lado mide ${medida} cm?`,
          visualType: lados === 5 ? 'geometry_shape' : 'none',
          visualData: lados === 5 ? { shape: 'pentagono' } : undefined,
          questionType: 'numeric',
          correctAnswer: (lados * medida).toString(),
          explanation: `Como todos los lados son iguales: ${lados} × ${medida} = ${lados * medida} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      }
    } else if (level === 'medio') {
      const sub = v % 4;
      if (sub === 0) {
        const lado = randInt(6, 22);
        const perimCuad = lado * 4;
        return {
          id: qId,
          prompt: `Si el perímetro total de un terreno cuadrado es ${perimCuad} metros, ¿cuánto mide cada uno de sus 4 lados?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: lado.toString(),
          explanation: `Como el cuadrado tiene 4 lados iguales: ${perimCuad} ÷ 4 = ${lado} metros por lado.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 1) {
        return {
          id: qId,
          prompt: `Un rectángulo tiene un perímetro total de ${perimRec} cm y su largo mide ${a} cm. ¿Cuántos centímetros mide su ancho?`,
          visualType: 'geometry_shape',
          visualData: { shape: 'rectangulo', width: a, height: '?', unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: b.toString(),
          explanation: `La suma de un largo y un ancho es la mitad del perímetro: ${perimRec / 2}. Ancho = ${perimRec / 2} − ${a} = ${b} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 2) {
        const lados = randChoice([5, 6, 8]);
        const medida = randInt(4, 15);
        const perim = lados * medida;
        return {
          id: qId,
          prompt: `Un polígono regular de ${lados} lados iguales tiene un perímetro de ${perim} cm. ¿Cuánto mide cada lado?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: medida.toString(),
          explanation: `Dividimos el perímetro por la cantidad de lados: ${perim} ÷ ${lados} = ${medida} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const ladoCuad = randInt(5, 14);
        const pCuad = ladoCuad * 4;
        const diff = Math.abs(perimRec - pCuad);
        return {
          id: qId,
          prompt: `Un rectángulo mide ${a} cm × ${b} cm y un cuadrado tiene ${ladoCuad} cm de lado. ¿Cuál es la diferencia positiva entre sus perímetros (en cm)?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: diff.toString(),
          explanation: `Perímetro rectángulo = ${perimRec} cm; cuadrado = ${pCuad} cm. Diferencia = |${perimRec} − ${pCuad}| = ${diff} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const ladoTri = randInt(6, 18);
      const ladoCuad = randInt(5, 16);
      const vueltas = randInt(2, 5);
      const ladoHex = randInt(4, 12);
      const scenarios = [
        {
          prompt: `La escuela desea colocar una reja alrededor de una zona rectangular de ${a} m de largo por ${b} m de ancho. ¿Cuántos metros de reja se deben comprar?`,
          ans: perimRec,
          exp: `Se calcula el perímetro del rectángulo: 2 × (${a} + ${b}) = ${perimRec} metros.`
        },
        {
          prompt: `Un huerto escolar con forma de triángulo equilátero tiene lados de ${ladoTri} metros cada uno. ¿Cuántos metros de malla se necesitan para rodearlo por completo?`,
          ans: ladoTri * 3,
          exp: `Perímetro del triángulo equilátero = 3 × ${ladoTri} m = ${ladoTri * 3} metros.`
        },
        {
          prompt: `Para decorar el marco de un diario mural cuadrado de ${ladoCuad * 10} cm por lado, ¿cuántos centímetros de cinta tricolor se requieren para rodear los 4 bordes?`,
          ans: ladoCuad * 40,
          exp: `Perímetro = 4 × ${ladoCuad * 10} cm = ${ladoCuad * 40} cm.`
        },
        {
          prompt: `Un estudiante corre ${vueltas} vueltas completas alrededor de una multicancha rectangular de ${a} m de largo y ${b} m de ancho. ¿Cuántos metros recorre en total?`,
          ans: perimRec * vueltas,
          exp: `Una vuelta mide ${perimRec} m. En ${vueltas} vueltas: ${perimRec} × ${vueltas} = ${perimRec * vueltas} m.`
        },
        {
          prompt: `Un jardín hexagonal regular tiene 6 lados iguales de ${ladoHex} metros cada uno. Si se instala una solera por todo el contorno, ¿cuántos metros de solera se usan?`,
          ans: ladoHex * 6,
          exp: `Perímetro = 6 × ${ladoHex} m = ${ladoHex * 6} metros.`
        },
        {
          prompt: `¿Cuántos centímetros de cinta se necesitan para bordear DOS cuadros rectangulares iguales de ${a} cm de largo y ${b} cm de ancho?`,
          ans: perimRec * 2,
          exp: `Cada cuadro tiene perímetro ${perimRec} cm. Dos cuadros requieren 2 × ${perimRec} = ${perimRec * 2} cm.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 31. Área
  area: (level, grade, oa, qId, variant) => {
    const base = randInt(4, 16);
    const altura = randInt(3, 11);
    const areaRec = base * altura;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const sub = v % 4;
      if (sub === 0) {
        return {
          id: qId,
          prompt: `Calcula el ÁREA de un rectángulo de base ${base} cm y altura ${altura} cm:`,
          context: `Área = ${base} × ${altura}`,
          visualType: 'geometry_shape',
          visualData: { shape: 'rectangulo', width: base, height: altura, unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: areaRec.toString(),
          explanation: `Área = base × altura = ${base} × ${altura} = ${areaRec} cm².`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 1) {
        const lado = randInt(3, 14);
        return {
          id: qId,
          prompt: `Calcula el ÁREA de un cuadrado cuyos lados miden ${lado} cm:`,
          visualType: 'geometry_shape',
          visualData: { shape: 'cuadrado', width: lado, height: lado, unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: (lado * lado).toString(),
          explanation: `Área del cuadrado = ${lado} × ${lado} = ${lado * lado} cm².`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 2) {
        const evenB = randInt(2, 8) * 2;
        const h = randInt(3, 9);
        const areaT = (evenB * h) / 2;
        return {
          id: qId,
          prompt: `Calcula el área de un triángulo cuya base mide ${evenB} cm y su altura mide ${h} cm:`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: areaT.toString(),
          explanation: `Área del triángulo = (${evenB} × ${h}) ÷ 2 = ${areaT} cm².`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else {
        const s = randInt(4, 9);
        const ans = `Cuadrado de ${s + 2} cm de lado`;
        const cands = [
          `Rectángulo de ${s} cm × ${s - 1} cm`,
          `Rectángulo de ${s + 3} cm × ${s - 2} cm`,
          `Cuadrado de ${s} cm de lado`,
        ];
        return {
          id: qId,
          prompt: `¿Cuál de las siguientes figuras tiene la MAYOR área?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, cands),
          correctAnswer: ans,
          explanation: `El cuadrado de ${s + 2} cm de lado tiene ${(s + 2) ** 2} cm², mayor que las demás opciones.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      }
    } else if (level === 'medio') {
      const sub = v % 4;
      if (sub === 0) {
        const evenBase = base % 2 === 0 ? base : base + 1;
        const areaTri = (evenBase * altura) / 2;
        return {
          id: qId,
          prompt: `Calcula el área de un triángulo con base de ${evenBase} cm y altura de ${altura} cm:`,
          context: `Área = (${evenBase} × ${altura}) ÷ 2`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: areaTri.toString(),
          explanation: `Área del triángulo = (${evenBase} × ${altura}) ÷ 2 = ${evenBase * altura} ÷ 2 = ${areaTri} cm².`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 1) {
        return {
          id: qId,
          prompt: `Un paralelogramo (romboide) tiene una base de ${base} cm y una altura de ${altura} cm. ¿Cuál es su área en cm²?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: areaRec.toString(),
          explanation: `El área del paralelogramo se calcula base × altura: ${base} × ${altura} = ${areaRec} cm².`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 2) {
        return {
          id: qId,
          prompt: `Un rectángulo tiene un área total de ${areaRec} cm² y su base mide ${base} cm. ¿Cuántos centímetros mide su altura?`,
          visualType: 'geometry_shape',
          visualData: { shape: 'rectangulo', width: base, height: '?', unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: altura.toString(),
          explanation: `Dividimos el área por la base: ${areaRec} ÷ ${base} = ${altura} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const lado = randInt(4, 15);
        return {
          id: qId,
          prompt: `Un afiche cuadrado cubre una superficie de ${lado * lado} cm². ¿Cuántos centímetros mide cada lado del afiche?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: lado.toString(),
          explanation: `Buscamos un número que multiplicado por sí mismo dé ${lado * lado}: ${lado} × ${lado} = ${lado * lado}, luego el lado mide ${lado} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const ladoCuad = randInt(5, 14);
      const evenBase = base % 2 === 0 ? base : base + 1;
      const precioM2 = randChoice([1000, 1500, 2000]);
      const innerSq = randInt(2, Math.min(base, altura) - 1);
      const scenarios = [
        {
          prompt: `En la sala de clases se instalarán baldosas en un piso rectangular de ${base} m de largo y ${altura} m de ancho. ¿Cuál es el área total en m² que se cubrirá?`,
          ans: areaRec,
          exp: `Largo × ancho = ${base} m × ${altura} m = ${areaRec} m².`
        },
        {
          prompt: `Una plaza vecinal cuadrada en Arica mide ${ladoCuad} metros por cada lado. ¿Cuántos metros cuadrados de pasto se necesitan para cubrir toda su superficie?`,
          ans: ladoCuad * ladoCuad,
          exp: `Área del cuadrado = ${ladoCuad} × ${ladoCuad} = ${ladoCuad * ladoCuad} m².`
        },
        {
          prompt: `Un banderín triangular para el aniversario escolar tiene una base de ${evenBase} cm y una altura de ${altura} cm. ¿Cuál es su área en cm²?`,
          ans: (evenBase * altura) / 2,
          exp: `(${evenBase} × ${altura}) ÷ 2 = ${(evenBase * altura) / 2} cm².`
        },
        {
          prompt: `Un mural rectangular mide ${base} m de largo por ${altura} m de alto. Si pintarlo cuesta ${formatCLP(precioM2)} por cada m², ¿cuánto cuesta pintar todo el mural?`,
          ans: areaRec * precioM2,
          exp: `Área = ${areaRec} m². Costo = ${areaRec} × ${formatCLP(precioM2)} = ${formatCLP(areaRec * precioM2)}.`
        },
        {
          prompt: `En un patio rectangular de ${base} m × ${altura} m hay una jardinera cuadrada central de ${innerSq} m de lado. ¿Cuántos m² quedan libres para caminar?`,
          ans: areaRec - innerSq * innerSq,
          exp: `Área patio = ${areaRec} m²; jardinera = ${innerSq * innerSq} m². Libres = ${areaRec - innerSq * innerSq} m².`
        },
        {
          prompt: `¿Cuántos cm² más tiene un rectángulo de ${base} cm × ${altura} cm que un triángulo de base ${evenBase} cm y altura ${altura} cm?`,
          ans: Math.abs(areaRec - (evenBase * altura) / 2),
          exp: `Área rectángulo = ${areaRec} cm²; área triángulo = ${(evenBase * altura) / 2} cm². Diferencia = ${Math.abs(areaRec - (evenBase * altura) / 2)} cm².`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 32. Volumen, Capacidad y Masa
  volumen_capacidad_masa: (level, grade, oa, qId, variant) => {
    const l = randInt(3, 8);
    const w = randInt(2, 6);
    const h = randInt(2, 5);
    const vol = l * w * h;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const sub = v % 4;
      if (sub === 0) {
        const kg = randInt(2, 12);
        return {
          id: qId,
          prompt: `¿A cuántos gramos (g) equivalen ${kg} kilogramos (kg)?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (kg * 1000).toString(),
          explanation: `1 kg = 1.000 g. ${kg} kg × 1.000 = ${kg * 1000} gramos.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 1) {
        const litros = randInt(2, 12);
        return {
          id: qId,
          prompt: `¿A cuántos mililitros (mL) equivalen ${litros} litros (L) de jugo?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (litros * 1000).toString(),
          explanation: `1 litro equivale a 1.000 mililitros. ${litros} × 1.000 = ${litros * 1000} mL.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 2) {
        const exactKg = randInt(2, 9);
        return {
          id: qId,
          prompt: `Una bolsa de arroz marca ${(exactKg * 1000).toLocaleString('es-CL')} gramos en la balanza. ¿A cuántos kilogramos (kg) equivale?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: exactKg.toString(),
          explanation: `${exactKg * 1000} g ÷ 1.000 = ${exactKg} kg.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else {
        const a = randInt(2, 6);
        return {
          id: qId,
          prompt: `Calcula el volumen (en cm³) de un cubo cuya arista mide ${a} cm:`,
          visualType: 'cube_prism',
          visualData: { kind: 'prism', length: a, width: a, height: a, unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: (a ** 3).toString(),
          explanation: `Volumen del cubo = ${a} × ${a} × ${a} = ${a ** 3} cm³.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      }
    } else if (level === 'medio') {
      const sub = v % 4;
      if (sub === 0) {
        return {
          id: qId,
          prompt: `Calcula el volumen de un prisma recto con dimensiones ${l} cm de largo, ${w} cm de ancho y ${h} cm de alto:`,
          context: `V = ${l} × ${w} × ${h}`,
          visualType: 'cube_prism',
          visualData: { kind: 'prism', length: l, width: w, height: h, unit: 'cm' },
          questionType: 'numeric',
          correctAnswer: vol.toString(),
          explanation: `Volumen = largo × ancho × alto = ${l} × ${w} × ${h} = ${vol} cm³.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 1) {
        return {
          id: qId,
          prompt: `Un prisma rectangular tiene un volumen de ${vol} cm³. Si su largo mide ${l} cm y su ancho mide ${w} cm, ¿cuántos centímetros mide su altura?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: h.toString(),
          explanation: `Área de la base = ${l} × ${w} = ${l * w} cm². Altura = ${vol} ÷ ${l * w} = ${h} cm.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 2) {
        const kg = randInt(2, 7);
        const extraG = randChoice([150, 250, 350, 480, 620, 750]);
        return {
          id: qId,
          prompt: `¿Cuántos gramos en total pesa una encomienda de ${kg} kg y ${extraG} gramos?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (kg * 1000 + extraG).toString(),
          explanation: `${kg} kg = ${kg * 1000} g. Sumando ${extraG} g resulta ${kg * 1000 + extraG} g.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const litros = randInt(2, 6);
        const vaso = randChoice([200, 250, 500]);
        return {
          id: qId,
          prompt: `¿Cuántos vasos de ${vaso} mL se pueden llenar completamente con un jarro de ${litros} litros?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ((litros * 1000) / vaso).toString(),
          explanation: `${litros} L = ${litros * 1000} mL. Dividimos: ${litros * 1000} ÷ ${vaso} = ${(litros * 1000) / vaso} vasos.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const litros = randInt(2, 6);
      const bebido = randChoice([350, 500, 650, 750, 850]);
      const kgHarina = randInt(3, 7);
      const usadoG = randChoice([400, 650, 750, 800, 950]);
      const cajas = randInt(2, 5);
      const paqG = randChoice([250, 500]);
      const cantPaq = paqG === 250 ? randChoice([4, 8, 12, 16]) : randChoice([4, 6, 8, 10]);
      const scenarios = [
        {
          prompt: `${name} tiene un bidón con ${litros} litros de agua para el taller deportivo. Si ya repartió ${bebido} mL, ¿cuántos mililitros de agua quedan?`,
          vis: 'none' as const,
          ans: litros * 1000 - bebido,
          exp: `${litros} L = ${litros * 1000} mL. Restamos ${bebido} mL: quedan ${litros * 1000 - bebido} mL.`
        },
        {
          prompt: `Una caja de acrílico para maqueta mide ${l * 10} cm de largo, ${w * 10} cm de ancho y ${h} cm de alto. ¿Cuál es su volumen en cm³?`,
          vis: 'cube_prism' as const,
          vd: { kind: 'prism', length: l * 10, width: w * 10, height: h, unit: 'cm' },
          ans: l * 10 * w * 10 * h,
          exp: `${l * 10} × ${w * 10} × ${h} = ${l * 10 * w * 10 * h} cm³.`
        },
        {
          prompt: `En el taller de gastronomía tenían ${kgHarina} kg de azúcar y ocuparon ${usadoG} gramos en un postre. ¿Cuántos gramos de azúcar quedaron?`,
          vis: 'none' as const,
          ans: kgHarina * 1000 - usadoG,
          exp: `${kgHarina} kg = ${kgHarina * 1000} g. Restamos ${usadoG} g: ${kgHarina * 1000 - usadoG} g.`
        },
        {
          prompt: `${name} apila ${cajas} cajas iguales con forma de prisma de ${l} cm de largo, ${w} cm de ancho y ${h} cm de alto. ¿Qué volumen total ocupan en cm³?`,
          vis: 'none' as const,
          ans: vol * cajas,
          exp: `Una caja mide ${l} × ${w} × ${h} = ${vol} cm³. Las ${cajas} cajas ocupan ${vol} × ${cajas} = ${vol * cajas} cm³.`
        },
        {
          prompt: `Para la colación solidaria se juntaron ${cantPaq} paquetes de fideos de ${paqG} gramos cada uno. ¿Cuántos KILOGRAMOS en total se reunieron?`,
          vis: 'none' as const,
          ans: (cantPaq * paqG) / 1000,
          exp: `${cantPaq} × ${paqG} g = ${cantPaq * paqG} g. Dividido por 1.000 = ${(cantPaq * paqG) / 1000} kg.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: chosen.vis,
        ...(chosen.vd ? { visualData: chosen.vd } : {}),
        questionType: 'numeric',
        correctAnswer: chosen.ans.toString(),
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 33. Tablas, Gráficos y Pictogramas (con gráficos visuales reales)
  tablas_graficos_pictogramas: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);

    const THEMES = [
      { title: 'Deportes Favoritos', unit: 'votos', cats: ['Fútbol', 'Básquetbol', 'Vóleibol', 'Atletismo'], noun: 'estudiantes', context: 'una encuesta deportiva escolar' },
      { title: 'Talleres Artísticos', unit: 'est.', cats: ['Música', 'Pintura', 'Teatro', 'Danza'], noun: 'estudiantes', context: 'la inscripción de talleres artísticos' },
      { title: 'Colaciones Saludables', unit: 'pref.', cats: ['Fruta', 'Yogurt', 'Sándwich', 'Frutos secos'], noun: 'estudiantes', context: 'las preferencias de colación' },
      { title: 'Transporte Escolar', unit: 'est.', cats: ['Caminando', 'Furgón', 'Micro', 'Bicicleta'], noun: 'estudiantes', context: 'cómo llegan al colegio' },
      { title: 'Lectura Mensual', unit: 'lectores', cats: ['Cómics', 'Aventuras', 'Ciencia', 'Poesía'], noun: 'lectores', context: 'los géneros más leídos en biblioteca' },
      { title: 'Instrumentos Musicales', unit: 'est.', cats: ['Guitarra', 'Flauta', 'Teclado', 'Percusión'], noun: 'estudiantes', context: 'los instrumentos del taller de música' },
      { title: 'Estaciones Favoritas', unit: 'votos', cats: ['Verano', 'Otoño', 'Invierno', 'Primavera'], noun: 'estudiantes', context: 'la estación del año preferida' },
      { title: 'Mascotas del Curso', unit: 'hogares', cats: ['Perro', 'Gato', 'Hámster', 'Pez'], noun: 'familias', context: 'las mascotas en casa' },
      { title: 'Juegos de Recreo', unit: 'votos', cats: ['Cuerda', 'Pinta', 'Ludo', 'Taca-taca'], noun: 'estudiantes', context: 'los juegos favoritos en recreo' },
      { title: 'Frutas de Azapa', unit: 'cajas', cats: ['Naranja', 'Tomate', 'Mango', 'Guayaba'], noun: 'personas', context: 'los productos preferidos en Arica' },
      { title: 'Clubes de Ciencia', unit: 'inscritos', cats: ['Robótica', 'Astronomía', 'Botánica', 'Química'], noun: 'estudiantes', context: 'los clubes científicos de la escuela' },
      { title: 'Reciclaje por Curso', unit: 'kg', cats: ['Cartón', 'Plástico', 'Vidrio', 'Latas'], noun: 'cursos', context: 'la campaña de reciclaje escolar' },
      { title: 'Sabores de Jugo', unit: 'vasos', cats: ['Piña', 'Frutilla', 'Durazno', 'Limón'], noun: 'estudiantes', context: 'los jugos naturales del quiosco' },
      { title: 'Áreas de Estudio', unit: 'votos', cats: ['Matemática', 'Historia', 'Ciencias', 'Lenguaje'], noun: 'estudiantes', context: 'las asignaturas favoritas' },
    ];
    const theme = THEMES[v % THEMES.length];

    // ------------------------------------------------------------------
    // Rama especializada para 6° Básico OA 24:
    // "Gráficos de barra doble y gráficos circulares"
    // ------------------------------------------------------------------
    if (grade === '6_basico' && oa.code === 'OA 24') {
      const seriesPairs = [
        ['6°A', '6°B'],
        ['Mujeres', 'Hombres'],
        ['Jornada Mañana', 'Jornada Tarde'],
        ['Grupo Norte', 'Grupo Sur'],
        ['Equipo A', 'Equipo B'],
        ['Turno 1', 'Turno 2'],
      ];
      const [sA, sB] = seriesPairs[Math.floor(v / THEMES.length) % seriesPairs.length];

      const doubleItems = theme.cats.map((label, idx) => ({
        label,
        valueA: idx === 1 ? randInt(23, 29) : randInt(6, 20),
        valueB: idx === 2 ? randInt(24, 30) : randInt(6, 20),
      }));

      const pieSplits: number[][] = [
        [40, 25, 20, 15],
        [50, 20, 20, 10],
        [35, 30, 20, 15],
        [45, 25, 20, 10],
        [30, 25, 25, 20],
        [40, 30, 20, 10],
      ];
      const rawSplit = shuffle(pieSplits[v % pieSplits.length]);
      const pieItems = theme.cats.map((label, idx) => ({ label, value: rawSplit[idx] }));

      if (level === 'facil') {
        const sub = v % 4;
        if (sub === 0) {
          const askMax = v % 8 < 4;
          const uniqSplit = [40, 30, 20, 10];
          const rotated = theme.cats.map((label, i) => ({
            label,
            value: uniqSplit[(i + v) % 4],
          }));
          const target = [...rotated].sort((a, b) => (askMax ? b.value - a.value : a.value - b.value))[0];
          return {
            id: qId,
            prompt: `Observa el gráfico circular "${theme.title}" sobre ${theme.context}. ¿Qué categoría obtuvo el ${askMax ? 'MAYOR' : 'MENOR'} porcentaje de preferencias?`,
            visualType: 'pie_chart',
            visualData: { title: theme.title, displayMode: 'percent', items: rotated },
            questionType: 'multiple_choice',
            options: shuffle(rotated.map(it => it.label)),
            correctAnswer: target.label,
            explanation: `${target.label} representa el ${target.value}%, siendo el sector ${askMax ? 'más grande' : 'más pequeño'} del gráfico circular.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Gráfico Circular'
          };
        } else if (sub === 1) {
          const unkIdx = v % 4;
          const missingVal = pieItems[unkIdx].value;
          const knownSum = 100 - missingVal;
          const displayPie = pieItems.map((it, idx) =>
            idx === unkIdx ? { ...it, isUnknown: true } : it
          );
          return {
            id: qId,
            prompt: `En el gráfico circular "${theme.title}" falta indicar el porcentaje de "${pieItems[unkIdx].label}". Sabiendo que el círculo completo representa el 100%, ¿qué porcentaje corresponde al sector "?"?`,
            visualType: 'pie_chart',
            visualData: { title: theme.title, displayMode: 'percent', items: displayPie },
            questionType: 'numeric',
            correctAnswer: missingVal.toString(),
            explanation: `Los sectores conocidos suman ${knownSum}%. Para completar el 100%: 100 − ${knownSum} = ${missingVal}%.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Gráfico Circular'
          };
        } else if (sub === 2) {
          const targetIdx = v % doubleItems.length;
          const useA = v % 2 === 0;
          const seriesName = useA ? sA : sB;
          const ansVal = useA ? doubleItems[targetIdx].valueA : doubleItems[targetIdx].valueB;
          return {
            id: qId,
            prompt: `Según el gráfico de barra doble "${theme.title}", ¿cuántos ${theme.noun} del grupo "${seriesName}" eligieron la opción "${doubleItems[targetIdx].label}"?`,
            visualType: 'double_bar_chart',
            visualData: {
              title: theme.title,
              unit: theme.unit,
              seriesA: sA,
              seriesB: sB,
              items: doubleItems,
            },
            questionType: 'numeric',
            correctAnswer: ansVal.toString(),
            explanation: `Ubicamos la categoría "${doubleItems[targetIdx].label}" y leemos la barra correspondiente a ${seriesName}: ${ansVal}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Gráfico de Barra Doble'
          };
        } else {
          const notable = randChoice([
            { pct: 50, deg: 180 },
            { pct: 25, deg: 90 },
            { pct: 20, deg: 72 },
            { pct: 10, deg: 36 },
          ]);
          const rest = 100 - notable.pct;
          const r1 = Math.floor(rest / 2);
          const r2 = Math.floor((rest - r1) / 2);
          const r3 = rest - r1 - r2;
          const items = [
            { label: theme.cats[0], value: notable.pct },
            { label: theme.cats[1], value: r1 },
            { label: theme.cats[2], value: r2 },
            ...(r3 > 0 ? [{ label: theme.cats[3], value: r3 }] : []),
          ];
          return {
            id: qId,
            prompt: `En el gráfico circular "${theme.title}", la categoría "${theme.cats[0]}" representa el ${notable.pct}% del total. ¿Cuántos grados mide su ángulo central en la circunferencia (360°)?`,
            visualType: 'pie_chart',
            visualData: { title: theme.title, displayMode: 'percent', items },
            questionType: 'multiple_choice',
            options: uniqueMcOptions(`${notable.deg}°`, ['45°', '60°', '90°', '120°', '144°', '180°']),
            correctAnswer: `${notable.deg}°`,
            explanation: `El ${notable.pct}% de 360° se calcula como (${notable.pct} · 360°) : 100 = ${notable.deg}°.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Gráfico Circular'
          };
        }
      } else if (level === 'medio') {
        const sub = v % 4;
        if (sub === 0) {
          const idx = v % doubleItems.length;
          const it = doubleItems[idx];
          if (it.valueA === it.valueB) it.valueA += 4;
          const diff = Math.abs(it.valueA - it.valueB);
          return {
            id: qId,
            prompt: `Observa el gráfico de barra doble "${theme.title}". En la categoría "${it.label}", ¿cuál es la diferencia entre ${sA} y ${sB}?`,
            visualType: 'double_bar_chart',
            visualData: { title: theme.title, unit: theme.unit, seriesA: sA, seriesB: sB, items: doubleItems },
            questionType: 'numeric',
            correctAnswer: diff.toString(),
            explanation: `En "${it.label}", ${sA} tiene ${it.valueA} y ${sB} tiene ${it.valueB}. La diferencia es |${it.valueA} − ${it.valueB}| = ${diff}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Gráfico de Barra Doble'
          };
        } else if (sub === 1) {
          const totalPeople = randChoice([80, 100, 120, 200, 300, 400]);
          const idx = v % pieItems.length;
          const pct = pieItems[idx].value;
          const countAns = Math.round((totalPeople * pct) / 100);
          return {
            id: qId,
            prompt: `El gráfico circular "${theme.title}" resume las respuestas de ${totalPeople} ${theme.noun} en ${theme.context}. ¿Cuántos ${theme.noun} eligieron "${pieItems[idx].label}"?`,
            visualType: 'pie_chart',
            visualData: { title: theme.title, subtitle: `Total encuestados: ${totalPeople}`, displayMode: 'percent', items: pieItems },
            questionType: 'numeric',
            correctAnswer: countAns.toString(),
            explanation: `Calculamos el ${pct}% de ${totalPeople}: (${pct} × ${totalPeople}) : 100 = ${countAns}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Gráfico Circular'
          };
        } else if (sub === 2) {
          const askSeriesSum = v % 2 === 0;
          if (askSeriesSum) {
            const useA = v % 4 === 0;
            const seriesName = useA ? sA : sB;
            const totalSeries = doubleItems.reduce((acc, it) => acc + (useA ? it.valueA : it.valueB), 0);
            return {
              id: qId,
              prompt: `Según el gráfico de barra doble "${theme.title}", ¿cuántos ${theme.noun} participaron EN TOTAL en "${seriesName}" sumando las cuatro categorías?`,
              visualType: 'double_bar_chart',
              visualData: { title: theme.title, unit: theme.unit, seriesA: sA, seriesB: sB, items: doubleItems },
              questionType: 'numeric',
              correctAnswer: totalSeries.toString(),
              explanation: `Sumamos todas las barras de ${seriesName}: ${doubleItems.map(it => (useA ? it.valueA : it.valueB)).join(' + ')} = ${totalSeries}.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 2: Gráfico de Barra Doble'
            };
          } else {
            const idx = v % doubleItems.length;
            const it = doubleItems[idx];
            const sumCat = it.valueA + it.valueB;
            return {
              id: qId,
              prompt: `Observa el gráfico de barra doble "${theme.title}". ¿Cuántos ${theme.noun} en total (juntando ${sA} y ${sB}) eligieron "${it.label}"?`,
              visualType: 'double_bar_chart',
              visualData: { title: theme.title, unit: theme.unit, seriesA: sA, seriesB: sB, items: doubleItems },
              questionType: 'numeric',
              correctAnswer: sumCat.toString(),
              explanation: `Sumamos ambas barras de "${it.label}": ${it.valueA} + ${it.valueB} = ${sumCat}.`,
              oaCode: oa.code,
              difficulty: level,
              categoryLabel: 'Nivel 2: Gráfico de Barra Doble'
            };
          }
        } else {
          const pct = randChoice([15, 20, 25, 30, 35, 40, 45]);
          const deg = Math.round((pct / 100) * 360);
          const rem = 100 - pct;
          const p2 = Math.floor(rem / 2);
          const p3 = rem - p2;
          const items = [
            { label: theme.cats[0], value: pct },
            { label: theme.cats[1], value: p2 },
            { label: theme.cats[2], value: p3 },
          ];
          return {
            id: qId,
            prompt: `En el gráfico circular "${theme.title}", el sector "${theme.cats[0]}" representa el ${pct}% del total. ¿Cuántos grados mide su ángulo central?`,
            visualType: 'pie_chart',
            visualData: { title: theme.title, displayMode: 'percent', items },
            questionType: 'numeric',
            correctAnswer: deg.toString(),
            explanation: `Un círculo completo mide 360°. El ${pct}% de 360° es (${pct} × 360) : 100 = ${deg}°.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Gráfico Circular'
          };
        }
      } else {
        const sub = v % 5;
        if (sub === 0) {
          const forced = [
            { label: theme.cats[0], valueA: randInt(10, 14), valueB: randInt(11, 15) },
            { label: theme.cats[1], valueA: randInt(25, 29), valueB: randInt(7, 11) },
            { label: theme.cats[2], valueA: randInt(12, 16), valueB: randInt(13, 17) },
            { label: theme.cats[3], valueA: randInt(8, 12), valueB: randInt(9, 13) },
          ];
          const maxIdx = 1;
          const gap = Math.abs(forced[maxIdx].valueA - forced[maxIdx].valueB);
          return {
            id: qId,
            prompt: `Analiza el gráfico de barra doble "${theme.title}". ¿En qué categoría se produce la MAYOR diferencia entre ${sA} y ${sB}?`,
            visualType: 'double_bar_chart',
            visualData: { title: theme.title, unit: theme.unit, seriesA: sA, seriesB: sB, items: forced },
            questionType: 'multiple_choice',
            options: shuffle(forced.map(it => it.label)),
            correctAnswer: forced[maxIdx].label,
            explanation: `En "${forced[maxIdx].label}" la diferencia es |${forced[maxIdx].valueA} − ${forced[maxIdx].valueB}| = ${gap}, superior a la de las demás categorías.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 3: Análisis Barra Doble'
          };
        } else if (sub === 1) {
          const totalPeople = randChoice([100, 200, 300, 400]);
          const s = shuffle([40, 30, 20, 10]);
          const items = theme.cats.map((label, idx) => ({ label, value: s[idx] }));
          const a = items[0];
          const b = items[1];
          const diffPct = Math.abs(a.value - b.value);
          const diffPeople = Math.round((totalPeople * diffPct) / 100);
          return {
            id: qId,
            prompt: `El gráfico circular "${theme.title}" representa una encuesta realizada a ${totalPeople} ${theme.noun}. ¿Cuántos ${theme.noun} más eligieron "${a.value > b.value ? a.label : b.label}" en comparación con "${a.value > b.value ? b.label : a.label}"?`,
            visualType: 'pie_chart',
            visualData: { title: theme.title, subtitle: `Total: ${totalPeople} ${theme.noun}`, displayMode: 'percent', items },
            questionType: 'numeric',
            correctAnswer: diffPeople.toString(),
            explanation: `La diferencia porcentual es |${a.value}% − ${b.value}%| = ${diffPct}%. El ${diffPct}% de ${totalPeople} es ${diffPeople}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 3: Problemas con Gráfico Circular'
          };
        } else if (sub === 2) {
          const pct = randChoice([20, 25, 40, 50]);
          const totalPeople = randChoice([80, 120, 160, 200, 240]);
          const partCount = Math.round((totalPeople * pct) / 100);
          const rem = 100 - pct;
          const p2 = Math.floor(rem / 2);
          const p3 = rem - p2;
          const items = [
            { label: theme.cats[0], value: pct },
            { label: theme.cats[1], value: p2 },
            { label: theme.cats[2], value: p3 },
          ];
          return {
            id: qId,
            prompt: `En el gráfico circular "${theme.title}", el sector "${theme.cats[0]}" (${pct}%) corresponde exactamente a ${partCount} ${theme.noun}. ¿Cuántos ${theme.noun} participaron EN TOTAL?`,
            visualType: 'pie_chart',
            visualData: { title: theme.title, displayMode: 'percent', items },
            questionType: 'numeric',
            correctAnswer: totalPeople.toString(),
            explanation: `Si el ${pct}% equivale a ${partCount}, entonces el 100% es (${partCount} × 100) : ${pct} = ${totalPeople}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 3: Problemas con Gráfico Circular'
          };
        } else if (sub === 3) {
          const sumA = doubleItems.reduce((acc, it) => acc + it.valueA, 0);
          const sumB = doubleItems.reduce((acc, it) => acc + it.valueB, 0);
          if (sumA === sumB) doubleItems[0].valueA += 5;
          const finalSumA = doubleItems.reduce((acc, it) => acc + it.valueA, 0);
          const finalSumB = doubleItems.reduce((acc, it) => acc + it.valueB, 0);
          const winner = finalSumA > finalSumB ? sA : sB;
          const diffTotal = Math.abs(finalSumA - finalSumB);
          return {
            id: qId,
            prompt: `Considerando todas las categorías de "${theme.title}", ¿cuántos ${theme.noun} más sumó en total "${winner}" respecto del otro grupo?`,
            visualType: 'double_bar_chart',
            visualData: { title: theme.title, unit: theme.unit, seriesA: sA, seriesB: sB, items: doubleItems },
            questionType: 'numeric',
            correctAnswer: diffTotal.toString(),
            explanation: `Total ${sA} = ${finalSumA}; Total ${sB} = ${finalSumB}. Diferencia = |${finalSumA} − ${finalSumB}| = ${diffTotal}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 3: Análisis Barra Doble'
          };
        } else {
          const degPairs = [
            { deg: 144, pct: 40 },
            { deg: 108, pct: 30 },
            { deg: 90, pct: 25 },
            { deg: 72, pct: 20 },
            { deg: 180, pct: 50 },
          ];
          const chosen = degPairs[v % degPairs.length];
          const remDeg = 360 - chosen.deg;
          const d2 = Math.floor(remDeg / 2);
          const d3 = remDeg - d2;
          const items = [
            { label: theme.cats[0], value: chosen.deg },
            { label: theme.cats[1], value: d2 },
            { label: theme.cats[2], value: d3 },
          ];
          return {
            id: qId,
            prompt: `El gráfico circular "${theme.title}" indica el ángulo central (en grados). ¿Qué porcentaje del total representa "${theme.cats[0]}" (${chosen.deg}°)?`,
            visualType: 'pie_chart',
            visualData: { title: `${theme.title} (en grados)`, displayMode: 'degrees', items },
            questionType: 'numeric',
            correctAnswer: chosen.pct.toString(),
            explanation: `Como el círculo completo mide 360° (100%), calculamos (${chosen.deg}° : 360°) × 100 = ${chosen.pct}%.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 3: Ángulos en Gráfico Circular'
          };
        }
      }
    }

    // ------------------------------------------------------------------
    // Resto de cursos (1° a 8° Básico) con gráficos de barra, línea y tablas reales
    // ------------------------------------------------------------------
    // Ensure strictly unique top & bottom values for unambiguous MC questions
    const uniqBarVals = shuffle([randInt(4, 8), randInt(10, 14), randInt(16, 20), randInt(22, 29)]);
    const barItems = theme.cats.map((label, idx) => ({
      label,
      value: uniqBarVals[idx],
    }));
    const useLine = (grade === '5_basico' && oa.code === 'OA 26' && v % 2 === 1) || (v % 7 === 5);
    const lineDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((label, idx) => ({
      label,
      value: idx === 2 ? randInt(25, 31) : idx === 0 ? randInt(10, 15) : randInt(16, 23),
    }));

    if (level === 'facil') {
      const sub = v % 5;
      if (sub === 0) {
        const sorted = [...barItems].sort((a, b) => b.value - a.value);
        return {
          id: qId,
          prompt: `Observa el gráfico "${theme.title}" sobre ${theme.context}. ¿Cuál categoría obtuvo la MAYOR cantidad de ${theme.unit}?`,
          visualType: 'bar_chart',
          visualData: { title: theme.title, unit: theme.unit, items: barItems },
          questionType: 'multiple_choice',
          options: shuffle(barItems.map(i => i.label)),
          correctAnswer: sorted[0].label,
          explanation: `${sorted[0].label} alcanza la barra más alta con ${sorted[0].value} ${theme.unit}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Lectura de Gráficos'
        };
      } else if (sub === 1) {
        const pick = barItems[v % barItems.length];
        return {
          id: qId,
          prompt: `Observa la tabla de frecuencias "${theme.title}" (${theme.context}). ¿Cuántos ${theme.noun} eligieron "${pick.label}"?`,
          visualType: 'table_data',
          visualData: {
            title: theme.title,
            headers: ['Categoría', 'Frecuencia'],
            rows: barItems.map(i => [i.label, String(i.value)]),
          },
          questionType: 'numeric',
          correctAnswer: pick.value.toString(),
          explanation: `En la fila correspondiente a "${pick.label}" aparece la frecuencia ${pick.value}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Tablas de Frecuencia'
        };
      } else if (sub === 2) {
        const minIt = [...barItems].sort((a, b) => a.value - b.value)[0];
        return {
          id: qId,
          prompt: `Según el gráfico de barras "${theme.title}", ¿cuál fue la opción MENOS preferida en ${theme.context}?`,
          visualType: 'bar_chart',
          visualData: { title: theme.title, unit: theme.unit, items: barItems },
          questionType: 'multiple_choice',
          options: shuffle(barItems.map(i => i.label)),
          correctAnswer: minIt.label,
          explanation: `${minIt.label} tiene la barra más baja con ${minIt.value} ${theme.unit}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Lectura de Gráficos'
        };
      } else if (sub === 3) {
        const pick = barItems[(v + 1) % barItems.length];
        return {
          id: qId,
          prompt: `Mira el gráfico de barras "${theme.title}". ¿Cuál categoría registró exactamente ${pick.value} ${theme.unit}?`,
          visualType: 'bar_chart',
          visualData: { title: theme.title, unit: theme.unit, items: barItems },
          questionType: 'multiple_choice',
          options: shuffle(barItems.map(i => i.label)),
          correctAnswer: pick.label,
          explanation: `La barra etiquetada "${pick.label}" tiene exactamente una altura de ${pick.value} ${theme.unit}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Lectura de Gráficos'
        };
      } else {
        const pick = barItems[(v + 2) % barItems.length];
        return {
          id: qId,
          prompt: `En el gráfico "${theme.title}", ¿qué cantidad de ${theme.unit} obtuvo la opción "${pick.label}"?`,
          visualType: 'bar_chart',
          visualData: { title: theme.title, unit: theme.unit, items: barItems },
          questionType: 'numeric',
          correctAnswer: pick.value.toString(),
          explanation: `Sobre la barra de "${pick.label}" se lee el valor ${pick.value}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Lectura de Gráficos'
        };
      }
    } else if (level === 'medio') {
      if (useLine) {
        const maxDay = [...lineDays].sort((a, b) => b.value - a.value)[0];
        return {
          id: qId,
          prompt: `El gráfico de línea muestra las temperaturas diarias registradas durante la semana. ¿Qué día registró la temperatura más alta?`,
          visualType: 'line_chart',
          visualData: { title: 'Temperaturas Diarias', unit: '°C', items: lineDays },
          questionType: 'multiple_choice',
          options: uniqueMcOptions(maxDay.label, lineDays.map(d => d.label)),
          correctAnswer: maxDay.label,
          explanation: `El punto más alto del gráfico de línea está el día ${maxDay.label} con ${maxDay.value}°C.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Gráfico de Línea'
        };
      }
      const sub = v % 4;
      if (sub === 0) {
        const sorted = [...barItems].sort((a, b) => b.value - a.value);
        const diff = sorted[0].value - sorted[sorted.length - 1].value;
        return {
          id: qId,
          prompt: `Observa el gráfico "${theme.title}". ¿Cuál es la diferencia entre la categoría con mayor frecuencia y la de menor frecuencia?`,
          visualType: 'bar_chart',
          visualData: { title: theme.title, unit: theme.unit, items: barItems },
          questionType: 'numeric',
          correctAnswer: diff.toString(),
          explanation: `La mayor es ${sorted[0].value} y la menor es ${sorted[sorted.length - 1].value}: ${sorted[0].value} − ${sorted[sorted.length - 1].value} = ${diff}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Interpretación de Gráficos'
        };
      } else if (sub === 1) {
        const total = barItems.reduce((acc, i) => acc + i.value, 0);
        return {
          id: qId,
          prompt: `La tabla "${theme.title}" resume la encuesta sobre ${theme.context}. ¿Cuántos ${theme.unit} se registraron en total?`,
          visualType: 'table_data',
          visualData: {
            title: theme.title,
            headers: ['Opción', 'Cantidad'],
            rows: barItems.map(i => [i.label, String(i.value)]),
          },
          questionType: 'numeric',
          correctAnswer: total.toString(),
          explanation: `Sumamos todas las frecuencias: ${barItems.map(i => i.value).join(' + ')} = ${total}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Tablas de Frecuencia'
        };
      } else if (sub === 2) {
        const i1 = v % 2;
        const i2 = i1 + 2;
        const sumTwo = barItems[i1].value + barItems[i2].value;
        return {
          id: qId,
          prompt: `Según el gráfico "${theme.title}", ¿cuántos ${theme.unit} suman "${barItems[i1].label}" y "${barItems[i2].label}" en conjunto?`,
          visualType: 'bar_chart',
          visualData: { title: theme.title, unit: theme.unit, items: barItems },
          questionType: 'numeric',
          correctAnswer: sumTwo.toString(),
          explanation: `Sumamos ambas barras: ${barItems[i1].value} + ${barItems[i2].value} = ${sumTwo}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Interpretación de Gráficos'
        };
      } else {
        const sorted = [...barItems].sort((a, b) => b.value - a.value);
        const diffTop2 = sorted[0].value - sorted[1].value;
        return {
          id: qId,
          prompt: `En la tabla "${theme.title}", ¿por cuántos ${theme.unit} supera "${sorted[0].label}" al segundo lugar ("${sorted[1].label}")?`,
          visualType: 'table_data',
          visualData: {
            title: theme.title,
            headers: ['Categoría', 'Registro'],
            rows: barItems.map(i => [i.label, String(i.value)]),
          },
          questionType: 'numeric',
          correctAnswer: diffTop2.toString(),
          explanation: `${sorted[0].value} − ${sorted[1].value} = ${diffTop2}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Tablas de Frecuencia'
        };
      }
    } else {
      const sub = v % 4;
      if (sub === 0) {
        const escala = randChoice([2, 4, 5, 10, 20]);
        const icons = [randInt(3, 8), randInt(4, 9), randInt(2, 6)];
        const months = randChoice([['Marzo', 'Abril', 'Mayo'], ['Julio', 'Agosto', 'Septiembre'], ['Octubre', 'Noviembre', 'Diciembre']]);
        const itemObj = randChoice(['botellas', 'latas', 'cuadernos', 'árboles plantados']);
        const total = icons.reduce((a, b) => a + b, 0) * escala;
        return {
          id: qId,
          prompt: `En un pictograma escolar, cada ícono representa ${escala} ${itemObj}. La tabla muestra la cantidad de íconos por mes. ¿Cuántos ${itemObj} se reunieron en total?`,
          visualType: 'table_data',
          visualData: {
            title: `Pictograma (1 ícono = ${escala} ${itemObj})`,
            headers: ['Mes', 'Cantidad de íconos'],
            rows: months.map((mName, idx) => [mName, `${icons[idx]} íconos`]),
          },
          questionType: 'numeric',
          correctAnswer: total.toString(),
          explanation: `Hay ${icons.reduce((a, b) => a + b, 0)} íconos en total × ${escala} = ${total}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Pictogramas'
        };
      } else if (sub === 1) {
        const maxDay = [...lineDays].sort((a, b) => b.value - a.value)[0];
        const minDay = [...lineDays].sort((a, b) => a.value - b.value)[0];
        const diff = maxDay.value - minDay.value;
        return {
          id: qId,
          prompt: `Observa el gráfico de línea de temperaturas semanales. ¿Cuál fue la variación (diferencia) entre la temperatura máxima y la mínima registrada?`,
          visualType: 'line_chart',
          visualData: { title: 'Registro Semanal', unit: '°C', items: lineDays },
          questionType: 'numeric',
          correctAnswer: diff.toString(),
          explanation: `Máxima (${maxDay.value}°C el ${maxDay.label}) menos mínima (${minDay.value}°C el ${minDay.label}) = ${diff}°C.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Gráfico de Línea'
        };
      } else if (sub === 2) {
        const totalBar = barItems.reduce((acc, i) => acc + i.value, 0);
        const top = [...barItems].sort((a, b) => b.value - a.value)[0];
        return {
          id: qId,
          prompt: `Observa el gráfico de barras "${theme.title}" sobre ${theme.context}. Si se suman las otras tres categorías (excluyendo a "${top.label}"), ¿cuántos ${theme.unit} suman entre las tres?`,
          visualType: 'bar_chart',
          visualData: { title: theme.title, unit: theme.unit, items: barItems },
          questionType: 'numeric',
          correctAnswer: (totalBar - top.value).toString(),
          explanation: `Total general = ${totalBar}. Restando "${top.label}" (${top.value}): ${totalBar} − ${top.value} = ${totalBar - top.value}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      } else {
        const unkIdx = v % barItems.length;
        const totalAll = barItems.reduce((acc, it) => acc + it.value, 0);
        const missingVal = barItems[unkIdx].value;
        return {
          id: qId,
          prompt: `En la encuesta "${theme.title}" participaron exactamente ${totalAll} en total. ¿Cuál es el valor desconocido (?) correspondiente a "${barItems[unkIdx].label}"?`,
          visualType: 'table_data',
          visualData: {
            title: `${theme.title} (Total: ${totalAll})`,
            headers: ['Categoría', 'Frecuencia'],
            rows: barItems.map((it, idx) => [it.label, idx === unkIdx ? '?' : String(it.value)]),
          },
          questionType: 'numeric',
          correctAnswer: missingVal.toString(),
          explanation: `Los datos conocidos suman ${totalAll - missingVal}. Restando al total: ${totalAll} − ${totalAll - missingVal} = ${missingVal}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Tablas Incompletas'
        };
      }
    }
  },

  // 34. Estadística y Tendencia Central
  estadistica_tendencia_central: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);
    const modeVal = randInt(4, 34);
    const d1 = modeVal + randInt(1, 5);
    const d2 = Math.max(1, modeVal - randInt(1, 4));
    const d3 = modeVal + randInt(6, 10);
    const modaData = shuffle([modeVal, modeVal, modeVal, d1, d2, d3]);

    if (level === 'facil') {
      const sub = v % 4;
      if (sub === 0) {
        return {
          id: qId,
          prompt: `En el siguiente conjunto de datos, ¿cuál es la MODA (el valor que más se repite)?`,
          context: modaData.join(', '),
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: modeVal.toString(),
          explanation: `El número ${modeVal} se repite 3 veces, siendo el dato con mayor frecuencia.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 1) {
        const minV = randInt(4, 18);
        const maxV = minV + randInt(8, 26);
        const list = shuffle([minV, maxV, minV + 3, minV + 6, maxV - 2]);
        return {
          id: qId,
          prompt: `Calcula el RANGO (diferencia entre el valor máximo y el mínimo) del siguiente conjunto de datos:`,
          context: list.join(', '),
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (maxV - minV).toString(),
          explanation: `El máximo es ${maxV} y el mínimo es ${minV}. Rango = ${maxV} − ${minV} = ${maxV - minV}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 2) {
        const vals = Array.from({ length: 5 }, (_, idx) => randInt(5 + idx * 6, 10 + idx * 6));
        const askMax = v % 8 < 4;
        const target = askMax ? Math.max(...vals) : Math.min(...vals);
        return {
          id: qId,
          prompt: `Observa los puntajes obtenidos por un equipo: ${shuffle(vals).join(', ')}. ¿Cuál fue el puntaje ${askMax ? 'MÁXIMO' : 'MÍNIMO'}?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: target.toString(),
          explanation: `Comparando todos los valores, el ${askMax ? 'mayor' : 'menor'} es ${target}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else {
        const labels = shuffle([`${modeVal}`, `${d1}`, `${d2}`, `${d3}`]);
        const freqs: Record<string, number> = {
          [`${modeVal}`]: randInt(8, 14),
          [`${d1}`]: randInt(2, 5),
          [`${d2}`]: randInt(2, 5),
          [`${d3}`]: randInt(2, 5),
        };
        return {
          id: qId,
          prompt: `Observa la tabla de frecuencias de edades en un taller escolar. ¿Cuál es la MODA de las edades registradas?`,
          visualType: 'table_data',
          visualData: {
            title: 'Frecuencia de edades',
            headers: ['Edad (años)', 'Cantidad de estudiantes'],
            rows: labels.map(lb => [lb, String(freqs[lb])]),
          },
          questionType: 'numeric',
          correctAnswer: modeVal.toString(),
          explanation: `La edad ${modeVal} años tiene la mayor frecuencia (${freqs[String(modeVal)]} estudiantes).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      }
    } else if (level === 'medio') {
      const sub = v % 4;
      if (sub === 0) {
        const m = randInt(5, 25);
        const delta1 = randInt(1, 4);
        const delta2 = randInt(2, 6);
        const list = shuffle([m - delta1, m + delta1, m - delta2, m + delta2]);
        return {
          id: qId,
          prompt: `Calcula la media aritmética (promedio) de estos cuatro datos: ${list.join(', ')}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: m.toString(),
          explanation: `Sumamos los 4 datos: ${m * 4}. Dividimos por 4: ${m * 4} ÷ 4 = ${m}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 1) {
        const base = randInt(6, 20);
        const ordered = [base, base + randInt(2, 4), base + randInt(5, 8), base + randInt(9, 12), base + randInt(13, 18)];
        return {
          id: qId,
          prompt: `Determina la MEDIANA de los siguientes cinco datos desordenados:`,
          context: shuffle(ordered).join(', '),
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ordered[2].toString(),
          explanation: `Al ordenar de menor a mayor (${ordered.join(', ')}), el dato central es ${ordered[2]}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 2) {
        const minT = randInt(8, 17);
        const maxT = minT + randInt(7, 16);
        const temps = shuffle([minT, minT + 2, minT + 4, minT + 5, maxT - 2, maxT]);
        return {
          id: qId,
          prompt: `Las temperaturas registradas en 6 días fueron: ${temps.join('°C, ')}°C. ¿Cuál es el RANGO de estas temperaturas?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (maxT - minT).toString(),
          explanation: `Máxima (${maxT}°C) menos mínima (${minT}°C) = ${maxT - minT}°C.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const center = randInt(8, 22);
        const dMid = randInt(1, 3);
        const ordered4 = [center - dMid - randInt(2, 5), center - dMid, center + dMid, center + dMid + randInt(2, 5)];
        return {
          id: qId,
          prompt: `Encuentra la MEDIANA de estos cuatro puntajes: ${shuffle(ordered4).join(', ')}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: center.toString(),
          explanation: `Ordenados (${ordered4.join(', ')}), promediamos los dos centrales: (${ordered4[1]} + ${ordered4[2]}) ÷ 2 = ${center}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const targetAvg = randChoice([5.0, 5.5, 6.0]);
      const nota3 = randChoice([6.0, 6.5, 7.0]);
      const nota2 = randChoice([4.5, 5.0, 5.5]);
      const nota1 = Math.round((targetAvg * 3 - nota3 - nota2) * 10) / 10;
      const edades = [randInt(8, 10), randInt(11, 12), randInt(13, 14), randInt(15, 16), randInt(17, 19)];
      const tempAvg = randInt(18, 28);
      const cantDatos = randChoice([4, 5, 6]);
      const promIni = randInt(10, 20);
      const nPlus1 = cantDatos + 1;
      const promNuevo = promIni + randInt(1, 3);
      const datoNuevo = promNuevo * nPlus1 - promIni * cantDatos;
      const pA = randInt(14, 22);
      const nA1 = pA - 2; const nA2 = pA; const nA3 = pA + 2;
      const pB = pA + randInt(2, 4);
      const nB1 = pB - 3; const nB2 = pB + 1; const nB3 = pB + 2;

      const scenarios = [
        {
          prompt: `${name} tiene dos notas en matemáticas: ${formatDec(nota1)} y ${formatDec(nota2)}. ¿Qué nota necesita obtener en su tercera prueba para que su promedio final sea exactamente ${formatDec(targetAvg)}?`,
          type: 'numeric' as const,
          ans: formatDec(nota3),
          exp: `La suma para promedio ${formatDec(targetAvg)} en 3 notas debe ser ${formatDec(targetAvg * 3)}. Resta: ${formatDec(targetAvg * 3)} − ${formatDec(nota1 + nota2)} = ${formatDec(nota3)}.`
        },
        {
          prompt: `Las edades de cinco integrantes de un equipo de debate son: ${shuffle(edades).join(', ')} años. ¿Cuál es la MEDIANA de estas edades?`,
          type: 'numeric' as const,
          ans: edades[2].toString(),
          exp: `Al ordenar los 5 datos de menor a mayor (${edades.join(', ')}), el valor central es ${edades[2]} años.`
        },
        {
          prompt: `Durante ${cantDatos} días en Arica se registraron temperaturas máximas cuyo promedio fue ${tempAvg}°C. ¿Cuál fue la suma total de esas ${cantDatos} temperaturas?`,
          type: 'numeric' as const,
          ans: (tempAvg * cantDatos).toString(),
          exp: `Promedio × cantidad de datos = ${tempAvg} × ${cantDatos} = ${tempAvg * cantDatos}°C.`
        },
        {
          prompt: `Un grupo de ${cantDatos} estudiantes tenía un promedio de ${promIni} puntos. Se integra ${name} con ${datoNuevo} puntos. ¿Cuál es el NUEVO promedio del grupo?`,
          type: 'numeric' as const,
          ans: promNuevo.toString(),
          exp: `Suma anterior: ${cantDatos} × ${promIni} = ${cantDatos * promIni}. Nueva suma: ${cantDatos * promIni + datoNuevo}. Dividido por ${nPlus1} = ${promNuevo}.`
        },
        {
          prompt: `El equipo Rojo obtuvo puntajes ${nA1}, ${nA2}, ${nA3} y el equipo Azul obtuvo ${nB1}, ${nB2}, ${nB3}. ¿Qué afirmación es VERDADERA sobre sus promedios?`,
          type: 'multiple_choice' as const,
          ans: `El equipo Azul tiene mayor promedio (${pB} puntos)`,
          opts: uniqueMcOptions(`El equipo Azul tiene mayor promedio (${pB} puntos)`, [
            `El equipo Rojo tiene mayor promedio (${pA} puntos)`,
            'Ambos equipos tienen exactamente el mismo promedio',
            `La diferencia entre sus promedios es ${Math.abs(pB - pA) + 4} puntos`,
          ]),
          exp: `Promedio Rojo = ${pA}; Promedio Azul = ${pB}. Por lo tanto, el equipo Azul tiene mayor promedio.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: chosen.type,
        ...(chosen.type === 'multiple_choice' ? { options: (chosen as { opts: string[] }).opts } : {}),
        correctAnswer: chosen.ans,
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 35. Probabilidad y Azar
  probabilidad_azar: (level, grade, oa, qId, variant) => {
    const rojas = randInt(2, 8);
    let azules = randInt(3, 10);
    if (azules === rojas) azules += 2;
    const total = rojas + azules;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const sub = v % 4;
      if (sub === 0) {
        const events = [
          { txt: 'sacar un número entre 1 y 6 al lanzar un dado común', ans: 'Seguro' },
          { txt: 'obtener un 7 al lanzar un dado común de 6 caras', ans: 'Imposible' },
          { txt: 'que salga Cara al lanzar una moneda equilibrada', ans: 'Posible' },
          { txt: 'sacar una bolita roja de una bolsa que solo tiene bolitas azules', ans: 'Imposible' },
          { txt: 'sacar una ficha verde de una caja con 5 fichas verdes y ninguna de otro color', ans: 'Seguro' },
          { txt: 'que el día después de lunes sea martes', ans: 'Seguro' },
          { txt: 'sacar un número par al lanzar un dado de 6 caras', ans: 'Posible' },
          { txt: 'extraer una pelota amarilla de una urna con 4 pelotas amarillas y 3 rojas', ans: 'Posible' },
        ];
        const ev = events[Math.floor(v / 4) % events.length];
        return {
          id: qId,
          prompt: `¿Cómo se clasifica el evento "${ev.txt}"?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ev.ans, ['Seguro', 'Posible', 'Imposible', 'Muy poco probable (nunca ocurre)']),
          correctAnswer: ev.ans,
          explanation: `De acuerdo con las posibilidades reales del experimento, el suceso es ${ev.ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 1) {
        const colorPairs = [
          ['roja', 'azul', 'rojas', 'azules'],
          ['verde', 'amarilla', 'verdes', 'amarillas'],
          ['morada', 'naranja', 'moradas', 'naranjas'],
          ['celeste', 'blanca', 'celestes', 'blancas'],
        ];
        const [c1, c2, c1p, c2p] = colorPairs[v % colorPairs.length];
        const askMore = v % 8 < 4;
        const winner = askMore ? (rojas > azules ? c1 : c2) : (rojas < azules ? c1 : c2);
        return {
          id: qId,
          prompt: `En una bolsa cerrada hay ${rojas} fichas ${c1p} y ${azules} fichas ${c2p}. Si sacas una sin mirar, ¿qué color es ${askMore ? 'MÁS' : 'MENOS'} probable obtener?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(
            `Ficha ${winner}`,
            [`Ficha ${c1}`, `Ficha ${c2}`, 'Ambos colores tienen la misma probabilidad', 'Ninguno es posible']
          ),
          correctAnswer: `Ficha ${winner}`,
          explanation: `Hay ${rojas} ${c1p} frente a ${azules} ${c2p}, por eso es ${askMore ? 'más' : 'menos'} probable sacar una ficha ${winner}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (sub === 2) {
        const exps = [
          {
            prompt: `Al lanzar una moneda común equilibrada al aire, ¿cuál de los siguientes es un resultado posible?`,
            ans: 'Cara o Sello',
            opts: ['Siempre sale Cara', 'Sale un número del 1 al 6', 'Nunca cae al suelo'],
            exp: `Los dos únicos resultados posibles al lanzar una moneda son Cara o Sello.`
          },
          {
            prompt: `En una ruleta con sectores pintados de rojo, verde y amarillo, ¿qué resultado es IMPOSIBLE obtener al girarla?`,
            ans: 'Color azul',
            opts: ['Color rojo', 'Color verde', 'Color amarillo'],
            exp: `Como la ruleta no tiene ningún sector azul, es imposible que la flecha marque ese color.`
          },
          {
            prompt: `Al lanzar un dado común numerado del 1 al 6, ¿cuál de los siguientes resultados es IMPOSIBLE?`,
            ans: 'Obtener el número 8',
            opts: ['Obtener un número par', 'Obtener el número 1', 'Obtener un número menor que 5'],
            exp: `Las caras del dado solo van del 1 al 6, por lo tanto 8 es imposible.`
          },
          {
            prompt: `Una tómbola contiene bolitas numeradas del 1 al 10. ¿Qué evento es POSIBLE pero NO seguro al sacar una bolita?`,
            ans: 'Sacar un número menor que 4',
            opts: ['Sacar un número menor que 15', 'Sacar el número 12', 'Sacar un número mayor que 0'],
            exp: `Los números menores que 4 ({1, 2, 3}) pueden salir, pero también pueden salir otros.`
          }
        ];
        const ex = exps[Math.floor(v / 4) % exps.length];
        return {
          id: qId,
          prompt: ex.prompt,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ex.ans, ex.opts),
          correctAnswer: ex.ans,
          explanation: ex.exp,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else {
        const papeles = randInt(5, 20);
        return {
          id: qId,
          prompt: `En una caja hay ${papeles} papelitos distintos numerados del 1 al ${papeles}. Si se extrae uno al azar, ¿cuántos resultados posibles distintos existen en total?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: papeles.toString(),
          explanation: `Como hay ${papeles} papelitos distintos, el espacio muestral tiene ${papeles} resultados posibles.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      }
    } else if (level === 'medio') {
      const sub = v % 4;
      if (sub === 0) {
        return {
          id: qId,
          prompt: `En una caja opaca hay ${rojas} fichas rojas y ${azules} fichas azules. ¿Cuántos casos favorables existen para extraer al azar una ficha roja?`,
          context: `${rojas} rojas · ${azules} azules`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: rojas.toString(),
          explanation: `El número de casos favorables corresponde exactamente a la cantidad de fichas rojas (${rojas}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 1) {
        const verdes = randInt(2, 7);
        const tot3 = rojas + azules + verdes;
        return {
          id: qId,
          prompt: `Una bolsa tiene ${rojas} bolitas rojas, ${azules} azules y ${verdes} verdes. ¿Cuántos casos posibles (totales) hay al sacar una bolita?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: tot3.toString(),
          explanation: `Sumamos todas las bolitas: ${rojas} + ${azules} + ${verdes} = ${tot3} casos totales.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else if (sub === 2) {
        const ans = `${rojas}/${total}`;
        return {
          id: qId,
          prompt: `En una bolsa hay ${rojas} tarjetas premiadas y ${azules} tarjetas en blanco. ¿Cuál es la probabilidad de sacar una tarjeta premiada?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, [
            `${azules}/${total}`,
            `1/${total}`,
            `${rojas}/${azules}`,
            `${azules}/${rojas}`,
          ]),
          correctAnswer: ans,
          explanation: `Casos favorables = ${rojas}; total = ${total}. Probabilidad = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const dadoCases = [
          { desc: 'un número par', fav: 3 },
          { desc: 'un número mayor que 4', fav: 2 },
          { desc: 'el número 5', fav: 1 },
          { desc: 'un número menor que 5', fav: 4 },
          { desc: 'un múltiplo de 3', fav: 2 },
        ];
        const dc = dadoCases[Math.floor(v / 4) % dadoCases.length];
        const ans = `${dc.fav}/6`;
        return {
          id: qId,
          prompt: `Al lanzar un dado común de 6 caras, ¿cuál es la probabilidad de obtener ${dc.desc}?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, ['1/6', '2/6', '3/6', '4/6', '5/6']),
          correctAnswer: ans,
          explanation: `Hay ${dc.fav} casos favorables de 6 posibles en total: ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const verdes = randInt(2, 6);
      const bolsaTotal = rojas + azules + verdes;
      const sub = v % 6;
      if (sub === 0) {
        const ans = `${rojas}/${total}`;
        return {
          id: qId,
          prompt: `En una ruleta de la kermesse escolar hay ${total} sectores iguales: ${rojas} son de color rojo y ${azules} de color azul. ¿Cuál es la probabilidad de que salga color rojo?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, [`${azules}/${total}`, `1/${total}`, `${rojas}/${azules}`, `${azules}/${rojas}`]),
          correctAnswer: ans,
          explanation: `Regla de Laplace: Casos favorables (${rojas}) dividido por casos totales (${total}) = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      } else if (sub === 1) {
        const ans = `${verdes}/${bolsaTotal}`;
        return {
          id: qId,
          prompt: `En una urna cerrada hay ${rojas} bolitas amarillas, ${azules} azules y ${verdes} verdes. Si se saca una sin mirar, ¿cuál es la probabilidad de obtener una bolita verde?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, [`${rojas}/${bolsaTotal}`, `${azules}/${bolsaTotal}`, `1/${verdes}`, `${verdes}/${rojas + azules}`]),
          correctAnswer: ans,
          explanation: `Total de bolitas = ${bolsaTotal}. Casos favorables verdes = ${verdes}. Probabilidad: ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      } else if (sub === 2) {
        const conds = [
          { desc: 'un número mayor que 4', fav: 2, list: '{5, 6}' },
          { desc: 'un número menor o igual a 3', fav: 3, list: '{1, 2, 3}' },
          { desc: 'un número distinto de 6', fav: 5, list: '{1, 2, 3, 4, 5}' },
          { desc: 'un número mayor que 2', fav: 4, list: '{3, 4, 5, 6}' },
        ];
        const c = conds[Math.floor(v / 6) % conds.length];
        const ans = `${c.fav}/6`;
        return {
          id: qId,
          prompt: `Al lanzar un dado común de 6 caras numeradas del 1 al 6, ¿cuál es la probabilidad de obtener ${c.desc}?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, ['1/6', '2/6', '3/6', '4/6', '5/6']),
          correctAnswer: ans,
          explanation: `Los casos favorables son ${c.list} (${c.fav} casos de 6 totales): ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      } else if (sub === 3) {
        const maxCard = randChoice([10, 12, 15, 20]);
        const mult = randChoice([3, 4, 5]);
        const fav = Math.floor(maxCard / mult);
        const ans = `${fav}/${maxCard}`;
        return {
          id: qId,
          prompt: `Se mezcla un mazo con tarjetas numeradas del 1 al ${maxCard}. Si se extrae una al azar, ¿cuál es la probabilidad de obtener un múltiplo de ${mult}?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions(ans, [`${fav + 1}/${maxCard}`, `1/${maxCard}`, `${mult}/${maxCard}`, `${Math.max(1, fav - 1)}/${maxCard}`]),
          correctAnswer: ans,
          explanation: `Entre 1 y ${maxCard} hay ${fav} múltiplos de ${mult}. Probabilidad = ${ans}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      } else if (sub === 4) {
        const g1 = randInt(2, 4);
        const tot1 = 10;
        const g2 = g1 + randInt(2, 4);
        const tot2 = 10;
        return {
          id: qId,
          prompt: `La urna A tiene ${g1} fichas doradas de un total de ${tot1}. La urna B tiene ${g2} fichas doradas de un total de ${tot2}. ¿En cuál urna es MÁS probable sacar una ficha dorada?`,
          visualType: 'none',
          questionType: 'multiple_choice',
          options: uniqueMcOptions('En la urna B', [
            'En la urna A',
            'En ambas es exactamente igual de probable',
            'Es imposible sacar una ficha dorada',
          ]),
          correctAnswer: 'En la urna B',
          explanation: `${g2}/${tot2} es mayor que ${g1}/${tot1}, por lo tanto hay mayor probabilidad en la urna B.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      } else {
        const otras = randInt(5, 12);
        const ganadoras = randInt(3, 9);
        const totBox = otras + ganadoras;
        return {
          id: qId,
          prompt: `En una rifa escolar hay ${totBox} boletos en total. Si ${otras} boletos no tienen premio y el resto sí tienen premio, ¿cuántos boletos premiados hay?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: ganadoras.toString(),
          explanation: `Restamos al total: ${totBox} − ${otras} = ${ganadoras} boletos premiados.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      }
    }
  }
};

// -------------------------------------------------------------
// PUBLIC GENERATOR FUNCTIONS
// -------------------------------------------------------------
const NAMES_REGEX = new RegExp(`\\b(${CHILEAN_NAMES.join('|')})\\b`, 'g');

function getStructKey(q: Question): string {
  const normalized = q.prompt
    .replace(/\d+(?:[.,]\d+)?/g, '#')
    .replace(NAMES_REGEX, 'NOMBRE')
    .slice(0, 72);
  return `${q.visualType}|${q.questionType}|${normalized}`;
}

export function generateQuestionsForOA(params: GenerationParams): Question[] {
  const { grade, oaCode, difficulty, count } = params;

  const oaObj =
    MINEDUC_OBJECTIVES.find(o => o.code === oaCode && o.grade === grade) ||
    MINEDUC_OBJECTIVES.find(o => o.code === oaCode) ||
    MINEDUC_OBJECTIVES[0];

  const topicKey = classifyOATopic(oaObj);
  const generator = TOPIC_GENERATORS[topicKey];

  const questions: Question[] = [];
  const seenSignatures = new Set<string>();
  const externalExcluded = new Set<string>(
    params.excludeSignatures ? Array.from(params.excludeSignatures) : []
  );
  const seedOffset = randInt(0, 999);
  let lastStructKey = '';

  for (let i = 0; i < count; i++) {
    let questionLevel: 'facil' | 'medio' | 'dificil';
    if (difficulty === 'progresivo') {
      const ratio = i / count;
      if (ratio < 0.35) {
        questionLevel = 'facil';
      } else if (ratio < 0.70) {
        questionLevel = 'medio';
      } else {
        questionLevel = 'dificil';
      }
    } else {
      questionLevel = difficulty;
    }

    let question: Question | null = null;
    let nonDupFallback: Question | null = null;
    let sessionOnlyFallback: Question | null = null;
    let attempts = 0;

    while (attempts < 80) {
      attempts++;
      const qId = `q_${grade}_${oaCode}_${questionLevel}_${i + 1}_${Math.random().toString(36).substring(2, 7)}`;
      const variant = seedOffset + i * 17 + (attempts - 1) * 7 + randInt(0, 11);
      const candidate = generator(questionLevel, grade, oaObj, qId, variant);

      const sig = `${candidate.prompt}::${candidate.context || ''}::${candidate.correctAnswer}`;
      const structKey = getStructKey(candidate);

      if (!seenSignatures.has(sig)) {
        if (!externalExcluded.has(sig)) {
          if (structKey !== lastStructKey || attempts > 35) {
            seenSignatures.add(sig);
            lastStructKey = structKey;
            question = candidate;
            break;
          }
          if (!nonDupFallback) nonDupFallback = candidate;
        } else if (!sessionOnlyFallback) {
          sessionOnlyFallback = candidate;
        }
      }
    }

    if (!question) {
      const picked =
        nonDupFallback ||
        sessionOnlyFallback ||
        generator(questionLevel, grade, oaObj, `q_${grade}_${oaCode}_${questionLevel}_${i + 1}_${Date.now()}`, seedOffset + i * 29 + 199);
      const sig = `${picked.prompt}::${picked.context || ''}::${picked.correctAnswer}`;
      seenSignatures.add(sig);
      lastStructKey = getStructKey(picked);
      question = picked;
    }

    questions.push(question);
  }

  return questions;
}

export function generateSingleUniqueQuestion(params: {
  grade: GradeLevel;
  oaCode: string;
  difficulty: DifficultyLevel;
  existingQuestions: Question[];
  index?: number;
}): Question {
  const { grade, oaCode, difficulty, existingQuestions, index = 1 } = params;
  const seenSignatures = new Set(existingQuestions.map(q => `${q.prompt}::${q.context || ''}::${q.correctAnswer}`));
  const lastStruct = existingQuestions.length > 0 ? getStructKey(existingQuestions[existingQuestions.length - 1]) : '';

  const oaObj =
    MINEDUC_OBJECTIVES.find(o => o.code === oaCode && o.grade === grade) ||
    MINEDUC_OBJECTIVES.find(o => o.code === oaCode) ||
    MINEDUC_OBJECTIVES[0];

  const topicKey = classifyOATopic(oaObj);
  const generator = TOPIC_GENERATORS[topicKey];

  let questionLevel: 'facil' | 'medio' | 'dificil';
  if (difficulty === 'progresivo') {
    const total = existingQuestions.length + 1;
    const ratio = index / total;
    if (ratio < 0.35) questionLevel = 'facil';
    else if (ratio < 0.70) questionLevel = 'medio';
    else questionLevel = 'dificil';
  } else {
    questionLevel = difficulty;
  }

  let fallback: Question | null = null;
  let attempts = 0;
  while (attempts < 75) {
    attempts++;
    const qId = `q_single_${grade}_${oaCode}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const candidate = generator(questionLevel, grade, oaObj, qId, attempts * 13 + randInt(1, 300));

    const sig = `${candidate.prompt}::${candidate.context || ''}::${candidate.correctAnswer}`;
    const structKey = getStructKey(candidate);
    if (!seenSignatures.has(sig)) {
      if (structKey !== lastStruct || attempts > 35) {
        return candidate;
      }
      if (!fallback) fallback = candidate;
    }
  }

  if (fallback) return fallback;
  const qId = `q_single_fallback_${Date.now()}`;
  return generator(questionLevel, grade, oaObj, qId, randInt(300, 999));
}
