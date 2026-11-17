import { LearningObjective, GradeLevel } from '../types';

export const MINEDUC_OBJECTIVES: LearningObjective[] = [
  // =========================================================================
  // 1° BÁSICO (Bases Curriculares MINEDUC Chile - Decreto N° 439)
  // =========================================================================
  {
    code: 'OA 01',
    grade: '1_basico',
    axis: 'numeros_operaciones',
    title: 'Contar y secuenciar números del 0 al 100',
    description: 'Contar números del 0 al 100 de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10, hacia adelante y hacia atrás, empezando por cualquier número menor que 100.',
    indicators: ['Continúa secuencias numéricas ascendentes y descendentes', 'Identifica el antecesor y sucesor de números hasta 100']
  },
  {
    code: 'OA 02',
    grade: '1_basico',
    axis: 'numeros_operaciones',
    title: 'Números ordinales del 1º al 10º',
    description: 'Identificar el orden de los elementos de una serie, utilizando números ordinales del primero (1º) al décimo (10º).',
    indicators: ['Reconoce la posición de objetos en una fila', 'Asocia numerales ordinales con su escritura en palabras']
  },
  {
    code: 'OA 03',
    grade: '1_basico',
    axis: 'numeros_operaciones',
    title: 'Lectura y representación de números del 0 al 20',
    description: 'Leer números del 0 al 20 y representarlos en forma concreta, pictórica y simbólica.',
    indicators: ['Asocia numerales con cantidades de objetos concretos', 'Escribe y reconoce números en palabras y cifras']
  },
  {
    code: 'OA 04',
    grade: '1_basico',
    axis: 'numeros_operaciones',
    title: 'Comparar y ordenar números del 0 al 20',
    description: 'Comparar y ordenar números del 0 al 20 de menor a mayor y/o viceversa, utilizando material concreto y/o software educativo.',
    indicators: ['Utiliza símbolos mayor que (>), menor que (<) e igual (=)', 'Ordena colecciones y cantidades de menor a mayor']
  },
  {
    code: 'OA 05',
    grade: '1_basico',
    axis: 'numeros_operaciones',
    title: 'Estimación de cantidades hasta 20',
    description: 'Estimar cantidades hasta 20 en situaciones concretas, usando un referente.',
    indicators: ['Estima si un grupo tiene más o menos de 10 elementos', 'Comprueba estimaciones contando uno a uno']
  },
  {
    code: 'OA 06',
    grade: '1_basico',
    axis: 'numeros_operaciones',
    title: 'Composición y descomposición aditiva hasta 20',
    description: 'Componer y descomponer números del 0 a 20 de manera aditiva, en forma concreta, pictórica y simbólica.',
    indicators: ['Descompone números en dos sumandos de diversas formas', 'Reconoce familias de operaciones aditivas']
  },
  {
    code: 'OA 07',
    grade: '1_basico',
    axis: 'numeros_operaciones',
    title: 'Cálculo mental de adición y sustracción hasta 20',
    description: 'Describir y aplicar estrategias de cálculo mental para las adiciones y las sustracciones hasta 20: conteo hacia adelante y atrás, completar 10, dobles.',
    indicators: ['Calcula sumas de un dígito usando dobles', 'Resuelve sustracciones pensando en la adición relacionada']
  },
  {
    code: 'OA 08',
    grade: '1_basico',
    axis: 'numeros_operaciones',
    title: 'Unidades y decenas en números del 0 al 20',
    description: 'Determinar las unidades y decenas en números del 0 al 20, agrupando de a 10, de manera concreta, pictórica y simbólica.',
    indicators: ['Agrupa objetos de a 10 para formar una decena', 'Identifica el valor de la decena y la unidad en cifras hasta 20']
  },
  {
    code: 'OA 09',
    grade: '1_basico',
    axis: 'numeros_operaciones',
    title: 'Adición y sustracción de números del 0 al 20',
    description: 'Demostrar que comprenden la adición y la sustracción de números del 0 al 20 progresivamente, de 0 a 5, de 6 a 10, de 11 a 20 con dos sumandos.',
    indicators: ['Resuelve sumas de un dígito con cálculo mental', 'Calcula restas simples dentro del ámbito 20', 'Aplica operaciones en problemas sencillos']
  },
  {
    code: 'OA 10',
    grade: '1_basico',
    axis: 'numeros_operaciones',
    title: 'Relación inversa entre adición y sustracción',
    description: 'Demostrar que la adición y la sustracción son operaciones inversas, de manera concreta, pictórica y simbólica.',
    indicators: ['Escribe 4 operaciones asociadas a un trío de números', 'Comprueba una resta sumando el resultado al sustraendo']
  },
  {
    code: 'OA 11',
    grade: '1_basico',
    axis: 'patrones_algebra',
    title: 'Patrones repetitivos y numéricos hasta 20',
    description: 'Reconocer, describir, crear y continuar patrones repetitivos (sonidos, figuras, ritmos) y patrones numéricos hasta el 20, crecientes y decrecientes.',
    indicators: ['Identifica la regla de formación de un patrón', 'Extiende secuencias con elementos faltantes']
  },
  {
    code: 'OA 12',
    grade: '1_basico',
    axis: 'patrones_algebra',
    title: 'Igualdad y desigualdad en la balanza (0 al 20)',
    description: 'Describir y registrar la igualdad y la desigualdad como equilibrio y desequilibrio, usando una balanza en forma concreta, pictórica y simbólica del 0 al 20, usando el símbolo igual (=).',
    indicators: ['Representa igualdades en balanzas de dos platos', 'Identifica si dos expresiones tienen el mismo valor']
  },
  {
    code: 'OA 13',
    grade: '1_basico',
    axis: 'geometria',
    title: 'Ubicación espacial de personas y objetos',
    description: 'Describir la posición de objetos y personas en relación a sí mismos y a otros objetos y personas, usando un lenguaje común (como derecha e izquierda).',
    indicators: ['Sigue trayectorias y direcciones simples', 'Describe posiciones relativas en la sala de clases']
  },
  {
    code: 'OA 14',
    grade: '1_basico',
    axis: 'geometria',
    title: 'Figuras 3D y figuras 2D en el entorno',
    description: 'Identificar en el entorno figuras 3D y figuras 2D y relacionarlas, usando material concreto.',
    indicators: ['Distingue formas planas de cuerpos con volumen', 'Reconoce figuras geométricas en objetos de la sala']
  },
  {
    code: 'OA 15',
    grade: '1_basico',
    axis: 'geometria',
    title: 'Líneas rectas y curvas',
    description: 'Identificar y dibujar líneas rectas y curvas.',
    indicators: ['Traza líneas rectas usando regla graduada', 'Diferencia contornos curvos de contornos poligonales rectos']
  },
  {
    code: 'OA 16',
    grade: '1_basico',
    axis: 'medicion',
    title: 'Duración de eventos con unidades no estandarizadas',
    description: 'Usar unidades no estandarizadas de tiempo para comparar la duración de eventos cotidianos.',
    indicators: ['Compara qué actividad demora más o menos tiempo', 'Usa aplausos, pasos o relojes de arena para estimar duración']
  },
  {
    code: 'OA 17',
    grade: '1_basico',
    axis: 'medicion',
    title: 'Secuenciación temporal: días, meses y fechas',
    description: 'Usar un lenguaje cotidiano para secuenciar eventos en el tiempo: días de la semana, meses del año y algunas fechas significativas.',
    indicators: ['Ordena secuencias cronológicas (antes/después, ayer/hoy/mañana)', 'Nombra en orden los 7 días de la semana y 12 meses']
  },
  {
    code: 'OA 18',
    grade: '1_basico',
    axis: 'medicion',
    title: 'Comparación de longitudes (largo y corto)',
    description: 'Identificar y comparar la longitud de objetos, usando palabras como largo y corto.',
    indicators: ['Compara dos o más objetos en forma directa', 'Ordena varillas u objetos según longitud']
  },
  {
    code: 'OA 19',
    grade: '1_basico',
    axis: 'datos_probabilidades',
    title: 'Recolección y registro de datos en tablas de conteo',
    description: 'Recolectar y registrar datos para responder preguntas estadísticas sobre sí mismo y el entorno, usando bloques, tablas de conteo y pictogramas.',
    indicators: ['Organiza información en listas y tablas de marcas', 'Cuenta frecuencias de respuestas en el curso']
  },
  {
    code: 'OA 20',
    grade: '1_basico',
    axis: 'datos_probabilidades',
    title: 'Construcción e interpretación de pictogramas',
    description: 'Construir, leer e interpretar pictogramas.',
    indicators: ['Extrae información de gráficos con figuras y dibujos', 'Compara cuál categoría tiene más o menos preferencias']
  },

  // =========================================================================
  // 2° BÁSICO (Bases Curriculares MINEDUC Chile - Decreto N° 439)
  // =========================================================================
  {
    code: 'OA 01',
    grade: '2_basico',
    axis: 'numeros_operaciones',
    title: 'Contar números hasta 1.000',
    description: 'Contar números del 0 al 1.000 de 2 en 2, de 5 en 5, de 10 en 10 y de 100 en 100, hacia adelante y hacia atrás, empezando por cualquier número menor que 1.000.',
    indicators: ['Cuenta de 10 en 10 hasta 1.000', 'Cuenta hacia atrás de 5 en 5 y 10 en 10']
  },
  {
    code: 'OA 02',
    grade: '2_basico',
    axis: 'numeros_operaciones',
    title: 'Lectura y representación de números hasta 100',
    description: 'Leer números del 0 al 100 y representarlos en forma concreta, pictórica y simbólica.',
    indicators: ['Escribe numerales y sus nombres en palabras hasta el 100', 'Representa con bloques multibase decenas y unidades']
  },
  {
    code: 'OA 03',
    grade: '2_basico',
    axis: 'numeros_operaciones',
    title: 'Comparar y ordenar números hasta 100',
    description: 'Comparar y ordenar números del 0 al 100 de menor a mayor y viceversa, usando material concreto y monedas nacionales.',
    indicators: ['Ordena de menor a mayor cifras de hasta 2 dígitos', 'Utiliza símbolos mayor (>), menor (<) e igual (=)']
  },
  {
    code: 'OA 04',
    grade: '2_basico',
    axis: 'numeros_operaciones',
    title: 'Estimación de cantidades hasta 100',
    description: 'Estimar cantidades hasta 100 en situaciones concretas, usando un referente.',
    indicators: ['Aproxima cantidades usando grupos de 10 como referente', 'Verifica estimaciones contando colecciones']
  },
  {
    code: 'OA 05',
    grade: '2_basico',
    axis: 'numeros_operaciones',
    title: 'Composición y descomposición aditiva hasta 100',
    description: 'Componer y descomponer números del 0 a 100 de manera aditiva, en forma concreta, pictórica y simbólica.',
    indicators: ['Descompone según valor posicional (ej: 47 = 40 + 7)', 'Forma números a partir de monedas de $1, $10 y $100']
  },
  {
    code: 'OA 06',
    grade: '2_basico',
    axis: 'numeros_operaciones',
    title: 'Estrategias de cálculo mental hasta 20',
    description: 'Describir y aplicar estrategias de cálculo mental para adiciones y sustracciones hasta 20: completar 10, usar dobles y mitades, uno más uno menos.',
    indicators: ['Calcula sumas usando el doble más uno', 'Calcula restas pensando en la suma relacionada']
  },
  {
    code: 'OA 07',
    grade: '2_basico',
    axis: 'numeros_operaciones',
    title: 'Unidades y decenas en números hasta 100',
    description: 'Identificar las unidades y decenas en números del 0 al 100, representando las cantidades de acuerdo a su valor posicional.',
    indicators: ['Reconoce el valor de posición de cada dígito', 'Compara el valor de cifras iguales en distintas posiciones']
  },
  {
    code: 'OA 08',
    grade: '2_basico',
    axis: 'numeros_operaciones',
    title: 'Propiedad del cero en la adición y sustracción',
    description: 'Demostrar y explicar de manera concreta, pictórica y simbólica el efecto de sumar y restar 0 a un número.',
    indicators: ['Reconoce que a + 0 = a y a - 0 = a', 'Aplica la propiedad del elemento neutro en cálculos rápidos']
  },
  {
    code: 'OA 09',
    grade: '2_basico',
    axis: 'numeros_operaciones',
    title: 'Adición y sustracción en el ámbito del 0 al 100',
    description: 'Demostrar que comprende la adición y la sustracción en el ámbito del 0 al 100 usando un lenguaje cotidiano y matemático.',
    indicators: ['Suma y resta con apoyo de bloques multibase y algoritmo', 'Resuelve problemas cotidianos de adición y sustracción']
  },
  {
    code: 'OA 10',
    grade: '2_basico',
    axis: 'numeros_operaciones',
    title: 'Relación entre adición y sustracción (familia de operaciones)',
    description: 'Demostrar que comprende la relación entre la adición y la sustracción al usar la familia de operaciones en cálculos aritméticos y resolución de problemas.',
    indicators: ['Verifica restas mediante sumas', 'Completa ecuaciones abiertas usando la operación inversa']
  },
  {
    code: 'OA 11',
    grade: '2_basico',
    axis: 'numeros_operaciones',
    title: 'Multiplicación: tablas del 2, 5 y 10',
    description: 'Demostrar que comprende la multiplicación usando representaciones concretas y pictóricas, expresándola como adición de sumandos iguales para las tablas del 2, 5 y 10.',
    indicators: ['Expresa sumas repetidas como producto', 'Calcula productos de las tablas del 2, 5 y 10']
  },
  {
    code: 'OA 12',
    grade: '2_basico',
    axis: 'patrones_algebra',
    title: 'Patrones numéricos y figuras en tablas',
    description: 'Crear, representar y continuar una variedad de patrones numéricos y completar los elementos faltantes, de manera manual y/o usando software educativo.',
    indicators: ['Identifica regularidades en filas y columnas de la tabla del 100', 'Encuentra números faltantes en secuencias']
  },
  {
    code: 'OA 13',
    grade: '2_basico',
    axis: 'patrones_algebra',
    title: 'Igualdad y desigualdad (0 al 20) con =, > y <',
    description: 'Demostrar, explicar y registrar la igualdad y la desigualdad en forma concreta y pictórica del 0 al 20, usando el símbolo igual (=) y los símbolos no igual (>, <).',
    indicators: ['Equilibra balanzas añadiendo o quitando elementos', 'Registra simbólicamente relaciones de orden y equivalencia']
  },
  {
    code: 'OA 14',
    grade: '2_basico',
    axis: 'geometria',
    title: 'Posición de objetos y personas respecto a otros',
    description: 'Representar y describir la posición de objetos y personas en relación a sí mismos y a otros objetos y personas, incluyendo derecha e izquierda.',
    indicators: ['Describe ubicaciones en planos simples y cuadrículas', 'Sigue instrucciones de desplazamiento espacial']
  },
  {
    code: 'OA 15',
    grade: '2_basico',
    axis: 'geometria',
    title: 'Figuras 2D: triángulos, cuadrados, rectángulos y círculos',
    description: 'Describir, comparar y construir figuras 2D (triángulos, cuadrados, rectángulos y círculos) con material concreto.',
    indicators: ['Cuenta lados y vértices en polígonos simples', 'Clasifica figuras 2D según número de lados y vértices']
  },
  {
    code: 'OA 16',
    grade: '2_basico',
    axis: 'geometria',
    title: 'Figuras 3D: cubos, paralelepípedos, esferas y conos',
    description: 'Describir, comparar y construir figuras 3D (cubos, paralelepípedos, esferas y conos) con diversos materiales.',
    indicators: ['Distingue cuerpos redondos de poliedros', 'Cuenta caras, aristas y vértices en cuerpos geométricos']
  },
  {
    code: 'OA 17',
    grade: '2_basico',
    axis: 'medicion',
    title: 'Días, semanas, meses y fechas en el calendario',
    description: 'Identificar días, semanas, meses y fechas en el calendario.',
    indicators: ['Calcula semanas o días que faltan para una fecha escolar', 'Identifica el número de días de cada mes']
  },
  {
    code: 'OA 18',
    grade: '2_basico',
    axis: 'medicion',
    title: 'Lectura de horas y medias horas en relojes',
    description: 'Leer horas y medias horas en relojes digitales, en el contexto de la resolución de problemas.',
    indicators: ['Identifica la hora exacta y la media hora', 'Asocia la hora digital con actividades cotidianas']
  },
  {
    code: 'OA 19',
    grade: '2_basico',
    axis: 'medicion',
    title: 'Longitud en centímetros y metros',
    description: 'Determinar la longitud de objetos, usando unidades de medidas no estandarizadas y unidades estandarizadas (cm y m), en el contexto de la resolución de problemas.',
    indicators: ['Mide objetos escolares con regla graduada en cm', 'Estima si un objeto mide más o menos de 1 metro']
  },
  {
    code: 'OA 20',
    grade: '2_basico',
    axis: 'datos_probabilidades',
    title: 'Recolección de datos y tablas de conteo',
    description: 'Recolectar y registrar datos para responder preguntas estadísticas sobre juegos con monedas y dados, usando bloques, tablas de conteo y pictogramas.',
    indicators: ['Registra frecuencias en tablas de conteo', 'Organiza información obtenida de juegos simples']
  },
  {
    code: 'OA 21',
    grade: '2_basico',
    axis: 'datos_probabilidades',
    title: 'Registro de resultados de juegos aleatorios',
    description: 'Registrar en tablas y gráficos de barra simple, resultados de juegos aleatorios con dados y monedas.',
    indicators: ['Anota resultados de lanzamientos de monedas y dados', 'Compara qué resultado salió más veces']
  },
  {
    code: 'OA 22',
    grade: '2_basico',
    axis: 'datos_probabilidades',
    title: 'Pictogramas con escala y gráficos de barra simple',
    description: 'Construir, leer e interpretar pictogramas con escala y gráficos de barra simple.',
    indicators: ['Interpreta la leyenda del pictograma (ej: 1 estrella = 2 niños)', 'Lee información y compara frecuencias en gráficos de barra']
  },

  // =========================================================================
  // 3° BÁSICO (Bases Curriculares MINEDUC Chile - Decreto N° 439)
  // =========================================================================
  {
    code: 'OA 01',
    grade: '3_basico',
    axis: 'numeros_operaciones',
    title: 'Contar números hasta 1.000 con diferentes saltos',
    description: 'Contar números del 0 al 1.000 de 5 en 5, de 10 en 10, de 100 en 100 hacia adelante y hacia atrás, y de 3 en 3, de 4 en 4, empezando por cualquier múltiplo.',
    indicators: ['Cuenta con saltos de 50 y 100', 'Completa secuencias numéricas hasta 1.000']
  },
  {
    code: 'OA 02',
    grade: '3_basico',
    axis: 'numeros_operaciones',
    title: 'Lectura y escritura de números hasta 1.000',
    description: 'Leer números hasta 1.000 y representarlos en forma concreta, pictórica y simbólica.',
    indicators: ['Escribe números de tres dígitos en cifras y palabras', 'Representa centenas, decenas y unidades con bloques base 10']
  },
  {
    code: 'OA 03',
    grade: '3_basico',
    axis: 'numeros_operaciones',
    title: 'Comparación y orden de números hasta 1.000',
    description: 'Comparar y ordenar números naturales hasta 1.000, utilizando la recta numérica o la tabla posicional.',
    indicators: ['Ordena ternas de números de menor a mayor', 'Identifica el número mayor o menor según posición de centenas']
  },
  {
    code: 'OA 04',
    grade: '3_basico',
    axis: 'numeros_operaciones',
    title: 'Estrategias de cálculo mental para adición y sustracción',
    description: 'Describir y aplicar estrategias de cálculo mental para las adiciones y sustracciones hasta 100: por descomposición, completar a la decena, usar dobles.',
    indicators: ['Descompone sumandos para calcular mentalmente', 'Estima sumas y diferencias redondeando a la decena']
  },
  {
    code: 'OA 05',
    grade: '3_basico',
    axis: 'numeros_operaciones',
    title: 'Valor posicional en números hasta 1.000',
    description: 'Identificar y describir las unidades, decenas y centenas en números del 0 al 1.000, representando las cantidades de acuerdo a su valor posicional.',
    indicators: ['Reconoce el valor relativo de cada dígito', 'Descompone aditivamente números de 3 dígitos']
  },
  {
    code: 'OA 06',
    grade: '3_basico',
    axis: 'numeros_operaciones',
    title: 'Adición y sustracción hasta 1.000 con reservas y canjes',
    description: 'Demostrar que comprenden la adición y la sustracción de números del 0 al 1.000 usando estrategias personales y el algoritmo estándar.',
    indicators: ['Aplica algoritmo de suma con reserva', 'Resuelve sustracciones con canje en centenas y decenas']
  },
  {
    code: 'OA 07',
    grade: '3_basico',
    axis: 'numeros_operaciones',
    title: 'Relación entre adición y sustracción en ámbito hasta 1.000',
    description: 'Demostrar que comprenden la relación entre la adición y la sustracción, usando la familia de operaciones en cálculos aritméticos y en la resolución de problemas.',
    indicators: ['Identifica datos, incógnita y operación inversa necesaria', 'Comprueba la solución mediante la operación contraria']
  },
  {
    code: 'OA 08',
    grade: '3_basico',
    axis: 'numeros_operaciones',
    title: 'Tablas de multiplicar hasta 10 × 10',
    description: 'Demostrar que comprenden las tablas de multiplicar hasta 10 de manera progresiva usando representaciones concretas, pictóricas y distributividad.',
    indicators: ['Calcula productos de las tablas del 3, 4, 6, 7, 8 y 9', 'Resuelve problemas que involucran arreglos bidimensionales']
  },
  {
    code: 'OA 09',
    grade: '3_basico',
    axis: 'numeros_operaciones',
    title: 'División en el contexto de las tablas hasta 10 × 10',
    description: 'Demostrar que comprenden la división en el contexto de las tablas de hasta 10×10, representando reparto equitativo y agrupación y relacionándola con la multiplicación.',
    indicators: ['Relaciona la división con la multiplicación inversa', 'Reparte cantidades en partes iguales sin resto']
  },
  {
    code: 'OA 10',
    grade: '3_basico',
    axis: 'numeros_operaciones',
    title: 'Resolución de problemas rutinarios con dinero ($ pesos)',
    description: 'Resolver problemas rutinarios en contextos cotidianos, que incluyan dinero en pesos chilenos ($) e involucren las cuatro operaciones.',
    indicators: ['Calcula vueltos y presupuestos de compras escolares', 'Utiliza billetes y monedas de circulación nacional']
  },
  {
    code: 'OA 11',
    grade: '3_basico',
    axis: 'numeros_operaciones',
    title: 'Fracciones de uso común: 1/2, 1/3, 1/4, 1/5, 1/6, 1/8',
    description: 'Demostrar que comprenden las fracciones de uso común: 1/4, 1/3, 1/2, 2/3, 3/4 explicando que una fracción representa la parte de un todo o de un grupo de elementos.',
    indicators: ['Identifica numerador y denominador en partes iguales', 'Compara fracciones unitarias en figuras y rectas']
  },
  {
    code: 'OA 12',
    grade: '3_basico',
    axis: 'patrones_algebra',
    title: 'Patrones numéricos en tablas hasta 1.000',
    description: 'Generar, describir y registrar patrones numéricos, usando una variedad de estrategias en tablas del 100, de manera manual y/o con software educativo.',
    indicators: ['Encuentra regularidades numéricas en tablas y secuencias', 'Extiende secuencias aditivas y multiplicativas']
  },
  {
    code: 'OA 13',
    grade: '3_basico',
    axis: 'patrones_algebra',
    title: 'Ecuaciones de un paso con balanza',
    description: 'Resolver ecuaciones de un paso que involucren adiciones y sustracciones y un símbolo geométrico que represente un número desconocido, en forma pictórica y simbólica.',
    indicators: ['Halla el valor desconocido de la incógnita en equilibrio', 'Comprueba la solución de la ecuación']
  },
  {
    code: 'OA 14',
    grade: '3_basico',
    axis: 'geometria',
    title: 'Localización en mapas simples o cuadrículas',
    description: 'Describir la localización de un objeto en un mapa simple o cuadrícula.',
    indicators: ['Ubica objetos usando coordenadas simples de fila y columna', 'Traza recorridos indicando direcciones']
  },
  {
    code: 'OA 15',
    grade: '3_basico',
    axis: 'geometria',
    title: 'Relación entre figuras 3D y redes 2D',
    description: 'Demostrar que comprenden la relación que existe entre figuras 3D y figuras 2D construyendo una figura 3D a partir de una red (plantilla).',
    indicators: ['Identifica la red que arma un cubo, paralelepípedo o pirámide', 'Reconoce las caras basales y laterales']
  },
  {
    code: 'OA 16',
    grade: '3_basico',
    axis: 'geometria',
    title: 'Cuerpos 3D: cubos, paralelepípedos, esferas, conos y pirámides',
    description: 'Describir cubos, paralelepípedos, esferas, conos, cilindros y pirámides de acuerdo a la forma de sus caras y el número de aristas y vértices.',
    indicators: ['Clasifica prismas y pirámides según la forma de su base', 'Cuenta caras, aristas y vértices de cuerpos 3D']
  },
  {
    code: 'OA 17',
    grade: '3_basico',
    axis: 'geometria',
    title: 'Traslación, rotación y reflexión de figuras 2D',
    description: 'Reconocer en el entorno figuras 2D que están trasladadas, reflejadas y rotadas.',
    indicators: ['Reconoce giros de un cuarto y media vuelta', 'Distingue entre traslación, reflexión y rotación']
  },
  {
    code: 'OA 18',
    grade: '3_basico',
    axis: 'geometria',
    title: 'Ángulos rectos y ángulos en el entorno',
    description: 'Demostrar que comprenden el concepto de ángulo identificando ejemplos en el entorno y estimando medidas de ángulos de 45° y 90°.',
    indicators: ['Usa una escuadra como referente de ángulo recto (90°)', 'Clasifica esquinas en menores, iguales o mayores que 90°']
  },
  {
    code: 'OA 19',
    grade: '3_basico',
    axis: 'medicion',
    title: 'Líneas de tiempo y calendarios',
    description: 'Leer e interpretar líneas de tiempo y calendarios.',
    indicators: ['Ubica meses y semanas transcurridas entre dos eventos', 'Ordena acontecimientos en líneas de tiempo escolares']
  },
  {
    code: 'OA 20',
    grade: '3_basico',
    axis: 'medicion',
    title: 'Lectura y registro de la hora en relojes',
    description: 'Leer y registrar el tiempo en horas, medias horas, cuartos de hora y minutos en relojes análogos y digitales.',
    indicators: ['Reconoce un cuarto para, y media, y cuarto', 'Calcula duración de eventos escolares']
  },
  {
    code: 'OA 21',
    grade: '3_basico',
    axis: 'medicion',
    title: 'Perímetro de figuras regulares e irregulares',
    description: 'Demostrar que comprenden el perímetro de una figura regular e irregular midiendo y registrando el perímetro de figuras del entorno en cm y m.',
    indicators: ['Suma las longitudes de los lados para hallar el contorno total', 'Calcula perímetro de rectángulos, cuadrados y polígonos']
  },
  {
    code: 'OA 22',
    grade: '3_basico',
    axis: 'medicion',
    title: 'Medición de peso/masa en gramos y kilogramos',
    description: 'Demostrar que comprenden la medición del peso (g y kg) comparando y registrando el peso de objetos de uso cotidiano.',
    indicators: ['Relaciona 1 kg con 1.000 g', 'Compara el peso de envases de alimentos escolares']
  },
  {
    code: 'OA 23',
    grade: '3_basico',
    axis: 'datos_probabilidades',
    title: 'Encuestas, clasificación y tablas de datos',
    description: 'Realizar encuestas y clasificar y organizar los datos obtenidos en tablas y visualizarlos en gráficos de barra.',
    indicators: ['Formula preguntas simples para sus compañeros', 'Organiza respuestas en tablas de frecuencias absolutas']
  },
  {
    code: 'OA 24',
    grade: '3_basico',
    axis: 'datos_probabilidades',
    title: 'Resultados de juegos aleatorios con dados y monedas',
    description: 'Registrar y ordenar datos obtenidos de juegos aleatorios con dados y monedas, encontrando el menor, el mayor y estimando el punto medio entre ambos.',
    indicators: ['Registra frecuencias de resultados en experimentos de azar', 'Clasifica eventos posibles, seguros e imposibles']
  },
  {
    code: 'OA 25',
    grade: '3_basico',
    axis: 'datos_probabilidades',
    title: 'Pictogramas y gráficos de barra simple con escala',
    description: 'Construir, leer e interpretar pictogramas y gráficos de barra simple con escala, en base a información recolectada o dada.',
    indicators: ['Interpreta la altura de las barras según escala de 2, 5 o 10', 'Extrae conclusiones a partir de los datos']
  },
  {
    code: 'OA 26',
    grade: '3_basico',
    axis: 'datos_probabilidades',
    title: 'Representación de datos en diagramas de puntos',
    description: 'Representar datos usando diagramas de puntos.',
    indicators: ['Construye diagramas de puntos con frecuencias dadas', 'Identifica el valor más repetido (moda) en el diagrama']
  },

  // =========================================================================
  // 4° BÁSICO (Bases Curriculares MINEDUC Chile - Decreto N° 439)
  // =========================================================================
  {
    code: 'OA 01',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'Números hasta el 10.000 y valor posicional',
    description: 'Representar y describir números del 0 al 10.000: contándolos, leyéndolos, escribiéndolos, comparándolos, ordenándolos y descomponiéndolos según valor posicional.',
    indicators: ['Identifica valor de unidades de mil, centenas, decenas y unidades', 'Compara cantidades en la recta numérica hasta 10.000']
  },
  {
    code: 'OA 02',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'Cálculo mental para multiplicaciones y divisiones',
    description: 'Describir y aplicar estrategias de cálculo mental: conteo hacia adelante y atrás, doblar y dividir por 2, por descomposición y usar el doble del doble para multiplicaciones hasta 10×10.',
    indicators: ['Aplica estrategia de doblar y dividir por 2', 'Calcula mentalmente productos y cocientes asociados']
  },
  {
    code: 'OA 03',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'Adición y sustracción de números hasta 1.000 y 10.000',
    description: 'Demostrar que comprenden la adición y la sustracción de números hasta 1.000 y su extensión a 10.000 usando estrategias personales y algoritmos estándar.',
    indicators: ['Aplica algoritmo de suma y resta con múltiples reservas', 'Estima sumas y diferencias redondeando']
  },
  {
    code: 'OA 04',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'Propiedades del 0 y del 1 en multiplicación y división',
    description: 'Fundamentar y aplicar las propiedades del 0 y del 1 para la multiplicación y la propiedad del 1 para la división.',
    indicators: ['Aplica que todo número multiplicado por 0 es 0', 'Comprende que todo número multiplicado o dividido por 1 mantiene su valor']
  },
  {
    code: 'OA 05',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'Multiplicación de números de tres dígitos por un dígito',
    description: 'Demostrar que comprenden la multiplicación de números de tres dígitos por números de un dígito usando estrategias con o sin material concreto y algoritmo.',
    indicators: ['Multiplica de forma algorítmica con reservas', 'Estima productos redondeando factores']
  },
  {
    code: 'OA 06',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'División con dividendos de dos dígitos por un dígito',
    description: 'Demostrar que comprenden la división con dividendos de dos dígitos y divisores de un dígito, con y sin resto.',
    indicators: ['Aplica algoritmo de la división', 'Interpreta el sentido del resto en situaciones de reparto']
  },
  {
    code: 'OA 07',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'Resolución de problemas cotidianos con dinero ($)',
    description: 'Resolver problemas rutinarios y no rutinarios en contextos cotidianos que incluyen dinero ($ pesos chilenos), seleccionando y utilizando la operación apropiada.',
    indicators: ['Calcula montos totales, cotizaciones y vueltos', 'Plantea operaciones combinadas o encadenadas para responder']
  },
  {
    code: 'OA 08',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'Fracciones con denominadores hasta 12 y 100',
    description: 'Demostrar que comprenden las fracciones con denominadores 100, 12, 10, 8, 6, 5, 4, 3, 2 explicando la parte de un todo y creando grupos equivalentes.',
    indicators: ['Identifica fracciones equivalentes de uso común', 'Representa fracciones pictórica y simbólicamente']
  },
  {
    code: 'OA 09',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'Adición y sustracción de fracciones de igual denominador',
    description: 'Resolver adiciones y sustracciones de fracciones con igual denominador (denominadores 100, 12, 10, 8, 6, 5, 4, 3, 2) de manera concreta y pictórica.',
    indicators: ['Suma y resta numeradores conservando el denominador común', 'Aplica en resolución de problemas cotidianos']
  },
  {
    code: 'OA 10',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'Fracciones propias, impropias y números mixtos',
    description: 'Identificar, escribir y representar fracciones propias y los números mixtos hasta el 5 de manera concreta, pictórica y simbólica.',
    indicators: ['Transforma fracciones impropias simples a números mixtos', 'Ubica fracciones propias y mixtos en la recta numérica']
  },
  {
    code: 'OA 11',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'Números decimales (décimos y centésimos)',
    description: 'Describir y representar decimales (décimos y centésimos) representándolos en forma concreta, pictórica y simbólica, y comparándolos en la recta numérica.',
    indicators: ['Escribe décimos y centésimos con coma decimal', 'Relaciona decimales con fracciones de denominador 10 y 100']
  },
  {
    code: 'OA 12',
    grade: '4_basico',
    axis: 'numeros_operaciones',
    title: 'Adición y sustracción de decimales (décimos y centésimos)',
    description: 'Resolver adiciones y sustracciones de decimales, empleando el valor posicional hasta el centésimo en el contexto de la resolución de problemas.',
    indicators: ['Alinea comas decimales para operar', 'Resuelve problemas cotidianos con longitudes o precios decimales']
  },
  {
    code: 'OA 13',
    grade: '4_basico',
    axis: 'patrones_algebra',
    title: 'Patrones numéricos en tablas',
    description: 'Identificar y describir patrones numéricos en tablas que involucren una operación, de manera manual y/o usando software educativo.',
    indicators: ['Determina la regla de entrada y salida de una tabla', 'Completa valores faltantes aplicando la regla']
  },
  {
    code: 'OA 14',
    grade: '4_basico',
    axis: 'patrones_algebra',
    title: 'Ecuaciones e inecuaciones de un paso (0 al 100)',
    description: 'Resolver ecuaciones e inecuaciones de un paso que involucren adiciones y sustracciones, comprobando los resultados en forma pictórica y simbólica del 0 al 100.',
    indicators: ['Determina el valor de la incógnita x en la balanza', 'Comprueba la igualdad o desigualdad sustituyendo']
  },
  {
    code: 'OA 15',
    grade: '4_basico',
    axis: 'geometria',
    title: 'Localización absoluta con coordenadas y relativa en mapas',
    description: 'Describir la localización absoluta de un objeto en un mapa simple con coordenadas informales (letras y números) y la localización relativa respecto a otros objetos.',
    indicators: ['Identifica pares ordenados como (B, 4) en mapas escolares', 'Traza recorridos indicando coordenadas sucesivas']
  },
  {
    code: 'OA 16',
    grade: '4_basico',
    axis: 'geometria',
    title: 'Vistas frontal, lateral y superior de figuras 3D',
    description: 'Determinar las vistas de figuras 3D, desde el frente, desde el lado y desde arriba.',
    indicators: ['Dibuja la vista en planta (superior) de construcciones con cubos', 'Asocia elevaciones con la figura tridimensional']
  },
  {
    code: 'OA 17',
    grade: '4_basico',
    axis: 'geometria',
    title: 'Líneas de simetría en figuras 2D',
    description: 'Demostrar que comprenden una línea de simetría identificando figuras simétricas 2D, creando figuras simétricas y dibujando una o más líneas de simetría.',
    indicators: ['Identifica si una figura tiene uno, dos o más ejes de simetría', 'Verifica doblando figuras simétricas']
  },
  {
    code: 'OA 18',
    grade: '4_basico',
    axis: 'geometria',
    title: 'Traslación, rotación y reflexión de figuras 2D',
    description: 'Trasladar, rotar y reflejar figuras 2D.',
    indicators: ['Identifica eje de reflexión y centros de rotación', 'Aplica traslaciones contando cuadros en cuadrículas']
  },
  {
    code: 'OA 19',
    grade: '4_basico',
    axis: 'geometria',
    title: 'Construcción y medición de ángulos con transportador',
    description: 'Construir ángulos con el transportador y compararlos.',
    indicators: ['Alinea el centro del transportador con el vértice', 'Clasifica ángulos menores a 90° (agudos) y mayores a 90° (obtusos)']
  },
  {
    code: 'OA 20',
    grade: '4_basico',
    axis: 'medicion',
    title: 'Lectura del tiempo en relojes A.M., P.M. y 24 horas',
    description: 'Leer y registrar diversas mediciones del tiempo en relojes análogos y digitales, usando los conceptos A.M., P.M. y 24 horas.',
    indicators: ['Convierte horas P.M. a formato 24 horas (ej: 3:00 P.M. = 15:00)', 'Calcula duración de actividades diarias']
  },
  {
    code: 'OA 21',
    grade: '4_basico',
    axis: 'medicion',
    title: 'Conversiones entre unidades de tiempo',
    description: 'Realizar conversiones entre unidades de tiempo en el contexto de la resolución de problemas: el número de segundos en un minuto, minutos en una hora, días en un mes y meses en un año.',
    indicators: ['Convierte horas a minutos (1 h = 60 min) y minutos a segundos', 'Resuelve problemas de calendarios y duraciones']
  },
  {
    code: 'OA 22',
    grade: '4_basico',
    axis: 'medicion',
    title: 'Medición de longitudes en m y cm y transformaciones',
    description: 'Medir longitudes con unidades estandarizadas (m, cm) y realizar transformaciones entre estas unidades (m a cm y viceversa) en el contexto de la resolución de problemas.',
    indicators: ['Reconoce que 1 m = 100 cm', 'Elige la unidad adecuada para medir objetos']
  },
  {
    code: 'OA 23',
    grade: '4_basico',
    axis: 'medicion',
    title: 'Área de un rectángulo y de un cuadrado',
    description: 'Demostrar que comprenden el concepto de área de un rectángulo y de un cuadrado en cm² y m², reconociendo que el área permanece constante al transformar figuras.',
    indicators: ['Multiplica base por altura para determinar la superficie', 'Distingue claramente entre área y perímetro']
  },
  {
    code: 'OA 24',
    grade: '4_basico',
    axis: 'medicion',
    title: 'Volumen de un cuerpo con cubos unidad',
    description: 'Demostrar que comprenden el concepto de volumen de un cuerpo seleccionando una unidad no estandarizada y reconociendo que el volumen se mide en unidades cúbicas.',
    indicators: ['Cuenta cubos unidad en construcciones prismáticas', 'Compara volúmenes de dos cuerpos con distinta forma']
  },
  {
    code: 'OA 25',
    grade: '4_basico',
    axis: 'datos_probabilidades',
    title: 'Encuestas y comparación de muestras aleatorias',
    description: 'Realizar encuestas, analizar los datos y comparar con los resultados de muestras aleatorias, usando tablas y gráficos.',
    indicators: ['Formula preguntas claras con alternativas', 'Tabula frecuencias y compara grupos']
  },
  {
    code: 'OA 26',
    grade: '4_basico',
    axis: 'datos_probabilidades',
    title: 'Experimentos aleatorios lúdicos, tablas y probabilidad',
    description: 'Realizar experimentos aleatorios lúdicos y cotidianos, y tabular y representar mediante gráficos de manera manual y/o con software educativo.',
    indicators: ['Clasifica eventos en más probable, menos probable o igualmente probable', 'Registra resultados de dados y ruletas en tablas']
  },
  {
    code: 'OA 27',
    grade: '4_basico',
    axis: 'datos_probabilidades',
    title: 'Lectura e interpretación de pictogramas y gráficos con escala',
    description: 'Leer e interpretar pictogramas y gráficos de barra simple con escala y comunicar sus conclusiones.',
    indicators: ['Compara categorías según alturas y escalas', 'Responde preguntas de síntesis estadística']
  },

  // =========================================================================
  // 5° BÁSICO (Bases Curriculares MINEDUC Chile - Decreto N° 439)
  // =========================================================================
  {
    code: 'OA 01',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Grandes números hasta 1.000.000.000',
    description: 'Representar y describir números naturales de hasta más de 6 dígitos y menores que 1.000 millones: valor posicional, composición estándar y expandida, aproximación y orden.',
    indicators: ['Lee y escribe cifras de millones', 'Aplica redondeo y estimación de cifras grandes']
  },
  {
    code: 'OA 02',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Cálculo mental, propiedades y operaciones combinadas (PAPOMUDAS)',
    description: 'Aplicar estrategias de cálculo mental para la multiplicación y resolver operaciones combinadas con paréntesis respetando prioridad PAPOMUDAS y propiedades.',
    indicators: ['Respeta prioridad: Paréntesis, Multiplicación/División, Suma/Resta', 'Aplica propiedad conmutativa, asociativa y distributiva']
  },
  {
    code: 'OA 03',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Multiplicación de dos dígitos por dos dígitos',
    description: 'Demostrar que comprenden la multiplicación de números naturales de dos dígitos por números naturales de dos dígitos: estimando productos, aplicando estrategias y algoritmo.',
    indicators: ['Multiplica factores de 2 cifras paso a paso', 'Aplica propiedad distributiva y estimación']
  },
  {
    code: 'OA 04',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'División con dividendos de tres dígitos y divisores de un dígito',
    description: 'Demostrar que comprenden la división con dividendos de tres dígitos y divisores de un dígito interpretando el resto y resolviendo problemas.',
    indicators: ['Aplica algoritmo estándar de la división', 'Interpreta el resto según contexto del problema']
  },
  {
    code: 'OA 05',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Cálculos que involucren las cuatro operaciones',
    description: 'Realizar cálculos que involucren las cuatro operaciones, aplicando las reglas relativas a paréntesis y la prevalencia de la multiplicación y la división por sobre la adición y la sustracción.',
    indicators: ['Resuelve expresiones combinadas respetando paréntesis', 'Aplica las 4 operaciones en problemas de compra y reparto']
  },
  {
    code: 'OA 06',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Problemas rutinarios y no rutinarios con calculadora',
    description: 'Resolver problemas rutinarios y no rutinarios que involucren las cuatro operaciones y combinaciones de ellas, usando la calculadora cuando corresponda en ámbitos superiores a 10.000.',
    indicators: ['Utiliza la calculadora para verificar cálculos con grandes números', 'Plantea estrategias lógicas para resolver desafíos matemáticos']
  },
  {
    code: 'OA 07',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Fracciones propias e impropias y números mixtos',
    description: 'Demostrar que comprenden las fracciones propias e impropias de uso común y los números mixtos asociados, representándolos en la recta numérica.',
    indicators: ['Convierte fracciones como 7/4 a 1 3/4', 'Ubica fracciones propias y números mixtos entre enteros consecutivos']
  },
  {
    code: 'OA 08',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Fracciones equivalentes por amplificación y simplificación',
    description: 'Demostrar que comprenden las fracciones impropias y equivalentes amplificando y simplificando de manera concreta, pictórica y simbólica.',
    indicators: ['Multiplica o divide numerador y denominador por el mismo número', 'Simplifica fracciones hasta su forma irreductible']
  },
  {
    code: 'OA 09',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Adición y sustracción de fracciones propias con distinto denominador',
    description: 'Resolver adiciones y sustracciones con fracciones propias con denominadores menores o iguales a 12 de manera pictórica y simbólica, amplificando o simplificando.',
    indicators: ['Calcula común denominador para sumar y restar fracciones', 'Resuelve problemas de partes de un todo']
  },
  {
    code: 'OA 10',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Conversión de fracciones a números decimales',
    description: 'Determinar el decimal que corresponde a fracciones con denominador 2, 4, 5 y 10 (y potencias de 10 como 100 y 1.000).',
    indicators: ['Convierte 1/2 a 0,5; 1/4 a 0,25 y 3/10 a 0,3', 'Expresa decimales comunes como fracciones equivalentes']
  },
  {
    code: 'OA 11',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Números decimales hasta la milésima: comparación y orden',
    description: 'Comparar y ordenar números decimales hasta la milésima empleando representación pictórica, recta numérica y valor posicional.',
    indicators: ['Compara decimales como 0,125 con 0,15 usando valor posicional', 'Lee y ordena décimos, centésimos y milésimos en la recta numérica']
  },
  {
    code: 'OA 12',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Adición y sustracción de decimales hasta la milésima',
    description: 'Resolver adiciones y sustracciones de decimales, empleando el valor posicional hasta la milésima.',
    indicators: ['Alinea columnas de comas decimales hasta la milésima', 'Resuelve cálculos exactos con decimales']
  },
  {
    code: 'OA 13',
    grade: '5_basico',
    axis: 'numeros_operaciones',
    title: 'Problemas con fracciones o decimales hasta la milésima',
    description: 'Resolver problemas rutinarios y no rutinarios, aplicando adiciones y sustracciones de fracciones propias o decimales hasta la milésima.',
    indicators: ['Modela situaciones de longitudes, masas y dinero con decimales', 'Combina sumas y restas de fracciones en problemas cotidianos']
  },
  {
    code: 'OA 14',
    grade: '5_basico',
    axis: 'patrones_algebra',
    title: 'Reglas de sucesiones y patrones numéricos',
    description: 'Descubrir alguna regla que explique una sucesión dada y que permita hacer predicciones.',
    indicators: ['Halla términos siguientes en secuencias crecientes o decrecientes', 'Formula la regla de formación de una tabla o sucesión']
  },
  {
    code: 'OA 15',
    grade: '5_basico',
    axis: 'patrones_algebra',
    title: 'Ecuaciones e inecuaciones de un paso',
    description: 'Resolver problemas, usando ecuaciones e inecuaciones de un paso, que involucren adiciones y sustracciones, en forma pictórica y simbólica.',
    indicators: ['Despeja la incógnita usando la operación inversa o balanza', 'Comprueba soluciones en ecuaciones e inecuaciones']
  },
  {
    code: 'OA 16',
    grade: '5_basico',
    axis: 'geometria',
    title: 'Puntos en el primer cuadrante del plano cartesiano',
    description: 'Identificar y dibujar puntos en el primer cuadrante del plano cartesiano, dadas sus coordenadas en números naturales.',
    indicators: ['Ubica pares ordenados (x, y) en el primer cuadrante', 'Forma figuras geométricas uniendo puntos por sus coordenadas']
  },
  {
    code: 'OA 17',
    grade: '5_basico',
    axis: 'geometria',
    title: 'Lados, caras y aristas paralelas y perpendiculares',
    description: 'Describir y dar ejemplos de aristas y caras de figuras 3D y lados de figuras 2D que son paralelos, que se intersectan y que son perpendiculares.',
    indicators: ['Reconoce ángulos de 90° en rectas y lados perpendiculares', 'Identifica aristas y caras paralelas en cubos y prismas']
  },
  {
    code: 'OA 18',
    grade: '5_basico',
    axis: 'geometria',
    title: 'Congruencia de figuras 2D e isometrías',
    description: 'Demostrar que comprenden el concepto de congruencia, usando la traslación, la reflexión y la rotación en cuadrículas y mediante software geométrico.',
    indicators: ['Verifica congruencia comprobando igual forma y tamaño', 'Reconoce que las isometrías mantienen la congruencia']
  },
  {
    code: 'OA 19',
    grade: '5_basico',
    axis: 'medicion',
    title: 'Medición de longitudes en m, cm y mm',
    description: 'Medir longitudes con unidades estandarizadas (m, cm, mm) en el contexto de la resolución de problemas.',
    indicators: ['Elige la unidad adecuada (mm, cm o m) según el objeto', 'Resuelve problemas de medición directa con regla y huincha']
  },
  {
    code: 'OA 20',
    grade: '5_basico',
    axis: 'medicion',
    title: 'Transformaciones entre unidades de longitud (km, m, cm, mm)',
    description: 'Realizar transformaciones entre unidades de medidas de longitud: km a m, m a cm, cm a mm y viceversa, de manera manual y/o usando software educativo.',
    indicators: ['Convierte 2,5 m a 250 cm y 3 km a 3.000 m', 'Resuelve problemas que combinan distintas unidades de longitud']
  },
  {
    code: 'OA 21',
    grade: '5_basico',
    axis: 'medicion',
    title: 'Diseño de rectángulos dados área y perímetro',
    description: 'Diseñar y construir diferentes rectángulos, dados el perímetro, el área o ambos, y sacar conclusiones.',
    indicators: ['Construye rectángulos de igual área y distinto perímetro', 'Analiza qué rectángulo tiene mayor o menor contorno']
  },
  {
    code: 'OA 22',
    grade: '5_basico',
    axis: 'medicion',
    title: 'Área de triángulos, paralelogramos y trapecios',
    description: 'Calcular áreas de triángulos, de paralelogramos y de trapecios, y estimar áreas de figuras irregulares aplicando conteo de cuadrículas y fórmulas.',
    indicators: ['Aplica Área del triángulo = (base × altura) / 2', 'Calcula área de paralelogramos y trapecios descomponiendo figuras']
  },
  {
    code: 'OA 23',
    grade: '5_basico',
    axis: 'datos_probabilidades',
    title: 'Cálculo e interpretación del promedio (media aritmética)',
    description: 'Calcular el promedio de datos e interpretarlo en su contexto escolar y cotidiano.',
    indicators: ['Suma todos los datos y divide por la cantidad total', 'Interpreta promedios de notas, puntajes o temperaturas']
  },
  {
    code: 'OA 24',
    grade: '5_basico',
    axis: 'datos_probabilidades',
    title: 'Posibilidad de ocurrencia en experimentos aleatorios',
    description: 'Describir la posibilidad de ocurrencia de un evento en base a un experimento aleatorio, empleando los términos seguro, posible, poco posible e imposible.',
    indicators: ['Clasifica sucesos cotidianos y de azar según su posibilidad', 'Justifica cuándo un evento es seguro o imposible']
  },
  {
    code: 'OA 25',
    grade: '5_basico',
    axis: 'datos_probabilidades',
    title: 'Comparación cualitativa de probabilidades',
    description: 'Comparar probabilidades de distintos eventos sin calcularlas.',
    indicators: ['Ordena sucesos desde el menos probable hasta el más probable', 'Compara urnas o ruletas según proporción de casos favorables']
  },
  {
    code: 'OA 26',
    grade: '5_basico',
    axis: 'datos_probabilidades',
    title: 'Tablas, gráficos de barra simple y gráficos de línea',
    description: 'Leer, interpretar y completar tablas, gráficos de barra simple y gráficos de línea, y comunicar sus conclusiones.',
    indicators: ['Analiza tendencias de aumento o descenso en gráficos de línea', 'Completa tablas de frecuencias absolutas']
  },
  {
    code: 'OA 27',
    grade: '5_basico',
    axis: 'datos_probabilidades',
    title: 'Diagramas de tallo y hojas para muestras aleatorias',
    description: 'Utilizar diagramas de tallo y hojas para representar datos provenientes de muestras aleatorias.',
    indicators: ['Organiza datos numéricos identificando tallo (decenas) y hojas (unidades)', 'Identifica valores extremos y concentración en el diagrama']
  },

  // =========================================================================
  // 6° BÁSICO (Bases Curriculares MINEDUC Chile - Decreto N° 439)
  // =========================================================================
  {
    code: 'OA 01',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    title: 'Factores, múltiplos, números primos y compuestos',
    description: 'Demostrar que comprenden los factores y múltiplos: determinando múltiplos y factores menores de 100, identificando primos y compuestos y calculando el mínimo común múltiplo.',
    indicators: ['Identifica números primos menores que 100', 'Calcula MCM y divisores comunes para resolver problemas']
  },
  {
    code: 'OA 02',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    title: 'Cálculos de las cuatro operaciones con naturales',
    description: 'Realizar cálculos que involucren las cuatro operaciones en el contexto de la resolución de problemas, utilizando la calculadora en ámbitos superiores a 10.000.',
    indicators: ['Aplica correctamente la prioridad PAPOMUDAS', 'Resuelve problemas aritméticos de varias etapas']
  },
  {
    code: 'OA 03',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    title: 'Razones de manera concreta, pictórica y simbólica',
    description: 'Demostrar que comprenden el concepto de razón de manera concreta, pictórica y simbólica, en forma manual y/o usando software educativo.',
    indicators: ['Expresa razones como a:b o a es a b', 'Resuelve problemas de mezclas y proporciones directas']
  },
  {
    code: 'OA 04',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    title: 'Concepto y cálculo de porcentajes',
    description: 'Demostrar que comprenden el concepto de porcentaje de manera concreta, pictórica y simbólica, relacionándolo con fracciones y decimales.',
    indicators: ['Calcula 50%, 25%, 10% y porcentajes generales', 'Aplica descuentos y recargos sencillos en precios']
  },
  {
    code: 'OA 05',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    title: 'Fracciones impropias y números mixtos',
    description: 'Demostrar que comprenden las fracciones y números mixtos: identificando y determinando equivalencias entre fracciones impropias y números mixtos y ubicándolos en la recta.',
    indicators: ['Convierte entre fracción impropia y número mixto', 'Ubica fracciones y mixtos en la recta numérica']
  },
  {
    code: 'OA 06',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    title: 'Adición y sustracción de fracciones y números mixtos',
    description: 'Resolver adiciones y sustracciones de fracciones propias e impropias y números mixtos con numeradores y denominadores de hasta dos dígitos.',
    indicators: ['Iguala denominadores usando MCM para sumar o restar', 'Resuelve problemas cotidianos con fracciones y mixtos']
  },
  {
    code: 'OA 07',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    title: 'Multiplicación y división de números decimales',
    description: 'Demostrar que comprenden la multiplicación y la división de decimales por números naturales de un dígito, múltiplos de 10 y decimales hasta la milésima.',
    indicators: ['Desplaza la coma decimal al multiplicar o dividir por potencias de 10', 'Aplica algoritmo con decimales hasta la milésima']
  },
  {
    code: 'OA 08',
    grade: '6_basico',
    axis: 'numeros_operaciones',
    title: 'Problemas con fracciones y decimales hasta la milésima',
    description: 'Resolver problemas rutinarios y no rutinarios que involucren adiciones y sustracciones de fracciones propias, impropias, números mixtos o decimales hasta la milésima.',
    indicators: ['Selecciona entre fracciones y decimales para resolver problemas', 'Resuelve problemas de recetas, medidas y presupuestos']
  },
  {
    code: 'OA 09',
    grade: '6_basico',
    axis: 'patrones_algebra',
    title: 'Relaciones en tablas de valores y reglas algebraicas',
    description: 'Demostrar que comprenden la relación entre los valores de una tabla y aplicarla en la resolución de problemas sencillos, formulando reglas con letras.',
    indicators: ['Encuentra la regla algebraica entre columna de entrada y salida', 'Predice valores no tabulados aplicando la fórmula']
  },
  {
    code: 'OA 10',
    grade: '6_basico',
    axis: 'patrones_algebra',
    title: 'Generalizaciones con expresiones con letras y ecuaciones',
    description: 'Representar generalizaciones de relaciones entre números naturales, usando expresiones con letras y ecuaciones.',
    indicators: ['Traduce el doble de un número aumentado en 5 a 2x + 5', 'Evalúa expresiones algebraicas y generaliza propiedades (ej: perímetro)']
  },
  {
    code: 'OA 11',
    grade: '6_basico',
    axis: 'patrones_algebra',
    title: 'Ecuaciones de primer grado: ax + b = c',
    description: 'Resolver ecuaciones de primer grado con una incógnita, utilizando estrategias como usar una balanza, descomponer y aplicar procedimientos formales.',
    indicators: ['Despeja la incógnita paso a paso', 'Comprueba la solución sustituyendo en la ecuación original']
  },
  {
    code: 'OA 12',
    grade: '6_basico',
    axis: 'geometria',
    title: 'Construcción y comparación de triángulos',
    description: 'Construir y comparar triángulos de acuerdo a la medida de sus lados y/o sus ángulos con instrumentos geométricos o software geométrico.',
    indicators: ['Clasifica triángulos según lados (equilátero, isósceles, escaleno) y ángulos', 'Verifica la desigualdad triangular']
  },
  {
    code: 'OA 13',
    grade: '6_basico',
    axis: 'geometria',
    title: 'Área de superficie de cubos y paralelepípedos mediante redes',
    description: 'Demostrar que comprenden el concepto de área de una superficie en cubos y paralelepípedos, calculando el área de sus redes (plantillas) asociadas.',
    indicators: ['Identifica las caras de una red de cubo o paralelepípedo', 'Suma las áreas de las 6 caras para hallar la superficie total']
  },
  {
    code: 'OA 14',
    grade: '6_basico',
    axis: 'geometria',
    title: 'Teselados de figuras 2D con isometrías',
    description: 'Realizar teselados de figuras 2D usando traslaciones, reflexiones y rotaciones.',
    indicators: ['Reconoce qué polígonos regulares teselan el plano sin dejar espacios', 'Aplica traslaciones, reflexiones y rotaciones para cubrir el plano']
  },
  {
    code: 'OA 15',
    grade: '6_basico',
    axis: 'geometria',
    title: 'Construcción y clasificación de ángulos',
    description: 'Construir ángulos agudos, obtusos, rectos, extendidos y completos con instrumentos geométricos o software geométrico.',
    indicators: ['Construye y clasifica ángulos según su medida (0° a 360°)', 'Distingue ángulos rectos (90°), extendidos (180°) y completos (360°)']
  },
  {
    code: 'OA 16',
    grade: '6_basico',
    axis: 'geometria',
    title: 'Ángulos entre dos rectas que se cortan',
    description: 'Identificar los ángulos que se forman entre dos rectas que se cortan (pares de ángulos opuestos por el vértice y pares de ángulos complementarios).',
    indicators: ['Reconoce que los ángulos opuestos por el vértice tienen igual medida', 'Calcula ángulos complementarios (90°) y suplementarios (180°)']
  },
  {
    code: 'OA 17',
    grade: '6_basico',
    axis: 'geometria',
    title: 'Suma de ángulos interiores en triángulos (180°) y cuadriláteros (360°)',
    description: 'Demostrar de manera concreta, pictórica y simbólica que la suma de los ángulos interiores de un triángulo es 180° y de un cuadrilátero es 360°.',
    indicators: ['Calcula el ángulo faltante en un triángulo conociendo dos', 'Determina ángulos en paralelogramos y trapecios']
  },
  {
    code: 'OA 18',
    grade: '6_basico',
    axis: 'medicion',
    title: 'Cálculo de superficie de cubos y paralelepípedos (cm² y m²)',
    description: 'Calcular la superficie de cubos y paralelepípedos expresando el resultado en cm² y m².',
    indicators: ['Calcula 6 · a² para el área total del cubo', 'Aplica en problemas de pintura o envoltorio de cajas']
  },
  {
    code: 'OA 19',
    grade: '6_basico',
    axis: 'medicion',
    title: 'Volumen de cubos y paralelepípedos (cm³, m³ y mm³)',
    description: 'Calcular el volumen de cubos y paralelepípedos, expresando el resultado en cm³, m³ y mm³.',
    indicators: ['Aplica V = largo × ancho × alto', 'Resuelve problemas de volumen y capacidad de recipientes']
  },
  {
    code: 'OA 20',
    grade: '6_basico',
    axis: 'medicion',
    title: 'Estimación y medición de ángulos con transportador',
    description: 'Estimar y medir ángulos usando el transportador, expresando las mediciones en grados.',
    indicators: ['Mide ángulos en grados sexagesimales con precisión', 'Estima amplitudes de ángulos agudos, rectos y obtusos']
  },
  {
    code: 'OA 21',
    grade: '6_basico',
    axis: 'medicion',
    title: 'Cálculo de ángulos en rectas paralelas y en triángulos',
    description: 'Calcular ángulos en rectas paralelas cortadas por una transversal y en triángulos.',
    indicators: ['Identifica ángulos alternos internos y correspondientes congruentes', 'Calcula ángulos desconocidos en figuras con paralelas y triángulos']
  },
  {
    code: 'OA 22',
    grade: '6_basico',
    axis: 'datos_probabilidades',
    title: 'Comparación de distribuciones (puntos y tallo y hojas)',
    description: 'Comparar distribuciones de dos grupos, provenientes de muestras aleatorias, usando diagramas de puntos y de tallo y hojas.',
    indicators: ['Compara centros y dispersión entre dos grupos', 'Analiza rendimientos comparados de dos cursos']
  },
  {
    code: 'OA 23',
    grade: '6_basico',
    axis: 'datos_probabilidades',
    title: 'Tendencia en experimentos aleatorios repetidos',
    description: 'Conjeturar acerca de la tendencia de resultados obtenidos en repeticiones de un mismo experimento con dados, monedas u otros, de manera manual y/o usando software educativo.',
    indicators: ['Observa la estabilización de frecuencias relativas al repetir ensayos', 'Diferencia probabilidad teórica de frecuencia empírica']
  },
  {
    code: 'OA 24',
    grade: '6_basico',
    axis: 'datos_probabilidades',
    title: 'Gráficos de barra doble y gráficos circulares',
    description: 'Leer e interpretar gráficos de barra doble y gráficos circulares y comunicar sus conclusiones.',
    indicators: ['Asocia porcentajes con sectores circulares (25% = 90°, 50% = 180°)', 'Compara categorías en gráficos de barras dobles']
  },

  // =========================================================================
  // 7° BÁSICO (Bases Curriculares MINEDUC Chile - Decreto N° 614)
  // =========================================================================
  {
    code: 'OA 01',
    grade: '7_basico',
    axis: 'numeros_operaciones',
    title: 'Adición y sustracción de números enteros en Z',
    description: 'Mostrar que comprenden la adición y la sustracción de números enteros: representando en la recta numérica, dando significado a los signos + y - y resolviendo problemas cotidianos.',
    indicators: ['Opera con números positivos y negativos', 'Resuelve problemas de temperaturas, profundidades y balances comerciales']
  },
  {
    code: 'OA 02',
    grade: '7_basico',
    axis: 'numeros_operaciones',
    title: 'Multiplicación y división de fracciones y decimales positivos',
    description: 'Explicar la multiplicación y la división de fracciones positivas utilizando representaciones concretas, pictóricas y simbólicas, relacionándolas con decimales.',
    indicators: ['Aplica algoritmo de producto de fracciones', 'Aplica el inverso multiplicativo para dividir fracciones']
  },
  {
    code: 'OA 03',
    grade: '7_basico',
    axis: 'numeros_operaciones',
    title: 'Problemas de multiplicación y división en Q+',
    description: 'Resolver problemas que involucren la multiplicación y la división de fracciones y de decimales positivos de manera concreta, pictórica y simbólica.',
    indicators: ['Calcula rendimientos y proporciones fraccionarias', 'Resuelve problemas cotidianos con decimales y fracciones']
  },
  {
    code: 'OA 04',
    grade: '7_basico',
    axis: 'numeros_operaciones',
    title: 'Porcentajes, IVA, descuentos e interés simple',
    description: 'Mostrar que comprenden el concepto de porcentaje: representándolo de manera pictórica, calculándolo de varias maneras y aplicándolo a situaciones sencillas (IVA, descuentos, interés).',
    indicators: ['Calcula el 19% de IVA y porcentajes de variación en pesos', 'Relaciona porcentajes con razones y decimales']
  },
  {
    code: 'OA 05',
    grade: '7_basico',
    axis: 'numeros_operaciones',
    title: 'Potencias de base 10 y notación científica',
    description: 'Utilizar potencias de base 10 con exponente natural usando los términos potencia, base, exponente y defiendo el exponente 0, representando números en notación científica.',
    indicators: ['Expresa números grandes como a × 10ⁿ', 'Aplica propiedades de potencias de base 10']
  },
  {
    code: 'OA 06',
    grade: '7_basico',
    axis: 'patrones_algebra',
    title: 'Lenguaje algebraico y generalización de relaciones',
    description: 'Utilizar el lenguaje algebraico para generalizar relaciones entre números, para establecer y formular reglas y propiedades y construir ecuaciones.',
    indicators: ['Traduce relaciones cotidianas a expresiones algebraicas', 'Calcula el valor numérico sustituyendo variables']
  },
  {
    code: 'OA 07',
    grade: '7_basico',
    axis: 'patrones_algebra',
    title: 'Reducción de expresiones algebraicas y términos semejantes',
    description: 'Reducir expresiones algebraicas, reuniendo términos semejantes para obtener expresiones de la forma ax + by + cz (con a, b, c ∈ Z).',
    indicators: ['Agrupa coeficientes de términos con igual factor literal', 'Simplifica expresiones algebraicas lineales']
  },
  {
    code: 'OA 08',
    grade: '7_basico',
    axis: 'patrones_algebra',
    title: 'Proporcionalidad directa e inversa',
    description: 'Mostrar que comprenden las proporciones directas e inversas: realizando tablas de valores, graficando valores y resolviendo problemas de la vida diaria.',
    indicators: ['Reconoce proporcionalidad directa (y/x = k) e inversa (x · y = k)', 'Interpreta gráficos lineales por el origen e hipérbolas']
  },
  {
    code: 'OA 09',
    grade: '7_basico',
    axis: 'patrones_algebra',
    title: 'Ecuaciones e inecuaciones lineales de primer grado',
    description: 'Modelar y resolver problemas diversos de la vida diaria y de otras asignaturas, que involucran ecuaciones e inecuaciones lineales de la forma ax = b, x/a = b, ax + b = c y desigualdades.',
    indicators: ['Despeja incógnitas aplicando propiedades de igualdad y desigualdad', 'Representa soluciones de inecuaciones en la recta numérica']
  },
  {
    code: 'OA 10',
    grade: '7_basico',
    axis: 'geometria',
    title: 'Ángulos interiores y exteriores en polígonos',
    description: 'Descubrir relaciones que involucran ángulos exteriores o interiores de diferentes polígonos.',
    indicators: ['Calcula la suma de ángulos interiores (n - 2) × 180°', 'Determina ángulos interiores y exteriores de polígonos regulares']
  },
  {
    code: 'OA 11',
    grade: '7_basico',
    axis: 'geometria',
    title: 'Círculo y circunferencia: perímetro y área',
    description: 'Mostrar que comprenden el círculo: describiendo las relaciones entre radio, diámetro y perímetro, y estimando y aplicando fórmulas de perímetro (2πr) y área (πr²).',
    indicators: ['Aplica P = 2 · π · r y A = π · r² con π ≈ 3,14', 'Resuelve problemas de ruedas, pistas y canchas circulares']
  },
  {
    code: 'OA 12',
    grade: '7_basico',
    axis: 'geometria',
    title: 'Construcciones geométricas: alturas, bisectrices y puntos notables',
    description: 'Construir objetos geométricos de manera manual y/o con software educativo: líneas perpendiculares, paralelas, bisectrices, alturas y puntos notables del triángulo.',
    indicators: ['Identifica bisectrices, alturas y simetrales en triángulos', 'Reconoce triángulos y cuadriláteros congruentes']
  },
  {
    code: 'OA 13',
    grade: '7_basico',
    axis: 'medicion',
    title: 'Área de triángulos, paralelogramos y trapecios',
    description: 'Desarrollar y aplicar la fórmula del área de triángulos, paralelogramos y trapecios en problemas geométricos y de medición.',
    indicators: ['Aplica A = base × altura en paralelogramos y A = (B + b) × h / 2 en trapecios', 'Calcula áreas compuestas descomponiendo polígonos']
  },
  {
    code: 'OA 14',
    grade: '7_basico',
    axis: 'geometria',
    title: 'Puntos y vectores en el plano cartesiano (4 cuadrantes)',
    description: 'Identificar puntos en el plano cartesiano, usando pares ordenados y vectores de forma concreta y pictórica en los cuatro cuadrantes.',
    indicators: ['Ubica pares ordenados con coordenadas positivas y negativas', 'Aplica vectores de desplazamiento en el plano']
  },
  {
    code: 'OA 15',
    grade: '7_basico',
    axis: 'datos_probabilidades',
    title: 'Población, muestra y muestreo aleatorio',
    description: 'Estimar el porcentaje de algunas características de una población desconocida por medio del muestreo aleatorio.',
    indicators: ['Distingue entre población y muestra representativa', 'Estima características poblacionales a partir de muestras']
  },
  {
    code: 'OA 16',
    grade: '7_basico',
    axis: 'datos_probabilidades',
    title: 'Tablas de frecuencias absolutas y relativas',
    description: 'Representar datos obtenidos en una muestra mediante tablas de frecuencias absolutas y relativas, utilizando gráficos apropiados.',
    indicators: ['Calcula frecuencia absoluta, relativa y porcentual', 'Selecciona el gráfico más adecuado según la variable']
  },
  {
    code: 'OA 17',
    grade: '7_basico',
    axis: 'datos_probabilidades',
    title: 'Medidas de tendencia central y rango',
    description: 'Mostrar que comprenden las medidas de tendencia central y el rango: determinando media aritmética, mediana, moda y rango para hacer inferencias.',
    indicators: ['Calcula media, mediana, moda y rango de conjuntos de datos', 'Analiza qué medida representa mejor un conjunto con valores extremos']
  },
  {
    code: 'OA 18',
    grade: '7_basico',
    axis: 'datos_probabilidades',
    title: 'Probabilidad de eventos y regla de Laplace',
    description: 'Explicar las probabilidades de eventos obtenidos por medio de experimentos de manera manual o digital, estimándolas y expresándolas como razones, fracciones o porcentajes.',
    indicators: ['Calcula P(A) = Casos Favorables / Casos Totales', 'Expresa probabilidades en fracción, decimal y porcentaje']
  },
  {
    code: 'OA 19',
    grade: '7_basico',
    axis: 'datos_probabilidades',
    title: 'Frecuencia relativa experimental vs. probabilidad teórica',
    description: 'Comparar las frecuencias relativas de un evento obtenidas al repetir un experimento de forma manual y/o con software educativo, con la probabilidad obtenida de manera teórica.',
    indicators: ['Usa diagramas de árbol y tablas para calcular casos posibles', 'Comprueba la convergencia hacia la probabilidad teórica']
  },

  // =========================================================================
  // 8° BÁSICO (Bases Curriculares MINEDUC Chile - Decreto N° 614)
  // =========================================================================
  {
    code: 'OA 01',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    title: 'Multiplicación y división de números enteros en Z',
    description: 'Mostrar que comprenden la multiplicación y la división de números enteros: representándolas en la recta, aplicando la regla de los signos y resolviendo problemas.',
    indicators: ['Aplica la regla de los signos en operaciones combinadas', 'Resuelve problemas con temperaturas, profundidades y balances']
  },
  {
    code: 'OA 02',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    title: 'Multiplicación y división de números racionales (Q)',
    description: 'Utilizar las operaciones de multiplicación y división con los números racionales en el contexto de la resolución de problemas, involucrando fracciones y decimales positivos y negativos.',
    indicators: ['Opera con fracciones y decimales negativos respetando regla de signos', 'Resuelve problemas que combinan fracciones y decimales']
  },
  {
    code: 'OA 03',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    title: 'Potencias de base y exponente natural y propiedades',
    description: 'Explicar la multiplicación, la división y el proceso de formar potencias de potencias de base natural y exponente natural hasta 3, de manera concreta, pictórica y simbólica.',
    indicators: ['Aplica aⁿ × aᵐ = aⁿ⁺ᵐ y aⁿ / aᵐ = aⁿ⁻ᵐ', 'Calcula potencias de potencias y potencias de base entera']
  },
  {
    code: 'OA 04',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    title: 'Raíces cuadradas de números naturales',
    description: 'Mostrar que comprenden las raíces cuadradas de números naturales: estimándolas de manera intuitiva, representándolas en la recta numérica y aplicándolas en geometría.',
    indicators: ['Calcula raíces cuadradas exactas hasta √144 y √225', 'Estima raíces cuadradas inexactas entre dos enteros consecutivos']
  },
  {
    code: 'OA 05',
    grade: '8_basico',
    axis: 'numeros_operaciones',
    title: 'Variaciones porcentuales en contextos económicos',
    description: 'Resolver problemas que involucran variaciones porcentuales en contextos diversos, usando representaciones pictóricas y registrando el proceso de manera simbólica.',
    indicators: ['Calcula aumentos y descuentos porcentuales sucesivos e IPC', 'Determina valores netos, brutos e intereses']
  },
  {
    code: 'OA 06',
    grade: '8_basico',
    axis: 'patrones_algebra',
    title: 'Operaciones algebraicas, productos notables y factorización',
    description: 'Mostrar que comprenden las operaciones de expresiones algebraicas: representándolas pictórica y simbólicamente, multiplicando binomios y determinando formas factorizadas.',
    indicators: ['Aplica propiedad distributiva y desarrolla cuadrado de binomio', 'Factoriza expresiones algebraicas relacionadas con áreas']
  },
  {
    code: 'OA 07',
    grade: '8_basico',
    axis: 'patrones_algebra',
    title: 'Noción de función lineal: f(x) = mx',
    description: 'Mostrar que comprenden la noción de función por medio de un cambio lineal: utilizando tablas, metáforas de máquinas, reglas entre x e y y representaciones gráficas.',
    indicators: ['Identifica la constante de proporcionalidad m en tablas y gráficos', 'Distingue relaciones funcionales de las que no lo son']
  },
  {
    code: 'OA 08',
    grade: '8_basico',
    axis: 'patrones_algebra',
    title: 'Modelamiento con ecuaciones lineales en Q',
    description: 'Modelar situaciones de la vida diaria y de otras asignaturas, usando ecuaciones lineales de la forma ax = b, x/a = b, ax + b = c, ax + b = cx + d.',
    indicators: ['Resuelve ecuaciones lineales con coeficientes enteros y racionales', 'Traduce problemas verbales a ecuaciones y verifica soluciones']
  },
  {
    code: 'OA 09',
    grade: '8_basico',
    axis: 'patrones_algebra',
    title: 'Inecuaciones lineales con coeficientes racionales',
    description: 'Resolver inecuaciones lineales con coeficientes racionales en el contexto de la resolución de problemas, por medio de representaciones gráficas y simbólicas.',
    indicators: ['Resuelve desigualdades invirtiendo el signo al multiplicar/dividir por negativos', 'Representa conjuntos solución en la recta numérica']
  },
  {
    code: 'OA 10',
    grade: '8_basico',
    axis: 'patrones_algebra',
    title: 'Función afín: f(x) = mx + n',
    description: 'Mostrar que comprenden la función afín: generalizándola como la suma de una constante con una función lineal, determinando pendiente m e intercepto n y graficándola.',
    indicators: ['Identifica pendiente m y coeficiente de posición n', 'Modela tarifas fijas más cobro variable usando funciones afines']
  },
  {
    code: 'OA 11',
    grade: '8_basico',
    axis: 'medicion',
    title: 'Área de superficie y volumen de prismas rectos y cilindros',
    description: 'Desarrollar las fórmulas para encontrar el área de superficies y el volumen de prismas rectos con diferentes bases y de cilindros.',
    indicators: ['Calcula volumen V = Abase × h en prismas y cilindros (πr²h)', 'Calcula área lateral y total desplegando redes']
  },
  {
    code: 'OA 12',
    grade: '8_basico',
    axis: 'geometria',
    title: 'Teorema de Pitágoras: a² + b² = c²',
    description: 'Explicar, de manera concreta, pictórica y simbólica, la validez del teorema de Pitágoras y aplicar a la resolución de problemas geométricos y de la vida cotidiana.',
    indicators: ['Calcula la hipotenusa conocidos los dos catetos', 'Halla un cateto desconocido mediante despeje y raíces cuadradas']
  },
  {
    code: 'OA 13',
    grade: '8_basico',
    axis: 'geometria',
    title: 'Transformaciones isométricas y vectores en el plano cartesiano',
    description: 'Describir la posición y el movimiento (traslaciones, rotaciones y reflexiones) de figuras 2D en el plano cartesiano usando vectores y ejes.',
    indicators: ['Aplica vectores de traslación a coordenadas (x, y)', 'Refleja figuras respecto a los ejes X e Y y rota en 90° o 180°']
  },
  {
    code: 'OA 14',
    grade: '8_basico',
    axis: 'geometria',
    title: 'Composición de transformaciones isométricas y simetrías',
    description: 'Componer rotaciones, traslaciones y reflexiones en el plano cartesiano y en el espacio, aplicándolas a las simetrías de polígonos y poliedros.',
    indicators: ['Identifica la transformación resultante al componer isometrías', 'Reconoce ejes y planos de simetría en polígonos y cuerpos']
  },
  {
    code: 'OA 15',
    grade: '8_basico',
    axis: 'datos_probabilidades',
    title: 'Medidas de posición: percentiles, cuartiles y diagramas de cajón',
    description: 'Mostrar que comprenden las medidas de posición, percentiles y cuartiles, identificando la población y representándolas en diagramas de cajón.',
    indicators: ['Calcula Q1, Q2 (mediana) y Q3 en conjuntos ordenados', 'Construye e interpreta diagramas de caja y bigotes']
  },
  {
    code: 'OA 16',
    grade: '8_basico',
    axis: 'datos_probabilidades',
    title: 'Evaluación de sesgos en medios y encuestas',
    description: 'Evaluar la forma en que los datos son presentados en medios de comunicación y encuestas para detectar sesgos, escalas engañosas e interpretaciones erróneas.',
    indicators: ['Identifica escalas truncadas o engañosas en ejes de gráficos', 'Analiza la representatividad del tamaño muestral']
  },
  {
    code: 'OA 17',
    grade: '8_basico',
    axis: 'datos_probabilidades',
    title: 'Principio combinatorio multiplicativo y diagramas de árbol',
    description: 'Explicar el principio combinatorio multiplicativo a partir de situaciones concretas, representándolo con tablas y árboles regulares para calcular probabilidades.',
    indicators: ['Aplica el principio multiplicativo en combinaciones y eventos compuestos', 'Dibuja diagramas de árbol para contar casos totales y favorables']
  }
];

export function getObjectivesForGrade(grade: GradeLevel): LearningObjective[] {
  return MINEDUC_OBJECTIVES.filter(oa => oa.grade === grade);
}

export function getObjectiveByCode(code: string, grade?: GradeLevel): LearningObjective | undefined {
  if (grade) {
    return MINEDUC_OBJECTIVES.find(oa => oa.code === code && oa.grade === grade);
  }
  return MINEDUC_OBJECTIVES.find(oa => oa.code === code);
}
