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
    <div className="max-w-md mx-auto my-8 p-7 tq-card border-2 rounded-3xl shadow-sm font-sans">
      <div className="text-center mb-6">
        <div className="w-16 h-16 tq-brand-badge border rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider tq-accent-soft px-2.5 py-0.5 rounded-full border tq-border">
          Escuela Ricardo Silva Arriagada · SLEP Chinchorro
        </span>
        <h1 className="text-2xl font-black tq-text mt-2">
          Acceso Docente en la Nube
        </h1>
        <p className="text-xs tq-text-muted mt-1">
          Conecta tu cuenta Google para sincronizar tus listas, evaluaciones y calificaciones en tiempo real con todos tus estudiantes.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs rounded-2xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary Cloud Google Login */}
      <div className="p-4 tq-tint border-2 border-[var(--tq-border-strong)] rounded-2xl space-y-3 mb-5">
        <div className="flex items-center gap-2 text-xs font-bold tq-text">
          <Cloud className="w-4 h-4 tq-text-accent shrink-0" />
          <span>Sincronización en Tiempo Real (Recomendado)</span>
        </div>
        <p className="text-[11px] tq-text-2 leading-relaxed">
          Tus pruebas nuevas, eliminaciones de notas y listas de curso aparecerán al instante en los dispositivos de tus alumnos, y verás sus resultados apenas terminen.
        </p>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full py-3.5 tq-btn-gradient disabled:opacity-50 font-bold text-sm rounded-2xl shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          <Cloud className="w-4 h-4" />
          <span>
            {isGoogleLoading ? 'Conectando con Google...' : 'Ingresar con Google (Base de Datos en la Nube)'}
          </span>
        </button>
      </div>

      {/* Collapsible Local Demo Fallback */}
      <div className="border tq-border rounded-2xl p-3.5 tq-subtle">
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
            <span>Modo Local sin Nube (solo en este navegador)</span>
          </span>
          <span className="text-[11px] tq-text-accent underline">
            {showLocalDemo ? 'Ocultar' : 'Abrir'}
          </span>
        </button>

        {showLocalDemo && (
          <div className="mt-4 pt-3 border-t tq-border">
            {/* Mode Tabs */}
            <div className="flex tq-muted p-1 rounded-2xl mb-4 border">
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

            {mode === 'login' ? (
              teachers.length === 0 ? (
                <div className="p-4 tq-card border rounded-xl text-center space-y-2.5">
                  <p className="text-xs tq-text-2 font-medium">
                    Aún no hay cuentas docentes locales creadas en este navegador.
                  </p>
                  <p className="text-[11px] tq-text-muted">
                    Usa <strong>Ingresar con Google</strong> arriba (recomendado) o crea una cuenta local en la pestaña <strong>Nuevo Docente</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="px-3.5 py-2 tq-btn-primary rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Crear cuenta docente local</span>
                  </button>
                </div>
              ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold tq-text-2 mb-1">
                    Cuenta Docente Local:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 tq-text-muted absolute left-3.5 top-3" />
                    <select
                      value={selectedTeacherId}
                      onChange={e => {
                        setSelectedTeacherId(e.target.value);
                        setPassword('');
                        setErrorMsg(null);
                      }}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden transition-all"
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
                    <KeyRound className="w-4 h-4 tq-text-muted absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Ingresa tu clave"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-2.5 tq-text-muted hover:tq-text p-0.5 cursor-pointer"
                      title={showPassword ? 'Ocultar clave' : 'Ver clave'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {selectedTeacherObj && selectedTeacherObj.hasCustomPassword === false && (
                    <p className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 mt-2 font-medium">
                      Para que tus alumnos se conecten desde otros dispositivos, usa "Ingresar con Google" arriba.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selectedTeacherId || !password.trim()}
                  className="w-full py-3 tq-btn-primary disabled:opacity-40 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ingresar en Modo Local</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              )
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold tq-text-2 mb-1">
                    Nombre y Apellidos del Docente:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 tq-text-muted absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Ej: María José Rojas"
                      className="w-full pl-10 pr-3.5 py-2 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold tq-text-2 mb-1">
                    Correo Electrónico (opcional):
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 tq-text-muted absolute left-3.5 top-2.5" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="nombre@slepchinchorro.cl"
                      className="w-full pl-10 pr-3.5 py-2 text-xs font-medium border-2 tq-input rounded-xl focus:outline-hidden"
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
                      className="w-full px-3 py-2 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
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
                      className="w-full px-3 py-2 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!regName.trim() || regPassword.trim().length < 4}
                  className="w-full py-3 tq-btn-primary disabled:opacity-40 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Cuenta Local e Ingresar</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Theme Palette Configurator right from Teacher Entry */}
      <div className="mt-5">
        <ThemePaletteSelector
          variant="compact"
          title="Paleta de colores"
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
          <span>Práctica Libre MateClic (ejercitar sin iniciar sesión)</span>
        </button>
      </div>
    </div>
  );
};
