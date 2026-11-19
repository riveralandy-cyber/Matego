import { Question, GradeLevel, DifficultyLevel, VisualType, ThematicAxis, LearningObjective } from '../types';
import { MINEDUC_OBJECTIVES } from '../data/mineducCurriculum';

export interface GenerationParams {
  grade: GradeLevel;
  oaCode: string;
  difficulty: DifficultyLevel; // 'facil' | 'medio' | 'dificil' | 'progresivo'
  count: number; // 5 to 20
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
  'Catalina', 'Mateo', 'Emilia', 'Joaquín', 'Valentina', 'Matías'
];

const CHILEAN_PLACES = [
  'el Terminal Asoagro de Arica',
  'la feria libre del barrio',
  'el almacén Don Pedro',
  'el Valle de Azapa',
  'la biblioteca de la Escuela Ricardo Silva Arriagada',
  'el patio techado de la escuela'
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
    const name = randChoice(CHILEAN_NAMES);
    const step = grade === '1_basico' ? (level === 'facil' ? 1 : 2) : grade === '2_basico' ? randChoice([5, 10]) : randChoice([10, 100]);
    const start = randInt(2, 15) * step;

    if (level === 'facil') {
      // Nivel 1: Ejercitación Básica - Conteo y sucesor/antecesor directo
      const num = start + step * 3;
      const isSucesor = variant % 2 === 0;
      const ans = isSucesor ? num + 1 : num - 1;
      return {
        id: qId,
        prompt: isSucesor ? `¿Cuál es el SUCESOR (número inmediatamente siguiente) de ${num}?` : `¿Cuál es el ANTECESOR (número inmediatamente anterior) de ${num}?`,
        context: isSucesor ? `${num} ➔ [ ? ]` : `[ ? ] ➔ ${num}`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: ans.toString(),
        explanation: isSucesor ? `El sucesor de ${num} es ${num} + 1 = ${ans}.` : `El antecesor de ${num} es ${num} - 1 = ${ans}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      // Nivel 2: Aplicación Intermedia - Término faltante en secuencia
      const seq = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
      const missIdx = 2;
      const missing = seq[missIdx];
      const display = seq.map((n, i) => (i === missIdx ? '___' : n)).join(', ');
      return {
        id: qId,
        prompt: `En la secuencia que avanza con un patrón constante, ¿qué número falta en el espacio en blanco?`,
        context: display,
        visualType: 'number_line',
        visualData: { numbers: seq, missing },
        questionType: 'numeric',
        correctAnswer: missing.toString(),
        explanation: `La secuencia avanza de ${step} en ${step}: ${seq[missIdx - 1]} + ${step} = ${missing}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      // Nivel 3: Resolución de Problemas - Problema contextualizado
      const finalCount = start + step * 4;
      return {
        id: qId,
        prompt: `${name} está ordenando sus stickers coleccionables en álbumes de ${step} en ${step}. Si empezó en ${start} y ya contó 4 grupos más (${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}...), ¿cuántos stickers habrá contado en total?`,
        context: `${start} ➔ ${start + step} ➔ ${start + step * 2} ➔ ${start + step * 3} ➔ ___`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: finalCount.toString(),
        explanation: `Sumando ${step} al último grupo (${start + step * 3} + ${step}) da un total de ${finalCount} stickers.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 2. Números Ordinales
  ordinales: (level, grade, oa, qId) => {
    const ordinals = [
      { num: '1º', word: 'primero', pos: 1 },
      { num: '2º', word: 'segundo', pos: 2 },
      { num: '3º', word: 'tercero', pos: 3 },
      { num: '4º', word: 'cuarto', pos: 4 },
      { num: '5º', word: 'quinto', pos: 5 },
      { num: '6º', word: 'sexto', pos: 6 },
      { num: '7º', word: 'séptimo', pos: 7 },
      { num: '8º', word: 'octavo', pos: 8 },
      { num: '9º', word: 'noveno', pos: 9 },
      { num: '10º', word: 'décimo', pos: 10 }
    ];
    const item = randChoice(ordinals);

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `¿Cómo se escribe con palabras el número ordinal ${item.num}?`,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle([item.word, randChoice(ordinals.filter(o => o.num !== item.num)).word, randChoice(ordinals.filter(o => o.num !== item.num)).word]),
        correctAnswer: item.word,
        explanation: `El símbolo ${item.num} corresponde a '${item.word}'.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const nextPos = item.pos < 10 ? item.pos + 1 : item.pos - 1;
      const nextOrd = ordinals.find(o => o.pos === nextPos)!;
      return {
        id: qId,
        prompt: `Si una persona está en el ${item.word} (${item.num}) lugar de una fila y retrocede una posición, ¿en qué lugar queda?`,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle([nextOrd.word, item.word, 'décimo']),
        correctAnswer: nextOrd.word,
        explanation: `Al retroceder desde el ${item.word} lugar, pasa al ${nextOrd.word} lugar.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      return {
        id: qId,
        prompt: `En la carrera escolar de la Escuela Ricardo Silva Arriagada compitieron 10 estudiantes. ${name} llegó justo antes del quinto lugar. ¿En qué lugar cruzó la meta?`,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle(['cuarto', 'quinto', 'sexto', 'tercero']),
        correctAnswer: 'cuarto',
        explanation: `El lugar inmediatamente anterior al quinto (5º) es el cuarto (4º).`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 3. Lectura y Escritura de Números
  lectura_escritura_numeros: (level, grade, oa, qId) => {
    const scope = getGradeScope(grade);
    const n = randInt(10, scope.maxDirect);

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `¿Cómo se escribe en cifras el número representado a continuación?`,
        context: `${n}`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: n.toString(),
        explanation: `El valor corresponde exactamente a la cifra ${n}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
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
    } else {
      const name = randChoice(CHILEAN_NAMES);
      return {
        id: qId,
        prompt: `${name} tiene ahorrado un total de ${formatCLP(n)} para la fiesta de la escuela. Si deposita ${formatCLP(100)} adicionales, ¿cuánto dinero tendrá en total?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: (n + 100).toString(),
        explanation: `${n} + 100 = ${n + 100}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 4. Comparación y Orden (>, <, =)
  comparacion_orden: (level, grade, oa, qId) => {
    const scope = getGradeScope(grade);
    const a = randInt(5, scope.maxDirect);
    let b = randInt(5, scope.maxDirect);
    while (b === a) b = randInt(5, scope.maxDirect);

    if (level === 'facil') {
      const sign = a > b ? '>' : '<';
      return {
        id: qId,
        prompt: `¿Qué signo de comparación corresponde entre ${a} y ${b}?`,
        context: `${a}  ___  ${b}`,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: ['>', '<', '='],
        correctAnswer: sign,
        explanation: `${a} es ${a > b ? 'mayor que (>)' : 'menor que (<)'} ${b}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const list = shuffle([a, b, a + randInt(2, 10), b - randInt(1, 4)]).filter(x => x > 0);
      const min = Math.min(...list);
      return {
        id: qId,
        prompt: `Entre los siguientes números: ${list.join(', ')}, ¿cuál es el MENOR de todos?`,
        context: list.join(' · '),
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: min.toString(),
        explanation: `El valor numérico más bajo del grupo es ${min}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      return {
        id: qId,
        prompt: `En una colecta escolar, ${name} reunió ${formatCLP(a)} y su compañero reunió ${formatCLP(b)}. ¿Cuánto dinero más reunió quien juntó la mayor cantidad?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: Math.abs(a - b).toString(),
        explanation: `La diferencia es: ${Math.max(a, b)} - ${Math.min(a, b)} = ${Math.abs(a - b)}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 5. Estimación y Redondeo
  estimacion_redondeo: (level, grade, oa, qId) => {
    const n = randInt(23, 895);
    const roundedDec = Math.round(n / 10) * 10;
    const roundedCen = Math.round(n / 100) * 100;

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `Aproxima el número ${n} a la DECENA más cercana:`,
        context: `${n} ➔ ___`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: roundedDec.toString(),
        explanation: `${n} está más cerca de ${roundedDec} en la recta numérica.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const a = randInt(21, 68);
      const b = randInt(21, 68);
      const est = Math.round(a / 10) * 10 + Math.round(b / 10) * 10;
      return {
        id: qId,
        prompt: `Redondea cada sumando a la decena más cercana y estima el resultado de: ${a} + ${b}`,
        context: `(${Math.round(a / 10) * 10} + ${Math.round(b / 10) * 10}) = ?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: est.toString(),
        explanation: `${a} se redondea a ${Math.round(a / 10) * 10} y ${b} se redondea a ${Math.round(b / 10) * 10}. Suma estimada = ${est}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const price1 = randInt(180, 420);
      const price2 = randInt(210, 560);
      const estTotal = Math.round(price1 / 100) * 100 + Math.round(price2 / 100) * 100;
      return {
        id: qId,
        prompt: `En el almacén escolar Don Pedro, un jugo cuesta ${formatCLP(price1)} y una barra de cereal cuesta ${formatCLP(price2)}. Si redondeas ambos precios a la centena más cercana, ¿cuál es el costo estimado total?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: estTotal.toString(),
        explanation: `${price1} se redondea a ${Math.round(price1 / 100) * 100} y ${price2} a ${Math.round(price2 / 100) * 100}. Total estimado: ${formatCLP(estTotal)}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 6. Valor Posicional y Descomposición
  valor_posicional_descomposicion: (level, grade, oa, qId) => {
    const scope = getGradeScope(grade);
    const n = grade === '1_basico' ? randInt(11, 19) : grade === '2_basico' ? randInt(20, 99) : randInt(120, scope.maxDirect);

    if (level === 'facil') {
      const u = n % 10;
      return {
        id: qId,
        prompt: `¿Cuántas UNIDADES tiene el número ${n}?`,
        context: `${n}`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: u.toString(),
        explanation: `En ${n}, el dígito en la posición de las unidades es ${u}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const d = Math.floor((n % 100) / 10) * 10;
      const c = Math.floor(n / 100) * 100;
      const u = n % 10;
      const part = c > 0 ? c : d;
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
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const billetes1000 = randInt(2, 6);
      const monedas100 = randInt(3, 9);
      const monedas10 = randInt(2, 8);
      const total = billetes1000 * 1000 + monedas100 * 100 + monedas10 * 10;
      return {
        id: qId,
        prompt: `Un estudiante de la Escuela Ricardo Silva Arriagada tiene ${billetes1000} billetes de $1.000, ${monedas100} monedas de $100 y ${monedas10} monedas de $10. ¿Cuánto dinero tiene en total?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: total.toString(),
        explanation: `(${billetes1000} × 1.000) + (${monedas100} × 100) + (${monedas10} × 10) = ${formatCLP(total)}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 7. Cálculo Mental y Estrategias (strictly grade-scoped; NO multiplication in 1°–3° Básico addition/subtraction)
  calculo_mental_estrategias: (level, grade, oa, qId) => {
    const titleLower = oa.title.toLowerCase();

    // Special branch: Propiedades del 0 y del 1
    if (titleLower.includes('propiedad del cero') || titleLower.includes('propiedades del 0 y del 1')) {
      const isMultDiv = grade !== '1_basico' && grade !== '2_basico' && titleLower.includes('multiplicación');
      if (isMultDiv) {
        const n = randInt(3, 45);
        if (level === 'facil') {
          const isZero = Math.random() > 0.5;
          return {
            id: qId,
            prompt: isZero ? `Aplica la propiedad absorbente del 0:` : `Aplica la propiedad del elemento neutro (1):`,
            context: isZero ? `${n} × 0 = ?` : `${n} × 1 = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (isZero ? 0 : n).toString(),
            explanation: isZero
              ? `Todo número multiplicado por 0 da 0: ${n} × 0 = 0.`
              : `Todo número multiplicado por 1 mantiene su valor: ${n} × 1 = ${n}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación Básica'
          };
        } else if (level === 'medio') {
          return {
            id: qId,
            prompt: `Calcula aplicando la propiedad del 1 en la división:`,
            context: `${n} ÷ 1 = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: n.toString(),
            explanation: `Todo número dividido por 1 es igual al mismo número: ${n} ÷ 1 = ${n}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación Intermedia'
          };
        } else {
          const name = randChoice(CHILEAN_NAMES);
          const cajas = randInt(4, 9);
          return {
            id: qId,
            prompt: `${name} tiene ${cajas} cajas vacías, cada una con 0 lápices en su interior. ¿Cuántos lápices tiene en total?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: '0',
            explanation: `${cajas} cajas × 0 lápices = 0 lápices en total.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 3: Resolución de Problemas'
          };
        }
      } else {
        // 2° Básico OA 08: Propiedad del cero en adición y sustracción
        const n = randInt(4, 60);
        if (level === 'facil') {
          const isAdd = Math.random() > 0.4;
          return {
            id: qId,
            prompt: `Aplica la propiedad del cero (${isAdd ? 'sumar 0' : 'restar 0'}):`,
            context: isAdd ? `${n} + 0 = ?` : `${n} - 0 = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: n.toString(),
            explanation: isAdd ? `Al sumar 0 a ${n}, el resultado sigue siendo ${n}.` : `Al restar 0 a ${n}, el resultado sigue siendo ${n}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación Básica'
          };
        } else if (level === 'medio') {
          return {
            id: qId,
            prompt: `¿Qué número falta para que se cumpla la propiedad del cero?`,
            context: `${n} + [ ? ] = ${n}`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: '0',
            explanation: `El único número que al sumarse con ${n} da ${n} es el 0.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 2: Aplicación Intermedia'
          };
        } else {
          const name = randChoice(CHILEAN_NAMES);
          return {
            id: qId,
            prompt: `${name} juntó ${n} fichas en su estuche y no agregó ni perdió ninguna durante el recreo. ¿Con cuántas fichas terminó?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: n.toString(),
            explanation: `${n} + 0 = ${n} fichas.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 3: Resolución de Problemas'
          };
        }
      }
    }

    // 4° Básico OA 02: Cálculo mental para multiplicaciones y divisiones
    if (grade === '4_basico' && (titleLower.includes('multiplicac') || titleLower.includes('division'))) {
      const a = randInt(4, 15);
      const mult2 = a * 2;
      if (level === 'facil') {
        return {
          id: qId,
          prompt: `Aplica cálculo mental doblando el número: ¿Cuál es el doble de ${a}?`,
          context: `2 × ${a} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: mult2.toString(),
          explanation: `El doble de ${a} es 2 × ${a} = ${mult2}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (level === 'medio') {
        const b = randChoice([4, 8]);
        const c = randInt(3, 9);
        return {
          id: qId,
          prompt: `Calcula mentalmente doblando y multiplicando:`,
          context: `${b} × ${c} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (b * c).toString(),
          explanation: `${b} × ${c} = ${b * c}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const name = randChoice(CHILEAN_NAMES);
        const total = randChoice([24, 32, 40, 48]);
        return {
          id: qId,
          prompt: `${name} repartió ${total} dulces en partes iguales entre 4 amigos. ¿Cuántos dulces recibió cada amigo?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: (total / 4).toString(),
          explanation: `Mitad de ${total} es ${total / 2}, y la mitad de ${total / 2} es ${total / 4}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      }
    }

    // 1°–3° Básico: Cálculo mental de adición y sustracción (SIN signo de multiplicación ×)
    const isGrade1or2Mental20 = grade === '1_basico' || (grade === '2_basico' && titleLower.includes('hasta 20'));
    if (isGrade1or2Mental20) {
      if (level === 'facil') {
        const useDouble = Math.random() > 0.45;
        if (useDouble) {
          const a = randInt(1, 10);
          return {
            id: qId,
            prompt: `Calcula mentalmente usando la estrategia de dobles (sumar dos veces el mismo número):`,
            context: `${a} + ${a} = ?`,
            visualType: 'none',
            questionType: 'numeric',
            correctAnswer: (a + a).toString(),
            explanation: `El doble de ${a} se calcula sumando ${a} + ${a} = ${a + a}.`,
            oaCode: oa.code,
            difficulty: level,
            categoryLabel: 'Nivel 1: Ejercitación Básica'
          };
        } else {
          const a = randInt(2, 10);
          const b = randInt(1, Math.min(9, 20 - a));
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
            categoryLabel: 'Nivel 1: Ejercitación Básica'
          };
        }
      } else if (level === 'medio') {
        // Completar 10 + resto, dentro de 0 al 20
        const a = randInt(6, 9);
        const b = randInt(11 - a, 20 - a); // suma entre 11 y 20
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
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const name = randChoice(CHILEAN_NAMES);
        const start = randInt(10, 18);
        const lost = randInt(2, 6);
        const won = randInt(1, Math.min(5, 20 - (start - lost)));
        const finalCount = start - lost + won;
        return {
          id: qId,
          prompt: `${name} tenía ${start} fichas en su mesa. Guardó ${lost} en su estuche y luego su compañera le prestó ${won} más. ¿Cuántas fichas tiene ahora sobre la mesa?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: finalCount.toString(),
          explanation: `Primero restamos ${start} - ${lost} = ${start - lost}. Luego sumamos ${start - lost} + ${won} = ${finalCount}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 3: Resolución de Problemas'
        };
      }
    }

    // 3° Básico+ estrategias de cálculo mental aditivo
    const a = randInt(12, 48);
    if (level === 'facil') {
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
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const b = randInt(15, 45);
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
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const ini = randChoice([40, 50, 60, 80]);
      const rest = randInt(12, 25);
      const gain = randInt(5, 15);
      return {
        id: qId,
        prompt: `${name} tenía ${ini} láminas. En el recreo intercambió y entregó ${rest}, pero después consiguió ${gain} nuevas. ¿Cuántas láminas tiene ahora?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: (ini - rest + gain).toString(),
        explanation: `${ini} - ${rest} = ${ini - rest}. Luego ${ini - rest} + ${gain} = ${ini - rest + gain} láminas.`,
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
      // Estricto 0 al 20: a + b <= 20
      a = randInt(2, 13);
      b = randInt(1, Math.min(10, 20 - a));
    } else if (grade === '2_basico') {
      // Estricto 0 al 100: a + b <= 100
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
        return {
          id: qId,
          prompt: `Si sabes que ${a} + ${b} = ${sum}, ¿cuánto es ${sum} - ${b}?`,
          context: `${sum} - ${b} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: a.toString(),
          explanation: `Como ${a} + ${b} = ${sum}, al restar ${b} obtenemos ${a}: ${sum} - ${b} = ${a}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else if (level === 'medio') {
        return {
          id: qId,
          prompt: `Completa la familia de operaciones usando la relación inversa:`,
          context: `${sum} - ${a} = ${b}   →   ${b} + [ ? ] = ${sum}`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: a.toString(),
          explanation: `Para comprobar la resta ${sum} - ${a} = ${b}, sumamos ${b} + ${a} = ${sum}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
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
      const isSum = v % 2 === 0;
      return {
        id: qId,
        prompt: isSum ? `Resuelve la siguiente adición:` : `Resuelve la siguiente sustracción:`,
        context: isSum ? `${a} + ${b} = ?` : `${sum} - ${b} = ?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: (isSum ? sum : a).toString(),
        explanation: isSum ? `${a} + ${b} = ${sum}.` : `${sum} - ${b} = ${a}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const variantType = v % 3;
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
      } else {
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

  // 9. Multiplicación (respeta dígitos exactos por curso + 7 escenarios reales distintos)
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
      const swapDisplay = v % 2 === 1 && grade !== '4_basico';
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
    } else if (level === 'medio') {
      const mType = v % 3;
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
      } else {
        const extra = randInt(25, 150);
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
          prompt: `En la biblioteca de la Escuela Ricardo Silva Arriagada hay ${b} estantes grandes, y en cada estante se ordenaron ${a} libros. ¿Cuántos libros hay en total en esos estantes?`,
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

  // 10. División (con escenarios variados)
  division: (level, grade, oa, qId, variant) => {
    const divisor = randInt(3, 9);
    const cociente = grade === '3_basico' ? randInt(3, 10) : randInt(12, 75);
    const dividendo = divisor * cociente;
    const v = Math.abs(variant);

    if (level === 'facil') {
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
    } else if (level === 'medio') {
      const mType = v % 2;
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
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
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
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
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
          prompt: `Entre ${divisor} amigos pagaron en partes iguales una cuenta de ${formatCLP(dividendo * 10)}. ¿Cuánto pagó cada amigo?`,
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

  // 11. Operaciones Combinadas
  operaciones_combinadas: (level, grade, oa, qId, variant) => {
    const a = randInt(10, 35);
    const b = randInt(2, 7);
    const c = randInt(2, 6);
    const mult = b * c;
    const ans = a + mult;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const fType = v % 2;
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
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else {
        const startVal = mult + randInt(5, 25);
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
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      }
    } else if (level === 'medio') {
      const mType = v % 2;
      if (mType === 0) {
        const parenthesisAns = (a - b) * c;
        return {
          id: qId,
          prompt: `Resuelve la operación combinada con paréntesis:`,
          context: `(${a} - ${b}) × ${c} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: parenthesisAns.toString(),
          explanation: `Primero resolvemos el paréntesis (${a} - ${b} = ${a - b}). Luego multiplicamos: ${a - b} × ${c} = ${parenthesisAns}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const div = b * c;
        const add = randInt(4, 15);
        const divAns = div / b + add;
        return {
          id: qId,
          prompt: `Resuelve respetando la prioridad entre división y suma:`,
          context: `${div} ÷ ${b} + ${add} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: divAns.toString(),
          explanation: `Primero dividimos ${div} ÷ ${b} = ${c}. Luego ${c} + ${add} = ${divAns}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const scenarios = [
        () => {
          const pLapiz = randChoice([250, 300, 350]);
          const cantLapices = randInt(3, 6);
          const pCuaderno = randChoice([1200, 1500, 1800]);
          const total = pCuaderno + pLapiz * cantLapices;
          return {
            prompt: `En la librería, ${name} compró 1 cuaderno a ${formatCLP(pCuaderno)} y ${cantLapices} lápices a ${formatCLP(pLapiz)} cada uno. ¿Cuánto pagó en total?`,
            context: `${pCuaderno} + (${cantLapices} × ${pLapiz}) = ?`,
            ans: total,
            exp: `${cantLapices} × ${pLapiz} = ${cantLapices * pLapiz}. Sumado al cuaderno: ${formatCLP(total)}.`
          };
        },
        () => {
          const cajas = randInt(3, 6);
          const porCaja = randInt(8, 15);
          const regalados = randInt(4, 9);
          const quedan = cajas * porCaja - regalados;
          return {
            prompt: `${name} tenía ${cajas} cajas con ${porCaja} plumones cada una y entregó ${regalados} plumones al taller de arte. ¿Cuántos plumones le quedaron?`,
            context: `(${cajas} × ${porCaja}) - ${regalados} = ?`,
            ans: quedan,
            exp: `${cajas} × ${porCaja} = ${cajas * porCaja} plumones. Menos ${regalados} = ${quedan} plumones.`
          };
        },
        () => {
          const billete = randChoice([5000, 10000]);
          const cant = randInt(2, 4);
          const precio = randChoice([650, 800, 950]);
          const vuelto = billete - cant * precio;
          return {
            prompt: `En el quiosco escolar, ${name} compró ${cant} jugos naturales a ${formatCLP(precio)} cada uno y pagó con un billete de ${formatCLP(billete)}. ¿Cuánto vuelto recibió?`,
            context: `${billete} - (${cant} × ${precio}) = ?`,
            ans: vuelto,
            exp: `Gasto: ${cant} × ${precio} = ${formatCLP(cant * precio)}. Vuelto: ${formatCLP(billete)} - ${formatCLP(cant * precio)} = ${formatCLP(vuelto)}.`
          };
        },
        () => {
          const buses = randInt(2, 4);
          const ninosPorBus = randInt(18, 25);
          const adultos = randInt(4, 8);
          const totalPersonas = buses * ninosPorBus + adultos;
          return {
            prompt: `A un paseo al Morro de Arica fueron ${buses} buses con ${ninosPorBus} estudiantes cada uno, más ${adultos} profesores acompañantes. ¿Cuántas personas viajaron en total?`,
            context: `(${buses} × ${ninosPorBus}) + ${adultos} = ?`,
            ans: totalPersonas,
            exp: `Estudiantes: ${buses} × ${ninosPorBus} = ${buses * ninosPorBus}. Total con profesores: ${totalPersonas} personas.`
          };
        },
        () => {
          const aTotal = randInt(36, 72);
          const bExtra = randInt(8, 16);
          const grupos = 4;
          const exactSum = Math.floor((aTotal + bExtra) / grupos) * grupos;
          const adjExtra = exactSum - aTotal;
          const porGrupo = exactSum / grupos;
          return {
            prompt: `Se juntaron ${aTotal} libros de una campaña y ${adjExtra} libros donados por apoderados. Si el total se reparte en partes iguales entre ${grupos} cursos, ¿cuántos libros recibe cada curso?`,
            context: `(${aTotal} + ${adjExtra}) ÷ ${grupos} = ?`,
            ans: porGrupo,
            exp: `Total de libros: ${aTotal} + ${adjExtra} = ${exactSum}. Al dividir en ${grupos} cursos: ${porGrupo} libros por curso.`
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
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
    const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25];
    const v = Math.abs(variant);

    if (level === 'facil') {
      const isP = v % 2 === 0;
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
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const a = randChoice([3, 4, 6, 9]);
      const b = randChoice([4, 5, 8, 10]);
      const gcd = (x: number, y: number): number => y === 0 ? x : gcd(y, x % y);
      const lcm = (a * b) / gcd(a, b);
      if (v % 2 === 0) {
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
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const gVal = gcd(a * 2, b * 2);
        return {
          id: qId,
          prompt: `Calcula el Máximo Común Divisor (MCD) entre ${a * 2} y ${b * 2}:`,
          context: `MCD(${a * 2}, ${b * 2}) = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: gVal.toString(),
          explanation: `El mayor divisor común entre ${a * 2} y ${b * 2} es ${gVal}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const pairs = [
        { a: 6, b: 8, lcm: 24, prompt: `Dos buses escolares salen de la Escuela Ricardo Silva Arriagada. La micro A sale cada 6 minutos y la micro B cada 8 minutos. Si salieron juntos a las 08:00, ¿en cuántos minutos volverán a coincidir en la salida?` },
        { a: 4, b: 6, lcm: 12, prompt: `En el patio escolar hay dos luces navideñas que parpadean: la luz verde se enciende cada 4 segundos y la luz azul cada 6 segundos. Si coincidieron recién, ¿en cuántos segundos volverán a encenderse al mismo tiempo?` },
        { a: 5, b: 10, lcm: 10, prompt: `Camila riega su huerta cada 5 días y Tomás abona las plantas cada 10 días. Si hoy hicieron ambas tareas juntos, ¿en cuántos días volverán a coincidir?` },
        { a: 3, b: 5, lcm: 15, prompt: `Un entrenamiento de fútbol se realiza cada 3 días y uno de música cada 5 días. Si hoy coincidieron ambos talleres, ¿después de cuántos días volverán a coincidir?` },
      ];
      const chosen = pairs[v % pairs.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosen.lcm.toString(),
        explanation: `El mínimo común múltiplo de ${chosen.a} y ${chosen.b} es ${chosen.lcm}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 13. Fracciones
  fracciones: (level, grade, oa, qId, variant) => {
    const den = randChoice([4, 5, 6, 8, 10]);
    const num1 = randInt(1, den - 2);
    const num2 = randInt(1, den - num1);
    const sumNum = num1 + num2;
    const v = Math.abs(variant);

    if (level === 'facil') {
      if (v % 2 === 0) {
        return {
          id: qId,
          prompt: `Calcula la suma de fracciones con igual denominador:`,
          context: `${num1}/${den} + ${num2}/${den} = ?`,
          visualType: 'fraction_bar',
          visualData: { numerator: sumNum, denominator: den },
          questionType: 'multiple_choice',
          options: shuffle([`${sumNum}/${den}`, `${sumNum}/${den * 2}`, `${num1}/${den}`, `${sumNum + 1}/${den}`]),
          correctAnswer: `${sumNum}/${den}`,
          explanation: `Se suman los numeradores (${num1} + ${num2} = ${sumNum}) y se conserva el denominador común (${den}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      } else {
        const diffNum = Math.max(1, sumNum - num1);
        return {
          id: qId,
          prompt: `Calcula la resta de fracciones con igual denominador:`,
          context: `${sumNum}/${den} - ${num1}/${den} = ?`,
          visualType: 'fraction_bar',
          visualData: { numerator: diffNum, denominator: den },
          questionType: 'multiple_choice',
          options: shuffle([`${diffNum}/${den}`, `${diffNum}/${den * 2}`, `${sumNum}/${den}`, `1/${den + 1}`]),
          correctAnswer: `${diffNum}/${den}`,
          explanation: `Se restan los numeradores (${sumNum} - ${num1} = ${diffNum}) y se mantiene el denominador (${den}).`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 1: Ejercitación Básica'
        };
      }
    } else if (level === 'medio') {
      return {
        id: qId,
        prompt: `¿Qué fracción falta para completar la igualdad?`,
        context: `${num1}/${den} + [ ? ] = ${sumNum}/${den}`,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle([`${num2}/${den}`, `${num1}/${den}`, `${num2}/${den * 2}`, `1/${den}`]),
        correctAnswer: `${num2}/${den}`,
        explanation: `${sumNum}/${den} - ${num1}/${den} = ${num2}/${den}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const scenarios = [
        {
          prompt: `En el taller de cocina escolar, ${name} usó ${num1}/${den} kg de harina para preparar pan amasado y ${num2}/${den} kg para queques. ¿Qué fracción de kilogramo de harina utilizó en total?`,
          ans: `${sumNum}/${den}`,
          opts: [`${sumNum}/${den}`, `${sumNum}/${den * 2}`, `${num1}/${den}`, `1/${den}`],
          exp: `${num1}/${den} + ${num2}/${den} = ${sumNum}/${den} kg de harina en total.`
        },
        {
          prompt: `Una botella contenía ${sumNum}/${den} litros de jugo natural de maracuyá. Si ${name} bebió ${num1}/${den} litros después de clases, ¿qué fracción de litro quedó en la botella?`,
          ans: `${num2}/${den}`,
          opts: [`${num2}/${den}`, `${sumNum}/${den}`, `${num1}/${den}`, `${num2}/${den * 2}`],
          exp: `Restamos lo que bebió: ${sumNum}/${den} - ${num1}/${den} = ${num2}/${den} litros.`
        },
        {
          prompt: `Para pintar un mural en la escuela, ${name} pintó ${num1}/${den} del muro en la mañana y ${num2}/${den} en la tarde. ¿Qué fracción del mural pintó en total?`,
          ans: `${sumNum}/${den}`,
          opts: [`${sumNum}/${den}`, `${num2}/${den}`, `${sumNum}/${den + 2}`, `${num1}/${den * 2}`],
          exp: `Sumamos ambas partes: ${num1}/${den} + ${num2}/${den} = ${sumNum}/${den} del mural.`
        },
        {
          prompt: `De una pizza dividida en ${den} porciones iguales, ${name} comió ${num1}/${den} y su hermano comió ${num2}/${den}. ¿Qué fracción de la pizza comieron entre los dos?`,
          ans: `${sumNum}/${den}`,
          opts: [`${sumNum}/${den}`, `${sumNum}/${den * 2}`, `${den - sumNum}/${den}`, `${num1}/${den}`],
          exp: `${num1}/${den} + ${num2}/${den} = ${sumNum}/${den} de la pizza.`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle(chosen.opts),
        correctAnswer: chosen.ans,
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 14. Decimales
  decimales: (level, grade, oa, qId, variant) => {
    const a = randInt(12, 58) / 10;
    const b = randInt(11, 35) / 10;
    const sum = Math.round((a + b) * 10) / 10;
    const diff = Math.round(Math.abs(a - b) * 10) / 10;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const isSum = v % 2 === 0;
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      return {
        id: qId,
        prompt: isSum ? `Resuelve la suma de números decimales:` : `Resuelve la resta de números decimales:`,
        context: isSum ? `${formatDec(a)} + ${formatDec(b)} = ?` : `${formatDec(big)} - ${formatDec(small)} = ?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: formatDec(isSum ? sum : diff),
        explanation: isSum
          ? `Alineando la coma decimal: ${formatDec(a)} + ${formatDec(b)} = ${formatDec(sum)}.`
          : `Alineando la coma decimal: ${formatDec(big)} - ${formatDec(small)} = ${formatDec(diff)}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const mult = randInt(2, 6);
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
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      const mult = randInt(2, 5);
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

  // 15. Razones y Proporciones
  razones_proporciones: (level, grade, oa, qId, variant) => {
    const a = randInt(2, 5);
    const b = randInt(3, 7);
    const factor = randInt(3, 7);
    const aExt = a * factor;
    const bExt = b * factor;
    const v = Math.abs(variant);

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `En una sala de clases hay ${a} niños por cada ${b} niñas. ¿Cuál es la razón de niños a niñas?`,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle([`${a}:${b}`, `${b}:${a}`, `${a + b}:${a}`, `${a}:${a + b}`]),
        correctAnswer: `${a}:${b}`,
        explanation: `La razón se expresa comparando directamente las cantidades en el orden pedido: ${a} es a ${b} (${a}:${b}).`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
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
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
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

  // 16. Porcentajes
  porcentajes: (level, grade, oa, qId, variant) => {
    const pct = randChoice([10, 20, 25, 50]);
    const base = randChoice([4000, 8000, 12000, 20000, 30000]);
    const result = (base * pct) / 100;
    const v = Math.abs(variant);

    if (level === 'facil') {
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
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
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
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const discounted = base - result;
      const increased = base + result;
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
          prompt: `En una encuesta de ${base / 100} estudiantes de la escuela, el ${pct}% eligió taller de robótica. ¿Cuántos estudiantes eligieron robótica?`,
          ans: ((base / 100) * pct) / 100,
          exp: `${pct}% de ${base / 100} = ${((base / 100) * pct) / 100} estudiantes.`
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

  // 18. Potencias y Raíces
  potencias_raices: (level, grade, oa, qId, variant) => {
    const base = randChoice([2, 3, 4, 5, 10]);
    const exp = base === 10 ? randInt(2, 5) : randInt(2, 3);
    const potVal = Math.pow(base, exp);
    const v = Math.abs(variant);

    if (level === 'facil') {
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
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const raizExacta = randChoice([4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144]);
      const res = Math.sqrt(raizExacta);
      if (v % 2 === 0) {
        return {
          id: qId,
          prompt: `Calcula la raíz cuadrada exacta:`,
          context: `√${raizExacta} = ?`,
          visualType: 'none',
          questionType: 'numeric',
          correctAnswer: res.toString(),
          explanation: `√${raizExacta} = ${res} porque ${res}² = ${res} × ${res} = ${raizExacta}.`,
          oaCode: oa.code,
          difficulty: level,
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      } else {
        const b1 = randChoice([2, 3, 5]);
        const e1 = randInt(2, 3);
        const e2 = randInt(1, 2);
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
          categoryLabel: 'Nivel 2: Aplicación Intermedia'
        };
      }
    } else {
      const lado = randInt(4, 12);
      const area = lado * lado;
      const arista = randInt(2, 5);
      const volCubo = arista * arista * arista;
      const dias = randInt(3, 5);
      const bacterias = Math.pow(2, dias);
      const cajas = randInt(3, 6);
      const scenarios = [
        {
          prompt: `El patio de juegos de la Escuela Ricardo Silva Arriagada tiene forma cuadrada y su área total es de ${area} m². ¿Cuánto mide cada uno de sus lados?`,
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

  // 19. Patrones y Álgebra
  patrones_algebra: (level, grade, oa, qId, variant) => {
    const start = randInt(2, 12);
    const step = randInt(3, 8);
    const seq = [start, start + step, start + step * 2, start + step * 3];
    const v = Math.abs(variant);

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `Identifica la regla de formación de la secuencia: ${seq.join(', ')}`,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle([`Sumar ${step}`, `Sumar ${step + 1}`, `Restar ${step}`, `Multiplicar por ${step}`]),
        correctAnswer: `Sumar ${step}`,
        explanation: `Cada término se obtiene sumando ${step} al anterior (${start} + ${step} = ${start + step}).`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
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
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const ahorroSemanal = randChoice([300, 400, 500, 750, 1000]);
      const semanas = randInt(3, 7);
      const total = ahorroSemanal * semanas;
      const pagInicial = randInt(4, 10);
      const pagDia = randInt(3, 6);
      const diaBuscado = randInt(4, 6);
      const paginasDia = pagInicial + (diaBuscado - 1) * pagDia;
      const fig1 = randInt(3, 5);
      const pasoF = randInt(2, 4);
      const posF = randInt(4, 6);
      const fosfTotal = fig1 + (posF - 1) * pasoF;
      const kmDia1 = randInt(2, 5);
      const kmExtra = randInt(1, 3);
      const diaRun = randInt(4, 6);
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

  // 21. Expresiones Algebraicas y Funciones
  expresiones_algebraicas_funciones: (level, grade, oa, qId, variant) => {
    const xVal = randInt(2, 7);
    const m = randInt(2, 6);
    const n = randInt(1, 9);
    const res = m * xVal + n;
    const v = Math.abs(variant);

    if (level === 'facil') {
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
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
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
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const bajada = randChoice([600, 800, 1000]);
      const km = randInt(3, 8);
      const valorKm = randChoice([500, 600, 700]);
      const costoMin = randChoice([150, 200, 250]);
      const minutos = randInt(5, 12);
      const precioUni = randChoice([1200, 1500, 2000]);
      const despacho = randChoice([1000, 1500]);
      const cant = randInt(2, 5);
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
          prompt: `Una tienda escolar cobra ${formatCLP(precioUni)} por cada polera deportiva más un cargo fijo de ${formatCLP(despacho)} por estampado del nombre. Si se encargan ${cant} poleras iguales con un solo estampado grupal, ¿cuál es el costo total?`,
          ans: precioUni * cant + despacho,
          exp: `${precioUni} × ${cant} + ${despacho} = ${formatCLP(precioUni * cant + despacho)}.`
        },
        {
          prompt: `Un estanque de riego en Azapa parte con ${bajada} litros de agua y recibe ${valorKm} litros adicionales por hora. ¿Cuántos litros tendrá después de ${km} horas?`,
          ans: bajada + valorKm * km,
          exp: `${bajada} + (${valorKm} × ${km}) = ${bajada + valorKm * km} litros.`
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

  // 22. Ubicación Espacial y Coordenadas
  ubicacion_espacial_coordenadas: (level, grade, oa, qId, variant) => {
    const x = randInt(1, 7);
    const y = randInt(1, 7);
    const v = Math.abs(variant);

    if (level === 'facil') {
      const askX = v % 2 === 0;
      return {
        id: qId,
        prompt: askX
          ? `En el par ordenado (${x}, ${y}), ¿cuál es el valor de la coordenada del eje X (horizontal)?`
          : `En el par ordenado (${x}, ${y}), ¿cuál es el valor de la coordenada del eje Y (vertical)?`,
        context: `(${x}, ${y})`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: (askX ? x : y).toString(),
        explanation: askX
          ? `En un par ordenado (x, y), el primer número siempre corresponde al eje X (${x}).`
          : `En un par ordenado (x, y), el segundo número siempre corresponde al eje Y (${y}).`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const dx = randInt(2, 5);
      return {
        id: qId,
        prompt: `Si el punto A se ubica en (${x}, ${y}) y se traslada ${dx} unidades hacia la derecha, ¿cuál será su nueva coordenada X?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: (x + dx).toString(),
        explanation: `Hacia la derecha se suma en el eje X: ${x} + ${dx} = ${x + dx}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const dx = randInt(2, 5);
      const dy = randInt(2, 4);
      const nx = x + dx;
      const ny = y + dy;
      const ansStr = `(${nx}, ${ny})`;
      const wrong1 = `(${ny}, ${nx})`;
      const wrong2 = `(${nx}, ${Math.max(0, y - dy)})`;
      const wrong3 = `(${Math.max(0, x - dx)}, ${ny})`;
      const scenarios = [
        `En el plano del patio de la escuela, ${name} se encuentra en el punto (${x}, ${y}). Camina ${dx} cuadros al este (+X) y ${dy} cuadros al norte (+Y). ¿En qué coordenada final se ubicará?`,
        `En un mapa del tesoro de Arica, la brújula marca la posición (${x}, ${y}). Si debes moverte ${dx} unidades a la derecha y ${dy} unidades hacia arriba, ¿en qué punto está el tesoro?`,
        `Un robot programado por estudiantes de la escuela parte en (${x}, ${y}) y avanza ${dx} pasos en el eje horizontal X y ${dy} pasos en el eje vertical Y. ¿Cuál es su nueva ubicación?`
      ];
      return {
        id: qId,
        prompt: scenarios[v % scenarios.length],
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle([ansStr, wrong1, wrong2, wrong3]),
        correctAnswer: ansStr,
        explanation: `Nueva coordenada X: ${x} + ${dx} = ${nx}. Nueva coordenada Y: ${y} + ${dy} = ${ny}. Punto final: ${ansStr}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 23. Figuras 2D
  figuras_2d: (level, grade, oa, qId, variant) => {
    const shapes = [
      { name: 'Triángulo', sides: 3, vertices: 3 },
      { name: 'Cuadrado', sides: 4, vertices: 4 },
      { name: 'Pentágono', sides: 5, vertices: 5 },
      { name: 'Hexágono', sides: 6, vertices: 6 },
      { name: 'Octágono', sides: 8, vertices: 8 }
    ];
    const v = Math.abs(variant);
    const s = shapes[v % shapes.length];

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `¿Cuántos lados tiene un polígono llamado ${s.name}?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: s.sides.toString(),
        explanation: `Un ${s.name.toLowerCase()} tiene exactamente ${s.sides} lados y ${s.vertices} vértices.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const types = [
        { q: '¿Cómo se clasifica un triángulo que tiene TODOS sus tres lados de igual longitud?', a: 'Equilátero', opts: ['Equilátero', 'Isósceles', 'Escaleno', 'Rectángulo'], exp: 'Un triángulo con tres lados iguales se llama equilátero.' },
        { q: '¿Cómo se clasifica un triángulo que tiene exactamente DOS lados de igual longitud?', a: 'Isósceles', opts: ['Isósceles', 'Equilátero', 'Escaleno', 'Obtusángulo'], exp: 'Un triángulo con dos lados iguales se llama isósceles.' },
        { q: '¿Qué cuadrilátero tiene 4 ángulos rectos y todos sus 4 lados de igual medida?', a: 'Cuadrado', opts: ['Cuadrado', 'Trapecio', 'Triángulo', 'Pentágono'], exp: 'El cuadrado posee 4 ángulos de 90° y 4 lados iguales.' }
      ];
      const chosen = types[v % types.length];
      return {
        id: qId,
        prompt: chosen.q,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle(chosen.opts),
        correctAnswer: chosen.a,
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const countFig = randInt(3, 7);
      const chosenShape = shapes[v % 4];
      const totalPalitos = countFig * chosenShape.sides;
      const scenarios = [
        {
          prompt: `${name} está armando figuras geométricas con palitos de fósforo para su maqueta escolar. Si construyó ${countFig} ${chosenShape.name.toLowerCase()}s independientes (sin compartir lados), ¿cuántos fósforos necesitó en total?`,
          ans: totalPalitos,
          exp: `Cada ${chosenShape.name.toLowerCase()} usa ${chosenShape.sides} fósforos. ${countFig} × ${chosenShape.sides} = ${totalPalitos} fósforos.`
        },
        {
          prompt: `En la clase de Artes, los estudiantes recortaron ${countFig} cartulinas con forma de ${chosenShape.name.toLowerCase()}. ¿Cuántos vértices (esquinas) suman en total todas las figuras?`,
          ans: countFig * chosenShape.vertices,
          exp: `Cada ${chosenShape.name.toLowerCase()} tiene ${chosenShape.vertices} vértices. ${countFig} × ${chosenShape.vertices} = ${countFig * chosenShape.vertices} vértices.`
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

  // 24. Cuerpos 3D
  cuerpos_3d: (level, grade, oa, qId, variant) => {
    const bodies = [
      { name: 'Cubo', faces: 6, edges: 12, vertices: 8 },
      { name: 'Pirámide de base cuadrada', faces: 5, edges: 8, vertices: 5 },
      { name: 'Prisma triangular', faces: 5, edges: 9, vertices: 6 },
      { name: 'Paralelepípedo (prisma rectangular)', faces: 6, edges: 12, vertices: 8 }
    ];
    const v = Math.abs(variant);
    const b = bodies[v % bodies.length];

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `¿Cuántas CARAS planas tiene un ${b.name}?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: b.faces.toString(),
        explanation: `El cuerpo geométrico ${b.name} tiene ${b.faces} caras planas.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const askVertices = v % 2 === 0;
      return {
        id: qId,
        prompt: askVertices
          ? `¿Cuántos VÉRTICES (esquinas) tiene un ${b.name}?`
          : `¿Cuántas ARISTAS (bordes donde se unen las caras) tiene un ${b.name}?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: (askVertices ? b.vertices : b.edges).toString(),
        explanation: `El cuerpo ${b.name} tiene ${askVertices ? `${b.vertices} vértices` : `${b.edges} aristas`} en total.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const cajas = randInt(2, 4);
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

  // 25. Líneas y Ángulos
  lineas_angulos: (level, grade, oa, qId, variant) => {
    const a1 = randInt(25, 78);
    const comp = 90 - a1;
    const v = Math.abs(variant);

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `¿Cómo se clasifica un ángulo que mide ${a1}° (menor que 90°)?`,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle(['Ángulo Agudo', 'Ángulo Recto', 'Ángulo Obtuso', 'Ángulo Llano']),
        correctAnswer: 'Ángulo Agudo',
        explanation: `Todo ángulo mayor que 0° y menor que 90° se clasifica como ángulo agudo.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const isSup = v % 2 === 1;
      const obtuso = randInt(100, 155);
      return {
        id: qId,
        prompt: isSup
          ? `¿Cuál es el ángulo SUPLEMENTARIO de ${obtuso}° (la suma de ambos debe ser 180°)?`
          : `¿Cuál es el ángulo COMPLEMENTARIO de ${a1}° (la suma de ambos debe ser 90°)?`,
        context: isSup ? `${obtuso}° + [ ? ] = 180°` : `${a1}° + [ ? ] = 90°`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: (isSup ? 180 - obtuso : comp).toString(),
        explanation: isSup ? `180° - ${obtuso}° = ${180 - obtuso}°.` : `90° - ${a1}° = ${comp}°.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const a2 = randInt(35, 65);
      const a3 = 180 - (a1 + a2);
      const angRectoPart = randInt(25, 65);
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
          prompt: `Sobre una línea recta (180°) se apoya una rampa formando un ángulo de ${a1}° por un lado. ¿Cuánto mide el ángulo suplementario del otro lado?`,
          ans: 180 - a1,
          exp: `180° - ${a1}° = ${180 - a1}°.`
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

  // 26. Transformaciones Isométricas
  transformaciones_isometricas: (level, grade, oa, qId, variant) => {
    const v = Math.abs(variant);
    if (level === 'facil') {
      const symShapes = [
        { name: 'cuadrado', axes: 4 },
        { name: 'rectángulo (no cuadrado)', axes: 2 },
        { name: 'triángulo equilátero', axes: 3 },
        { name: 'triángulo isósceles (no equilátero)', axes: 1 }
      ];
      const sh = symShapes[v % symShapes.length];
      return {
        id: qId,
        prompt: `¿Cuántos ejes de simetría tiene un ${sh.name}?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: sh.axes.toString(),
        explanation: `Un ${sh.name} tiene exactamente ${sh.axes} ${sh.axes === 1 ? 'eje' : 'ejes'} de simetría.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const defs = [
        { q: '¿Qué transformación isométrica traslada todos los puntos de una figura en una misma dirección y distancia sin rotarla ni deformarla?', a: 'Traslación', exp: 'El movimiento recto según un vector se llama traslación.' },
        { q: '¿Qué transformación isométrica hace girar una figura alrededor de un punto fijo llamado centro, según un ángulo determinado?', a: 'Rotación', exp: 'El giro alrededor de un centro en cierto ángulo se llama rotación.' },
        { q: '¿Qué transformación isométrica produce una imagen en espejo respecto a una recta llamada eje de simetría?', a: 'Reflexión', exp: 'El efecto espejo respecto de un eje se llama reflexión o simetría axial.' }
      ];
      const chosen = defs[v % defs.length];
      return {
        id: qId,
        prompt: chosen.q,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle(['Traslación', 'Rotación', 'Reflexión', 'Homotecia']),
        correctAnswer: chosen.a,
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const chosenGiro = [
        { g1: 90, g2: 90, tot: 180 },
        { g1: 90, g2: 180, tot: 270 },
        { g1: 45, g2: 45, tot: 90 },
        { g1: 60, g2: 120, tot: 180 }
      ][v % 4];
      return {
        id: qId,
        prompt: `${name} diseñó el emblema escolar y rotó una figura en ${chosenGiro.g1}° en sentido horario. Si luego la vuelve a rotar otros ${chosenGiro.g2}° en el mismo sentido, ¿cuál es el giro total acumulado en grados?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: chosenGiro.tot.toString(),
        explanation: `${chosenGiro.g1}° + ${chosenGiro.g2}° = ${chosenGiro.tot}° de rotación total.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  },

  // 27. Teorema de Pitágoras
  teorema_pitagoras: (level, grade, oa, qId, variant) => {
    const triplets = [
      { a: 3, b: 4, c: 5 },
      { a: 6, b: 8, c: 10 },
      { a: 5, b: 12, c: 13 },
      { a: 9, b: 12, c: 15 },
      { a: 8, b: 15, c: 17 }
    ];
    const v = Math.abs(variant);
    const tri = triplets[v % triplets.length];

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `En un triángulo rectángulo cuyos catetos miden ${tri.a} cm y ${tri.b} cm, ¿cuánto mide su hipotenusa?`,
        context: `c² = ${tri.a}² + ${tri.b}²`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: tri.c.toString(),
        explanation: `c² = ${tri.a * tri.a} + ${tri.b * tri.b} = ${tri.c * tri.c}. Por lo tanto c = √${tri.c * tri.c} = ${tri.c} cm.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
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
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
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
    const h = randInt(8, 14);
    const m = randChoice([10, 15, 20, 30, 45]);
    const v = Math.abs(variant);

    if (level === 'facil') {
      const hrs = randInt(2, 5);
      return {
        id: qId,
        prompt: `¿A cuántos minutos equivalen ${hrs} horas completas?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: (hrs * 60).toString(),
        explanation: `Cada hora tiene 60 minutos. ${hrs} × 60 = ${hrs * 60} minutos.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const durMin = randChoice([25, 35, 45]);
      const endM = (m + durMin) % 60;
      const endH = h + Math.floor((m + durMin) / 60);
      const ans = `${endH}:${endM < 10 ? '0' + endM : endM}`;
      return {
        id: qId,
        prompt: `Un taller de matemáticas comenzó a las ${h}:${m < 10 ? '0' + m : m} y duró ${durMin} minutos. ¿A qué hora terminó?`,
        visualType: 'clock',
        visualData: { hour: endH, minute: endM },
        questionType: 'multiple_choice',
        options: shuffle([
          ans,
          `${endH + 1}:${endM < 10 ? '0' + endM : endM}`,
          `${h}:${endM < 10 ? '0' + endM : endM}`,
          `${endH}:${m < 10 ? '0' + m : m}`
        ]),
        correctAnswer: ans,
        explanation: `Sumando los ${durMin} minutos: finaliza a las ${ans}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const ida = randInt(25, 45);
      const vuelta = randInt(30, 50);
      const semanas = randInt(3, 6);
      const diasLectura = randInt(2, 4);
      const minDia = randChoice([20, 25, 30]);
      const scenarios = [
        {
          prompt: `${name} viajó en bus desde Arica hasta el Valle de Azapa. El viaje de ida duró ${ida} minutos y el de vuelta duró ${vuelta} minutos. ¿Cuántos minutos en total estuvo viajando en el bus?`,
          ans: ida + vuelta,
          exp: `${ida} min + ${vuelta} min = ${ida + vuelta} minutos en total.`
        },
        {
          prompt: `Un proyecto de ciencias escolares dura exactamente ${semanas} semanas completas. ¿Cuántos días dura el proyecto en total?`,
          ans: semanas * 7,
          exp: `Cada semana tiene 7 días. ${semanas} × 7 = ${semanas * 7} días.`
        },
        {
          prompt: `${name} leyó durante ${diasLectura} días seguidos, dedicando ${minDia} minutos cada día a su libro favorito. ¿Cuántos minutos leyó en total?`,
          ans: diasLectura * minDia,
          exp: `${diasLectura} días × ${minDia} minutos = ${diasLectura * minDia} minutos.`
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

  // 29. Longitud y Distancia
  longitud_distancia: (level, grade, oa, qId, variant) => {
    const meters = randInt(2, 12);
    const cm = meters * 100;
    const v = Math.abs(variant);

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `Realiza la conversión métrica: ¿A cuántos centímetros (cm) equivalen ${meters} metros (m)?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: cm.toString(),
        explanation: `1 metro equivale a 100 centímetros. Por lo tanto, ${meters} m × 100 = ${cm} cm.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const km = randInt(2, 7);
      const extraM = randChoice([250, 400, 550, 700]);
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
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const d1 = randInt(450, 950);
      const d2 = randInt(220, 480);
      const cintaCm = randInt(180, 320);
      const corteCm = randInt(45, 110);
      const scenarios = [
        {
          prompt: `En la clase de educación física de la escuela, ${name} corrió una distancia de ${d1} metros y luego caminó otros ${d2} metros para enfriar. ¿Cuántos metros recorrió en total?`,
          ans: d1 + d2,
          exp: `${d1} m + ${d2} m = ${d1 + d2} metros.`
        },
        {
          prompt: `${name} tenía una cuerda de ${cintaCm} cm de largo para un circuito psicomotriz y cortó ${corteCm} cm. ¿Cuántos centímetros de cuerda quedaron?`,
          ans: cintaCm - corteCm,
          exp: `${cintaCm} cm - ${corteCm} cm = ${cintaCm - corteCm} cm.`
        },
        {
          prompt: `Un atleta da 4 vueltas alrededor de una pista que mide ${d2} metros por vuelta. ¿Cuántos metros corre en total?`,
          ans: d2 * 4,
          exp: `4 × ${d2} m = ${d2 * 4} metros.`
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
    const a = randInt(5, 16);
    const b = randInt(3, 11);
    const perimRec = 2 * (a + b);
    const v = Math.abs(variant);

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `Calcula el PERÍMETRO de un rectángulo que mide ${a} cm de largo y ${b} cm de ancho:`,
        context: `P = 2 × (${a} + ${b})`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: perimRec.toString(),
        explanation: `El perímetro es la suma de todos los lados: ${a} + ${b} + ${a} + ${b} = ${perimRec} cm.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const perimCuad = a * 4;
      return {
        id: qId,
        prompt: `Si el perímetro total de un terreno cuadrado es ${perimCuad} metros, ¿cuánto mide cada uno de sus 4 lados?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: a.toString(),
        explanation: `Como el cuadrado tiene 4 lados iguales: ${perimCuad} ÷ 4 = ${a} metros por lado.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const ladoTri = randInt(6, 15);
      const ladoCuad = randInt(5, 14);
      const vueltas = randInt(2, 4);
      const scenarios = [
        {
          prompt: `La escuela Ricardo Silva Arriagada desea colocar una reja de seguridad alrededor de una zona rectangular de ${a} metros de largo por ${b} metros de ancho. ¿Cuántos metros lineales de reja se deben comprar?`,
          ans: perimRec,
          exp: `Se calcula el perímetro del rectángulo: 2 × (${a} + ${b}) = ${perimRec} metros.`
        },
        {
          prompt: `Un huerto escolar con forma de triángulo equilátero tiene lados de ${ladoTri} metros cada uno. Si se rodea con malla protectora, ¿cuántos metros de malla se necesitan?`,
          ans: ladoTri * 3,
          exp: `Perímetro del triángulo equilátero = 3 × ${ladoTri} m = ${ladoTri * 3} metros.`
        },
        {
          prompt: `Para decorar el marco de un diario mural cuadrado de ${ladoCuad}0 cm por lado, ¿cuántos centímetros de cinta tricolor se requieren para rodear los 4 bordes?`,
          ans: ladoCuad * 40,
          exp: `Perímetro = 4 × ${ladoCuad}0 cm = ${ladoCuad * 40} cm.`
        },
        {
          prompt: `Un estudiante corre ${vueltas} vueltas completas alrededor de una multicancha rectangular de ${a} m de largo y ${b} m de ancho. ¿Cuántos metros recorre en total?`,
          ans: perimRec * vueltas,
          exp: `Una vuelta mide ${perimRec} m. En ${vueltas} vueltas: ${perimRec} × ${vueltas} = ${perimRec * vueltas} m.`
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
    const base = randInt(4, 14);
    const altura = randInt(3, 9);
    const areaRec = base * altura;
    const v = Math.abs(variant);

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `Calcula el ÁREA de un rectángulo de base ${base} cm y altura ${altura} cm:`,
        context: `Área = ${base} × ${altura}`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: areaRec.toString(),
        explanation: `Área = base × altura = ${base} × ${altura} = ${areaRec} cm².`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const evenBase = base % 2 === 0 ? base : base + 1;
      const areaTri = (evenBase * altura) / 2;
      return {
        id: qId,
        prompt: `Calcula el área de un triángulo con base de ${evenBase} cm y altura de ${altura} cm:`,
        context: `Área = (${evenBase} × ${altura}) ÷ 2`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: areaTri.toString(),
        explanation: `Área del triángulo = (${evenBase} × ${altura}) ÷ 2 = ${(evenBase * altura)} ÷ 2 = ${areaTri} cm².`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const ladoCuad = randInt(5, 13);
      const evenBase = base % 2 === 0 ? base : base + 1;
      const scenarios = [
        {
          prompt: `En la sala de clases de la escuela se van a instalar baldosas en un piso rectangular de ${base} metros de largo y ${altura} metros de ancho. ¿Cuál es el área total en m² que se cubrirá?`,
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
          prompt: `Un mural rectangular mide ${base} m de largo por ${altura} m de alto. Si el valor para pintarlo es de $1.000 por cada m², ¿cuánto cuesta pintar todo el mural?`,
          ans: areaRec * 1000,
          exp: `Área = ${areaRec} m². Costo = ${areaRec} × $1.000 = $${areaRec * 1000}.`
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
    const l = randInt(2, 6);
    const w = randInt(2, 5);
    const h = randInt(2, 4);
    const vol = l * w * h;
    const v = Math.abs(variant);

    if (level === 'facil') {
      const kg = randInt(2, 9);
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
    } else if (level === 'medio') {
      return {
        id: qId,
        prompt: `Calcula el volumen de un prisma recto con dimensiones ${l} cm de largo, ${w} cm de ancho y ${h} cm de alto:`,
        context: `V = ${l} × ${w} × ${h}`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: vol.toString(),
        explanation: `Volumen = largo × ancho × alto = ${l} × ${w} × ${h} = ${vol} cm³.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const litros = randInt(2, 4);
      const bebido = randChoice([350, 500, 650, 750]);
      const kgHarina = randInt(3, 6);
      const usadoG = randChoice([400, 750, 800]);
      const scenarios = [
        {
          prompt: `${name} tiene un bidón con ${litros} litros de agua para el taller deportivo. Si ya repartió ${bebido} mililitros (mL), ¿cuántos mililitros de agua quedan?`,
          ans: litros * 1000 - bebido,
          exp: `${litros} L = ${litros * 1000} mL. Restamos ${bebido} mL: quedan ${litros * 1000 - bebido} mL.`
        },
        {
          prompt: `Una caja de acrílico para maqueta mide ${l}0 cm de largo, ${w}0 cm de ancho y ${h} cm de alto. ¿Cuál es su volumen en cm³?`,
          ans: l * 10 * w * 10 * h,
          exp: `${l * 10} × ${w * 10} × ${h} = ${l * 10 * w * 10 * h} cm³.`
        },
        {
          prompt: `En el taller de gastronomía escolar tenían ${kgHarina} kg de azúcar y ocuparon ${usadoG} gramos en un postre. ¿Cuántos gramos de azúcar quedaron?`,
          ans: kgHarina * 1000 - usadoG,
          exp: `${kgHarina} kg = ${kgHarina * 1000} g. Restamos ${usadoG} g: ${kgHarina * 1000 - usadoG} g.`
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

  // 33. Tablas, Gráficos y Pictogramas
  tablas_graficos_pictogramas: (level, grade, oa, qId, variant) => {
    const c1 = randInt(4, 10);
    const c2 = randInt(11, 16);
    const c3 = randInt(2, 8);
    const total = c1 + c2 + c3;
    const v = Math.abs(variant);

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `En una votación del curso: Fútbol obtuvo ${c1} votos, Básquetbol obtuvo ${c2} votos y Atletismo obtuvo ${c3} votos. ¿Cuál fue el deporte que obtuvo la MAYOR cantidad de preferencias?`,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle(['Básquetbol', 'Fútbol', 'Atletismo']),
        correctAnswer: 'Básquetbol',
        explanation: `Básquetbol obtuvo ${c2} votos, superando a Fútbol (${c1}) y Atletismo (${c3}).`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const diff = Math.abs(c2 - c1);
      return {
        id: qId,
        prompt: `En una tabla de frecuencias del curso, Fútbol registró ${c1} votos y Básquetbol ${c2} votos. ¿Cuántos votos más obtuvo el deporte ganador respecto a Fútbol?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: diff.toString(),
        explanation: `Diferencia de preferencias: ${c2} - ${c1} = ${diff} votos.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const escala = randChoice([2, 3, 4, 5]);
      const iconos = randInt(3, 7);
      const scenarios = [
        {
          prompt: `En una encuesta escolar en la Escuela Ricardo Silva Arriagada se registraron los votos de los tres deportes favoritos: Fútbol (${c1}), Básquetbol (${c2}) y Atletismo (${c3}). ¿Cuántos estudiantes participaron en total?`,
          ans: total,
          exp: `Sumamos todos los votos: ${c1} + ${c2} + ${c3} = ${total} estudiantes.`
        },
        {
          prompt: `En un pictograma sobre árboles plantados en Arica, cada dibujo de árbol representa ${escala} árboles reales. Si la fila del mes de septiembre muestra ${iconos} dibujos, ¿cuántos árboles se plantaron en septiembre?`,
          ans: escala * iconos,
          exp: `${iconos} íconos × ${escala} árboles por ícono = ${escala * iconos} árboles.`
        },
        {
          prompt: `Un gráfico de barras muestra la venta de colaciones saludables: lunes ${c1}, martes ${c2} y miércoles ${c3}. ¿Cuántas colaciones más se vendieron el día de mayor venta comparado con el día de menor venta?`,
          ans: c2 - Math.min(c1, c3),
          exp: `${c2} - ${Math.min(c1, c3)} = ${c2 - Math.min(c1, c3)} colaciones.`
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

  // 34. Estadística y Tendencia Central
  estadistica_tendencia_central: (level, grade, oa, qId, variant) => {
    const base = randInt(4, 7);
    const other = base + randInt(1, 2);
    const data = shuffle([base, base, base, other, other]);
    const v = Math.abs(variant);

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `En el siguiente conjunto de datos, ¿cuál es la MODA (el valor que más se repite)?`,
        context: data.join(', '),
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: base.toString(),
        explanation: `El número ${base} se repite 3 veces, siendo el dato con mayor frecuencia.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      const m = randInt(4, 7);
      const n1 = m - 1;
      const n2 = m;
      const n3 = m + 1;
      return {
        id: qId,
        prompt: `Calcula el promedio (media aritmética) de las siguientes tres notas: ${n1}, ${n2} y ${n3}:`,
        context: `(${n1} + ${n2} + ${n3}) ÷ 3 = ?`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: m.toString(),
        explanation: `Sumamos las notas: ${n1 + n2 + n3}. Dividimos por 3: ${m}.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const name = randChoice(CHILEAN_NAMES);
      const targetAvg = randChoice([5.0, 5.5, 6.0]);
      const nota3 = randChoice([6.0, 6.5, 7.0]);
      const nota1 = Math.round((targetAvg * 3 - nota3 - 5.0) * 10) / 10;
      const edades = [randInt(9, 10), randInt(10, 11), randInt(11, 12), randInt(12, 13), randInt(13, 14)].sort((x, y) => x - y);
      const tempAvg = randInt(18, 25);
      const scenarios = [
        {
          prompt: `${name} tiene dos notas en matemáticas: ${formatDec(nota1)} y 5,0. ¿Qué nota necesita obtener en su tercera prueba para que su promedio final sea exactamente ${formatDec(targetAvg)}?`,
          ans: formatDec(nota3),
          exp: `Para promedio ${formatDec(targetAvg)} con 3 notas, la suma debe ser ${formatDec(targetAvg * 3)}. Resta: ${formatDec(targetAvg * 3)} - ${formatDec(nota1 + 5.0)} = ${formatDec(nota3)}.`
        },
        {
          prompt: `Las edades de cinco integrantes de un equipo escolar de debate son: ${edades.join(', ')} años. ¿Cuál es la MEDIANA de estas edades?`,
          ans: edades[2].toString(),
          exp: `Al ordenar los 5 datos de menor a mayor, el valor central (posición 3) es ${edades[2]} años.`
        },
        {
          prompt: `Durante 4 días en Arica se registraron temperaturas máximas cuyo promedio fue ${tempAvg}°C. ¿Cuál fue la suma total de esas 4 temperaturas?`,
          ans: (tempAvg * 4).toString(),
          exp: `Promedio × cantidad de datos = ${tempAvg} × 4 = ${tempAvg * 4}°C.`
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

  // 35. Probabilidad y Azar
  probabilidad_azar: (level, grade, oa, qId, variant) => {
    const rojas = randInt(2, 6);
    const azules = randInt(3, 8);
    const total = rojas + azules;
    const v = Math.abs(variant);

    if (level === 'facil') {
      return {
        id: qId,
        prompt: `Al lanzar una moneda común equilibrada al aire, ¿cuál de los siguientes es un resultado posible?`,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle(['Cara o Sello', 'Siempre sale Cara', 'Imposible que caiga', 'Sale un número del 1 al 6']),
        correctAnswer: 'Cara o Sello',
        explanation: `Los dos únicos eventos posibles al lanzar una moneda son Cara o Sello.`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 1: Ejercitación Básica'
      };
    } else if (level === 'medio') {
      return {
        id: qId,
        prompt: `En una caja opaca hay ${rojas} fichas rojas y ${azules} fichas azules. ¿Cuántos casos favorables existen para extraer al azar una ficha roja?`,
        context: `${rojas} rojas · ${azules} azules`,
        visualType: 'none',
        questionType: 'numeric',
        correctAnswer: rojas.toString(),
        explanation: `El número de casos favorables para el evento corresponde exactamente a la cantidad de fichas rojas presentes (${rojas}).`,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 2: Aplicación Intermedia'
      };
    } else {
      const verdes = randInt(2, 5);
      const bolsaTotal = rojas + azules + verdes;
      const scenarios = [
        {
          prompt: `En una ruleta de la kermesse escolar hay ${total} sectores iguales: ${rojas} son de color rojo y ${azules} son de color azul. ¿Cuál es la probabilidad de que al girar la ruleta salga el color rojo?`,
          ans: `${rojas}/${total}`,
          opts: [`${rojas}/${total}`, `${azules}/${total}`, `1/${total}`, `${rojas}/${azules}`],
          exp: `Regla de Laplace: Casos favorables (${rojas}) dividido por casos totales (${total}) = ${rojas}/${total}.`
        },
        {
          prompt: `En una urna cerrada hay ${rojas} bolitas amarillas, ${azules} bolitas azules y ${verdes} bolitas verdes. Si se saca una bolita sin mirar, ¿cuál es la probabilidad de obtener una bolita verde?`,
          ans: `${verdes}/${bolsaTotal}`,
          opts: [`${verdes}/${bolsaTotal}`, `${rojas}/${bolsaTotal}`, `1/${verdes}`, `${verdes}/${rojas + azules}`],
          exp: `Total de bolitas = ${bolsaTotal}. Casos favorables verdes = ${verdes}. Probabilidad: ${verdes}/${bolsaTotal}.`
        },
        {
          prompt: `Al lanzar un dado común de 6 caras numeradas del 1 al 6, ¿cuál es la probabilidad de obtener un número mayor que 4?`,
          ans: `2/6`,
          opts: [`2/6`, `1/6`, `4/6`, `3/6`],
          exp: `Los números mayores que 4 son {5, 6}, es decir, 2 casos favorables de 6 totales (2/6).`
        }
      ];
      const chosen = scenarios[v % scenarios.length];
      return {
        id: qId,
        prompt: chosen.prompt,
        visualType: 'none',
        questionType: 'multiple_choice',
        options: shuffle(chosen.opts),
        correctAnswer: chosen.ans,
        explanation: chosen.exp,
        oaCode: oa.code,
        difficulty: level,
        categoryLabel: 'Nivel 3: Resolución de Problemas'
      };
    }
  }
};

// -------------------------------------------------------------
// PUBLIC GENERATOR FUNCTIONS
// -------------------------------------------------------------
export function generateQuestionsForOA(params: GenerationParams): Question[] {
  const { grade, oaCode, difficulty, count } = params;

  // Retrieve objective metadata
  const oaObj =
    MINEDUC_OBJECTIVES.find(o => o.code === oaCode && o.grade === grade) ||
    MINEDUC_OBJECTIVES.find(o => o.code === oaCode) ||
    MINEDUC_OBJECTIVES[0];

  const topicKey = classifyOATopic(oaObj);
  const generator = TOPIC_GENERATORS[topicKey];

  const questions: Question[] = [];
  const seenSignatures = new Set<string>();
  const seedOffset = randInt(0, 99);

  for (let i = 0; i < count; i++) {
    // Determine level for this question
    let questionLevel: 'facil' | 'medio' | 'dificil';
    if (difficulty === 'progresivo') {
      const ratio = i / count;
      if (ratio < 0.35) {
        questionLevel = 'facil'; // Nivel 1: Ejercitación Básica
      } else if (ratio < 0.70) {
        questionLevel = 'medio'; // Nivel 2: Aplicación Intermedia
      } else {
        questionLevel = 'dificil'; // Nivel 3: Resolución de Problemas
      }
    } else {
      questionLevel = difficulty;
    }

    let question: Question | null = null;
    let attempts = 0;

    while (attempts < 40) {
      attempts++;
      const qId = `q_${grade}_${oaCode}_${questionLevel}_${i + 1}_${Math.random().toString(36).substring(2, 7)}`;
      const candidate = generator(questionLevel, grade, oaObj, qId, seedOffset + i + (attempts - 1));

      const sig = `${candidate.prompt}::${candidate.context || ''}::${candidate.correctAnswer}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        question = candidate;
        break;
      }
    }

    if (!question) {
      const qId = `q_${grade}_${oaCode}_${questionLevel}_${i + 1}_${Date.now()}`;
      question = generator(questionLevel, grade, oaObj, qId, seedOffset + i + 99);
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

  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    const qId = `q_single_${grade}_${oaCode}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const candidate = generator(questionLevel, grade, oaObj, qId, randInt(1, 200));

    const sig = `${candidate.prompt}::${candidate.context || ''}::${candidate.correctAnswer}`;
    if (!seenSignatures.has(sig)) {
      return candidate;
    }
  }

  const qId = `q_single_fallback_${Date.now()}`;
  return generator(questionLevel, grade, oaObj, qId, randInt(300, 999));
}
