import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  UserPlus,
  Printer,
  Search,
  Check,
  Eye,
  Trash2,
  Cloud,
  Copy,
  Unlink,
  QrCode,
  Download,
  Share2,
  X,
  Link2,
} from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { GradeLevel } from '../../types';

export const CourseRosterView: React.FC = () => {
  const {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    selectedCourse,
    teacherStudents,
    addStudentsToCourse,
    removeStudentFromCourse,
    clearCourseStudentsForTeacher,
    unlinkStudentGoogleAccount,
    getCourseJoinCode,
    isCloudTeacher,
    setActiveTeacherTab,
    currentTeacher,
    setIsTeacherLoginModalOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPrintCardsOpen, setIsPrintCardsOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [rawStudentList, setRawStudentList] = useState('');
  const [addedCountNotice, setAddedCountNotice] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copiedJoinCode, setCopiedJoinCode] = useState(false);
  const [copiedQrUrl, setCopiedQrUrl] = useState(false);

  const inlineQrCanvasWrapRef = useRef<HTMLButtonElement | null>(null);
  const modalQrCanvasWrapRef = useRef<HTMLDivElement | null>(null);

  // Group courses by grade level with dark-aware pastel colors
  const GRADE_LEVELS: { id: GradeLevel; name: string; pastelActive: string; pastelIdle: string }[] = [
    { id: '1_basico', name: '1° Básico', pastelActive: 'bg-sky-100 dark:bg-sky-900/70 border-sky-400 text-sky-950 dark:text-sky-100 font-black', pastelIdle: 'hover:bg-sky-50/70 dark:hover:bg-sky-950/50 border-sky-200/80 dark:border-sky-800/70 text-sky-900 dark:text-sky-200' },
    { id: '2_basico', name: '2° Básico', pastelActive: 'bg-emerald-100 dark:bg-emerald-900/70 border-emerald-400 text-emerald-950 dark:text-emerald-100 font-black', pastelIdle: 'hover:bg-emerald-50/70 dark:hover:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200' },
    { id: '3_basico', name: '3° Básico', pastelActive: 'bg-amber-100 dark:bg-amber-900/70 border-amber-400 text-amber-950 dark:text-amber-100 font-black', pastelIdle: 'hover:bg-amber-50/70 dark:hover:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/70 text-amber-900 dark:text-amber-200' },
    { id: '4_basico', name: '4° Básico', pastelActive: 'bg-orange-100 dark:bg-orange-900/70 border-orange-400 text-orange-950 dark:text-orange-100 font-black', pastelIdle: 'hover:bg-orange-50/70 dark:hover:bg-orange-950/50 border-orange-200/80 dark:border-orange-800/70 text-orange-900 dark:text-orange-200' },
    { id: '5_basico', name: '5° Básico', pastelActive: 'bg-indigo-100 dark:bg-indigo-900/70 border-indigo-400 text-indigo-950 dark:text-indigo-100 font-black', pastelIdle: 'hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50 border-indigo-200/80 dark:border-indigo-800/70 text-indigo-900 dark:text-indigo-200' },
    { id: '6_basico', name: '6° Básico', pastelActive: 'bg-purple-100 dark:bg-purple-900/70 border-purple-400 text-purple-950 dark:text-purple-100 font-black', pastelIdle: 'hover:bg-purple-50/70 dark:hover:bg-purple-950/50 border-purple-200/80 dark:border-purple-800/70 text-purple-900 dark:text-purple-200' },
    { id: '7_basico', name: '7° Básico', pastelActive: 'bg-pink-100 dark:bg-pink-900/70 border-pink-400 text-pink-950 dark:text-pink-100 font-black ring-2 ring-pink-300 dark:ring-pink-700', pastelIdle: 'hover:bg-pink-50/70 dark:hover:bg-pink-950/50 border-pink-200/80 dark:border-pink-800/70 text-pink-900 dark:text-pink-200' },
    { id: '8_basico', name: '8° Básico', pastelActive: 'bg-teal-100 dark:bg-teal-900/70 border-teal-400 text-teal-950 dark:text-teal-100 font-black', pastelIdle: 'hover:bg-teal-50/70 dark:hover:bg-teal-950/50 border-teal-200/80 dark:border-teal-800/70 text-teal-900 dark:text-teal-200' },
  ];

  const currentGrade = selectedCourse?.grade || '7_basico';
  const coursesInCurrentGrade = courses.filter(c => c.grade === currentGrade);

  // Courses where THIS teacher has loaded at least 1 student
  const myLoadedCourses = courses
    .map(c => ({
      course: c,
      count: teacherStudents.filter(s => s.courseId === c.id).length,
    }))
    .filter(item => item.count > 0);

  const courseStudents = teacherStudents.filter(s => s.courseId === selectedCourseId);
  const filteredStudents = courseStudents.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rut.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.accessCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Shareable Course QR & URL
  const cloudJoinCode = getCourseJoinCode(selectedCourseId);
  const shareCourseCode = cloudJoinCode || selectedCourseId;
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrShareUrl = `${originUrl}/?curso=${encodeURIComponent(shareCourseCode)}&rol=estudiante`;

  const teacherDisplay = currentTeacher?.name ? `Prof. ${currentTeacher.name}` : 'Docente';
  const whatsAppShareText = [
    `*Escuela Ricardo Silva Arriagada · SLEP Chinchorro*`,
    `Acceso al curso *${selectedCourse?.section || ''}* (${teacherDisplay}) en la plataforma Matemática ThatQuiz:`,
    ``,
    `📲 Ingresa directo escaneando el QR o abriendo este enlace:`,
    qrShareUrl,
    ``,
    `🔑 Código del curso: *${shareCourseCode}*`,
    `Cada estudiante elige su nombre de la lista e ingresa su PIN de 4 dígitos.`,
  ].join('\n');
  const whatsAppHref = `https://wa.me/?text=${encodeURIComponent(whatsAppShareText)}`;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawStudentList.trim()) return;

    const hadStudentsBefore = courseStudents.length > 0;
    const count = addStudentsToCourse(selectedCourseId, rawStudentList);
    setRawStudentList('');
    setIsAddModalOpen(false);
    setAddedCountNotice(count);
    if (!hadStudentsBefore && count > 0) {
      setIsQrModalOpen(true);
    }
    setTimeout(() => setAddedCountNotice(null), 5000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyQrUrl = () => {
    void navigator.clipboard?.writeText(qrShareUrl);
    setCopiedQrUrl(true);
    setTimeout(() => setCopiedQrUrl(false), 2200);
  };

  const handleCopyJoinCode = () => {
    void navigator.clipboard?.writeText(shareCourseCode);
    setCopiedJoinCode(true);
    setTimeout(() => setCopiedJoinCode(false), 2200);
  };

  const handleDownloadQrPng = () => {
    const sourceCanvas =
      modalQrCanvasWrapRef.current?.querySelector('canvas') ||
      inlineQrCanvasWrapRef.current?.querySelector('canvas');
    if (!sourceCanvas) return;

    const cardWidth = 640;
    const cardHeight = 820;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = cardWidth;
    outCanvas.height = cardHeight;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    // White card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // Top indigo-sky banner
    const grad = ctx.createLinearGradient(0, 0, cardWidth, 140);
    grad.addColorStop(0, '#3730a3');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cardWidth, 148);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e0e7ff';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('ESCUELA RICARDO SILVA ARRIAGADA · SLEP CHINCHORRO', cardWidth / 2, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Curso: ${selectedCourse?.section || ''}`, cardWidth / 2, 90);

    ctx.fillStyle = '#bae6fd';
    ctx.font = '600 17px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${teacherDisplay} · Matemática ThatQuiz`, cardWidth / 2, 122);

    // QR Frame
    const qrSize = 360;
    const qrX = (cardWidth - qrSize) / 2;
    const qrY = 186;
    ctx.strokeStyle = '#c7d2fe';
    ctx.lineWidth = 3;
    ctx.strokeRect(qrX - 18, qrY - 18, qrSize + 36, qrSize + 36);
    ctx.drawImage(sourceCanvas, qrX, qrY, qrSize, qrSize);

    // Join code pill
    ctx.fillStyle = '#eef2ff';
    ctx.fillRect(90, 586, cardWidth - 180, 74);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(90, 586, cardWidth - 180, 74);

    ctx.fillStyle = '#4338ca';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText('CÓDIGO DEL CURSO', cardWidth / 2, 612);

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 26px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(shareCourseCode, cardWidth / 2, 644);

    // Instructions for students and parents
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
    ctx.fillText('¿Cómo ingresar con Estudiantes y Apoderados?', cardWidth / 2, 702);

    ctx.fillStyle = '#475569';
    ctx.font = '500 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('1. Escanea el código QR con la cámara de tu celular.', cardWidth / 2, 734);
    ctx.fillText('2. Conecta una cuenta Google y elige tu nombre en la lista.', cardWidth / 2, 760);
    ctx.fillText('3. Ingresa el PIN de 4 dígitos entregado por tu profesor(a).', cardWidth / 2, 786);

    const pngUrl = outCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `QR_${(selectedCourse?.section || 'Curso').replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Level Selector Bar */}
      <div className="tq-card border rounded-2xl p-5 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b tq-border pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tq-text-accent tracking-wider">
              {selectedCourse?.schoolName} · {selectedCourse?.commune}
            </span>
            <h2 className="text-base font-bold tq-text flex items-center gap-1.5 mt-0.5">
              <span>Niveles de Educación Básica</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full tq-muted tq-text-2">
                1° a 8° Básico
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="tq-text-muted font-medium">Docente a cargo:</span>
            <button
              type="button"
              onClick={() => setIsTeacherLoginModalOpen(true)}
              className="font-bold tq-text tq-subtle hover:bg-[var(--tq-tint-bg)] px-2.5 py-1 rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Gestionar clave o cambiar de docente"
            >
              <span>{teacherDisplay}</span>
              <span className="text-[10px] tq-text-accent underline font-bold">Cuenta</span>
            </button>
          </div>
        </div>

        {/* Level buttons (1° to 8° Básico) */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {GRADE_LEVELS.map(lvl => {
            const isSelected = currentGrade === lvl.id;
            const gradeCourseIds = new Set(courses.filter(c => c.grade === lvl.id).map(c => c.id));
            const myCountInGrade = teacherStudents.filter(s => gradeCourseIds.has(s.courseId)).length;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  const withStudents = courses.find(
                    c => c.grade === lvl.id && teacherStudents.some(s => s.courseId === c.id)
                  );
                  const targetCourse = withStudents || courses.find(c => c.grade === lvl.id);
                  if (targetCourse) {
                    setSelectedCourseId(targetCourse.id);
                    setConfirmClear(false);
                  }
                }}
                className={`py-2.5 px-1.5 text-center rounded-xl border transition-all shadow-2xs cursor-pointer ${
                  isSelected ? lvl.pastelActive : `tq-card ${lvl.pastelIdle}`
                }`}
              >
                <div className="text-xs">{lvl.name}</div>
                <div className="text-[10px] opacity-80 mt-0.5 font-semibold">
                  {myCountInGrade > 0 ? `${myCountInGrade} al.` : 'Sin lista'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mis Listas Cargadas Quick Bar */}
        <div className="mt-4 pt-3 border-t tq-border flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold tq-text-2">
            Mis listas cargadas ({myLoadedCourses.length}):
          </span>
          {myLoadedCourses.length === 0 ? (
            <span className="text-xs tq-text-muted italic">
              Aún no has cargado listas de curso con tu cuenta ({teacherDisplay}). Elige un nivel arriba y presiona "Cargar Lista de Curso".
            </span>
          ) : (
            myLoadedCourses.map(({ course, count }) => (
              <button
                key={course.id}
                type="button"
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setConfirmClear(false);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-full border transition-all cursor-pointer ${
                  selectedCourseId === course.id
                    ? 'tq-btn-primary border-[var(--tq-accent)] shadow-2xs'
                    : 'tq-accent-soft border tq-border hover:opacity-90'
                }`}
              >
                {course.section} ({count})
              </button>
            ))
          )}
        </div>

        {/* Course paralelos for current grade */}
        <div className="mt-3 pt-3 border-t tq-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tq-text-2">Paralelo seleccionado:</span>
            <div className="flex items-center gap-2">
              {coursesInCurrentGrade.map(c => {
                const count = teacherStudents.filter(s => s.courseId === c.id).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setConfirmClear(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      selectedCourseId === c.id
                        ? 'tq-btn-primary border-transparent shadow-xs'
                        : 'tq-card tq-text-2 hover:bg-[var(--tq-subtle-bg)]'
                    }`}
                  >
                    {c.section} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTeacherTab('matrix')}
              className="px-3.5 py-1.5 text-xs font-bold tq-accent-soft border tq-border rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Matriz de Notas ThatQuiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Course Roster Header */}
      <div className="tq-card border rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-lg font-bold tq-text">
              Mi Lista del Curso: {selectedCourse?.section}
            </h1>
            <span className="text-xs font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-900 dark:text-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
              {courseStudents.length} estudiantes
            </span>
          </div>
          <p className="text-xs tq-text-muted">
            Cargada por <strong className="tq-text-2">{teacherDisplay}</strong> · Al guardar la lista se genera automáticamente su código QR para compartir
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-bold tq-btn-primary rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cargar Lista de Curso (Pegar de Excel)</span>
          </button>

          {courseStudents.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="px-4 py-2 text-xs font-bold tq-btn-gradient rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Código QR y Compartir</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintCardsOpen(true)}
                className="px-4 py-2 text-xs font-bold tq-text-2 tq-muted hover:opacity-85 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 tq-text-muted" />
                <span>Tarjetas de Credenciales</span>
              </button>

              {confirmClear ? (
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-rose-800 dark:text-rose-200">¿Vaciar lista?</span>
                  <button
                    type="button"
                    onClick={() => {
                      clearCourseStudentsForTeacher(selectedCourseId);
                      setConfirmClear(false);
                    }}
                    className="px-2 py-0.5 bg-rose-600 text-white text-[11px] font-bold rounded-lg hover:bg-rose-700 cursor-pointer"
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-0.5 tq-card tq-text-2 text-[11px] font-semibold rounded-lg border tq-border cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="p-2 tq-text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer"
                  title="Vaciar lista de este curso"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {addedCountNotice !== null && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs rounded-xl flex items-center justify-between gap-2 shadow-2xs print:hidden">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">
              Se han agregado exitosamente {addedCountNotice} estudiantes con sus credenciales de acceso y código QR del curso listo para compartir.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer"
          >
            Ver QR
          </button>
        </div>
      )}

      {/* Shareable Course QR & Join Code Card */}
      {courseStudents.length > 0 && (
        <div className="p-5 tq-tint border-2 border-[var(--tq-border-strong)] rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-2xs print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Crisp white quiet zone around QR so phone cameras scan reliably in all 5 themes */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              ref={inlineQrCanvasWrapRef}
              className="bg-white p-2.5 rounded-2xl border border-indigo-200 shadow-xs shrink-0 hover:scale-[1.03] transition-transform cursor-pointer"
              title="Haz clic para ampliar o imprimir el afiche QR"
            >
              <QRCodeCanvas
                value={qrShareUrl}
                size={104}
                level="M"
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </button>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black tq-text flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 tq-text-accent" />
                  <span>QR del Curso para Apoderados y Estudiantes ({selectedCourse?.section})</span>
                </span>
                {isCloudTeacher ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    <span>Sincronizado en la nube</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                    Modo local · Conecta Google para multi-dispositivo
                  </span>
                )}
              </div>

              <p className="text-xs tq-text-2 max-w-2xl leading-relaxed">
                Al escanear este QR con el celular, el estudiante o apoderado abre directamente el ingreso de <strong>{selectedCourse?.section}</strong> para elegir su nombre de la lista y entrar con su PIN.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-[11px] font-bold tq-text-muted">Código del curso:</span>
                <span className="font-mono font-black text-xs px-2.5 py-1 tq-card border border-[var(--tq-border-strong)] rounded-lg tq-text-accent select-all">
                  {shareCourseCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyJoinCode}
                  className="px-2.5 py-1 tq-card border tq-border rounded-lg text-[11px] font-bold tq-text-2 hover:tq-text inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedJoinCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJoinCode ? 'Copiado' : 'Copiar código'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar por WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleCopyQrUrl}
              className="px-3.5 py-2.5 tq-card border tq-border hover:border-[var(--tq-border-strong)] tq-text rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedQrUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5 tq-text-accent" />}
              <span>{copiedQrUrl ? 'Enlace copiado' : 'Copiar enlace'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQrPng}
              className="px-3.5 py-2.5 tq-btn-primary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar QR</span>
            </button>

            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="px-3.5 py-2.5 tq-accent-soft border tq-border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Ampliar / Imprimir</span>
            </button>
          </div>
        </div>
      )}

      {/* Student Table */}
      <div className="tq-card border rounded-2xl shadow-xs overflow-hidden print:hidden">
        <div className="p-4 border-b tq-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 tq-subtle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg tq-accent-soft flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold tq-text">
              Lista Oficial · {selectedCourse?.section}
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 tq-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar estudiante, RUN o código..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border tq-input rounded-xl focus:outline-hidden transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="tq-subtle border-b tq-border tq-text-2 font-bold">
                <th className="py-3 px-4 w-12 text-center">N°</th>
                <th className="py-3 px-4">Estudiante (Nombre y Apellidos)</th>
                <th className="py-3 px-4">RUN</th>
                <th className="py-3 px-4">Código ThatQuiz</th>
                <th className="py-3 px-4">PIN Inicial</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-3 text-center w-14">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--tq-border)] tq-text-2 font-mono text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center tq-text-muted font-sans">
                    No has cargado estudiantes en {selectedCourse?.section} con tu cuenta ({teacherDisplay}). Usa el botón "Cargar Lista de Curso" para pegar tu lista desde Excel y generar el código QR del curso.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-[var(--tq-tint-bg)]/40 transition-colors">
                    <td className="py-2.5 px-4 text-center tq-text-muted">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-bold font-sans tq-text">
                      {st.name}
                    </td>
                    <td className="py-2.5 px-4 tq-text-2">
                      {st.rut}
                    </td>
                    <td className="py-2.5 px-4 font-bold">
                      <span className="px-2 py-0.5 rounded-md tq-accent-soft border tq-border">
                        {st.accessCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold tq-text">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md tq-muted border tq-border">
                          {st.pin}
                        </span>
                        {st.hasCustomPin ? (
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-md font-sans font-bold" title="El estudiante cambió su PIN por uno personal">
                            Personal
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-md font-sans font-medium" title="PIN inicial asignado por sistema">
                            Inicial
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center font-sans">
                      {st.linkedStudentUid ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800">
                            <Cloud className="w-3 h-3" />
                            <span>Vinculado</span>
                          </span>
                          {isCloudTeacher && (
                            <button
                              type="button"
                              onClick={() => unlinkStudentGoogleAccount(st.id)}
                              className="p-1 tq-text-muted hover:text-amber-600 rounded-md transition-colors cursor-pointer"
                              title="Desvincular cuenta Google del alumno para que ingrese desde otro correo"
                            >
                              <Unlink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                          Habilitado
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeStudentFromCourse(st.id)}
                        className="p-1 tq-text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                        title="Quitar de mi lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Load Students from Excel / List */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-2xs print:hidden">
          <div className="tq-card rounded-2xl shadow-xl border max-w-lg w-full p-6">
            <h3 className="text-base font-bold tq-text mb-1">
              Cargar Lista de Curso en {selectedCourse?.section}
            </h3>
            <p className="text-xs tq-text-muted mb-4">
              Copia y pega la lista de alumnos desde Excel o el libro de clases (un alumno por línea). Se generarán automáticamente sus credenciales de acceso y el código QR del curso.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <textarea
                  rows={8}
                  value={rawStudentList}
                  onChange={e => setRawStudentList(e.target.value)}
                  placeholder={`Ejemplo (un estudiante por línea):\nAPELLIDO NOMBRE\n22.345.678-9, APELLIDO NOMBRE`}
                  className="w-full text-xs font-mono p-3 border tq-input rounded-xl focus:outline-hidden"
                />
                <span className="text-[11px] tq-text-muted mt-1 block">
                  Acepta nombres en mayúsculas o minúsculas, con o sin RUN.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t tq-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold tq-text-muted hover:tq-text cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!rawStudentList.trim()}
                  className="px-4 py-2 text-xs font-bold tq-btn-primary disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Guardar y Generar QR + Credenciales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enlarged QR Poster / Share with Parents & Students */}
      {isQrModalOpen && courseStudents.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 p-4 flex items-center justify-center backdrop-blur-2xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-indigo-100 max-w-lg w-full p-6 sm:p-7 text-slate-900 relative">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer print:hidden"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1 pb-4 border-b border-slate-200">
              <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-700 block">
                Escuela Ricardo Silva Arriagada · SLEP Chinchorro
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Acceso por QR · {selectedCourse?.section}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {teacherDisplay} · Comparte este código con estudiantes y apoderados
              </p>
            </div>

            <div className="my-5 flex flex-col items-center">
              <div
                ref={modalQrCanvasWrapRef}
                className="bg-white p-4 rounded-2xl border-2 border-indigo-200 shadow-sm"
              >
                <QRCodeCanvas
                  value={qrShareUrl}
                  size={220}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>

              <div className="mt-4 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-700 block">
                  Código del Curso
                </span>
                <span className="font-mono font-black text-lg text-indigo-950 select-all">
                  {shareCourseCode}
                </span>
              </div>

              <ol className="mt-4 text-xs text-slate-600 space-y-1 text-left bg-slate-50 border border-slate-200 rounded-2xl p-3.5 w-full">
                <li><strong>1.</strong> Escanea el código QR con la cámara del celular o abre el enlace compartido.</li>
                <li><strong>2.</strong> Conecta la cuenta Google del estudiante o apoderado.</li>
                <li><strong>3.</strong> Selecciona el nombre del estudiante en la lista e ingresa su PIN de 4 dígitos.</li>
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-200 print:hidden">
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadQrPng}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Imagen PNG</span>
              </button>

              <button
                type="button"
                onClick={handleCopyQrUrl}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedQrUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4 text-indigo-600" />}
                <span>{copiedQrUrl ? 'Enlace copiado' : 'Copiar enlace'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-700" />
                <span>Imprimir Afiche</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Printable Sheet: Student Credential Cards (kept crisp white paper for printing) */}
      {isPrintCardsOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4 flex justify-center backdrop-blur-2xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 max-w-4xl w-full p-6 my-8 text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5 print:hidden">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Tarjetas de Acceso ThatQuiz - {selectedCourse?.section}
                </h3>
                <p className="text-xs text-slate-500">
                  Escuela Ricardo Silva Arriagada · SLEP Chinchorro
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 tq-btn-primary text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Tarjetas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintCardsOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Course QR Header on Printable Sheet for Parents & Students */}
            <div className="mb-5 p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between gap-4 break-inside-avoid">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-indigo-700 block">
                  Escanea este QR para ingresar directo a {selectedCourse?.section}
                </span>
                <p className="text-xs text-slate-700">
                  Código del curso: <strong className="font-mono">{shareCourseCode}</strong> · {teacherDisplay}
                </p>
                <p className="text-[11px] text-slate-500 font-mono break-all">
                  {qrShareUrl}
                </p>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-indigo-200 shrink-0">
                <QRCodeSVG value={qrShareUrl} size={76} level="M" bgColor="#ffffff" fgColor="#0f172a" />
              </div>
            </div>

            {/* Printable Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {courseStudents.map(st => (
                <div
                  key={st.id}
                  className="border-2 border-dashed border-indigo-200 p-4 rounded-xl bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/20 flex flex-col justify-between text-xs space-y-2 break-inside-avoid shadow-2xs"
                >
                  <div className="border-b border-indigo-100 pb-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 block">
                      Escuela Ricardo Silva Arriagada
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      SLEP Chinchorro · {selectedCourse?.section}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Estudiante:</span>
                    <span className="font-bold text-slate-900 text-sm block leading-tight">
                      {st.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">RUN: {st.rut}</span>
                  </div>

                  <div className="bg-white border border-indigo-100 p-2.5 rounded-lg flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Código:</span>
                      <span className="font-mono font-black text-indigo-700 text-xs">
                        {st.accessCode}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        {st.hasCustomPin ? 'PIN Personal:' : 'Primer PIN:'}
                      </span>
                      <span className="font-mono font-black text-slate-900 text-xs tracking-wider">
                        {st.pin}
                      </span>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-500 text-center pt-1 border-t border-indigo-50">
                    {st.hasCustomPin
                      ? 'PIN personalizado por el estudiante'
                      : 'Al ingresar por 1ª vez, puedes cambiarlo por tu PIN personal'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
