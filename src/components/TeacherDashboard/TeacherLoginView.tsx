import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  User,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  UserPlus,
  AlertCircle,
  KeyRound,
  PlayCircle,
} from 'lucide-react';
import { ThemePaletteSelector } from '../ThemePaletteSelector';

export const TeacherLoginView: React.FC = () => {
  const {
    teachers,
    currentTeacher,
    loginTeacher,
    registerTeacher,
    setRole,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    currentTeacher?.id || teachers[0]?.id || ''
  );
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Register fields
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedTeacherObj = teachers.find(t => t.id === selectedTeacherId);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = loginTeacher(selectedTeacherId, password);
    if (!res.ok) {
      setErrorMsg(res.error || 'No se pudo iniciar sesión.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Las claves ingresadas no coinciden.');
      return;
    }
    const res = registerTeacher(regName, regPassword, regEmail);
    if (!res.ok) {
      setErrorMsg(res.error || 'No se pudo registrar la cuenta docente.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-7 tq-card border-2 rounded-3xl shadow-sm font-sans">
      <div className="text-center mb-6">
        <div className="w-16 h-16 tq-brand-badge border rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider tq-accent-soft px-2.5 py-0.5 rounded-full border tq-border">
          Escuela Ricardo Silva Arriagada · SLEP Chinchorro
        </span>
        <h1 className="text-2xl font-black tq-text mt-2">
          Acceso Docente Protegido
        </h1>
        <p className="text-xs tq-text-muted mt-1">
          Ingresa con tu cuenta y clave personal para administrar tus cursos, notas y evaluaciones.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex tq-muted p-1 rounded-2xl mb-5 border">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'login'
              ? 'tq-card tq-text-accent shadow-xs'
              : 'tq-text-muted hover:tq-text'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Iniciar Sesión</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'register'
              ? 'tq-card tq-text-accent shadow-xs'
              : 'tq-text-muted hover:tq-text'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Nuevo Docente</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {mode === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold tq-text-2 mb-1.5">
              Cuenta Docente:
            </label>
            <div className="relative">
              <User className="w-4 h-4 tq-text-muted absolute left-3.5 top-3.5" />
              <select
                value={selectedTeacherId}
                onChange={e => {
                  setSelectedTeacherId(e.target.value);
                  setPassword('');
                  setErrorMsg(null);
                }}
                className="w-full pl-10 pr-3.5 py-3 text-sm font-bold border-2 tq-input rounded-2xl focus:outline-hidden transition-all"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    Prof. {t.name} {t.email ? `(${t.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold tq-text-2 mb-1.5">
              Clave de Acceso Docente:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 tq-text-muted absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ingresa tu clave personal"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 text-sm font-bold border-2 tq-input rounded-2xl focus:outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-3 tq-text-muted hover:tq-text p-0.5 cursor-pointer"
                title={showPassword ? 'Ocultar clave' : 'Ver clave'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {selectedTeacherObj && selectedTeacherObj.hasCustomPassword === false && (
              <p className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 mt-2 font-medium">
                Primer ingreso: utiliza la clave inicial asignada (<strong>1234</strong>) y cámbiala por tu clave privada al entrar en tu perfil docente.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!selectedTeacherId || !password.trim()}
            className="w-full py-3.5 tq-btn-gradient disabled:opacity-40 font-bold text-sm rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ingresar al Panel Docente</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold tq-text-2 mb-1">
              Nombre y Apellidos del Docente:
            </label>
            <div className="relative">
              <User className="w-4 h-4 tq-text-muted absolute left-3.5 top-3" />
              <input
                type="text"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="Ej: María José Rojas"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm font-bold border-2 tq-input rounded-2xl focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold tq-text-2 mb-1">
              Correo Electrónico (opcional):
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 tq-text-muted absolute left-3.5 top-3" />
              <input
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="nombre@slepchinchorro.cl"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium border-2 tq-input rounded-2xl focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold tq-text-2 mb-1">
                Crear Clave (mín. 4):
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                placeholder="Clave secreta"
                className="w-full px-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-2xl focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold tq-text-2 mb-1">
                Confirmar Clave:
              </label>
              <input
                type="password"
                value={regConfirmPassword}
                onChange={e => setRegConfirmPassword(e.target.value)}
                placeholder="Repetir clave"
                className="w-full px-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-2xl focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!regName.trim() || regPassword.trim().length < 4}
            className="w-full py-3.5 tq-btn-primary disabled:opacity-40 font-bold text-sm rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Cuenta e Ingresar</span>
          </button>
        </form>
      )}

      {/* Theme Palette Configurator right from Teacher Entry */}
      <div className="mt-5">
        <ThemePaletteSelector
          variant="compact"
          title="Personaliza la paleta de colores"
          subtitle="Puedes mantener el tema estándar o elegir otro desde tu ingreso."
        />
      </div>

      {/* Links to Student Portal & Free Practice */}
      <div className="mt-5 pt-4 border-t tq-border flex flex-col items-center gap-2.5 text-center">
        <button
          type="button"
          onClick={() => setRole('student')}
          className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:opacity-80 transition-opacity inline-flex items-center gap-1.5 cursor-pointer"
        >
          <GraduationCap className="w-4 h-4" />
          <span>¿Eres estudiante? Ingresa al Portal de Alumnos aquí</span>
        </button>

        <button
          type="button"
          onClick={() => setRole('practice')}
          className="text-xs font-bold tq-text-accent hover:opacity-80 transition-opacity inline-flex items-center gap-1.5 cursor-pointer"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Práctica Libre ThatQuiz (ejercitar sin iniciar sesión)</span>
        </button>
      </div>
    </div>
  );
};
