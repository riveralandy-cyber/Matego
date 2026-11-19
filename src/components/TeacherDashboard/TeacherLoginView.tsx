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
  Cloud,
} from 'lucide-react';
import { ThemePaletteSelector } from '../ThemePaletteSelector';

export const TeacherLoginView: React.FC = () => {
  const {
    teachers,
    currentTeacher,
    loginTeacher,
    loginTeacherWithGoogle,
    registerTeacher,
    setRole,
  } = useApp();

  const [showLocalDemo, setShowLocalDemo] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>(() =>
    teachers.length === 0 ? 'register' : 'login'
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    currentTeacher?.id || teachers[0]?.id || ''
  );
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Register fields
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedTeacherObj = teachers.find(t => t.id === selectedTeacherId);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const res = await loginTeacherWithGoogle();
      if (!res.ok) {
        setErrorMsg(res.error || 'No se pudo iniciar sesión con Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
    <div className="max-w-lg mx-auto my-1 sm:my-2 p-4 sm:p-5 tq-card border-2 rounded-2xl shadow-sm font-sans">
      <div className="flex items-center gap-3 mb-3.5 pb-2.5 border-b tq-border">
        <div className="w-11 h-11 tq-brand-badge border rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
          <Lock className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider tq-accent-soft px-2 py-0.5 rounded-full border tq-border inline-block">
            SLEP Chinchorro · Ricardo Silva Arriagada
          </span>
          <h1 className="text-lg sm:text-xl font-black tq-text mt-0.5 leading-tight">
            Acceso Docente en la Nube
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary Cloud Google Login */}
      <div className="p-3.5 tq-tint border-2 border-[var(--tq-border-strong)] rounded-2xl space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold tq-text">
          <Cloud className="w-4 h-4 tq-text-accent shrink-0" />
          <span>Sincronización en Tiempo Real (Recomendado)</span>
        </div>
        <p className="text-[11px] tq-text-2 leading-snug">
          Conecta tu cuenta Google para sincronizar listas de curso, evaluaciones y calificaciones al instante en todos los dispositivos.
        </p>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full py-2.5 tq-btn-gradient disabled:opacity-50 font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Cloud className="w-4 h-4" />
          <span>
            {isGoogleLoading ? 'Conectando con Google...' : 'Ingresar con Google (Nube)'}
          </span>
        </button>
      </div>

      {/* Collapsible Local Demo Fallback */}
      <div className="border tq-border rounded-xl p-2.5 tq-subtle">
        <button
          type="button"
          onClick={() => {
            setShowLocalDemo(prev => !prev);
            setErrorMsg(null);
          }}
          className="w-full flex items-center justify-between text-xs font-bold tq-text-2 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 tq-text-muted" />
            <span>Modo Local sin Nube (solo este navegador)</span>
          </span>
          <span className="text-[11px] tq-text-accent underline">
            {showLocalDemo ? 'Ocultar' : 'Abrir'}
          </span>
        </button>

        {showLocalDemo && (
          <div className="mt-3 pt-2.5 border-t tq-border">
            {/* Mode Tabs */}
            <div className="flex tq-muted p-1 rounded-xl mb-3 border">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'tq-card tq-text-accent shadow-xs'
                    : 'tq-text-muted hover:tq-text'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nuevo Docente</span>
              </button>
            </div>

            {mode === 'login' ? (
              teachers.length === 0 ? (
                <div className="p-3 tq-card border rounded-xl text-center space-y-2">
                  <p className="text-xs tq-text-2 font-medium">
                    Aún no hay cuentas docentes locales creadas en este navegador.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="px-3 py-1.5 tq-btn-primary rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Crear cuenta docente local</span>
                  </button>
                </div>
              ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-xs font-bold tq-text-2 mb-1">
                    Cuenta Docente Local:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 tq-text-muted absolute left-3 top-2.5" />
                    <select
                      value={selectedTeacherId}
                      onChange={e => {
                        setSelectedTeacherId(e.target.value);
                        setPassword('');
                        setErrorMsg(null);
                      }}
                      className="w-full pl-9 pr-3 py-2 text-xs font-bold border tq-input rounded-xl focus:outline-hidden transition-all"
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
                  <label className="block text-xs font-bold tq-text-2 mb-1">
                    Clave de Acceso Local:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 tq-text-muted absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Ingresa tu clave"
                      autoComplete="current-password"
                      className="w-full pl-9 pr-9 py-2 text-xs font-bold border tq-input rounded-xl focus:outline-hidden transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-2.5 top-2 tq-text-muted hover:tq-text p-0.5 cursor-pointer"
                      title={showPassword ? 'Ocultar clave' : 'Ver clave'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {selectedTeacherObj && selectedTeacherObj.hasCustomPassword === false && (
                    <p className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 mt-1.5 font-medium">
                      Para que tus alumnos se conecten desde otros dispositivos, usa "Ingresar con Google" arriba.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selectedTeacherId || !password.trim()}
                  className="w-full py-2.5 tq-btn-primary disabled:opacity-40 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ingresar en Modo Local</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              )
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-xs font-bold tq-text-2 mb-1">
                    Nombre y Apellidos del Docente:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 tq-text-muted absolute left-3 top-2" />
                    <input
                      type="text"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Ej: María José Rojas"
                      className="w-full pl-9 pr-3 py-1.5 text-xs font-bold border tq-input rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold tq-text-2 mb-1">
                    Correo Electrónico (opcional):
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 tq-text-muted absolute left-3 top-2" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="nombre@slepchinchorro.cl"
                      className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border tq-input rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold tq-text-2 mb-1">
                      Crear Clave (mín. 4):
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Clave secreta"
                      className="w-full px-3 py-1.5 text-xs font-bold border tq-input rounded-xl focus:outline-hidden"
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
                      className="w-full px-3 py-1.5 text-xs font-bold border tq-input rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!regName.trim() || regPassword.trim().length < 4}
                  className="w-full py-2.5 tq-btn-primary disabled:opacity-40 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Cuenta Local e Ingresar</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Theme Palette Configurator + Links */}
      <div className="mt-3 pt-2.5 border-t tq-border space-y-2.5">
        <ThemePaletteSelector
          variant="inline-bar"
          title="Paleta"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-center">
          <button
            type="button"
            onClick={() => setRole('student')}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:opacity-80 transition-opacity inline-flex items-center gap-1.5 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Portal de Estudiantes</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('practice')}
            className="text-xs font-bold tq-text-accent hover:opacity-80 transition-opacity inline-flex items-center gap-1.5 cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Práctica Libre (sin sesión)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
