import {
  DifficultyLevel,
  SimceGradeLevel,
  SimceSkill,
  ThematicAxis,
} from '../types';
import type { SimceBankQuestion } from './simceQuestionBank';

// ---------------------------------------------------------------------------
// Seeded & Live RNG Abstraction
// ---------------------------------------------------------------------------
interface Rng {
  next: () => number;
  int: (min: number, max: number) => number;
  choice: <T>(arr: readonly T[]) => T;
  shuffle: <T>(arr: readonly T[]) => T[];
}

function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seed?: number): Rng {
  const next = seed !== undefined ? createMulberry32(seed) : Math.random;
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  const choice = <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)];
  const shuffle = <T>(arr: readonly T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  return { next, int, choice, shuffle };
}

// ---------------------------------------------------------------------------
// Formatting Helpers (Chilean School Conventions)
// ---------------------------------------------------------------------------
const NAMES = [
  'Camila', 'Tomás', 'Florencia', 'Diego', 'Martina', 'Benjamín',
  'Sofía', 'Lucas', 'Javiera', 'Vicente', 'Isidora', 'Agustín',
  'Catalina', 'Mateo', 'Emilia', 'Joaquín', 'Valentina', 'Matías',
  'Antonia', 'Sebastián', 'Renata', 'Gabriel', 'Maite', 'Alonso',
];

function fmtCLP(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL').replace(/\./g, ' ');
}

function fmtInt(n: number): string {
  const absStr = Math.abs(Math.round(n)).toString();
  const formatted = absStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return n < 0 ? `−${formatted}` : formatted;
}

function fmtDec(n: number, decimals = 2): string {
  const rounded = Number(n.toFixed(decimals));
  return rounded.toString().replace('.', ',');
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function buildOptions(
  correct: string,
  candidates: string[],
  rng: Rng,
  fallbackGen?: (idx: number) => string
): string[] {
  const uniqueDistractors: string[] = [];
  for (const c of candidates) {
    if (c && c !== correct && !uniqueDistractors.includes(c)) {
      uniqueDistractors.push(c);
    }
  }
  let guard = 1;
  while (uniqueDistractors.length < 3 && guard < 40) {
    const fallback = fallbackGen ? fallbackGen(guard) : `${correct} (${guard})`;
    if (fallback !== correct && !uniqueDistractors.includes(fallback)) {
      uniqueDistractors.push(fallback);
    }
    guard++;
  }
  return rng.shuffle([correct, ...uniqueDistractors.slice(0, 3)]);
}

function numericOptions(
  correctVal: number,
  offsets: number[],
  formatter: (v: number) => string,
  rng: Rng,
  allowNegative = false
): { options: string[]; correctAnswer: string } {
  const correct = formatter(correctVal);
  const candidates = offsets
    .map(o => correctVal + o)
    .filter(v => allowNegative || v >= 0)
    .map(formatter);
  const options = buildOptions(correct, candidates, rng, idx =>
    formatter(Math.max(allowNegative ? -9999 : 1, correctVal + idx * 3 + 1))
  );
  return { options, correctAnswer: correct };
}

type TemplateFn = (rng: Rng, id: string) => SimceBankQuestion;

interface SimceTemplate {
  key: string;
  grade: SimceGradeLevel;
  axis: ThematicAxis;
  difficulty: DifficultyLevel;
  build: TemplateFn;
}

function makeItem(
  base: Omit<SimceBankQuestion, 'isSimce' | 'questionType' | 'categoryLabel'> & {
    categoryLabel?: string;
  }
): SimceBankQuestion {
  return {
    ...base,
    isSimce: true,
    questionType: 'multiple_choice',
    categoryLabel: base.categoryLabel || 'SIMCE · Variación paramétrica',
  };
}

// ===========================================================================
// 4° BÁSICO TEMPLATES (41 arquetipos paramétricos across 5 axes)
// ===========================================================================
const TEMPLATES_4B: SimceTemplate[] = [
  // --- NÚMEROS Y OPERACIONES (9) ---
  {
    key: '4b-num-valor-posicional',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    difficulty: 'facil',
    build: (rng, id) => {
      const digits = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
      const num = digits[0] * 1000 + digits[1] * 100 + digits[2] * 10 + digits[3];
      const posIdx = rng.choice([0, 1, 2]); // UM, C, D
      const mult = posIdx === 0 ? 1000 : posIdx === 1 ? 100 : 10;
      const posName = posIdx === 0 ? 'unidades de mil' : posIdx === 1 ? 'centenas' : 'decenas';
      const d = digits[posIdx];
      const ans = d * mult;
      const { options, correctAnswer } = numericOptions(
        ans,
        [d - ans, d * 10 - ans, d * 100 - ans, d * 1000 - ans, mult],
        fmtInt,
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 01',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Valor posicional)',
        categoryLabel: 'SIMCE · Valor posicional',
        prompt: `¿Cuál es el valor posicional del dígito ${d} en el número ${fmtInt(num)}?`,
        context: fmtInt(num),
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `En el número ${fmtInt(num)}, el dígito ${d} ocupa el lugar de las ${posName}, por lo que su valor es ${d} × ${fmtInt(mult)} = ${fmtInt(ans)}.`,
      });
    },
  },
  {
    key: '4b-num-descomposicion',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    difficulty: 'facil',
    build: (rng, id) => {
      const um = rng.int(1, 8);
      const c = rng.int(0, 9);
      const d = rng.int(1, 9);
      const u = rng.int(1, 9);
      const ans = um * 1000 + c * 100 + d * 10 + u;
      const { options, correctAnswer } = numericOptions(
        ans,
        [
          um * 1000 + d * 100 + c * 10 + u - ans,
          um * 100 + c * 10 + d + u - ans,
          100,
          -10,
          90,
        ],
        fmtInt,
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 01',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Composición numérica)',
        categoryLabel: 'SIMCE · Números',
        prompt: `¿Qué número se forma con ${um} unidades de mil, ${c} centenas, ${d} decenas y ${u} unidades?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `${um} × 1 000 + ${c} × 100 + ${d} × 10 + ${u} = ${fmtInt(ans)}.`,
      });
    },
  },
  {
    key: '4b-num-dinero-vuelto',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    difficulty: 'medio',
    build: (rng, id) => {
      const name = rng.choice(NAMES);
      const item = rng.choice(['cuadernos', 'lápices pasta', 'jugos naturales', 'carpetas', 'colaciones']);
      const qty = rng.int(2, 5);
      const unitPrice = rng.choice([650, 800, 950, 1100, 1250, 1400, 1500, 1750, 2100]);
      const spent = qty * unitPrice;
      const bill = spent <= 5000 ? rng.choice([5000, 10000]) : rng.choice([10000, 20000]);
      const change = bill - spent;
      const { options, correctAnswer } = numericOptions(
        change,
        [-spent + bill === change ? -1000 : -500, unitPrice - change, spent - change, 1000, -1000, 500],
        fmtCLP,
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 03',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Dinero y vuelto)',
        categoryLabel: 'SIMCE · Dinero y vuelto',
        prompt: `${name} pagó con un billete de ${fmtCLP(bill)} al comprar ${qty} ${item} de ${fmtCLP(unitPrice)} cada uno. ¿Cuánto dinero recibió de vuelto?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Los ${qty} ${item} cuestan ${qty} × ${fmtCLP(unitPrice)} = ${fmtCLP(spent)}. El vuelto es ${fmtCLP(bill)} − ${fmtCLP(spent)} = ${fmtCLP(change)}.`,
      });
    },
  },
  {
    key: '4b-num-reparto-modelamiento',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    difficulty: 'medio',
    build: (rng, id) => {
      const name = rng.choice(NAMES);
      const friends = rng.int(2, 5);
      const totalPeople = friends + 1;
      const perPerson = rng.int(4, 12);
      const total = totalPeople * perPerson;
      const obj = rng.choice(['láminas', 'dulces', 'galletas', 'fichas', 'autoadhesivos']);
      const correct = `${total} : ${totalPeople}`;
      const options = buildOptions(
        correct,
        [`${total} : ${friends}`, `${total} · ${totalPeople}`, `${total} − ${totalPeople}`, `${total} + ${friends}`],
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 06',
        difficulty: 'medio',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Modelamiento división)',
        categoryLabel: 'SIMCE · Modelamiento',
        prompt: `${name} reparte ${total} ${obj} en partes iguales entre él/ella y sus ${friends} amigos. ¿Qué operación permite calcular cuántas ${obj} recibe cada persona?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `En total son ${friends} + 1 = ${totalPeople} personas. Repartir ${total} en partes iguales entre ${totalPeople} corresponde a ${total} : ${totalPeople}.`,
      });
    },
  },
  {
    key: '4b-num-multiplicacion-matriz',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    difficulty: 'facil',
    build: (rng, id) => {
      const rows = rng.int(4, 9);
      const cols = rng.int(5, 11);
      const ans = rows * cols;
      const obj = rng.choice(['sillas en el gimnasio', 'árboles en el huerto', 'baldosas pintadas', 'cajas en la bodega']);
      const { options, correctAnswer } = numericOptions(
        ans,
        [rows + cols - ans, rows, -cols, (rows - 1) * cols - ans, rows * (cols + 1) - ans],
        fmtInt,
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 05',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Arreglo rectangular)',
        categoryLabel: 'SIMCE · Multiplicación',
        prompt: `En la imagen se ordenaron ${obj} en ${rows} filas con ${cols} elementos en cada fila. ¿Cuántos hay en total?`,
        visualType: 'grid_multiplication',
        visualData: { rows, cols },
        options,
        correctAnswer,
        explanation: `Un arreglo rectangular de ${rows} filas por ${cols} columnas tiene ${rows} × ${cols} = ${ans} elementos.`,
      });
    },
  },
  {
    key: '4b-num-fraccion-barra',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    difficulty: 'medio',
    build: (rng, id) => {
      const den = rng.choice([4, 5, 6, 8, 10]);
      const num = rng.int(1, den - 2);
      const left = den - num;
      const askRemaining = rng.next() > 0.5;
      const targetNum = askRemaining ? left : num;
      const correct = `${targetNum}/${den}`;
      const options = buildOptions(
        correct,
        [`${askRemaining ? num : left}/${den}`, `${num}/${left}`, `${den}/${targetNum}`, `1/${den}`],
        rng,
        k => `${Math.min(den, k)}/${den + 1}`
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 08',
        difficulty: 'medio',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Fracciones)',
        categoryLabel: 'SIMCE · Fracciones',
        prompt: askRemaining
          ? 'La barra muestra la fracción de un chocolate que ya se comió (parte sombreada). ¿Qué fracción del chocolate queda SIN comer?'
          : 'Observa la barra dividida en partes iguales. ¿Qué fracción representa la parte sombreada?',
        visualType: 'fraction_bar',
        visualData: { numerator: num, denominator: den },
        options,
        correctAnswer: correct,
        explanation: askRemaining
          ? `La barra tiene ${den} partes iguales y ${num} están sombreadas. Quedan ${den} − ${num} = ${left} partes sin comer, es decir, ${left}/${den}.`
          : `De ${den} partes iguales, hay ${num} partes pintadas, lo que representa la fracción ${num}/${den}.`,
      });
    },
  },
  {
    key: '4b-num-dos-pasos',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    difficulty: 'dificil',
    build: (rng, id) => {
      const name = rng.choice(NAMES);
      const initial = rng.int(180, 450);
      const sold = rng.int(65, 145);
      const arrived = rng.int(40, 120);
      const finalAmt = initial - sold + arrived;
      const item = rng.choice(['libros en la biblioteca', 'empanadas en el quiosco', 'botellas de agua', 'cuadernos en bodega']);
      const { options, correctAnswer } = numericOptions(
        finalAmt,
        [-2 * arrived, 2 * sold, sold - arrived, 20, -20],
        fmtInt,
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 03',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Problemas 2 pasos)',
        categoryLabel: 'SIMCE · Problemas',
        prompt: `Al comenzar la semana había ${initial} ${item}. Durante los primeros días se entregaron ${sold} y luego llegaron ${arrived} más para reponer. ¿Cuántos hay ahora en total?`,
        context: `${name} registró el inventario semanal.`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Primero restamos los entregados: ${initial} − ${sold} = ${initial - sold}. Luego sumamos los que llegaron: ${initial - sold} + ${arrived} = ${finalAmt}.`,
      });
    },
  },
  {
    key: '4b-num-division-resto',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    difficulty: 'dificil',
    build: (rng, id) => {
      const cap = rng.choice([4, 6, 8, 9]);
      const full = rng.int(4, 9);
      const rem = rng.int(1, cap - 1);
      const total = cap * full + rem;
      const ans = full + 1;
      const { options, correctAnswer } = numericOptions(ans, [-1, 1, 2, -2], n => `${n} furgones`, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 06',
        difficulty: 'dificil',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (División e interpretación de resto)',
        categoryLabel: 'SIMCE · División con resto',
        prompt: `Un curso de ${total} estudiantes irá a una salida pedagógica en furgones escolares con capacidad máxima de ${cap} pasajeros cada uno. ¿Cuántos furgones se necesitan como mínimo para trasladar a TODOS los estudiantes?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `${total} : ${cap} = ${full} furgones completos y sobran ${rem} estudiantes. Para que nadie quede fuera, se necesita 1 furgón adicional: ${full} + 1 = ${ans} furgones.`,
      });
    },
  },
  {
    key: '4b-num-decimales-suma',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    difficulty: 'medio',
    build: (rng, id) => {
      const a = rng.int(12, 48) / 10; // 1.2 .. 4.8
      const b = rng.int(11, 39) / 10;
      const sum = Number((a + b).toFixed(1));
      const name = rng.choice(NAMES);
      const { options, correctAnswer } = numericOptions(
        sum,
        [-0.9, 1, -1, 0.2, 1.1],
        v => `${fmtDec(v, 1)} L`,
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 12',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Decimales en contexto)',
        categoryLabel: 'SIMCE · Decimales',
        prompt: `${name} mezcló ${fmtDec(a, 1)} litros de jugo de naranja con ${fmtDec(b, 1)} litros de agua mineral. ¿Cuántos litros de bebida preparó en total?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Sumamos alineando la coma decimal: ${fmtDec(a, 1)} + ${fmtDec(b, 1)} = ${fmtDec(sum, 1)} L.`,
      });
    },
  },

  // --- PATRONES Y ÁLGEBRA (8) ---
  {
    key: '4b-alg-secuencia-aritmetica',
    grade: '4_basico',
    axis: 'patrones_algebra',
    difficulty: 'facil',
    build: (rng, id) => {
      const isUp = rng.next() > 0.35;
      const step = rng.choice([4, 6, 7, 8, 9, 12, 15, 25]);
      const start = isUp ? rng.int(12, 65) : rng.int(120, 260);
      const s = isUp ? step : -step;
      const seq = [0, 1, 2, 3, 4].map(i => start + i * s);
      const missingIdx = rng.choice([2, 3, 4]);
      const ans = seq[missingIdx];
      const shown = seq.map((v, i) => (i === missingIdx ? '?' : String(v))).join(' ,  ');
      const { options, correctAnswer } = numericOptions(
        ans,
        [s, -s, 2, -3, s + 2],
        fmtInt,
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 13',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Patrones numéricos)',
        categoryLabel: 'SIMCE · Secuencias',
        prompt: `Observa la secuencia que sigue un patrón constante. ¿Cuál es el número que reemplaza al signo "?"?\n${shown}`,
        context: shown,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El patrón ${isUp ? 'suma' : 'resta'} ${step} en cada paso. Por eso el término buscado es ${ans}.`,
      });
    },
  },
  {
    key: '4b-alg-balanza-suma',
    grade: '4_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const x = rng.int(9, 34);
      const add = rng.int(12, 45);
      const total = x + add;
      const { options, correctAnswer } = numericOptions(x, [add, -5, 4, total - x, 10], fmtInt, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 14',
        difficulty: 'medio',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Balanza y ecuaciones)',
        categoryLabel: 'SIMCE · Ecuaciones',
        prompt: `La balanza está en equilibrio. Si ambos platos tienen el mismo peso total, ¿cuánto vale □?`,
        visualType: 'balance_equation',
        visualData: { left: `□ + ${add}`, right: String(total) },
        options,
        correctAnswer,
        explanation: `Para equilibrar la balanza, □ + ${add} = ${total}. Restando ${add} en ambos lados: □ = ${total} − ${add} = ${x}.`,
      });
    },
  },
  {
    key: '4b-alg-balanza-mult',
    grade: '4_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const k = rng.int(3, 7);
      const x = rng.int(4, 15);
      const total = k * x;
      const { options, correctAnswer } = numericOptions(x, [total - k - x, k, -2, 3, total / k + 4 - x], fmtInt, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 14',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Balanza multiplicativa)',
        categoryLabel: 'SIMCE · Ecuaciones',
        prompt: `En la balanza en equilibrio hay ${k} cajas iguales de masa □ que equivalen a ${total} kg. ¿Cuál es la masa de una caja □?`,
        visualType: 'balance_equation',
        visualData: { left: `${k} · □`, right: `${total}` },
        options,
        correctAnswer,
        explanation: `Como ${k} · □ = ${total}, dividimos ${total} : ${k} = ${x} kg.`,
      });
    },
  },
  {
    key: '4b-alg-tabla-regla',
    grade: '4_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const isMult = rng.next() > 0.5;
      const k = isMult ? rng.int(3, 7) : rng.int(7, 19);
      const inputs = [2, 4, 6, 9];
      const outputs = inputs.map(n => (isMult ? n * k : n + k));
      const rows = inputs.map((n, i) => [String(n), i === 3 ? '?' : String(outputs[i])]);
      const ans = outputs[3];
      const { options, correctAnswer } = numericOptions(ans, [isMult ? k : 3, -k, 2, -4, 6], fmtInt, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 13',
        difficulty: 'medio',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Tabla de patrones)',
        categoryLabel: 'SIMCE · Tablas y patrones',
        prompt: `Observa cómo la máquina matemática transforma cada número de entrada en uno de salida según una regla fija. ¿Qué número falta en lugar de "?"?`,
        visualType: 'table_data',
        visualData: {
          title: 'Máquina de Reglas',
          headers: ['Entrada', 'Salida'],
          rows,
        },
        options,
        correctAnswer,
        explanation: isMult
          ? `La regla multiplica cada entrada por ${k}. Por lo tanto, 9 × ${k} = ${ans}.`
          : `La regla suma ${k} a cada entrada. Por lo tanto, 9 + ${k} = ${ans}.`,
      });
    },
  },
  {
    key: '4b-alg-inecuacion',
    grade: '4_basico',
    axis: 'patrones_algebra',
    difficulty: 'dificil',
    build: (rng, id) => {
      const add = rng.int(6, 18);
      const limit = add + rng.int(7, 21);
      const maxValid = limit - add - 1;
      const { options, correctAnswer } = numericOptions(maxValid, [1, 2, -1, limit - maxValid], fmtInt, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 14',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Inecuaciones)',
        categoryLabel: 'SIMCE · Inecuaciones',
        prompt: `¿Cuál es el MAYOR número entero positivo que puede reemplazar a x para que se cumpla la desigualdad  x + ${add} < ${limit}?`,
        context: `x + ${add} < ${limit}`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Si x + ${add} = ${limit}, entonces x = ${limit - add}. Como debe ser estrictamente menor (<), el mayor entero posible es ${maxValid} (${maxValid} + ${add} = ${maxValid + add} < ${limit}).`,
      });
    },
  },
  {
    key: '4b-alg-inecuacion-contexto',
    grade: '4_basico',
    axis: 'patrones_algebra',
    difficulty: 'dificil',
    build: (rng, id) => {
      const name = rng.choice(NAMES);
      const saved = rng.choice([2500, 3200, 4100, 5400]);
      const itemPrice = saved + rng.choice([1200, 1500, 1800, 2300]);
      const minExtra = itemPrice - saved;
      const { options, correctAnswer } = numericOptions(
        minExtra,
        [-300, 500, itemPrice - minExtra, -500],
        fmtCLP,
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 14',
        difficulty: 'dificil',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Inecuación en contexto)',
        categoryLabel: 'SIMCE · Inecuaciones',
        prompt: `${name} tiene ahorrados ${fmtCLP(saved)} y necesita reunir AL MENOS ${fmtCLP(itemPrice)} para comprar un libro. ¿Cuánto dinero adicional como mínimo le falta juntar?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Planteamos ${fmtCLP(saved)} + x ≥ ${fmtCLP(itemPrice)}, de donde x ≥ ${fmtCLP(itemPrice)} − ${fmtCLP(saved)} = ${fmtCLP(minExtra)}.`,
      });
    },
  },
  {
    key: '4b-alg-patron-multiplicativo',
    grade: '4_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const factor = rng.choice([2, 3]);
      const start = rng.int(2, 5);
      const t1 = start;
      const t2 = t1 * factor;
      const t3 = t2 * factor;
      const t4 = t3 * factor;
      const t5 = t4 * factor;
      const { options, correctAnswer } = numericOptions(
        t5,
        [t4 + (t4 - t3) - t5, -factor * 3, factor * 4, t4 - t5],
        fmtInt,
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 13',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Patrón multiplicativo)',
        categoryLabel: 'SIMCE · Patrones',
        prompt: `En un experimento escolar, un cultivo crece siguiendo la secuencia: ${t1}, ${t2}, ${t3}, ${t4}, ... ¿Qué número continúa en el 5° lugar?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Cada término se obtiene multiplicando el anterior por ${factor}. Así, ${t4} × ${factor} = ${t5}.`,
      });
    },
  },
  {
    key: '4b-alg-ecuacion-resta',
    grade: '4_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const name = rng.choice(NAMES);
      const gave = rng.int(7, 19);
      const left = rng.int(14, 38);
      const initial = gave + left;
      const obj = rng.choice(['lápices de colores', 'bolitas', 'cartas coleccionables', 'figuras']);
      const { options, correctAnswer } = numericOptions(initial, [left - gave - initial, -4, 5, -gave], fmtInt, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 14',
        difficulty: 'medio',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Ecuación aditiva)',
        categoryLabel: 'SIMCE · Ecuaciones',
        prompt: `${name} regaló ${gave} ${obj} a su hermana y todavía le quedaron ${left}. ¿Cuántas ${obj} tenía al principio? (Modela con □ − ${gave} = ${left})`,
        visualType: 'balance_equation',
        visualData: { left: `□ − ${gave}`, right: String(left) },
        options,
        correctAnswer,
        explanation: `De □ − ${gave} = ${left}, sumamos ${left} + ${gave} = ${initial}.`,
      });
    },
  },

  // --- GEOMETRÍA (8) ---
  {
    key: '4b-geo-cuerpo-elementos',
    grade: '4_basico',
    axis: 'geometria',
    difficulty: 'facil',
    build: (rng, id) => {
      const specs = [
        { name: 'cubo', q: 'aristas', ans: 12, dist: [6, 8, 10], exp: 'Un cubo tiene 6 caras cuadradas, 8 vértices y 12 aristas.' },
        { name: 'prisma rectangular', q: 'vértices', ans: 8, dist: [6, 10, 12], exp: 'Un prisma rectangular tiene 6 caras, 8 vértices y 12 aristas.' },
        { name: 'pirámide de base cuadrada', q: 'caras en total (incluyendo su base)', ans: 5, dist: [4, 6, 8], exp: 'Tiene 1 base cuadrada y 4 caras laterales triangulares: 1 + 4 = 5 caras.' },
        { name: 'pirámide de base cuadrada', q: 'aristas', ans: 8, dist: [4, 5, 6], exp: 'Tiene 4 aristas en la base cuadrada y 4 aristas que suben a la cúspide: 8 aristas.' },
        { name: 'prisma triangular', q: 'caras en total', ans: 5, dist: [3, 6, 9], exp: 'Tiene 2 bases triangulares y 3 caras laterales rectangulares: 5 caras.' },
        { name: 'cilindro recto', q: 'caras planas circulares (bases)', ans: 2, dist: [0, 1, 3], exp: 'Un cilindro tiene 2 bases circulares planas y 1 superficie lateral curva.' },
      ];
      const spec = rng.choice(specs);
      const correct = String(spec.ans);
      const options = buildOptions(correct, spec.dist.map(String), rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'geometria',
        oaCode: 'OA 16',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Cuerpos 3D)',
        categoryLabel: 'SIMCE · Cuerpos 3D',
        prompt: `¿Cuántas ${spec.q} tiene un(a) ${spec.name}?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: spec.exp,
      });
    },
  },
  {
    key: '4b-geo-angulos-clasificacion',
    grade: '4_basico',
    axis: 'geometria',
    difficulty: 'facil',
    build: (rng, id) => {
      const choices = [
        { deg: rng.choice([25, 35, 45, 55, 70]), type: 'Ángulo agudo', reason: 'mide más de 0° y menos de 90°' },
        { deg: 90, type: 'Ángulo recto', reason: 'mide exactamente 90°' },
        { deg: rng.choice([105, 115, 125, 140, 155]), type: 'Ángulo obtuso', reason: 'mide más de 90° y menos de 180°' },
      ];
      const pick = rng.choice(choices);
      const options = buildOptions(pick.type, ['Ángulo agudo', 'Ángulo recto', 'Ángulo obtuso', 'Ángulo extendido'], rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'geometria',
        oaCode: 'OA 19',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Clasificación ángulos)',
        categoryLabel: 'SIMCE · Ángulos',
        prompt: `Observa el ángulo de ${pick.deg}° mostrado en la figura. ¿Cómo se clasifica según su medida?`,
        visualType: 'angle_figure',
        visualData: { kind: 'angle_arc', degrees: pick.deg, label: 'α' },
        options,
        correctAnswer: pick.type,
        explanation: `Se clasifica como ${pick.type.toLowerCase()} porque ${pick.reason}.`,
      });
    },
  },
  {
    key: '4b-geo-ejes-simetria',
    grade: '4_basico',
    axis: 'geometria',
    difficulty: 'medio',
    build: (rng, id) => {
      const figs = [
        { name: 'un cuadrado', ans: '4', dist: ['1', '2', '8'], exp: 'El cuadrado tiene 4 ejes de simetría (dos por los puntos medios de sus lados y dos por sus diagonales).' },
        { name: 'un rectángulo que no es cuadrado', ans: '2', dist: ['1', '4', '0'], exp: 'Un rectángulo no cuadrado tiene solo 2 ejes de simetría (las diagonales no coinciden al doblar).' },
        { name: 'un triángulo equilátero (3 lados iguales)', ans: '3', dist: ['1', '2', '6'], exp: 'El triángulo equilátero tiene 3 ejes de simetría, uno desde cada vértice al punto medio del lado opuesto.' },
        { name: 'un triángulo isósceles (solo 2 lados iguales)', ans: '1', dist: ['0', '2', '3'], exp: 'Solo tiene 1 eje de simetría, que pasa por el vértice entre los dos lados iguales.' },
      ];
      const f = rng.choice(figs);
      const options = buildOptions(f.ans, f.dist, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'geometria',
        oaCode: 'OA 17',
        difficulty: 'medio',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Simetría)',
        categoryLabel: 'SIMCE · Simetría',
        prompt: `¿Cuántos ejes de simetría tiene exactamente ${f.name}?`,
        visualType: 'none',
        options,
        correctAnswer: f.ans,
        explanation: f.exp,
      });
    },
  },
  {
    key: '4b-geo-traslacion-cuadricula',
    grade: '4_basico',
    axis: 'geometria',
    difficulty: 'medio',
    build: (rng, id) => {
      const x0 = rng.int(1, 5);
      const y0 = rng.int(1, 5);
      const dx = rng.int(2, 5);
      const dy = rng.int(1, 4);
      const x1 = x0 + dx;
      const y1 = y0 + dy;
      const correct = `(${x1}, ${y1})`;
      const options = buildOptions(
        correct,
        [`(${x0 + dy}, ${y0 + dx})`, `(${x1}, ${y0})`, `(${Math.max(0, x0 - dx)}, ${y1})`, `(${x1 + 1}, ${y1 - 1})`],
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'geometria',
        oaCode: 'OA 18',
        difficulty: 'medio',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Traslación)',
        categoryLabel: 'SIMCE · Transformaciones',
        prompt: `Una ficha está en el punto (${x0}, ${y0}) de un plano cuadriculado. Si se traslada ${dx} unidades hacia la derecha y ${dy} unidades hacia arriba, ¿en qué coordenada queda?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `Mover ${dx} a la derecha suma ${dx} a la primera coordenada (${x0} + ${dx} = ${x1}), y subir ${dy} suma ${dy} a la segunda (${y0} + ${dy} = ${y1}): queda en ${correct}.`,
      });
    },
  },
  {
    key: '4b-geo-redes-cuerpos',
    grade: '4_basico',
    axis: 'geometria',
    difficulty: 'medio',
    build: (rng, id) => {
      const nets = [
        { desc: '6 cuadrados congruentes unidos por sus lados', body: 'Un cubo', exp: 'Un cubo se arma exactamente con 6 cuadrados iguales.' },
        { desc: '1 cuadrado central y 4 triángulos unidos a sus lados', body: 'Una pirámide de base cuadrada', exp: 'La base cuadrada más 4 caras triangulares forman una pirámide de base cuadrada.' },
        { desc: '2 círculos y 1 rectángulo curvable', body: 'Un cilindro', exp: 'Los 2 círculos son las bases y el rectángulo forma el manto curvo del cilindro.' },
        { desc: '2 triángulos iguales y 3 rectángulos', body: 'Un prisma triangular', exp: 'Las 2 bases triangulares unidas por 3 caras rectangulares arman un prisma triangular.' },
      ];
      const pick = rng.choice(nets);
      const options = buildOptions(
        pick.body,
        ['Un cubo', 'Una pirámide de base cuadrada', 'Un cilindro', 'Un prisma triangular'],
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'geometria',
        oaCode: 'OA 16',
        difficulty: 'medio',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Redes geométricas)',
        categoryLabel: 'SIMCE · Redes 3D',
        prompt: `Con una red recortable formada por ${pick.desc}, ¿qué cuerpo geométrico se puede armar al doblar y pegar?`,
        visualType: 'none',
        options,
        correctAnswer: pick.body,
        explanation: pick.exp,
      });
    },
  },
  {
    key: '4b-geo-vistas-3d',
    grade: '4_basico',
    axis: 'geometria',
    difficulty: 'dificil',
    build: (rng, id) => {
      const cases = [
        { body: 'un cono apoyado sobre su base circular', view: 'desde ARRIBA (vista superior)', ans: 'Un círculo con un punto en el centro', dist: ['Un triángulo', 'Un cuadrado', 'Un rectángulo'], exp: 'Mirado desde arriba, el cono se ve como su base circular y la cúspide al centro.' },
        { body: 'un cilindro apoyado verticalmente sobre su base', view: 'desde el FRENTE (vista frontal)', ans: 'Un rectángulo', dist: ['Un círculo', 'Un triángulo', 'Un pentágono'], exp: 'Visto de frente a la altura de sus bases, el cilindro proyecta la silueta de un rectángulo.' },
        { body: 'una pirámide de base cuadrada', view: 'desde el FRENTE', ans: 'Un triángulo', dist: ['Un cuadrado', 'Un círculo', 'Un hexágono'], exp: 'Las caras laterales de la pirámide son triángulos, por lo que de frente se ve un triángulo.' },
      ];
      const c = rng.choice(cases);
      const options = buildOptions(c.ans, c.dist, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'geometria',
        oaCode: 'OA 15',
        difficulty: 'dificil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Vistas 2D de cuerpos 3D)',
        categoryLabel: 'SIMCE · Vistas 3D',
        prompt: `Si observas ${c.body} exactamente ${c.view}, ¿qué figura 2D se distingue?`,
        visualType: 'none',
        options,
        correctAnswer: c.ans,
        explanation: c.exp,
      });
    },
  },
  {
    key: '4b-geo-angulos-reloj',
    grade: '4_basico',
    axis: 'geometria',
    difficulty: 'medio',
    build: (rng, id) => {
      const cases = [
        { time: '3:00', deg: '90° (ángulo recto)', dist: ['45° (ángulo agudo)', '120° (ángulo obtuso)', '180° (ángulo extendido)'], exp: 'Entre las 12 y las 3 hay un cuarto de giro completo: 360° : 4 = 90°.' },
        { time: '2:00', deg: '60° (ángulo agudo)', dist: ['90° (ángulo recto)', '120° (ángulo obtuso)', '30° (ángulo agudo)'], exp: 'Cada hora en el reloj equivale a 30° (360° : 12). De 12 a 2 hay 2 × 30° = 60°.' },
        { time: '4:00', deg: '120° (ángulo obtuso)', dist: ['90° (ángulo recto)', '60° (ángulo agudo)', '180° (ángulo extendido)'], exp: 'Cada hora equivale a 30°. De 12 a 4 hay 4 × 30° = 120° (obtuso).' },
      ];
      const c = rng.choice(cases);
      const options = buildOptions(c.deg, c.dist, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'geometria',
        oaCode: 'OA 19',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Ángulos en reloj)',
        categoryLabel: 'SIMCE · Ángulos',
        prompt: `En un reloj de manecillas, ¿qué medida y tipo de ángulo forman el horario y el minutero exactamente a las ${c.time}?`,
        visualType: 'none',
        options,
        correctAnswer: c.deg,
        explanation: c.exp,
      });
    },
  },
  {
    key: '4b-geo-poligonos',
    grade: '4_basico',
    axis: 'geometria',
    difficulty: 'facil',
    build: (rng, id) => {
      const polys = [
        { name: 'Hexágono', sides: 6 },
        { name: 'Pentágono', sides: 5 },
        { name: 'Octágono', sides: 8 },
        { name: 'Cuadrilátero', sides: 4 },
      ];
      const pick = rng.choice(polys);
      const options = buildOptions(
        pick.name,
        polys.map(p => p.name).concat(['Triángulo']),
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'geometria',
        oaCode: 'OA 16',
        difficulty: 'facil',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Polígonos)',
        categoryLabel: 'SIMCE · Polígonos',
        prompt: `Una señalética escolar tiene forma de polígono plano con exactamente ${pick.sides} lados rectos y ${pick.sides} vértices. ¿Cuál es su nombre?`,
        visualType: 'none',
        options,
        correctAnswer: pick.name,
        explanation: `Todo polígono de ${pick.sides} lados y ${pick.sides} vértices se denomina ${pick.name.toLowerCase()}.`,
      });
    },
  },

  // --- MEDICIÓN (8) ---
  {
    key: '4b-med-cm-a-m',
    grade: '4_basico',
    axis: 'medicion',
    difficulty: 'facil',
    build: (rng, id) => {
      const meters = rng.int(2, 9);
      const cm = meters * 100;
      const { options, correctAnswer } = numericOptions(meters, [meters * 9, meters * 99, 1, -1], v => `${fmtInt(v)} m`, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'medicion',
        oaCode: 'OA 22',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Conversión longitud)',
        categoryLabel: 'SIMCE · Longitud',
        prompt: `Una cinta de atletismo del colegio mide ${fmtInt(cm)} cm de largo. ¿A cuántos metros equivale esa longitud?`,
        visualType: 'number_line',
        visualData: { start: 0, end: cm },
        options,
        correctAnswer,
        explanation: `Como 1 metro = 100 cm, dividimos ${fmtInt(cm)} : 100 = ${meters} metros.`,
      });
    },
  },
  {
    key: '4b-med-perimetro-rect',
    grade: '4_basico',
    axis: 'medicion',
    difficulty: 'facil',
    build: (rng, id) => {
      const w = rng.int(7, 16);
      const h = rng.int(3, w - 2);
      const p = 2 * (w + h);
      const { options, correctAnswer } = numericOptions(p, [w * h - p, w + h - p, 4, -4], v => `${v} cm`, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'medicion',
        oaCode: 'OA 23',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Perímetro)',
        categoryLabel: 'SIMCE · Perímetro',
        prompt: `Observa la tarjeta rectangular de ${w} cm de largo y ${h} cm de ancho. ¿Cuál es su perímetro total?`,
        visualType: 'geometry_shape',
        visualData: { shape: 'rectangulo', width: w, height: h, unit: 'cm' },
        options,
        correctAnswer,
        explanation: `El perímetro suma los 4 lados: ${w} + ${h} + ${w} + ${h} = ${p} cm.`,
      });
    },
  },
  {
    key: '4b-med-perimetro-inverso-cuadrado',
    grade: '4_basico',
    axis: 'medicion',
    difficulty: 'medio',
    build: (rng, id) => {
      const side = rng.int(5, 18);
      const p = 4 * side;
      const { options, correctAnswer } = numericOptions(side, [side, -2, 3, p - side], v => `${v} cm`, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'medicion',
        oaCode: 'OA 23',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Lado desde perímetro)',
        categoryLabel: 'SIMCE · Perímetro',
        prompt: `El perímetro de un cartel cuadrado es ${p} cm. ¿Cuánto mide cada uno de sus lados?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Un cuadrado tiene 4 lados de igual medida, así que cada lado mide ${p} : 4 = ${side} cm.`,
      });
    },
  },
  {
    key: '4b-med-area-rect',
    grade: '4_basico',
    axis: 'medicion',
    difficulty: 'medio',
    build: (rng, id) => {
      const w = rng.int(6, 14);
      const h = rng.int(4, w - 1);
      const area = w * h;
      const { options, correctAnswer } = numericOptions(area, [2 * (w + h) - area, w + h - area, w, -h], v => `${v} cm²`, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'medicion',
        oaCode: 'OA 23',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Área rectángulo)',
        categoryLabel: 'SIMCE · Área',
        prompt: `¿Cuál es el área de la superficie del rectángulo mostrado en la figura?`,
        visualType: 'geometry_shape',
        visualData: { shape: 'rectangulo', width: w, height: h, unit: 'cm' },
        options,
        correctAnswer,
        explanation: `El área de un rectángulo es largo × ancho = ${w} cm × ${h} cm = ${area} cm².`,
      });
    },
  },
  {
    key: '4b-med-tiempo-transcurrido',
    grade: '4_basico',
    axis: 'medicion',
    difficulty: 'medio',
    build: (rng, id) => {
      const startH = rng.int(8, 16);
      const startM = rng.choice([10, 15, 20, 30, 40, 45]);
      const durMin = rng.choice([35, 45, 50, 75, 85, 95, 110]);
      const totalM = startH * 60 + startM + durMin;
      const endH = Math.floor(totalM / 60);
      const endM = totalM % 60;
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const ans = `${pad(endH)}:${pad(endM)} h`;
      const alt1 = `${pad(endH)}:${pad((endM + 10) % 60)} h`;
      const alt2 = `${pad(endH - 1)}:${pad(endM)} h`;
      const alt3 = `${pad(endH + 1)}:${pad(endM)} h`;
      const options = buildOptions(ans, [alt1, alt2, alt3], rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'medicion',
        oaCode: 'OA 21',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Tiempo)',
        categoryLabel: 'SIMCE · Tiempo',
        prompt: `Una clase de taller comenzó a las ${pad(startH)}:${pad(startM)} horas y tuvo una duración exacta de ${durMin} minutos. ¿A qué hora terminó?`,
        visualType: 'none',
        options,
        correctAnswer: ans,
        explanation: `Convertimos ${durMin} min = ${Math.floor(durMin / 60)} h y ${durMin % 60} min. Sumando a las ${pad(startH)}:${pad(startM)}, termina a las ${pad(endH)}:${pad(endM)} h.`,
      });
    },
  },
  {
    key: '4b-med-masa-kg-g',
    grade: '4_basico',
    axis: 'medicion',
    difficulty: 'medio',
    build: (rng, id) => {
      const kg = rng.int(2, 5);
      const gExtra = rng.choice([250, 350, 500, 750]);
      const totalG = kg * 1000 + gExtra;
      const { options, correctAnswer } = numericOptions(
        totalG,
        [-(kg * 900), 1000, -500, gExtra === 500 ? 250 : -250],
        v => `${fmtInt(v)} g`,
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'medicion',
        oaCode: 'OA 22',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Masa kg y g)',
        categoryLabel: 'SIMCE · Masa',
        prompt: `En el Terminal Asoagro, una familia compró ${kg} kg y ${gExtra} g de naranjas. ¿Cuántos gramos compró en total?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Cada kilogramo equivale a 1 000 g. Entonces ${kg} × 1 000 + ${gExtra} = ${fmtInt(totalG)} g.`,
      });
    },
  },
  {
    key: '4b-med-capacidad-vasos',
    grade: '4_basico',
    axis: 'medicion',
    difficulty: 'dificil',
    build: (rng, id) => {
      const liters = rng.int(2, 5);
      const cupMl = rng.choice([200, 250, 500]);
      const ans = (liters * 1000) / cupMl;
      const { options, correctAnswer } = numericOptions(ans, [-4, 4, 2, -2], v => `${v} vasos`, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'medicion',
        oaCode: 'OA 22',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Capacidad L y mL)',
        categoryLabel: 'SIMCE · Capacidad',
        prompt: `Un bidón contiene ${liters} litros de agua purificada y se quiere repartir completamente en vasos de ${cupMl} mL cada uno. ¿Cuántos vasos se pueden llenar?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `${liters} litros equivalen a ${fmtInt(liters * 1000)} mL. Dividiendo ${fmtInt(liters * 1000)} : ${cupMl} = ${ans} vasos.`,
      });
    },
  },
  {
    key: '4b-med-volumen-cubos',
    grade: '4_basico',
    axis: 'medicion',
    difficulty: 'dificil',
    build: (rng, id) => {
      const l = rng.int(3, 6);
      const w = rng.int(2, 4);
      const h = rng.int(2, 4);
      const vol = l * w * h;
      const { options, correctAnswer } = numericOptions(vol, [l + w + h - vol, l * w - vol, 4, -4], v => `${v} cm³`, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'medicion',
        oaCode: 'OA 24',
        difficulty: 'dificil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Volumen con cubos)',
        categoryLabel: 'SIMCE · Volumen',
        prompt: `La caja de la figura mide ${l} cm de largo, ${w} cm de ancho y ${h} cm de alto. ¿Cuántos cubitos de 1 cm³ caben exactamente dentro de ella?`,
        visualType: 'cube_prism',
        visualData: { kind: 'prism', length: l, width: w, height: h, unit: 'cm' },
        options,
        correctAnswer,
        explanation: `Cada piso tiene ${l} × ${w} = ${l * w} cubitos, y como hay ${h} pisos de alto, caben ${l * w} × ${h} = ${vol} cm³.`,
      });
    },
  },

  // --- DATOS Y PROBABILIDADES (8) ---
  {
    key: '4b-dat-barras-diferencia',
    grade: '4_basico',
    axis: 'datos_probabilidades',
    difficulty: 'facil',
    build: (rng, id) => {
      const cats = rng.choice([
        ['Fútbol', 'Básquetbol', 'Vóleibol', 'Atletismo'],
        ['Manzana', 'Plátano', 'Naranja', 'Uva'],
        ['4°A', '4°B', '4°C', '4°D'],
      ]);
      const vals = [rng.int(12, 22), rng.int(28, 42), rng.int(16, 26), rng.int(6, 11)];
      const maxV = Math.max(...vals);
      const minV = Math.min(...vals);
      const diff = maxV - minV;
      const { options, correctAnswer } = numericOptions(diff, [maxV + minV - diff, 3, -3, 5], fmtInt, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 27',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Gráficos de barras)',
        categoryLabel: 'SIMCE · Gráficos',
        prompt: `El gráfico resume los resultados de una encuesta escolar. ¿Cuál es la diferencia entre la categoría más votada y la menos votada?`,
        visualType: 'bar_chart',
        visualData: {
          title: 'Preferencias Escolares',
          unit: 'votos',
          items: cats.map((label, i) => ({ label, value: vals[i] })),
        },
        options,
        correctAnswer,
        explanation: `La mayor frecuencia es ${maxV} y la menor es ${minV}. Su diferencia es ${maxV} − ${minV} = ${diff}.`,
      });
    },
  },
  {
    key: '4b-dat-barras-total',
    grade: '4_basico',
    axis: 'datos_probabilidades',
    difficulty: 'medio',
    build: (rng, id) => {
      const vals = [rng.int(14, 24), rng.int(18, 29), rng.int(12, 22), rng.int(15, 25)];
      const total = vals.reduce((a, b) => a + b, 0);
      const { options, correctAnswer } = numericOptions(total, [-5, 6, 10, -8], v => `${v} estudiantes`, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 27',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Total gráfico)',
        categoryLabel: 'SIMCE · Gráficos',
        prompt: `Cada estudiante eligió exactamente un taller artístico. Según el gráfico de barras, ¿cuántos estudiantes participaron en total?`,
        visualType: 'bar_chart',
        visualData: {
          title: 'Inscripción en Talleres',
          unit: 'est.',
          items: [
            { label: 'Música', value: vals[0] },
            { label: 'Pintura', value: vals[1] },
            { label: 'Teatro', value: vals[2] },
            { label: 'Danza', value: vals[3] },
          ],
        },
        options,
        correctAnswer,
        explanation: `Sumamos todas las barras: ${vals.join(' + ')} = ${total} estudiantes.`,
      });
    },
  },
  {
    key: '4b-dat-barras-pareja-unica',
    grade: '4_basico',
    axis: 'datos_probabilidades',
    difficulty: 'dificil',
    build: (rng, id) => {
      // Strictly unique pair summing to target
      const base = rng.int(20, 35);
      const vA = base;
      const vB = base + 12;
      const vC = base + 5;
      const vD = base + 19;
      // Pairs: A+B=2b+12, A+C=2b+5, A+D=2b+19, B+C=2b+17, B+D=2b+31, C+D=2b+24 -> all 6 pairwise sums strictly distinct!
      const target = vA + vD; // 2*base + 19
      const correct = '4°A y 4°D';
      const options = buildOptions(correct, ['4°A y 4°C', '4°B y 4°C', '4°B y 4°D'], rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 27',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Lectura combinada)',
        categoryLabel: 'SIMCE · Gráficos',
        prompt: `El gráfico muestra las tapas plásticas recicladas por cuatro cursos. ¿Qué pareja de cursos reunió exactamente ${target} tapas entre los dos?`,
        visualType: 'bar_chart',
        visualData: {
          title: 'Campaña de Reciclaje',
          unit: 'tapas',
          items: [
            { label: '4°A', value: vA },
            { label: '4°B', value: vB },
            { label: '4°C', value: vC },
            { label: '4°D', value: vD },
          ],
        },
        options,
        correctAnswer: correct,
        explanation: `4°A reunió ${vA} y 4°D reunió ${vD}: ${vA} + ${vD} = ${target} tapas (ninguna otra pareja suma ${target}).`,
      });
    },
  },
  {
    key: '4b-dat-tabla-moda',
    grade: '4_basico',
    axis: 'datos_probabilidades',
    difficulty: 'facil',
    build: (rng, id) => {
      const pets = ['Perro', 'Gato', 'Hámster', 'Ave'];
      const winnerIdx = rng.int(0, 3);
      const counts = pets.map((_, i) => (i === winnerIdx ? rng.int(16, 24) : rng.int(4, 13)));
      const correct = pets[winnerIdx];
      const options = buildOptions(correct, pets, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 25',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Tabla y moda)',
        categoryLabel: 'SIMCE · Tablas',
        prompt: `La tabla registra la mascota favorita de los alumnos de 4° Básico. ¿Cuál es la moda (dato con mayor frecuencia)?`,
        visualType: 'table_data',
        visualData: {
          title: 'Mascota Favorita',
          headers: ['Mascota', 'Cantidad'],
          rows: pets.map((p, i) => [p, String(counts[i])]),
        },
        options,
        correctAnswer: correct,
        explanation: `${correct} tiene la mayor frecuencia (${counts[winnerIdx]} preferencias), por lo que corresponde a la moda.`,
      });
    },
  },
  {
    key: '4b-dat-pictograma',
    grade: '4_basico',
    axis: 'datos_probabilidades',
    difficulty: 'medio',
    build: (rng, id) => {
      const scale = rng.choice([2, 4, 5, 10]);
      const icons = [rng.int(2, 5), rng.int(3, 6), rng.int(2, 5)];
      const total = icons.reduce((a, b) => a + b, 0) * scale;
      const { options, correctAnswer } = numericOptions(
        total,
        [icons.reduce((a, b) => a + b, 0) - total, scale, -scale, 2 * scale],
        v => `${v} libros`,
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 27',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Pictograma con escala)',
        categoryLabel: 'SIMCE · Pictogramas',
        prompt: `En un pictograma de lectura mensual, cada ícono 📖 representa ${scale} libros leídos. Si en marzo hay ${icons[0]} íconos, en abril ${icons[1]} y en mayo ${icons[2]}, ¿cuántos libros se leyeron en total en esos 3 meses?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Hay ${icons[0]} + ${icons[1]} + ${icons[2]} = ${icons.reduce((a, b) => a + b, 0)} íconos en total. Multiplicando por ${scale} libros por ícono: ${icons.reduce((a, b) => a + b, 0)} × ${scale} = ${total} libros.`,
      });
    },
  },
  {
    key: '4b-dat-azar-seguro-imposible',
    grade: '4_basico',
    axis: 'datos_probabilidades',
    difficulty: 'facil',
    build: (rng, id) => {
      const maxDie = rng.choice([6, 8]);
      const askImpossible = rng.next() > 0.5;
      const correct = askImpossible
        ? `Obtener el número ${maxDie + 1}`
        : `Obtener un número menor o igual que ${maxDie}`;
      const options = buildOptions(
        correct,
        [
          'Obtener un número par',
          `Obtener el número ${maxDie}`,
          'Obtener un número mayor que 3',
          askImpossible ? `Obtener un número menor o igual que ${maxDie}` : `Obtener el número ${maxDie + 2}`,
        ],
        rng
      );
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 26',
        difficulty: 'facil',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Eventos aleatorios)',
        categoryLabel: 'SIMCE · Azar',
        prompt: `Al lanzar un dado equilibrado numerado del 1 al ${maxDie}, ¿cuál de los siguientes eventos es ${askImpossible ? 'IMPOSIBLE' : 'SEGURO'} que ocurra?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: askImpossible
          ? `Las caras solo llegan hasta ${maxDie}, por lo que es imposible obtener ${maxDie + 1}.`
          : `Todas las caras (1 al ${maxDie}) son menores o iguales que ${maxDie}, por lo que ocurrirá siempre.`,
      });
    },
  },
  {
    key: '4b-dat-urna-probable',
    grade: '4_basico',
    axis: 'datos_probabilidades',
    difficulty: 'medio',
    build: (rng, id) => {
      const r = rng.int(2, 6);
      const b = rng.int(8, 14);
      const g = rng.int(1, 3);
      const askLeast = rng.next() > 0.5;
      const correct = askLeast ? 'Verde' : 'Azul';
      const options = buildOptions(correct, ['Roja', 'Azul', 'Verde', 'Amarilla'], rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 26',
        difficulty: 'medio',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Comparación de azar)',
        categoryLabel: 'SIMCE · Probabilidad',
        prompt: `En una bolsa cerrada hay ${r} fichas rojas, ${b} fichas azules y ${g} fichas verdes (no hay amarillas). Si se saca una ficha sin mirar, ¿qué color es ${askLeast ? 'MENOS probable (pero aún posible)' : 'MÁS probable'} de salir?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: askLeast
          ? `Hay menos fichas verdes (${g}) que rojas (${r}) o azules (${b}), así que verde es el menos probable.`
          : `El color azul tiene la mayor cantidad (${b} fichas), por lo que es el más probable.`,
      });
    },
  },
  {
    key: '4b-dat-tabla-umbral',
    grade: '4_basico',
    axis: 'datos_probabilidades',
    difficulty: 'medio',
    build: (rng, id) => {
      const c1 = rng.int(4, 9);
      const c2 = rng.int(7, 14);
      const c3 = rng.int(5, 11);
      const c4 = rng.int(2, 6);
      const ans = c3 + c4;
      const { options, correctAnswer } = numericOptions(ans, [c2, -2, 3, c1 + c2 - ans], v => `${v} estudiantes`, rng);
      return makeItem({
        id,
        grade: '4_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 25',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 4° Básico · Generador paramétrico (Frecuencias acumuladas)',
        categoryLabel: 'SIMCE · Tablas',
        prompt: `La tabla indica cuántos libros leyó cada estudiante durante el año. ¿Cuántos estudiantes leyeron 3 o más libros?`,
        visualType: 'table_data',
        visualData: {
          title: 'Lectura Anual',
          headers: ['Libros leídos', 'N° de estudiantes'],
          rows: [
            ['1 libro', String(c1)],
            ['2 libros', String(c2)],
            ['3 libros', String(c3)],
            ['4 o más libros', String(c4)],
          ],
        },
        options,
        correctAnswer,
        explanation: `Sumamos quienes leyeron 3 libros (${c3}) y 4 o más libros (${c4}): ${c3} + ${c4} = ${ans} estudiantes.`,
      });
    },
  },
];

// ===========================================================================
// 6° BÁSICO TEMPLATES (41 arquetipos paramétricos across 5 axes)
// ===========================================================================
const TEMPLATES_6B: SimceTemplate[] = [
  // --- NÚMEROS Y OPERACIONES (9) ---
  {
    key: '6b-num-papomudas',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    difficulty: 'facil',
    build: (rng, id) => {
      const a = rng.int(6, 18);
      const b = rng.int(3, 8);
      const c = rng.int(4, 9);
      const e = rng.int(2, 6);
      const q = rng.int(2, 7);
      const d = e * q;
      const ans = a + b * c - q;
      const { options, correctAnswer } = numericOptions(
        ans,
        [(a + b) * c - q - ans, b * (c - q) - ans, 4, -5],
        fmtInt,
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 02',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Prioridad de operaciones)',
        categoryLabel: 'SIMCE · Operatoria combinada',
        prompt: `¿Cuál es el resultado correcto de la siguiente operación combinada?\n${a} + ${b} · ${c} − ${d} : ${e}`,
        context: `${a} + ${b} · ${c} − ${d} : ${e}`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Resolvemos primero multiplicación y división: ${b} · ${c} = ${b * c} y ${d} : ${e} = ${q}. Luego ${a} + ${b * c} − ${q} = ${ans}.`,
      });
    },
  },
  {
    key: '6b-num-mcm',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    difficulty: 'medio',
    build: (rng, id) => {
      const [a, b] = rng.choice([
        [10, 15],
        [12, 18],
        [8, 12],
        [9, 12],
        [12, 16],
        [15, 20],
        [6, 14],
      ]);
      const ans = lcm(a, b);
      const { options, correctAnswer } = numericOptions(
        ans,
        [a * b - ans, a + b - ans, Math.max(a, b) - ans, ans / 2 - ans],
        v => `${v} min`,
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 01',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Mínimo común múltiplo)',
        categoryLabel: 'SIMCE · MCM',
        prompt: `Dos recorridos de buses salen juntos desde el terminal a las 08:00. El bus A pasa cada ${a} minutos y el bus B cada ${b} minutos. ¿En cuántos minutos volverán a coincidir?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El mínimo común múltiplo entre ${a} y ${b} es ${ans}. Coincidirán nuevamente después de ${ans} minutos.`,
      });
    },
  },
  {
    key: '6b-num-mcd',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    difficulty: 'dificil',
    build: (rng, id) => {
      const d = rng.choice([6, 8, 9, 12, 15]);
      const p1 = rng.choice([2, 3, 5]);
      const p2 = rng.choice([4, 7].filter(x => gcd(x, p1) === 1));
      const a = d * p1;
      const b = d * p2;
      const { options, correctAnswer } = numericOptions(d, [p1 + p2 - d, d, -2, d * 2 - d], v => `${v} bolsas`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 01',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Máximo común divisor)',
        categoryLabel: 'SIMCE · MCD',
        prompt: `Se quieren armar la MAYOR cantidad posible de bolsas idénticas usando ${a} lápices y ${b} gomas sin que sobre ninguno. ¿Cuántas bolsas se pueden armar?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Buscamos el máximo común divisor entre ${a} y ${b}: MCD(${a}, ${b}) = ${d} bolsas (${p1} lápices y ${p2} gomas por bolsa).`,
      });
    },
  },
  {
    key: '6b-num-fracciones-distinto-den',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    difficulty: 'medio',
    build: (rng, id) => {
      const pairs = [
        { a: 1, da: 2, b: 1, db: 3, n: 5, d: 6 },
        { a: 1, da: 3, b: 1, db: 4, n: 7, d: 12 },
        { a: 2, da: 3, b: 1, db: 4, n: 11, d: 12 },
        { a: 1, da: 4, b: 2, db: 5, n: 13, d: 20 },
        { a: 3, da: 4, b: 1, db: 6, n: 11, d: 12 },
        { a: 2, da: 5, b: 1, db: 2, n: 9, d: 10 },
      ];
      const p = rng.choice(pairs);
      const correct = `${p.n}/${p.d}`;
      const options = buildOptions(
        correct,
        [`${p.a + p.b}/${p.da + p.db}`, `${Math.max(1, p.n - 2)}/${p.d}`, `${p.n}/${p.da * p.db + 2}`],
        rng
      );
      const name = rng.choice(NAMES);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 06',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Suma de fracciones)',
        categoryLabel: 'SIMCE · Fracciones',
        prompt: `${name} corrió ${p.a}/${p.da} km en la mañana y ${p.b}/${p.db} km en la tarde. ¿Qué fracción de kilómetro corrió en total?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `Igualando a denominador común ${p.d}, la suma ${p.a}/${p.da} + ${p.b}/${p.db} = ${p.n}/${p.d} km.`,
      });
    },
  },
  {
    key: '6b-num-decimales-mult',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    difficulty: 'medio',
    build: (rng, id) => {
      const kgPrice = rng.choice([1.25, 1.5, 2.4, 2.5, 3.2, 1.75]);
      const count = rng.int(3, 6);
      const ans = Number((kgPrice * count).toFixed(2));
      const { options, correctAnswer } = numericOptions(
        ans,
        [1, -1, 0.5, -0.5, kgPrice],
        v => `${fmtDec(v, 2)} kg`,
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 07',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Multiplicación decimal)',
        categoryLabel: 'SIMCE · Decimales',
        prompt: `Cada paquete de harina pesa exactamente ${fmtDec(kgPrice, 2)} kg. ¿Cuánto pesan ${count} paquetes iguales en total?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Multiplicamos ${fmtDec(kgPrice, 2)} × ${count} = ${fmtDec(ans, 2)} kg.`,
      });
    },
  },
  {
    key: '6b-num-porcentaje-descuento',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    difficulty: 'medio',
    build: (rng, id) => {
      const pct = rng.choice([10, 20, 25, 30, 50]);
      const basePrice = rng.choice([8000, 12000, 16000, 20000, 24000, 32000]);
      const disc = (basePrice * pct) / 100;
      const finalPrice = basePrice - disc;
      const { options, correctAnswer } = numericOptions(
        finalPrice,
        [disc - finalPrice, -1000, 1000, basePrice * 0.1],
        fmtCLP,
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 04',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Porcentaje de descuento)',
        categoryLabel: 'SIMCE · Porcentajes',
        prompt: `Una mochila cuesta ${fmtCLP(basePrice)} y tiene un descuento del ${pct}%. ¿Cuánto se paga finalmente por la mochila?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El ${pct}% de ${fmtCLP(basePrice)} es ${fmtCLP(disc)}. Al descontarlo: ${fmtCLP(basePrice)} − ${fmtCLP(disc)} = ${fmtCLP(finalPrice)}.`,
      });
    },
  },
  {
    key: '6b-num-porcentaje-parte',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    difficulty: 'dificil',
    build: (rng, id) => {
      const total = rng.choice([20, 25, 40, 50]);
      const pct = rng.choice([15, 20, 25, 30, 40, 60, 75, 80].filter(p => (total * p) % 100 === 0));
      const part = (total * pct) / 100;
      const { options, correctAnswer } = numericOptions(pct, [100 - pct - pct, 10, -10, part - pct], v => `${v}%`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 04',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Qué porcentaje es)',
        categoryLabel: 'SIMCE · Porcentajes',
        prompt: `En una prueba de ${total} preguntas, ${rng.choice(NAMES)} respondió correctamente ${part} de ellas. ¿Qué porcentaje de la prueba respondió correctamente?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `La razón es ${part}/${total} = ${(part / total).toFixed(2).replace('.', ',')}, que equivale al ${pct}%.`,
      });
    },
  },
  {
    key: '6b-num-razones',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    difficulty: 'medio',
    build: (rng, id) => {
      const r1 = rng.int(2, 5);
      const r2 = rng.int(3, 7);
      const mult = rng.int(3, 8);
      const given = r1 * mult;
      const ans = r2 * mult;
      const { options, correctAnswer } = numericOptions(ans, [given - ans, r1 + r2, mult, -mult], v => `${v} mujeres`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 03',
        difficulty: 'medio',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Razones)',
        categoryLabel: 'SIMCE · Razones',
        prompt: `En un taller deportivo, la razón entre varones y mujeres es ${r1} : ${r2}. Si hay ${given} varones inscritos, ¿cuántas mujeres participan?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Como ${r1} × ${mult} = ${given}, multiplicamos ${r2} × ${mult} = ${ans} mujeres.`,
      });
    },
  },
  {
    key: '6b-num-primos-factores',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    difficulty: 'facil',
    build: (rng, id) => {
      const comps = [
        { n: 36, f: '2 · 2 · 3 · 3', d: ['2 · 3 · 6', '4 · 9', '2 · 2 · 9'] },
        { n: 45, f: '3 · 3 · 5', d: ['5 · 9', '3 · 15', '3 · 5 · 5'] },
        { n: 60, f: '2 · 2 · 3 · 5', d: ['4 · 3 · 5', '2 · 5 · 6', '2 · 3 · 10'] },
        { n: 72, f: '2 · 2 · 2 · 3 · 3', d: ['8 · 9', '2 · 4 · 9', '2 · 2 · 3 · 6'] },
        { n: 84, f: '2 · 2 · 3 · 7', d: ['4 · 3 · 7', '2 · 6 · 7', '2 · 2 · 21'] },
      ];
      const pick = rng.choice(comps);
      const options = buildOptions(pick.f, pick.d, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 01',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Factorización prima)',
        categoryLabel: 'SIMCE · Factores primos',
        prompt: `¿Cuál es la descomposición en factores PRIMOS del número ${pick.n}?`,
        visualType: 'none',
        options,
        correctAnswer: pick.f,
        explanation: `Solo ${pick.f} contiene únicamente números primos cuyo producto es ${pick.n}.`,
      });
    },
  },

  // --- PATRONES Y ÁLGEBRA (8) ---
  {
    key: '6b-alg-termino-enesimo',
    grade: '6_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const m = rng.int(3, 7);
      const b = rng.int(1, 6);
      const seq = [1, 2, 3, 4].map(n => m * n + b);
      const pos = rng.choice([10, 12, 15, 20]);
      const ans = m * pos + b;
      const { options, correctAnswer } = numericOptions(ans, [-b, m, -m, pos], fmtInt, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 09',
        difficulty: 'medio',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Término general)',
        categoryLabel: 'SIMCE · Secuencias',
        prompt: `Observa la secuencia numérica: ${seq.join(', ')}, ... Si la regla continúa igual, ¿qué número ocupa la posición ${pos}?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El término en la posición n sigue la regla ${m}n + ${b}. Para n = ${pos}: ${m} × ${pos} + ${b} = ${ans}.`,
      });
    },
  },
  {
    key: '6b-alg-lenguaje-algebraico',
    grade: '6_basico',
    axis: 'patrones_algebra',
    difficulty: 'facil',
    build: (rng, id) => {
      const k = rng.choice([2, 3, 4, 5]);
      const kWord = k === 2 ? 'El doble' : k === 3 ? 'El triple' : k === 4 ? 'El cuádruple' : 'El quíntuple';
      const c = rng.int(3, 12);
      const isSub = rng.next() > 0.5;
      const correct = isSub ? `${k}x − ${c}` : `${k}x + ${c}`;
      const options = buildOptions(
        correct,
        [
          isSub ? `${k}(x − ${c})` : `${k}(x + ${c})`,
          isSub ? `${k}x + ${c}` : `${k}x − ${c}`,
          `x/${k} ${isSub ? '−' : '+'} ${c}`,
        ],
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 10',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Lenguaje algebraico)',
        categoryLabel: 'SIMCE · Lenguaje algebraico',
        prompt: `¿Qué expresión algebraica representa "${kWord} de un número x, ${isSub ? 'disminuido' : 'aumentado'} en ${c}"?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `${kWord} de x se escribe ${k}x, y ${isSub ? 'disminuido' : 'aumentado'} en ${c} da ${correct}.`,
      });
    },
  },
  {
    key: '6b-alg-ecuacion-balanza',
    grade: '6_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const a = rng.int(2, 5);
      const x = rng.int(4, 15);
      const b = rng.int(3, 19);
      const c = a * x + b;
      const { options, correctAnswer } = numericOptions(x, [1, -1, b, c - x], fmtInt, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 11',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Ecuación en balanza)',
        categoryLabel: 'SIMCE · Ecuaciones',
        prompt: `La balanza de la figura está equilibrada. ¿Cuál es el valor de x?`,
        visualType: 'balance_equation',
        visualData: { left: `${a}x + ${b}`, right: String(c) },
        options,
        correctAnswer,
        explanation: `Restamos ${b} en ambos lados: ${a}x = ${c - b}. Dividiendo por ${a}: x = ${x}.`,
      });
    },
  },
  {
    key: '6b-alg-ecuacion-contexto',
    grade: '6_basico',
    axis: 'patrones_algebra',
    difficulty: 'dificil',
    build: (rng, id) => {
      const qty = rng.int(3, 6);
      const unit = rng.choice([1200, 1500, 1800, 2200, 2500]);
      const ship = rng.choice([1000, 1500, 2000]);
      const total = qty * unit + ship;
      const { options, correctAnswer } = numericOptions(
        unit,
        [ship / qty, -300, 400, total / qty - unit],
        fmtCLP,
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 11',
        difficulty: 'dificil',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Ecuación en compra)',
        categoryLabel: 'SIMCE · Ecuaciones',
        prompt: `${rng.choice(NAMES)} compró ${qty} entradas iguales al cine y pagó además ${fmtCLP(ship)} de recargo por servicio, gastando ${fmtCLP(total)} en total. ¿Cuánto costaba cada entrada?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Ecuación: ${qty}x + ${ship} = ${total}. Entonces ${qty}x = ${total - ship}, y cada entrada cuesta ${fmtCLP(unit)}.`,
      });
    },
  },
  {
    key: '6b-alg-evaluar-expresion',
    grade: '6_basico',
    axis: 'patrones_algebra',
    difficulty: 'facil',
    build: (rng, id) => {
      const p = rng.int(2, 5);
      const q = rng.int(2, 4);
      const r = rng.int(1, 7);
      const a = rng.int(3, 9);
      const b = rng.int(2, 7);
      const ans = p * a + q * b - r;
      const { options, correctAnswer } = numericOptions(ans, [2 * r, -3, 4, -(q * b)], fmtInt, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 10',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Evaluación algebraica)',
        categoryLabel: 'SIMCE · Expresiones',
        prompt: `Si a = ${a} y b = ${b}, ¿cuál es el valor numérico de la expresión ${p}a + ${q}b − ${r}?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Reemplazando: ${p}·(${a}) + ${q}·(${b}) − ${r} = ${p * a} + ${q * b} − ${r} = ${ans}.`,
      });
    },
  },
  {
    key: '6b-alg-tabla-regla',
    grade: '6_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const m = rng.int(2, 6);
      const c = rng.int(1, 5);
      const xs = [1, 2, 3, 4];
      const correct = `${m}n + ${c}`;
      const options = buildOptions(
        correct,
        [`${m + 1}n + ${c}`, `${m}n − ${c}`, `${c}n + ${m}`, `n + ${m + c}`],
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 09',
        difficulty: 'medio',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Regla desde tabla)',
        categoryLabel: 'SIMCE · Tablas y reglas',
        prompt: `¿Qué expresión general permite calcular la cantidad de piezas para cualquier figura n de la tabla?`,
        visualType: 'table_data',
        visualData: {
          title: 'Secuencia de Figuras',
          headers: ['N° de figura (n)', 'Cantidad de piezas'],
          rows: xs.map(n => [String(n), String(m * n + c)]),
        },
        options,
        correctAnswer: correct,
        explanation: `La cantidad aumenta de ${m} en ${m}, y para n = 1 da ${m}·1 + ${c} = ${m + c}. La regla es ${correct}.`,
      });
    },
  },
  {
    key: '6b-alg-patron-palitos',
    grade: '6_basico',
    axis: 'patrones_algebra',
    difficulty: 'dificil',
    build: (rng, id) => {
      const start = rng.choice([4, 5, 6]);
      const step = start - 1;
      const fig = rng.choice([8, 10, 12, 15]);
      const ans = start + (fig - 1) * step;
      const { options, correctAnswer } = numericOptions(ans, [-step, step, 1, -1], v => `${v} palitos`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 09',
        difficulty: 'dificil',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Patrón con fósforos)',
        categoryLabel: 'SIMCE · Patrones',
        prompt: `Con palitos de fósforo se arma una fila de figuras pegadas: la Figura 1 usa ${start} palitos, la Figura 2 usa ${start + step} y la Figura 3 usa ${start + 2 * step}. ¿Cuántos palitos necesita la Figura ${fig}?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Cada nueva figura agrega ${step} palitos: ${start} + (${fig} − 1) × ${step} = ${ans} palitos.`,
      });
    },
  },
  {
    key: '6b-alg-perimetro-ecuacion',
    grade: '6_basico',
    axis: 'patrones_algebra',
    difficulty: 'dificil',
    build: (rng, id) => {
      const x = rng.int(5, 14);
      const diff = rng.int(3, 8);
      const p = 2 * (x + (x + diff));
      const { options, correctAnswer } = numericOptions(x, [diff, -2, 3, p / 2 - x], v => `${v} cm`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 11',
        difficulty: 'dificil',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Ecuación geométrica)',
        categoryLabel: 'SIMCE · Álgebra',
        prompt: `El largo de un rectángulo mide ${diff} cm más que su ancho x. Si el perímetro del rectángulo es ${p} cm, ¿cuánto mide su ancho x?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Perímetro = 2(x + x + ${diff}) = ${p} ⇒ 4x + ${2 * diff} = ${p} ⇒ 4x = ${p - 2 * diff} ⇒ x = ${x} cm.`,
      });
    },
  },

  // --- GEOMETRÍA (8) ---
  {
    key: '6b-geo-triangulo-angulos',
    grade: '6_basico',
    axis: 'geometria',
    difficulty: 'facil',
    build: (rng, id) => {
      const a = rng.int(32, 78);
      const b = rng.int(34, 82);
      const x = 180 - a - b;
      const { options, correctAnswer } = numericOptions(x, [10, -10, a + b - x, 15], v => `${v}°`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'geometria',
        oaCode: 'OA 17',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Ángulos en triángulo)',
        categoryLabel: 'SIMCE · Triángulos',
        prompt: `En el triángulo ABC de la figura, dos de sus ángulos interiores miden ${a}° y ${b}°. ¿Cuánto mide el ángulo x?`,
        visualType: 'angle_figure',
        visualData: { kind: 'triangle_angles', a, b },
        options,
        correctAnswer,
        explanation: `Los ángulos interiores de un triángulo suman 180°. Luego x = 180° − (${a}° + ${b}°) = ${x}°.`,
      });
    },
  },
  {
    key: '6b-geo-cuadrilatero-angulos',
    grade: '6_basico',
    axis: 'geometria',
    difficulty: 'medio',
    build: (rng, id) => {
      const a = rng.int(65, 115);
      const b = rng.int(75, 120);
      const c = rng.int(60, 105);
      const d = 360 - (a + b + c);
      const { options, correctAnswer } = numericOptions(d, [10, -10, 20, -15], v => `${v}°`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'geometria',
        oaCode: 'OA 17',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Cuadriláteros)',
        categoryLabel: 'SIMCE · Cuadriláteros',
        prompt: `Tres ángulos interiores de un cuadrilátero miden ${a}°, ${b}° y ${c}°. ¿Cuánto mide el cuarto ángulo interior?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `En todo cuadrilátero los ángulos interiores suman 360°. Entonces 360° − (${a}° + ${b}° + ${c}°) = ${d}°.`,
      });
    },
  },
  {
    key: '6b-geo-paralelas-transversal',
    grade: '6_basico',
    axis: 'geometria',
    difficulty: 'medio',
    build: (rng, id) => {
      const acute = rng.int(42, 78);
      const obtuse = 180 - acute;
      const { options, correctAnswer } = numericOptions(obtuse, [acute - obtuse, 10, -10, 90 - acute - obtuse], v => `${v}°`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'geometria',
        oaCode: 'OA 21',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Paralelas y transversal)',
        categoryLabel: 'SIMCE · Rectas paralelas',
        prompt: `Las rectas L1 y L2 son paralelas y están cortadas por la transversal T. Si el ángulo agudo α mide ${acute}°, ¿cuánto mide el ángulo obtuso β?`,
        visualType: 'angle_figure',
        visualData: { kind: 'transversal', acute },
        options,
        correctAnswer,
        explanation: `Entre rectas paralelas cortadas por una transversal, los ángulos agudo y obtuso forman par suplementario: β = 180° − ${acute}° = ${obtuse}°.`,
      });
    },
  },
  {
    key: '6b-geo-suplemento-complemento',
    grade: '6_basico',
    axis: 'geometria',
    difficulty: 'facil',
    build: (rng, id) => {
      const askComp = rng.next() > 0.5;
      const alpha = askComp ? rng.int(18, 72) : rng.int(35, 145);
      const ans = (askComp ? 90 : 180) - alpha;
      const { options, correctAnswer } = numericOptions(
        ans,
        [10, -10, askComp ? 90 : -90, 5],
        v => `${v}°`,
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'geometria',
        oaCode: 'OA 21',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Complemento y suplemento)',
        categoryLabel: 'SIMCE · Ángulos',
        prompt: `Si un ángulo mide ${alpha}°, ¿cuánto mide su ángulo ${askComp ? 'complementario' : 'suplementario'}?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Los ángulos ${askComp ? 'complementarios suman 90°' : 'suplementarios suman 180°'}. Por lo tanto: ${askComp ? 90 : 180}° − ${alpha}° = ${ans}°.`,
      });
    },
  },
  {
    key: '6b-geo-isosceles-angulos',
    grade: '6_basico',
    axis: 'geometria',
    difficulty: 'dificil',
    build: (rng, id) => {
      const top = rng.choice([30, 40, 50, 70, 80, 100, 110]);
      const baseAngle = (180 - top) / 2;
      const { options, correctAnswer } = numericOptions(baseAngle, [top - baseAngle, 10, -10, 180 - top - baseAngle], v => `${v}°`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'geometria',
        oaCode: 'OA 17',
        difficulty: 'dificil',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Triángulo isósceles)',
        categoryLabel: 'SIMCE · Triángulos',
        prompt: `En un triángulo isósceles, el ángulo distinto (entre los dos lados iguales) mide ${top}°. ¿Cuánto mide cada uno de los dos ángulos basales iguales?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Quedan 180° − ${top}° = ${180 - top}° para repartir en dos ángulos iguales: ${180 - top}° : 2 = ${baseAngle}°.`,
      });
    },
  },
  {
    key: '6b-geo-opuestos-vertice',
    grade: '6_basico',
    axis: 'geometria',
    difficulty: 'facil',
    build: (rng, id) => {
      const a = rng.int(35, 135);
      const adj = 180 - a;
      const { options, correctAnswer } = numericOptions(adj, [a - adj, 10, -10, 15], v => `${v}°`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'geometria',
        oaCode: 'OA 21',
        difficulty: 'facil',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Rectas secantes)',
        categoryLabel: 'SIMCE · Ángulos',
        prompt: `Al cruzarse dos rectas en un punto se forman cuatro ángulos. Si uno de ellos mide ${a}°, ¿cuánto mide su ángulo adyacente sobre la misma recta?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Dos ángulos adyacentes sobre una recta forman un par suplementario (180°): 180° − ${a}° = ${adj}°.`,
      });
    },
  },
  {
    key: '6b-geo-angulo-exterior',
    grade: '6_basico',
    axis: 'geometria',
    difficulty: 'dificil',
    build: (rng, id) => {
      const a = rng.int(38, 75);
      const b = rng.int(42, 78);
      const ext = a + b;
      const { options, correctAnswer } = numericOptions(ext, [180 - ext - ext, -10, 10, Math.abs(a - b) - ext], v => `${v}°`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'geometria',
        oaCode: 'OA 17',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Ángulo exterior)',
        categoryLabel: 'SIMCE · Triángulos',
        prompt: `En un triángulo, dos ángulos interiores miden ${a}° y ${b}°. ¿Cuánto mide el ángulo EXTERIOR adyacente al tercer vértice?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El tercer ángulo interior mide 180° − (${a}° + ${b}°) = ${180 - ext}°, por lo que su ángulo exterior suplementario mide ${a}° + ${b}° = ${ext}°.`,
      });
    },
  },
  {
    key: '6b-geo-teselacion',
    grade: '6_basico',
    axis: 'geometria',
    difficulty: 'medio',
    build: (rng, id) => {
      const items = [
        { q: 'hexágonos regulares', ang: 120, n: 3, dist: [2, 4, 6] },
        { q: 'triángulos equiláteros', ang: 60, n: 6, dist: [3, 4, 5] },
        { q: 'cuadrados', ang: 90, n: 4, dist: [2, 3, 6] },
      ];
      const pick = rng.choice(items);
      const options = buildOptions(String(pick.n), pick.dist.map(String), rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'geometria',
        oaCode: 'OA 14',
        difficulty: 'medio',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Teselaciones)',
        categoryLabel: 'SIMCE · Teselaciones',
        prompt: `Cada ángulo interior de ${pick.q} mide ${pick.ang}°. ¿Cuántos de ellos se deben juntar en un mismo vértice para completar 360° y teselar el plano sin dejar espacios?`,
        visualType: 'none',
        options,
        correctAnswer: String(pick.n),
        explanation: `Dividimos la vuelta completa de 360° entre ${pick.ang}°: 360° : ${pick.ang}° = ${pick.n} polígonos por vértice.`,
      });
    },
  },

  // --- MEDICIÓN (8) ---
  {
    key: '6b-med-area-triangulo',
    grade: '6_basico',
    axis: 'medicion',
    difficulty: 'facil',
    build: (rng, id) => {
      const b = rng.int(6, 18);
      const h = rng.choice([4, 6, 8, 10, 12]);
      const area = (b * h) / 2;
      const { options, correctAnswer } = numericOptions(area, [b * h - area, b + h - area, 6, -6], v => `${v} cm²`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'medicion',
        oaCode: 'OA 13',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Área triángulo)',
        categoryLabel: 'SIMCE · Área',
        prompt: `Un banderín triangular tiene ${b} cm de base y ${h} cm de altura. ¿Cuál es su área?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Área del triángulo = (base × altura) : 2 = (${b} × ${h}) : 2 = ${area} cm².`,
      });
    },
  },
  {
    key: '6b-med-area-romboide',
    grade: '6_basico',
    axis: 'medicion',
    difficulty: 'facil',
    build: (rng, id) => {
      const b = rng.int(9, 19);
      const h = rng.int(4, 11);
      const area = b * h;
      const { options, correctAnswer } = numericOptions(area, [-(area / 2), 2 * (b + h) - area, b, -h], v => `${v} cm²`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'medicion',
        oaCode: 'OA 13',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Área paralelogramo)',
        categoryLabel: 'SIMCE · Área',
        prompt: `Un paralelogramo (romboide) tiene ${b} cm de base y ${h} cm de altura perpendicular. ¿Cuál es su área?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El área de un paralelogramo es base × altura = ${b} × ${h} = ${area} cm².`,
      });
    },
  },
  {
    key: '6b-med-area-trapecio',
    grade: '6_basico',
    axis: 'medicion',
    difficulty: 'dificil',
    build: (rng, id) => {
      const bMinor = rng.int(5, 11);
      const bMajor = bMinor + rng.choice([4, 6, 8]);
      const h = rng.choice([4, 6, 8]);
      const area = ((bMajor + bMinor) * h) / 2;
      const { options, correctAnswer } = numericOptions(
        area,
        [(bMajor + bMinor) * h - area, (bMajor * h) / 2 - area, 8, -8],
        v => `${v} m²`,
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'medicion',
        oaCode: 'OA 13',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Área trapecio)',
        categoryLabel: 'SIMCE · Área',
        prompt: `Un patio con forma de trapecio tiene bases paralelas de ${bMajor} m y ${bMinor} m, y una altura de ${h} m. ¿Cuál es su área?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Área del trapecio = ((${bMajor} + ${bMinor}) × ${h}) : 2 = (${bMajor + bMinor} × ${h}) : 2 = ${area} m².`,
      });
    },
  },
  {
    key: '6b-med-cubo-area-total',
    grade: '6_basico',
    axis: 'medicion',
    difficulty: 'medio',
    build: (rng, id) => {
      const a = rng.int(3, 8);
      const area = 6 * a * a;
      const { options, correctAnswer } = numericOptions(area, [a * a * a - area, 4 * a * a - area, a * a - area, 12], v => `${v} cm²`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'medicion',
        oaCode: 'OA 18',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Área de cubo)',
        categoryLabel: 'SIMCE · Superficie 3D',
        prompt: `¿Cuál es el área de la superficie TOTAL de un cubo cuya arista mide ${a} cm?`,
        visualType: 'cube_prism',
        visualData: { kind: 'cube', length: a, width: a, height: a, unit: 'cm' },
        options,
        correctAnswer,
        explanation: `Un cubo tiene 6 caras cuadradas de área ${a} × ${a} = ${a * a} cm². Área total = 6 × ${a * a} = ${area} cm².`,
      });
    },
  },
  {
    key: '6b-med-prisma-volumen',
    grade: '6_basico',
    axis: 'medicion',
    difficulty: 'facil',
    build: (rng, id) => {
      const l = rng.int(4, 9);
      const w = rng.int(3, 6);
      const h = rng.int(2, 5);
      const vol = l * w * h;
      const { options, correctAnswer } = numericOptions(vol, [2 * (l * w + l * h + w * h) - vol, l + w + h - vol, l * w - vol, 6], v => `${v} cm³`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'medicion',
        oaCode: 'OA 19',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Volumen paralelepípedo)',
        categoryLabel: 'SIMCE · Volumen',
        prompt: `Calcula el volumen de una caja con forma de paralelepípedo rectangular de ${l} cm de largo, ${w} cm de ancho y ${h} cm de alto.`,
        visualType: 'cube_prism',
        visualData: { kind: 'prism', length: l, width: w, height: h, unit: 'cm' },
        options,
        correctAnswer,
        explanation: `Volumen = largo × ancho × alto = ${l} × ${w} × ${h} = ${vol} cm³.`,
      });
    },
  },
  {
    key: '6b-med-prisma-area-total',
    grade: '6_basico',
    axis: 'medicion',
    difficulty: 'dificil',
    build: (rng, id) => {
      const l = rng.int(5, 9);
      const w = rng.int(3, 5);
      const h = rng.int(2, 4);
      const area = 2 * (l * w + l * h + w * h);
      const { options, correctAnswer } = numericOptions(area, [l * w * h - area, -(area / 2), 10, -8], v => `${v} cm²`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'medicion',
        oaCode: 'OA 18',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Área paralelepípedo)',
        categoryLabel: 'SIMCE · Superficie 3D',
        prompt: `¿Cuánto cartón se necesita para cubrir todas las caras de una caja cerrada de ${l} cm de largo, ${w} cm de ancho y ${h} cm de alto?`,
        visualType: 'cube_prism',
        visualData: { kind: 'prism', length: l, width: w, height: h, unit: 'cm' },
        options,
        correctAnswer,
        explanation: `Área total = 2·(${l}·${w} + ${l}·${h} + ${w}·${h}) = 2·(${l * w} + ${l * h} + ${w * h}) = ${area} cm².`,
      });
    },
  },
  {
    key: '6b-med-despejar-altura',
    grade: '6_basico',
    axis: 'medicion',
    difficulty: 'dificil',
    build: (rng, id) => {
      const l = rng.int(4, 8);
      const w = rng.int(3, 6);
      const h = rng.int(4, 9);
      const vol = l * w * h;
      const { options, correctAnswer } = numericOptions(h, [2, -2, l * w - h, 4], v => `${v} cm`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'medicion',
        oaCode: 'OA 19',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Altura desde volumen)',
        categoryLabel: 'SIMCE · Volumen',
        prompt: `Un acuario rectangular tiene un volumen de ${vol} cm³, un largo de ${l} cm y un ancho de ${w} cm. ¿Cuál es su altura?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El área basal es ${l} × ${w} = ${l * w} cm². Dividiendo el volumen por esa base: ${vol} : ${l * w} = ${h} cm.`,
      });
    },
  },
  {
    key: '6b-med-perimetro-a-area',
    grade: '6_basico',
    axis: 'medicion',
    difficulty: 'medio',
    build: (rng, id) => {
      const side = rng.int(4, 12);
      const p = 4 * side;
      const area = side * side;
      const { options, correctAnswer } = numericOptions(area, [p - area, side * 2 - area, 8, -8], v => `${v} cm²`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'medicion',
        oaCode: 'OA 13',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (De perímetro a área)',
        categoryLabel: 'SIMCE · Área y perímetro',
        prompt: `El perímetro de una cerámica cuadrada mide ${p} cm. ¿Cuál es su área?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Cada lado mide ${p} : 4 = ${side} cm. Por lo tanto, el área es ${side} × ${side} = ${area} cm².`,
      });
    },
  },

  // --- DATOS Y PROBABILIDADES (8) ---
  {
    key: '6b-dat-promedio-tabla',
    grade: '6_basico',
    axis: 'datos_probabilidades',
    difficulty: 'facil',
    build: (rng, id) => {
      const base = rng.int(12, 22);
      const d1 = base - 2;
      const d2 = base + 3;
      const d3 = base - 1;
      const d4 = base;
      const { options, correctAnswer } = numericOptions(base, [2, -2, 4, -3], fmtInt, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 23',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Promedio aritmético)',
        categoryLabel: 'SIMCE · Estadística',
        prompt: `La tabla muestra las temperaturas máximas de 4 días. ¿Cuál fue el promedio (media aritmética) de temperatura en esos 4 días?`,
        visualType: 'table_data',
        visualData: {
          title: 'Temperaturas Semanales (°C)',
          headers: ['Día', 'Temperatura (°C)'],
          rows: [
            ['Lunes', String(d1)],
            ['Martes', String(d2)],
            ['Miércoles', String(d3)],
            ['Jueves', String(d4)],
          ],
        },
        options,
        correctAnswer,
        explanation: `Suma = ${d1} + ${d2} + ${d3} + ${d4} = ${4 * base}. Dividiendo por 4 días: ${4 * base} : 4 = ${base}°C.`,
      });
    },
  },
  {
    key: '6b-dat-dato-faltante-promedio',
    grade: '6_basico',
    axis: 'datos_probabilidades',
    difficulty: 'dificil',
    build: (rng, id) => {
      const targetAvg = rng.choice([5.5, 6.0, 6.2]);
      const g1 = 5.0;
      const g2 = 6.0;
      const g3 = rng.choice([5.4, 5.8, 6.4]);
      const needed = Number((4 * targetAvg - (g1 + g2 + g3)).toFixed(1));
      if (needed > 7.0 || needed < 3.0) {
        // Guaranteed safe fallback
        const { options, correctAnswer } = numericOptions(6.6, [-0.6, -1.0, 0.4, -0.4], v => fmtDec(v, 1), rng);
        return makeItem({
          id,
          grade: '6_basico',
          axis: 'datos_probabilidades',
          oaCode: 'OA 23',
          difficulty: 'dificil',
          simceSkill: 'Resolver problemas',
          simceSource: 'SIMCE 6° Básico · Generador paramétrico (Nota faltante)',
          categoryLabel: 'SIMCE · Promedios',
          prompt: `${rng.choice(NAMES)} lleva notas 5,4; 6,0 y 6,0 en tres evaluaciones. ¿Qué nota necesita en la cuarta evaluación para lograr exactamente promedio 6,0?`,
          visualType: 'none',
          options,
          correctAnswer,
          explanation: `Para promedio 6,0 en 4 notas debe sumar 24,0. Como lleva 17,4, necesita 24,0 − 17,4 = 6,6.`,
        });
      }
      const { options, correctAnswer } = numericOptions(needed, [-0.5, 0.5, -1, -0.3], v => fmtDec(v, 1), rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 23',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Nota faltante)',
        categoryLabel: 'SIMCE · Promedios',
        prompt: `${rng.choice(NAMES)} obtuvo notas ${fmtDec(g1, 1)}; ${fmtDec(g2, 1)} y ${fmtDec(g3, 1)} en tres pruebas. ¿Qué nota necesita en la 4ª prueba para tener promedio exacto ${fmtDec(targetAvg, 1)}?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Suma requerida = 4 × ${fmtDec(targetAvg, 1)} = ${fmtDec(4 * targetAvg, 1)}. Lleva ${fmtDec(g1 + g2 + g3, 1)}, por lo que necesita ${fmtDec(needed, 1)}.`,
      });
    },
  },
  {
    key: '6b-dat-mediana',
    grade: '6_basico',
    axis: 'datos_probabilidades',
    difficulty: 'medio',
    build: (rng, id) => {
      const sorted = [
        rng.int(10, 14),
        rng.int(15, 18),
        rng.int(19, 22),
        rng.int(23, 27),
        rng.int(28, 32),
        rng.int(33, 37),
        rng.int(38, 42),
      ];
      const med = sorted[3];
      const unsorted = rng.shuffle(sorted);
      const { options, correctAnswer } = numericOptions(
        med,
        [unsorted[3] - med || 3, sorted[2] - med, sorted[4] - med, -2],
        fmtInt,
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 23',
        difficulty: 'medio',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Mediana)',
        categoryLabel: 'SIMCE · Estadística',
        prompt: `Las edades de 7 asistentes a un club de ciencias son: ${unsorted.join(', ')}. ¿Cuál es la MEDIANA de estos datos?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Al ordenar de menor a mayor (${sorted.join(', ')}), el dato central (4° lugar) es ${med}.`,
      });
    },
  },
  {
    key: '6b-dat-porcentaje-tabla',
    grade: '6_basico',
    axis: 'datos_probabilidades',
    difficulty: 'medio',
    build: (rng, id) => {
      const total = rng.choice([20, 40, 50]);
      const pA = rng.choice([20, 25, 30, 40].filter(p => (total * p) % 100 === 0));
      const cA = (total * pA) / 100;
      const rem = total - cA;
      const cB = Math.floor(rem / 2);
      const cC = rem - cB;
      const { options, correctAnswer } = numericOptions(pA, [cA - pA, 10, -10, 15], v => `${v}%`, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 24',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Porcentaje desde tabla)',
        categoryLabel: 'SIMCE · Tablas y porcentajes',
        prompt: `La tabla muestra las colaciones preferidas en 6° Básico. ¿Qué porcentaje del total de estudiantes prefiere Fruta?`,
        visualType: 'table_data',
        visualData: {
          title: 'Encuesta de Colaciones',
          headers: ['Opción', 'Estudiantes'],
          rows: [
            ['Fruta', String(cA)],
            ['Yogurt', String(cB)],
            ['Sándwich', String(cC)],
          ],
        },
        options,
        correctAnswer,
        explanation: `El total de encuestados es ${cA} + ${cB} + ${cC} = ${total}. Quienes prefieren fruta son ${cA}/${total} = ${pA}%.`,
      });
    },
  },
  {
    key: '6b-dat-tallo-hojas',
    grade: '6_basico',
    axis: 'datos_probabilidades',
    difficulty: 'dificil',
    build: (rng, id) => {
      const minV = rng.int(12, 18);
      const maxV = rng.int(41, 49);
      const range = maxV - minV;
      const { options, correctAnswer } = numericOptions(range, [minV, -4, 4, maxV - range], fmtInt, rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 22',
        difficulty: 'dificil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Tallo y hojas)',
        categoryLabel: 'SIMCE · Tallo y hojas',
        prompt: `Un diagrama de tallo y hojas registra puntajes: Tallo 1 | ${minV % 10}, 9  ·  Tallo 2 | 3, 5, 8  ·  Tallo 3 | 1, 4  ·  Tallo 4 | 0, ${maxV % 10}. ¿Cuál es el RANGO de los puntajes?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El menor puntaje es ${minV} y el mayor es ${maxV}. El rango es ${maxV} − ${minV} = ${range}.`,
      });
    },
  },
  {
    key: '6b-dat-probabilidad-urna',
    grade: '6_basico',
    axis: 'datos_probabilidades',
    difficulty: 'medio',
    build: (rng, id) => {
      const total = rng.choice([10, 12, 15, 20]);
      const fav = rng.choice([2, 3, 4, 5, 6].filter(x => x < total));
      const g = gcd(fav, total);
      const sn = fav / g;
      const sd = total / g;
      const correct = `${sn}/${sd}`;
      const options = buildOptions(
        correct,
        [`${fav}/${total - fav}`, `1/${fav}`, `${sd - sn}/${sd}`, `${sn}/${sd + 1}`],
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 24',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Probabilidad en urna)',
        categoryLabel: 'SIMCE · Probabilidades',
        prompt: `En una tómbola hay ${total} bolitas numeradas, de las cuales ${fav} son verdes y las demás azules. ¿Cuál es la probabilidad simplificada de extraer al azar una bolita verde?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `Casos favorables = ${fav} de ${total} posibles: ${fav}/${total}, que simplificada por ${g} resulta ${correct}.`,
      });
    },
  },
  {
    key: '6b-dat-probabilidad-ruleta',
    grade: '6_basico',
    axis: 'datos_probabilidades',
    difficulty: 'facil',
    build: (rng, id) => {
      const sectors = rng.choice([8, 10, 12]);
      const mult = rng.choice([2, 3]);
      const favCount = Math.floor(sectors / mult);
      const pct = Math.round((favCount / sectors) * 100);
      if ((favCount * 100) % sectors === 0) {
        const { options, correctAnswer } = numericOptions(pct, [10, -10, 25, -15], v => `${v}%`, rng);
        return makeItem({
          id,
          grade: '6_basico',
          axis: 'datos_probabilidades',
          oaCode: 'OA 24',
          difficulty: 'facil',
          simceSkill: 'Resolver problemas',
          simceSource: 'SIMCE 6° Básico · Generador paramétrico (Ruleta equiprobable)',
          categoryLabel: 'SIMCE · Probabilidades',
          prompt: `Una ruleta tiene ${sectors} sectores iguales numerados del 1 al ${sectors}. ¿Qué porcentaje de probabilidad hay de obtener un múltiplo de ${mult}?`,
          visualType: 'none',
          options,
          correctAnswer,
          explanation: `Hay ${favCount} múltiplos de ${mult} entre 1 y ${sectors}. Entonces ${favCount}/${sectors} = ${pct}%.`,
        });
      }
      const g = gcd(favCount, sectors);
      const correct = `${favCount / g}/${sectors / g}`;
      const options = buildOptions(correct, [`1/${mult + 1}`, `${favCount}/${sectors - favCount}`, `1/${sectors}`], rng);
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 24',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Ruleta equiprobable)',
        categoryLabel: 'SIMCE · Probabilidades',
        prompt: `Una ruleta tiene ${sectors} sectores iguales numerados del 1 al ${sectors}. ¿Cuál es la probabilidad simplificada de obtener un múltiplo de ${mult}?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `Hay ${favCount} múltiplos de ${mult} entre ${sectors} sectores: ${favCount}/${sectors} = ${correct}.`,
      });
    },
  },
  {
    key: '6b-dat-barras-afirmacion',
    grade: '6_basico',
    axis: 'datos_probabilidades',
    difficulty: 'medio',
    build: (rng, id) => {
      const a = rng.int(12, 18);
      const b = a * 2;
      const c = rng.int(15, 22);
      const d = rng.int(8, 11);
      const correct = 'El grupo B tiene exactamente el doble que el grupo A';
      const options = buildOptions(
        correct,
        [
          'El grupo D supera al grupo A',
          `La suma de todos los grupos es ${a + b + c + d + 10}`,
          'El grupo C es el menor de todos',
        ],
        rng
      );
      return makeItem({
        id,
        grade: '6_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 24',
        difficulty: 'medio',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 6° Básico · Generador paramétrico (Lectura crítica gráfico)',
        categoryLabel: 'SIMCE · Análisis de gráficos',
        prompt: `Observa el gráfico con el puntaje de cuatro equipos. ¿Cuál de las siguientes afirmaciones es VERDADERA?`,
        visualType: 'bar_chart',
        visualData: {
          title: 'Olimpiada Escolar',
          unit: 'pts',
          items: [
            { label: 'Grupo A', value: a },
            { label: 'Grupo B', value: b },
            { label: 'Grupo C', value: c },
            { label: 'Grupo D', value: d },
          ],
        },
        options,
        correctAnswer: correct,
        explanation: `Grupo A obtuvo ${a} puntos y Grupo B obtuvo ${b} puntos (2 × ${a} = ${b}).`,
      });
    },
  },
];

// ===========================================================================
// 8° BÁSICO TEMPLATES (41 arquetipos paramétricos across 5 axes)
// ===========================================================================
const TEMPLATES_8B: SimceTemplate[] = [
  // --- NÚMEROS Y OPERACIONES (9) ---
  {
    key: '8b-num-enteros-combinada',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    difficulty: 'facil',
    build: (rng, id) => {
      const a = rng.int(2, 7);
      const b = rng.int(3, 8);
      const d = rng.int(2, 6);
      const q = rng.int(2, 7);
      const c = d * q;
      const ans = -a * b + q; // (-a)*b + (-c)/(-d)
      const { options, correctAnswer } = numericOptions(
        ans,
        [-2 * q, 2 * a * b, 4, -4],
        fmtInt,
        rng,
        true
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 01',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Operatoria en ℤ)',
        categoryLabel: 'SIMCE · Números enteros',
        prompt: `¿Cuál es el resultado de la operación (−${a}) · ${b} + (−${c}) : (−${d})?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `(−${a}) · ${b} = −${a * b}, y (−${c}) : (−${d}) = +${q}. Luego −${a * b} + ${q} = ${fmtInt(ans)}.`,
      });
    },
  },
  {
    key: '8b-num-enteros-temperatura',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    difficulty: 'facil',
    build: (rng, id) => {
      const minT = -rng.int(4, 14);
      const maxT = rng.int(5, 16);
      const diff = maxT - minT;
      const { options, correctAnswer } = numericOptions(
        diff,
        [maxT + minT - diff, -4, 4, 2],
        v => `${v}°C`,
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 01',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Variación térmica)',
        categoryLabel: 'SIMCE · Enteros en contexto',
        prompt: `En la zona cordillerana, la temperatura mínima fue de ${fmtInt(minT)}°C y la máxima alcanzó ${maxT}°C. ¿Cuál fue la variación térmica (diferencia entre máxima y mínima)?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Variación = ${maxT} − (${fmtInt(minT)}) = ${maxT} + ${Math.abs(minT)} = ${diff}°C.`,
      });
    },
  },
  {
    key: '8b-num-racionales-division',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    difficulty: 'medio',
    build: (rng, id) => {
      const pairs = [
        { n1: -3, d1: 4, n2: 3, d2: 8, rn: -2, rd: 1, label: '−2' },
        { n1: -2, d1: 3, n2: 4, d2: 9, rn: -3, rd: 2, label: '−3/2' },
        { n1: -5, d1: 6, n2: 5, d2: 12, rn: -2, rd: 1, label: '−2' },
        { n1: -3, d1: 5, n2: -9, d2: 10, rn: 2, rd: 3, label: '2/3' },
        { n1: 4, d1: 7, n2: -8, d2: 21, rn: -3, rd: 2, label: '−3/2' },
      ];
      const p = rng.choice(pairs);
      const sign2 = p.n2 < 0 ? `(−${Math.abs(p.n2)}/${p.d2})` : `${p.n2}/${p.d2}`;
      const sign1 = p.n1 < 0 ? `(−${Math.abs(p.n1)}/${p.d1})` : `${p.n1}/${p.d1}`;
      const options = buildOptions(p.label, ['2', '−2/3', '3/2', '−1/2', '−3/2', '2/3'], rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 02',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (División en ℚ)',
        categoryLabel: 'SIMCE · Racionales',
        prompt: `¿Cuál es el resultado simplificado de ${sign1} : ${sign2}?`,
        visualType: 'none',
        options,
        correctAnswer: p.label,
        explanation: `Dividir por una fracción equivale a multiplicar por su inverso multiplicativo, obteniendo ${p.label}.`,
      });
    },
  },
  {
    key: '8b-num-potencias-propiedades',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    difficulty: 'facil',
    build: (rng, id) => {
      const base = rng.choice([2, 3, 5, 7]);
      const e1 = rng.int(4, 8);
      const e2 = rng.int(2, 5);
      const e3 = rng.int(1, e1 + e2 - 2);
      const resExp = e1 + e2 - e3;
      const sup = (n: number) =>
        String(n).replace(/0/g, '⁰').replace(/1/g, '¹').replace(/2/g, '²').replace(/3/g, '³').replace(/4/g, '⁴').replace(/5/g, '⁵').replace(/6/g, '⁶').replace(/7/g, '⁷').replace(/8/g, '⁸').replace(/9/g, '⁹');
      const correct = `${base}${sup(resExp)}`;
      const options = buildOptions(
        correct,
        [`${base}${sup(e1 + e2 + e3)}`, `${base}${sup(Math.max(1, resExp + 2))}`, `${base * 2}${sup(resExp)}`],
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 03',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Potencias)',
        categoryLabel: 'SIMCE · Potencias',
        prompt: `¿A qué potencia equivale la expresión (${base}${sup(e1)} · ${base}${sup(e2)}) : ${base}${sup(e3)}?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `En multiplicación de igual base se suman exponentes (${e1} + ${e2} = ${e1 + e2}) y en división se restan (${e1 + e2} − ${e3} = ${resExp}): ${correct}.`,
      });
    },
  },
  {
    key: '8b-num-crecimiento-exponencial',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    difficulty: 'dificil',
    build: (rng, id) => {
      const factor = rng.choice([2, 3]);
      const steps = factor === 2 ? rng.int(4, 6) : rng.int(3, 4);
      const init = rng.choice([1, 2, 5]);
      const ans = init * Math.pow(factor, steps);
      const mins = rng.choice([15, 20, 30]);
      const totalMins = mins * steps;
      const { options, correctAnswer } = numericOptions(
        ans,
        [init * factor * steps - ans, ans / factor - ans, ans * factor - ans],
        v => `${fmtInt(v)} bacterias`,
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 03',
        difficulty: 'dificil',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Crecimiento exponencial)',
        categoryLabel: 'SIMCE · Potencias',
        prompt: `Un cultivo comienza con ${init} ${init === 1 ? 'bacteria' : 'bacterias'} y se ${factor === 2 ? 'duplica' : 'triplica'} cada ${mins} minutos. ¿Cuántas bacterias habrá al cabo de ${totalMins} minutos?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `En ${totalMins} minutos hay ${totalMins} : ${mins} = ${steps} periodos. Cantidad = ${init} · ${factor}^${steps} = ${fmtInt(ans)} bacterias.`,
      });
    },
  },
  {
    key: '8b-num-raiz-estimacion',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    difficulty: 'medio',
    build: (rng, id) => {
      const k = rng.int(6, 14);
      const n = rng.int(k * k + 3, (k + 1) * (k + 1) - 3);
      const correct = `Entre ${k} y ${k + 1}`;
      const options = buildOptions(
        correct,
        [`Entre ${k - 1} y ${k}`, `Entre ${k + 1} y ${k + 2}`, `Entre ${k + 2} y ${k + 3}`],
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 04',
        difficulty: 'medio',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Raíces cuadradas)',
        categoryLabel: 'SIMCE · Raíces cuadradas',
        prompt: `¿Entre qué par de números enteros consecutivos se encuentra el valor de √${n}?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `Como ${k}² = ${k * k} y ${k + 1}² = ${(k + 1) * (k + 1)}, y ${k * k} < ${n} < ${(k + 1) * (k + 1)}, √${n} está entre ${k} y ${k + 1}.`,
      });
    },
  },
  {
    key: '8b-num-raices-exactas',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    difficulty: 'facil',
    build: (rng, id) => {
      const a = rng.int(4, 12);
      const b = rng.int(3, 10);
      const c = rng.int(2, 6);
      const ans = a + b - c;
      const { options, correctAnswer } = numericOptions(ans, [2 * c, -3, 3, -5], fmtInt, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 04',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Operatoria con raíces)',
        categoryLabel: 'SIMCE · Raíces cuadradas',
        prompt: `¿Cuál es el valor de √${a * a} + √${b * b} − √${c * c}?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `√${a * a} = ${a}, √${b * b} = ${b} y √${c * c} = ${c}. Entonces ${a} + ${b} − ${c} = ${ans}.`,
      });
    },
  },
  {
    key: '8b-num-porcentaje-sucesivo',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    difficulty: 'dificil',
    build: (rng, id) => {
      const price = rng.choice([20000, 30000, 40000, 50000]);
      const d1 = rng.choice([10, 20]);
      const d2 = rng.choice([10, 20, 25]);
      const after1 = price * (1 - d1 / 100);
      const finalP = after1 * (1 - d2 / 100);
      const naiveP = price * (1 - (d1 + d2) / 100);
      const { options, correctAnswer } = numericOptions(
        finalP,
        [naiveP - finalP, 1200, -1200, 2500],
        fmtCLP,
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 05',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Descuentos sucesivos)',
        categoryLabel: 'SIMCE · Variaciones porcentuales',
        prompt: `Un artículo de ${fmtCLP(price)} tiene un ${d1}% de descuento y, sobre ese nuevo valor rebajado, se aplica un ${d2}% adicional con tarjeta. ¿Cuánto se paga al final?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Tras ${d1}% queda en ${fmtCLP(after1)}. Luego descontamos ${d2}% de ${fmtCLP(after1)} y resulta ${fmtCLP(finalP)}.`,
      });
    },
  },
  {
    key: '8b-num-porcentaje-inverso',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    difficulty: 'dificil',
    build: (rng, id) => {
      const original = rng.choice([15000, 20000, 25000, 30000, 40000]);
      const disc = rng.choice([20, 25, 30]);
      const paid = (original * (100 - disc)) / 100;
      const { options, correctAnswer } = numericOptions(
        original,
        [paid * (1 + disc / 100) - original, -2000, 3000, -4000],
        fmtCLP,
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'numeros_operaciones',
        oaCode: 'OA 05',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Precio original)',
        categoryLabel: 'SIMCE · Porcentajes',
        prompt: `Después de aplicar un ${disc}% de descuento, un par de zapatillas costó ${fmtCLP(paid)}. ¿Cuál era el precio original sin descuento?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El valor pagado corresponde al ${100 - disc}% del total. Precio original = ${fmtCLP(paid)} : 0,${100 - disc} = ${fmtCLP(original)}.`,
      });
    },
  },

  // --- PATRONES Y ÁLGEBRA (8) ---
  {
    key: '8b-alg-reduccion-parentesis',
    grade: '8_basico',
    axis: 'patrones_algebra',
    difficulty: 'facil',
    build: (rng, id) => {
      const c = rng.int(3, 9);
      const a = rng.int(2, 6);
      const b = rng.int(2, 7);
      const e = b + rng.int(2, 5);
      // c - (ax - by) + (-ey + ax) = c + (b - e)y -> since e > b, coefficient of y is negative: -(e-b)y
      const diffY = e - b;
      const correct = `${c} − ${diffY}y`;
      const options = buildOptions(
        correct,
        [`${c} + ${diffY}y`, `${c} − ${b + e}y`, `${2 * a}x − ${diffY}y + ${c}`],
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 06',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Reducción algebraica)',
        categoryLabel: 'SIMCE · Álgebra',
        prompt: `Al reducir los términos semejantes en ${c} − (${a}x − ${b}y) + (−${e}y + ${a}x), ¿qué expresión se obtiene?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `Eliminando el paréntesis: ${c} − ${a}x + ${b}y − ${e}y + ${a}x. Los términos en x se anulan y ${b}y − ${e}y = −${diffY}y, quedando ${correct}.`,
      });
    },
  },
  {
    key: '8b-alg-producto-binomios',
    grade: '8_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const a = rng.int(2, 7);
      const b = rng.int(2, 6);
      const sum = a + b;
      const prod = a * b;
      const correct = `x² + ${sum}x + ${prod}`;
      const options = buildOptions(
        correct,
        [`x² + ${prod}`, `x² + ${prod}x + ${sum}`, `x² + ${sum}x + ${sum}`],
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 06',
        difficulty: 'medio',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Multiplicación algebraica)',
        categoryLabel: 'SIMCE · Álgebra',
        prompt: `Un rectángulo mide (x + ${a}) cm de largo y (x + ${b}) cm de ancho. ¿Qué expresión representa su área?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `(x + ${a})(x + ${b}) = x² + (${a} + ${b})x + (${a} · ${b}) = ${correct}.`,
      });
    },
  },
  {
    key: '8b-alg-ecuacion-dos-lados',
    grade: '8_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const c = rng.int(2, 4);
      const a = c + rng.int(2, 4);
      const x = rng.int(2, 9);
      const b = rng.int(1, 9);
      const d = (a - c) * x + b;
      const { options, correctAnswer } = numericOptions(x, [1, -1, 2, -2], v => `x = ${v}`, rng, true);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 08',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Ecuación lineal)',
        categoryLabel: 'SIMCE · Ecuaciones',
        prompt: `¿Cuál es la solución de la ecuación ${a}x + ${b} = ${c}x + ${d}?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Agrupando las incógnitas: (${a} − ${c})x = ${d} − ${b} ⇒ ${a - c}x = ${d - b} ⇒ x = ${x}.`,
      });
    },
  },
  {
    key: '8b-alg-inecuacion-lineal',
    grade: '8_basico',
    axis: 'patrones_algebra',
    difficulty: 'dificil',
    build: (rng, id) => {
      const a = rng.int(2, 5);
      const b = rng.int(4, 15);
      const xLimit = rng.int(4, 11);
      const c = a * xLimit + b;
      const ans = xLimit - 1;
      const { options, correctAnswer } = numericOptions(ans, [1, 2, -1, -2], fmtInt, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 09',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Inecuación lineal)',
        categoryLabel: 'SIMCE · Inecuaciones',
        prompt: `¿Cuál es el MAYOR número entero que satisface la inecuación ${a}x + ${b} < ${c}?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `${a}x < ${c - b} ⇒ x < ${xLimit}. Como debe ser estrictamente menor que ${xLimit}, el mayor entero es ${ans}.`,
      });
    },
  },
  {
    key: '8b-alg-funcion-afin-modelo',
    grade: '8_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const fixed = rng.choice([2500, 3500, 4500, 6000]);
      const perUnit = rng.choice([120, 150, 200, 250]);
      const units = rng.int(12, 30);
      const total = fixed + perUnit * units;
      const { options, correctAnswer } = numericOptions(
        total,
        [-fixed + perUnit, 1000, -1000, 1500],
        fmtCLP,
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 10',
        difficulty: 'medio',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Función afín)',
        categoryLabel: 'SIMCE · Función afín',
        prompt: `Un plan de agua potable cobra un cargo fijo mensual de ${fmtCLP(fixed)} más ${fmtCLP(perUnit)} por cada metro cúbico consumido. ¿Cuánto pagará una familia que consume ${units} m³ en un mes?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Usamos f(x) = ${perUnit}x + ${fixed}. Para x = ${units}: ${perUnit}·${units} + ${fixed} = ${fmtCLP(total)}.`,
      });
    },
  },
  {
    key: '8b-alg-funcion-afin-tabla',
    grade: '8_basico',
    axis: 'patrones_algebra',
    difficulty: 'dificil',
    build: (rng, id) => {
      const m = rng.int(2, 6);
      const n = rng.int(1, 7);
      const xs = [0, 1, 2, 3];
      const correct = `f(x) = ${m}x + ${n}`;
      const options = buildOptions(
        correct,
        [`f(x) = ${n}x + ${m}`, `f(x) = ${m}x − ${n}`, `f(x) = ${m + 1}x + ${n}`],
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 10',
        difficulty: 'dificil',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Expresión de función)',
        categoryLabel: 'SIMCE · Funciones',
        prompt: `¿Qué función afín representa exactamente los valores de la siguiente tabla?`,
        visualType: 'table_data',
        visualData: {
          title: 'Tabla de Valores',
          headers: ['x', 'f(x)'],
          rows: xs.map(x => [String(x), String(m * x + n)]),
        },
        options,
        correctAnswer: correct,
        explanation: `Cuando x = 0, f(0) = ${n} (intercepto n = ${n}). Por cada unidad que aumenta x, f(x) sube ${m} (pendiente m = ${m}). Así, ${correct}.`,
      });
    },
  },
  {
    key: '8b-alg-funcion-lineal-evaluar',
    grade: '8_basico',
    axis: 'patrones_algebra',
    difficulty: 'facil',
    build: (rng, id) => {
      const m = rng.int(3, 8);
      const n = rng.int(2, 9);
      const targetY = m * rng.int(4, 11) + n;
      const ansX = (targetY - n) / m;
      const { options, correctAnswer } = numericOptions(ansX, [2, -2, 3, -1], fmtInt, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 10',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Preimagen en función)',
        categoryLabel: 'SIMCE · Funciones',
        prompt: `Dada la función f(x) = ${m}x + ${n}, ¿para qué valor de x se cumple que f(x) = ${targetY}?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Igualamos ${m}x + ${n} = ${targetY} ⇒ ${m}x = ${targetY - n} ⇒ x = ${ansX}.`,
      });
    },
  },
  {
    key: '8b-alg-factorizacion',
    grade: '8_basico',
    axis: 'patrones_algebra',
    difficulty: 'medio',
    build: (rng, id) => {
      const k = rng.int(3, 8);
      const a = rng.int(2, 6);
      const b = rng.int(2, 7);
      const correct = `${k}(${a}x + ${b})`;
      const options = buildOptions(
        correct,
        [`${k}(${a}x + ${k * b})`, `${k * a}(x + ${b})`, `${a}(${k}x + ${b})`],
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'patrones_algebra',
        oaCode: 'OA 06',
        difficulty: 'medio',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Factorización)',
        categoryLabel: 'SIMCE · Factorización',
        prompt: `¿Cuál de las siguientes expresiones equivale a ${k * a}x + ${k * b} al factorizar por ${k}?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `Extraemos el factor común ${k}: ${k} · ${a}x + ${k} · ${b} = ${correct}.`,
      });
    },
  },

  // --- GEOMETRÍA (8) ---
  {
    key: '8b-geo-pitagoras-hipotenusa',
    grade: '8_basico',
    axis: 'geometria',
    difficulty: 'facil',
    build: (rng, id) => {
      const triples = [
        [3, 4, 5],
        [6, 8, 10],
        [9, 12, 15],
        [5, 12, 13],
        [8, 15, 17],
        [12, 16, 20],
      ];
      const [a, b, c] = rng.choice(triples);
      const { options, correctAnswer } = numericOptions(c, [a + b - c, -2, 2, 4], v => `${v} cm`, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'geometria',
        oaCode: 'OA 12',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Teorema de Pitágoras)',
        categoryLabel: 'SIMCE · Pitágoras',
        prompt: `En el triángulo rectángulo cuyos catetos miden ${a} cm y ${b} cm, ¿cuánto mide la hipotenusa?`,
        visualType: 'geometry_shape',
        visualData: { shape: 'triangulo_rectangulo', legA: a, legB: b, unit: 'cm' },
        options,
        correctAnswer,
        explanation: `c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, por lo que c = √${c * c} = ${c} cm.`,
      });
    },
  },
  {
    key: '8b-geo-pitagoras-cateto',
    grade: '8_basico',
    axis: 'geometria',
    difficulty: 'medio',
    build: (rng, id) => {
      const triples = [
        [6, 8, 10],
        [5, 12, 13],
        [8, 15, 17],
        [9, 12, 15],
        [7, 24, 25],
      ];
      const [a, b, c] = rng.choice(triples);
      const { options, correctAnswer } = numericOptions(b, [c + a - b, -2, 3, -3], v => `${v} cm`, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'geometria',
        oaCode: 'OA 12',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Cateto con Pitágoras)',
        categoryLabel: 'SIMCE · Pitágoras',
        prompt: `Un triángulo rectángulo tiene una hipotenusa de ${c} cm y uno de sus catetos mide ${a} cm. ¿Cuánto mide el otro cateto?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `b² = ${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}, luego b = √${b * b} = ${b} cm.`,
      });
    },
  },
  {
    key: '8b-geo-pitagoras-escalera',
    grade: '8_basico',
    axis: 'geometria',
    difficulty: 'dificil',
    build: (rng, id) => {
      const scale = rng.choice([1, 2]);
      const base = 3 * scale;
      const height = 4 * scale;
      const ladder = 5 * scale;
      const { options, correctAnswer } = numericOptions(height, [ladder - height, -1, 1, 2], v => `${v} m`, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'geometria',
        oaCode: 'OA 12',
        difficulty: 'dificil',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Aplicación Pitágoras)',
        categoryLabel: 'SIMCE · Pitágoras',
        prompt: `Una escalera de ${ladder} m de largo se apoya sobre una pared vertical dejando su base a ${base} m de distancia del muro. ¿A qué altura de la pared llega la escalera?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `La escalera es la hipotenusa (${ladder} m): h² = ${ladder}² − ${base}² = ${ladder * ladder - base * base} ⇒ h = ${height} m.`,
      });
    },
  },
  {
    key: '8b-geo-traslacion-vector',
    grade: '8_basico',
    axis: 'geometria',
    difficulty: 'facil',
    build: (rng, id) => {
      const x = rng.int(-5, 6);
      const y = rng.int(-5, 6);
      const vx = rng.choice([-4, -3, 3, 4, 5]);
      const vy = rng.choice([-5, -2, 2, 4, 6]);
      const nx = x + vx;
      const ny = y + vy;
      const fmtPt = (a: number, b: number) => `(${fmtInt(a)}, ${fmtInt(b)})`;
      const correct = fmtPt(nx, ny);
      const options = buildOptions(
        correct,
        [fmtPt(x - vx, y - vy), fmtPt(ny, nx), fmtPt(nx, y - vy), fmtPt(nx + 1, ny - 1)],
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'geometria',
        oaCode: 'OA 13',
        difficulty: 'facil',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Traslación vectorial)',
        categoryLabel: 'SIMCE · Isometrías',
        prompt: `Al punto P${fmtPt(x, y)} del plano cartesiano se le aplica la traslación según el vector v = ${fmtPt(vx, vy)}. ¿Cuál es el punto imagen P'?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `Sumamos coordenada a coordenada: (${fmtInt(x)} + ${fmtInt(vx)}, ${fmtInt(y)} + ${fmtInt(vy)}) = ${correct}.`,
      });
    },
  },
  {
    key: '8b-geo-reflexion-rotacion',
    grade: '8_basico',
    axis: 'geometria',
    difficulty: 'medio',
    build: (rng, id) => {
      const x = rng.int(2, 7);
      const y = rng.int(2, 7);
      const mode = rng.choice(['ejeX', 'ejeY', 'rot180']);
      const ans =
        mode === 'ejeX'
          ? `(${x}, −${y})`
          : mode === 'ejeY'
          ? `(−${x}, ${y})`
          : `(−${x}, −${y})`;
      const desc =
        mode === 'ejeX'
          ? 'una reflexión respecto al eje X'
          : mode === 'ejeY'
          ? 'una reflexión respecto al eje Y'
          : 'una rotación de 180° en torno al origen (0, 0)';
      const options = buildOptions(ans, [`(${x}, −${y})`, `(−${x}, ${y})`, `(−${x}, −${y})`, `(${y}, ${x})`], rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'geometria',
        oaCode: 'OA 13',
        difficulty: 'medio',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Reflexión y rotación)',
        categoryLabel: 'SIMCE · Isometrías',
        prompt: `Si al punto A(${x}, ${y}) se le aplica ${desc}, ¿cuáles son las coordenadas del punto resultante?`,
        visualType: 'none',
        options,
        correctAnswer: ans,
        explanation:
          mode === 'ejeX'
            ? `Reflejar respecto al eje X mantiene x y cambia el signo de y: ${ans}.`
            : mode === 'ejeY'
            ? `Reflejar respecto al eje Y cambia el signo de x y mantiene y: ${ans}.`
            : `Rotar 180° respecto al origen cambia el signo de ambas coordenadas: ${ans}.`,
      });
    },
  },
  {
    key: '8b-geo-composicion-isometrias',
    grade: '8_basico',
    axis: 'geometria',
    difficulty: 'dificil',
    build: (rng, id) => {
      const x = rng.int(1, 5);
      const y = rng.int(2, 6);
      const dx = rng.int(2, 4);
      const dy = rng.int(1, 3);
      const tx = x + dx;
      const ty = y + dy;
      const rx = -tx;
      const ry = ty;
      const correct = `(−${Math.abs(rx)}, ${ry})`;
      const options = buildOptions(
        correct,
        [`(${tx}, −${ty})`, `(−${x + dx}, −${ry})`, `(${-x + dx}, ${ty})`],
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'geometria',
        oaCode: 'OA 14',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Composición isometrías)',
        categoryLabel: 'SIMCE · Isometrías',
        prompt: `Al punto (${x}, ${y}) primero se le traslada por el vector (${dx}, ${dy}) y luego el resultado se refleja respecto al eje Y. ¿Cuál es la coordenada final?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `Traslación: (${x} + ${dx}, ${y} + ${dy}) = (${tx}, ${ty}). Luego reflexión respecto al eje Y cambia signo de x: ${correct}.`,
      });
    },
  },
  {
    key: '8b-geo-poligono-angulos',
    grade: '8_basico',
    axis: 'geometria',
    difficulty: 'medio',
    build: (rng, id) => {
      const specs = [
        { name: 'pentágono', n: 5, sum: 540 },
        { name: 'hexágono', n: 6, sum: 720 },
        { name: 'octágono', n: 8, sum: 1080 },
        { name: 'decágono', n: 10, sum: 1440 },
      ];
      const p = rng.choice(specs);
      const { options, correctAnswer } = numericOptions(p.sum, [-180, 180, -360], v => `${fmtInt(v)}°`, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'geometria',
        oaCode: 'OA 13',
        difficulty: 'medio',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Polígonos)',
        categoryLabel: 'SIMCE · Polígonos',
        prompt: `¿Cuánto suman todos los ángulos interiores de un ${p.name} (${p.n} lados)?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Aplicando (${p.n} − 2) · 180° = ${p.n - 2} · 180° = ${fmtInt(p.sum)}°.`,
      });
    },
  },
  {
    key: '8b-geo-homotecia-escala',
    grade: '8_basico',
    axis: 'geometria',
    difficulty: 'dificil',
    build: (rng, id) => {
      const k = rng.choice([2, 3, 4]);
      const baseArea = rng.int(5, 14);
      const newArea = baseArea * k * k;
      const { options, correctAnswer } = numericOptions(
        newArea,
        [baseArea * k - newArea, baseArea + k - newArea, k * k],
        v => `${v} cm²`,
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'geometria',
        oaCode: 'OA 14',
        difficulty: 'dificil',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Semejanza y áreas)',
        categoryLabel: 'SIMCE · Semejanza',
        prompt: `Una figura plana tiene un área de ${baseArea} cm². Si todas sus dimensiones lineales se amplían multiplicándolas por ${k}, ¿cuál será la nueva área?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Cuando las longitudes se multiplican por k = ${k}, el área se multiplica por k² = ${k * k}. Así, ${baseArea} × ${k * k} = ${newArea} cm².`,
      });
    },
  },

  // --- MEDICIÓN (8) ---
  {
    key: '8b-med-circulo-perimetro',
    grade: '8_basico',
    axis: 'medicion',
    difficulty: 'facil',
    build: (rng, id) => {
      const r = rng.choice([5, 6, 8, 10, 12, 15, 20]);
      const p = Number((2 * 3.14 * r).toFixed(2));
      const { options, correctAnswer } = numericOptions(
        p,
        [Number((3.14 * r).toFixed(2)) - p, Number((3.14 * r * r).toFixed(2)) - p, 10],
        v => `${fmtDec(v, 2)} cm`,
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'medicion',
        oaCode: 'OA 11',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Perímetro círculo)',
        categoryLabel: 'SIMCE · Círculo',
        prompt: `Calcula el perímetro de la circunferencia de radio ${r} cm mostrada en la figura (considera π ≈ 3,14).`,
        visualType: 'geometry_shape',
        visualData: { shape: 'circulo', radius: r, unit: 'cm' },
        options,
        correctAnswer,
        explanation: `Perímetro = 2 · π · r ≈ 2 × 3,14 × ${r} = ${fmtDec(p, 2)} cm.`,
      });
    },
  },
  {
    key: '8b-med-circulo-area-diametro',
    grade: '8_basico',
    axis: 'medicion',
    difficulty: 'medio',
    build: (rng, id) => {
      const r = rng.choice([3, 4, 5, 6, 8, 10]);
      const d = 2 * r;
      const area = Number((3.14 * r * r).toFixed(2));
      const { options, correctAnswer } = numericOptions(
        area,
        [Number((3.14 * d * d).toFixed(2)) - area, Number((3.14 * d).toFixed(2)) - area, 12],
        v => `${fmtDec(v, 2)} m²`,
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'medicion',
        oaCode: 'OA 11',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Área círculo)',
        categoryLabel: 'SIMCE · Círculo',
        prompt: `Una piscina circular tiene un diámetro de ${d} metros. ¿Cuál es su área aproximada de superficie? (Usa π ≈ 3,14)`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El radio es la mitad del diámetro: r = ${r} m. Área = π · r² ≈ 3,14 × ${r}² = ${fmtDec(area, 2)} m².`,
      });
    },
  },
  {
    key: '8b-med-semicirculo',
    grade: '8_basico',
    axis: 'medicion',
    difficulty: 'dificil',
    build: (rng, id) => {
      const r = rng.choice([4, 6, 8, 10]);
      const coef = (r * r) / 2;
      const correct = `${coef}π cm²`;
      const options = buildOptions(correct, [`${r * r}π cm²`, `${r}π cm²`, `${2 * r}π cm²`], rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'medicion',
        oaCode: 'OA 11',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Semicírculo)',
        categoryLabel: 'SIMCE · Círculo',
        prompt: `¿Cuál es el área de un semicírculo (medio círculo) cuyo radio mide ${r} cm? (Expresa la respuesta en términos de π).`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `Área del círculo completo = π · ${r}² = ${r * r}π cm². La mitad es ${coef}π cm².`,
      });
    },
  },
  {
    key: '8b-med-cilindro-volumen',
    grade: '8_basico',
    axis: 'medicion',
    difficulty: 'facil',
    build: (rng, id) => {
      const r = rng.int(2, 6);
      const h = rng.int(4, 10);
      const coef = r * r * h;
      const correct = `${coef}π cm³`;
      const options = buildOptions(
        correct,
        [`${2 * r * h}π cm³`, `${r * h}π cm³`, `${r * r + h}π cm³`],
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'medicion',
        oaCode: 'OA 11',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Volumen cilindro)',
        categoryLabel: 'SIMCE · Cilindros',
        prompt: `Calcula el volumen del cilindro recto de radio basal ${r} cm y altura ${h} cm (deja la respuesta expresada en términos de π).`,
        visualType: 'cube_prism',
        visualData: { kind: 'cylinder', radius: r, height: h, unit: 'cm' },
        options,
        correctAnswer: correct,
        explanation: `V = π · r² · h = π · ${r}² · ${h} = ${coef}π cm³.`,
      });
    },
  },
  {
    key: '8b-med-cilindro-area-lateral',
    grade: '8_basico',
    axis: 'medicion',
    difficulty: 'dificil',
    build: (rng, id) => {
      const r = rng.int(3, 7);
      const h = rng.int(5, 11);
      const lat = 2 * r * h;
      const correct = `${lat}π cm²`;
      const options = buildOptions(
        correct,
        [`${r * h}π cm²`, `${r * r * h}π cm²`, `${2 * r * (r + h)}π cm²`],
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'medicion',
        oaCode: 'OA 11',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Área lateral cilindro)',
        categoryLabel: 'SIMCE · Cilindros',
        prompt: `Se quiere colocar una etiqueta que cubra solo el contorno lateral (sin las tapas) de un tarro cilíndrico de radio ${r} cm y altura ${h} cm. ¿Cuál es el área de la etiqueta en términos de π?`,
        visualType: 'cube_prism',
        visualData: { kind: 'cylinder', radius: r, height: h, unit: 'cm' },
        options,
        correctAnswer: correct,
        explanation: `El área lateral del cilindro es 2 · π · r · h = 2 · π · ${r} · ${h} = ${lat}π cm².`,
      });
    },
  },
  {
    key: '8b-med-cilindro-despejar-altura',
    grade: '8_basico',
    axis: 'medicion',
    difficulty: 'dificil',
    build: (rng, id) => {
      const r = rng.int(2, 5);
      const h = rng.int(4, 12);
      const volCoef = r * r * h;
      const { options, correctAnswer } = numericOptions(h, [2, -2, r * r - h, 4], v => `${v} cm`, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'medicion',
        oaCode: 'OA 11',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Altura de cilindro)',
        categoryLabel: 'SIMCE · Cilindros',
        prompt: `Un vaso cilíndrico tiene un volumen de ${volCoef}π cm³ y un radio basal de ${r} cm. ¿Cuál es su altura?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `V = π · r² · h ⇒ ${volCoef}π = π · ${r}² · h ⇒ h = ${volCoef} : ${r * r} = ${h} cm.`,
      });
    },
  },
  {
    key: '8b-med-prisma-triangular-vol',
    grade: '8_basico',
    axis: 'medicion',
    difficulty: 'medio',
    build: (rng, id) => {
      const b = rng.choice([4, 6, 8]);
      const hTri = rng.int(3, 7);
      const largo = rng.int(5, 10);
      const baseArea = (b * hTri) / 2;
      const vol = baseArea * largo;
      const { options, correctAnswer } = numericOptions(vol, [b * hTri * largo - vol, baseArea - vol, 12], v => `${v} m³`, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'medicion',
        oaCode: 'OA 11',
        difficulty: 'medio',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Prisma triangular)',
        categoryLabel: 'SIMCE · Prismas',
        prompt: `Una carpa con forma de prisma triangular tiene una entrada triangular de ${b} m de ancho por ${hTri} m de alto, y ${largo} m de largo. ¿Cuál es su volumen interior?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Área basal = (${b} × ${hTri}) : 2 = ${baseArea} m². Volumen = ${baseArea} × ${largo} = ${vol} m³.`,
      });
    },
  },
  {
    key: '8b-med-corona-circular',
    grade: '8_basico',
    axis: 'medicion',
    difficulty: 'dificil',
    build: (rng, id) => {
      const rIn = rng.int(2, 5);
      const rOut = rIn + rng.int(2, 4);
      const diff = rOut * rOut - rIn * rIn;
      const correct = `${diff}π m²`;
      const options = buildOptions(
        correct,
        [`${(rOut - rIn) * (rOut - rIn)}π m²`, `${rOut * rOut + rIn * rIn}π m²`, `${rOut - rIn}π m²`],
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'medicion',
        oaCode: 'OA 11',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Corona circular)',
        categoryLabel: 'SIMCE · Círculo',
        prompt: `Un sendero circular rodea una fuente central. El radio exterior del sendero mide ${rOut} m y el radio de la fuente interior mide ${rIn} m. ¿Cuál es el área del sendero (en función de π)?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: `Restamos el círculo interior al exterior: π(${rOut}² − ${rIn}²) = π(${rOut * rOut} − ${rIn * rIn}) = ${diff}π m².`,
      });
    },
  },

  // --- DATOS Y PROBABILIDADES (8) ---
  {
    key: '8b-dat-estadigrafos-tabla',
    grade: '8_basico',
    axis: 'datos_probabilidades',
    difficulty: 'facil',
    build: (rng, id) => {
      const f1 = rng.int(3, 7);
      const f2 = rng.int(5, 9);
      const f3 = rng.int(4, 8);
      const f4 = rng.int(2, 5);
      const sum = 1 * f1 + 2 * f2 + 3 * f3 + 4 * f4;
      const total = f1 + f2 + f3 + f4;
      // Ensure clean rounded or exact to 1 decimal
      const mean = Number((sum / total).toFixed(1));
      const { options, correctAnswer } = numericOptions(mean, [0.4, -0.4, 0.8, -0.6], v => fmtDec(v, 1), rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 15',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Media ponderada)',
        categoryLabel: 'SIMCE · Estadística',
        prompt: `La tabla resume la cantidad de hermanos de un grupo de estudiantes. ¿Cuál es el promedio (aproximado a la décima) de hermanos por estudiante?`,
        visualType: 'table_data',
        visualData: {
          title: 'Frecuencia de Hermanos',
          headers: ['N° de hermanos', 'Frecuencia'],
          rows: [
            ['1', String(f1)],
            ['2', String(f2)],
            ['3', String(f3)],
            ['4', String(f4)],
          ],
        },
        options,
        correctAnswer,
        explanation: `Suma ponderada = ${sum} dividida por ${total} estudiantes ≈ ${fmtDec(mean, 1)}.`,
      });
    },
  },
  {
    key: '8b-dat-cuartiles',
    grade: '8_basico',
    axis: 'datos_probabilidades',
    difficulty: 'medio',
    build: (rng, id) => {
      const base = rng.int(10, 20);
      const arr = [base, base + 2, base + 4, base + 6, base + 9, base + 12, base + 15];
      const askQ3 = rng.next() > 0.5;
      const ans = askQ3 ? arr[5] : arr[1];
      const { options, correctAnswer } = numericOptions(
        ans,
        [arr[3] - ans, arr[askQ3 ? 4 : 2] - ans, 3, -3],
        fmtInt,
        rng
      );
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 15',
        difficulty: 'medio',
        simceSkill: 'Representar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Cuartiles)',
        categoryLabel: 'SIMCE · Medidas de posición',
        prompt: `Dado el conjunto ordenado de 7 puntajes: ${arr.join(', ')}. ¿Cuál es el valor del ${askQ3 ? 'tercer cuartil (Q3)' : 'primer cuartil (Q1)'}?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: askQ3
          ? `La mediana Q2 es ${arr[3]}. La mitad superior es [${arr.slice(4).join(', ')}], cuyo centro es Q3 = ${ans}.`
          : `La mediana Q2 es ${arr[3]}. La mitad inferior es [${arr.slice(0, 3).join(', ')}], cuyo centro es Q1 = ${ans}.`,
      });
    },
  },
  {
    key: '8b-dat-rango-intercuartil',
    grade: '8_basico',
    axis: 'datos_probabilidades',
    difficulty: 'dificil',
    build: (rng, id) => {
      const min = rng.int(12, 20);
      const q1 = min + rng.int(6, 12);
      const q2 = q1 + rng.int(5, 10);
      const q3 = q2 + rng.int(7, 13);
      const max = q3 + rng.int(6, 12);
      const ric = q3 - q1;
      const { options, correctAnswer } = numericOptions(ric, [max - min - ric, q2 - q1 - ric, 4], fmtInt, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 15',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Rango intercuartílico)',
        categoryLabel: 'SIMCE · Diagrama de cajón',
        prompt: `En un diagrama de cajón los valores son: Mín = ${min}, Q1 = ${q1}, Q2 = ${q2}, Q3 = ${q3} y Máx = ${max}. ¿Cuál es el rango intercuartílico (RIC)?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El rango intercuartílico mide el ancho de la caja central: RIC = Q3 − Q1 = ${q3} − ${q1} = ${ric}.`,
      });
    },
  },
  {
    key: '8b-dat-percentil',
    grade: '8_basico',
    axis: 'datos_probabilidades',
    difficulty: 'medio',
    build: (rng, id) => {
      const pct = rng.choice([70, 75, 80, 85, 90]);
      const total = rng.choice([120, 200, 300, 400]);
      const below = (total * pct) / 100;
      const above = total - below;
      const { options, correctAnswer } = numericOptions(above, [below - above, 10, -10], v => `${v} estudiantes`, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 15',
        difficulty: 'medio',
        simceSkill: 'Argumentar y comunicar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Percentiles)',
        categoryLabel: 'SIMCE · Percentiles',
        prompt: `En un ensayo comunal rindieron la prueba ${total} estudiantes. Si ${rng.choice(NAMES)} quedó ubicado exactamente en el percentil ${pct}, ¿cuántos estudiantes obtuvieron un puntaje superior al suyo?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `El percentil ${pct} supera al ${pct}% de los participantes, por lo que queda un ${100 - pct}% por sobre él/ella: ${100 - pct}% de ${total} = ${above} estudiantes.`,
      });
    },
  },
  {
    key: '8b-dat-principio-multiplicativo',
    grade: '8_basico',
    axis: 'datos_probabilidades',
    difficulty: 'facil',
    build: (rng, id) => {
      const a = rng.int(3, 5);
      const b = rng.int(4, 6);
      const c = rng.int(2, 4);
      const total = a * b * c;
      const { options, correctAnswer } = numericOptions(total, [a + b + c - total, a * b - total, 6], v => `${v} menús`, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 17',
        difficulty: 'facil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Principio multiplicativo)',
        categoryLabel: 'SIMCE · Combinatoria',
        prompt: `Un casino escolar ofrece ${a} tipos de entrada, ${b} platos de fondo y ${c} postres distintos. ¿Cuántos menús completos diferentes (1 entrada, 1 fondo y 1 postre) se pueden armar?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Por el principio multiplicativo: ${a} × ${b} × ${c} = ${total} combinaciones posibles.`,
      });
    },
  },
  {
    key: '8b-dat-probabilidad-dos-dados',
    grade: '8_basico',
    axis: 'datos_probabilidades',
    difficulty: 'dificil',
    build: (rng, id) => {
      const sums = [
        { s: 5, fav: 4, sim: '1/9', dist: ['4/12', '5/36', '1/6'] },
        { s: 7, fav: 6, sim: '1/6', dist: ['7/36', '1/12', '1/4'] },
        { s: 9, fav: 4, sim: '1/9', dist: ['9/36', '1/6', '1/12'] },
        { s: 10, fav: 3, sim: '1/12', dist: ['1/9', '1/6', '5/18'] },
      ];
      const pick = rng.choice(sums);
      const options = buildOptions(pick.sim, pick.dist, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 17',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Espacio muestral 2 dados)',
        categoryLabel: 'SIMCE · Probabilidades',
        prompt: `Al lanzar simultáneamente dos dados comunes de 6 caras, ¿cuál es la probabilidad simplificada de que la suma de sus puntos sea exactamente ${pick.s}?`,
        visualType: 'none',
        options,
        correctAnswer: pick.sim,
        explanation: `Hay 6 × 6 = 36 parejas posibles y exactamente ${pick.fav} de ellas suman ${pick.s}. Simplificando ${pick.fav}/36 = ${pick.sim}.`,
      });
    },
  },
  {
    key: '8b-dat-probabilidad-independiente',
    grade: '8_basico',
    axis: 'datos_probabilidades',
    difficulty: 'dificil',
    build: (rng, id) => {
      const cases = [
        { text: 'obtener cara en una moneda y un número par en un dado', num: 1, den: 4, exp: 'Moneda: 1/2, número par en dado: 3/6 = 1/2. Producto: (1/2) · (1/2) = 1/4.' },
        { text: 'obtener sello en una moneda y un número mayor que 4 en un dado', num: 1, den: 6, exp: 'Moneda: 1/2, mayor que 4 ({5,6}): 2/6 = 1/3. Producto: (1/2) · (1/3) = 1/6.' },
        { text: 'sacar sello en dos lanzamientos consecutivos de una moneda', num: 1, den: 4, exp: '(1/2) · (1/2) = 1/4.' },
      ];
      const c = rng.choice(cases);
      const correct = `${c.num}/${c.den}`;
      const options = buildOptions(correct, ['1/2', '1/3', '1/8', '1/12'], rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 17',
        difficulty: 'dificil',
        simceSkill: 'Modelar',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Eventos independientes)',
        categoryLabel: 'SIMCE · Probabilidades',
        prompt: `¿Cuál es la probabilidad de ${c.text}?`,
        visualType: 'none',
        options,
        correctAnswer: correct,
        explanation: c.exp,
      });
    },
  },
  {
    key: '8b-dat-cambio-promedio',
    grade: '8_basico',
    axis: 'datos_probabilidades',
    difficulty: 'dificil',
    build: (rng, id) => {
      const n = rng.choice([4, 5, 6]);
      const avg0 = rng.int(12, 18);
      const newAvg = avg0 + 2;
      const added = newAvg * (n + 1) - avg0 * n;
      const { options, correctAnswer } = numericOptions(added, [newAvg - added, -4, 4], fmtInt, rng);
      return makeItem({
        id,
        grade: '8_basico',
        axis: 'datos_probabilidades',
        oaCode: 'OA 15',
        difficulty: 'dificil',
        simceSkill: 'Resolver problemas',
        simceSource: 'SIMCE 8° Básico · Generador paramétrico (Propiedad de la media)',
        categoryLabel: 'SIMCE · Estadística',
        prompt: `El promedio de ${n} puntajes es ${avg0}. Si se agrega un puntaje más y el nuevo promedio sube a ${newAvg}, ¿cuál fue el puntaje agregado?`,
        visualType: 'none',
        options,
        correctAnswer,
        explanation: `Suma inicial = ${n} × ${avg0} = ${n * avg0}. Nueva suma = ${n + 1} × ${newAvg} = ${(n + 1) * newAvg}. Diferencia = ${added}.`,
      });
    },
  },
];

const ALL_SIMCE_TEMPLATES: Record<SimceGradeLevel, SimceTemplate[]> = {
  '4_basico': TEMPLATES_4B,
  '6_basico': TEMPLATES_6B,
  '8_basico': TEMPLATES_8B,
};

const AXES: ThematicAxis[] = [
  'numeros_operaciones',
  'patrones_algebra',
  'geometria',
  'medicion',
  'datos_probabilidades',
];

/**
 * Genera variaciones paramétricas deterministas (con semilla fija por nivel y eje)
 * para nutrir el banco base hasta alcanzar ~50 ítems por eje (~250 por nivel, >750 totales),
 * manteniendo consistencia visual en contadores y selector de cantidad de preguntas.
 */
export function generateSeededParametricSimceForGrade(
  grade: SimceGradeLevel,
  existingCountByAxis: Record<ThematicAxis, number>,
  targetPerAxis = 50
): SimceBankQuestion[] {
  const gradeSeed = grade === '4_basico' ? 40100 : grade === '6_basico' ? 60100 : 80100;
  const templates = ALL_SIMCE_TEMPLATES[grade];
  const out: SimceBankQuestion[] = [];
  const usedPrompts = new Set<string>();

  AXES.forEach((axis, axisIdx) => {
    const axisTemplates = templates.filter(t => t.axis === axis);
    const needed = Math.max(0, targetPerAxis - (existingCountByAxis[axis] || 0));
    const rng = makeRng(gradeSeed + axisIdx * 997);

    let generated = 0;
    let attempt = 0;
    while (generated < needed && attempt < needed * 6 && axisTemplates.length > 0) {
      const tpl = axisTemplates[attempt % axisTemplates.length];
      attempt++;
      const id = `simce-gen-${grade}-${axis}-${generated + 1}`;
      const q = tpl.build(rng, id);
      const pKey = q.prompt.trim();
      if (usedPrompts.has(pKey)) continue;
      usedPrompts.add(pKey);
      out.push(q);
      generated++;
    }
  });

  return out;
}

/**
 * Genera un lote completamente fresco (aleatorio real) de variaciones paramétricas SIMCE
 * con números, contextos, tablas y gráficos nuevos en cada generación o ensayo semanal.
 */
export function generateFreshParametricSimceBatch(params: {
  grade: SimceGradeLevel;
  axisFilter: ThematicAxis | 'all';
  roundsPerTemplate?: number;
}): SimceBankQuestion[] {
  const { grade, axisFilter, roundsPerTemplate = 2 } = params;
  const rng = makeRng();
  const templates = ALL_SIMCE_TEMPLATES[grade].filter(
    t => axisFilter === 'all' || t.axis === axisFilter
  );

  const out: SimceBankQuestion[] = [];
  const usedPrompts = new Set<string>();
  const stamp = Date.now().toString(36);

  for (let round = 0; round < roundsPerTemplate; round++) {
    for (const tpl of rng.shuffle(templates)) {
      const id = `simce-dyn-${grade}-${tpl.key}-${stamp}-${round}-${Math.floor(rng.next() * 9999)}`;
      const q = tpl.build(rng, id);
      const pKey = q.prompt.trim();
      if (!usedPrompts.has(pKey)) {
        usedPrompts.add(pKey);
        out.push(q);
      }
    }
  }

  return out;
}

/**
 * Genera un único ítem paramétrico SIMCE nuevo para el botón "Cambiar ítem",
 * evitando colisionar con los enunciados ya presentes en el ensayo.
 */
export function generateSingleFreshSimceItem(params: {
  grade: SimceGradeLevel;
  axis: ThematicAxis;
  excludePrompts?: Set<string>;
}): SimceBankQuestion | null {
  const { grade, axis, excludePrompts } = params;
  const templates = ALL_SIMCE_TEMPLATES[grade].filter(t => t.axis === axis);
  if (templates.length === 0) return null;

  const rng = makeRng();
  for (let i = 0; i < 15; i++) {
    const tpl = rng.choice(templates);
    const id = `simce-swap-${grade}-${tpl.key}-${Date.now().toString(36)}-${i}`;
    const q = tpl.build(rng, id);
    if (!excludePrompts || !excludePrompts.has(q.prompt.trim())) {
      return q;
    }
  }
  return templates[0].build(rng, `simce-swap-${grade}-${Date.now().toString(36)}`);
}
