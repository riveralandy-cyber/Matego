import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { School, User, MapPin, Hash, ArrowRight, AlertCircle, LogOut, ShieldCheck } from 'lucide-react';

export const TeacherSchoolOnboarding: React.FC = () => {
  const {
    currentTeacher,
    isCloudTeacher,
    updateTeacherProfile,
    teacherStudents,
    setActiveTeacherTab,
    logoutTeacher,
  } = useApp();

  const [teacherName, setTeacherName] = useState(currentTeacher?.name || '');
  const [schoolName, setSchoolName] = useState('');
  const [commune, setCommune] = useState('');
  const [rbd, setRbd] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentTeacher?.name && !teacherName) {
      setTeacherName(currentTeacher.name);
    }
  }, [currentTeacher?.name, teacherName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanTeacher = teacherName.replace(/\s+/g, ' ').trim();
    const cleanSchool = schoolName.replace(/\s+/g, ' ').trim();
    const cleanCommune = commune.replace(/\s+/g, ' ').trim();

    if (cleanTeacher.length < 2) {
      setErrorMsg('Ingresa tu nombre y apellido docente.');
      return;
    }
    if (cleanSchool.length < 2 || cleanSchool.toLowerCase() === 'mi establecimiento') {
      setErrorMsg('Ingresa el nombre real de tu escuela, colegio o liceo.');
      return;
    }
    if (cleanCommune.length < 2 || cleanCommune.toLowerCase() === 'chile') {
      setErrorMsg('Ingresa la comuna y/o región (o SLEP) de tu establecimiento.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateTeacherProfile({
        name: cleanTeacher,
        schoolName: cleanSchool,
        commune: cleanCommune,
        rbd: rbd.trim() || '-',
      });
      if (!res.ok) {
        setErrorMsg(res.error || 'No se pudieron guardar los datos de tu establecimiento.');
        return;
      }
      if (teacherStudents.length === 0) {
        setActiveTeacherTab('courses');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-3 sm:my-6 p-5 sm:p-6 tq-card border-2 rounded-3xl shadow-md font-sans">
      {/* Header with Logo */}
      <div className="flex items-center gap-3.5 pb-4 mb-4 border-b tq-border">
        <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
          <img
            src="/assets/aistudio/Logo_Mateclic___19_Nov_2026__11.16_am_fde2aa63.png"
            alt="Logo MateClic"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider tq-accent-soft px-2.5 py-0.5 rounded-full border tq-border inline-block">
            Primer Ingreso Docente · Paso Inicial
          </span>
          <h1 className="text-lg sm:text-xl font-black tq-text mt-1 leading-tight">
            Configura los Datos de tu Escuela
          </h1>
          <p className="text-xs tq-text-muted mt-0.5">
            {currentTeacher?.email ? `Cuenta: ${currentTeacher.email} · ` : ''}
            Personaliza MateClic para tu establecimiento antes de comenzar.
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-4 p-3 tq-tint border border-[var(--tq-border-strong)] rounded-2xl flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 tq-text-accent shrink-0 mt-0.5" />
        <p className="text-[11px] sm:text-xs tq-text-2 leading-relaxed">
          Estos datos identificarán <strong>tu plataforma, códigos QR de acceso, listas de curso e informes PDF</strong>. Cada establecimiento trabaja de forma completamente independiente y privada.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold tq-text-2 mb-1">
            Nombre y Apellido del Docente:
          </label>
          <div className="relative">
            <User className="w-4 h-4 tq-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              required
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              placeholder="Ej: Carolina Muñoz Soto"
              maxLength={120}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold tq-text-2 mb-1">
            Nombre de la Escuela, Colegio o Liceo:
          </label>
          <div className="relative">
            <School className="w-4 h-4 tq-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              required
              autoFocus
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              placeholder="Ej: Escuela Básica Gabriela Mistral"
              maxLength={160}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold tq-text-2 mb-1">
              Comuna / Región o SLEP:
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 tq-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={commune}
                onChange={e => setCommune(e.target.value)}
                placeholder="Ej: Temuco · La Araucanía"
                maxLength={120}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs font-semibold border-2 tq-input rounded-xl focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold tq-text-2 mb-1">
              RBD (opcional):
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 tq-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={rbd}
                onChange={e => setRbd(e.target.value)}
                placeholder="Ej: 12345-6"
                maxLength={24}
                className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold border-2 tq-input rounded-xl focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving || !teacherName.trim() || !schoolName.trim() || !commune.trim()}
          className="w-full py-3 tq-btn-gradient disabled:opacity-45 font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
        >
          <span>
            {isSaving
              ? isCloudTeacher
                ? 'Guardando establecimiento en la nube...'
                : 'Guardando establecimiento...'
              : 'Guardar mi Establecimiento y Comenzar'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-4 pt-3 border-t tq-border flex items-center justify-between text-[11px] tq-text-muted">
        <span>Podrás editar estos datos luego en Cuenta → Mi Escuela.</span>
        <button
          type="button"
          onClick={logoutTeacher}
          className="text-rose-700 dark:text-rose-300 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0 ml-2"
        >
          <LogOut className="w-3 h-3" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
};
