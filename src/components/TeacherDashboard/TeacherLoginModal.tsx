import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Check,
  User,
  ArrowRight,
  X,
  Mail,
  GraduationCap,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  Palette,
  Cloud,
  Trash2,
} from 'lucide-react';
import { ThemePaletteSelector } from '../ThemePaletteSelector';

export const TeacherLoginModal: React.FC = () => {
  const {
    teachers,
    currentTeacher,
    isTeacherAuthenticated,
    isCloudTeacher,
    cloudSyncMessage,
    loginTeacherWithGoogle,
    isTeacherLoginModalOpen,
    setIsTeacherLoginModalOpen,
    loginTeacher,
    registerTeacher,
    logoutTeacher,
    updateTeacherPassword,
    clearTeacherWorkspaceAll,
  } = useApp();

  const [tab, setTab] = useState<'password' | 'theme' | 'switch' | 'register'>('password');

  // Change password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Switch teacher state
  const [targetTeacherId, setTargetTeacherId] = useState(currentTeacher?.id || teachers[0]?.id || '');
  const [switchPassword, setSwitchPassword] = useState('');
  const [showSwitchPass, setShowSwitchPass] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  useEffect(() => {
    if (isTeacherLoginModalOpen) {
      setErrorMsg(null);
      setSuccessNotice(null);
      setConfirmClearAll(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setSwitchPassword('');
      setTargetTeacherId(
        teachers.find(t => t.id !== currentTeacher?.id)?.id || teachers[0]?.id || ''
      );
      setTab(isCloudTeacher ? 'theme' : 'password');
    }
  }, [isTeacherLoginModalOpen, currentTeacher, teachers, isCloudTeacher]);

  if (!isTeacherLoginModalOpen || !isTeacherAuthenticated) return null;

  const targetTeacherObj = teachers.find(t => t.id === targetTeacherId);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    if (newPass !== confirmPass) {
      setErrorMsg('La nueva clave y su confirmación no coinciden.');
      return;
    }

    const res = updateTeacherPassword(currentPass, newPass);
    if (!res.ok) {
      setErrorMsg(res.error || 'No se pudo actualizar la clave.');
      return;
    }

    setSuccessNotice('Tu clave personal ha sido actualizada correctamente.');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => {
      setSuccessNotice(null);
      setIsTeacherLoginModalOpen(false);
    }, 1200);
  };

  const handleSwitchTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    const res = loginTeacher(targetTeacherId, switchPassword);
    if (!res.ok) {
      setErrorMsg(res.error || 'Clave incorrecta.');
      return;
    }

    setSuccessNotice(`Sesión cambiada correctamente.`);
    setTimeout(() => {
      setSuccessNotice(null);
      setIsTeacherLoginModalOpen(false);
    }, 800);
  };

  const handleRegisterNew = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Las claves ingresadas no coinciden.');
      return;
    }

    const res = registerTeacher(regName, regPassword, regEmail);
    if (!res.ok) {
      setErrorMsg(res.error || 'No se pudo registrar la cuenta.');
      return;
    }

    setSuccessNotice(`Cuenta creada e iniciada para Prof. ${regName.trim()}.`);
    setTimeout(() => {
      setSuccessNotice(null);
      setIsTeacherLoginModalOpen(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="tq-card rounded-3xl shadow-2xl border-2 max-w-lg w-full p-6 sm:p-7 relative font-sans animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={() => setIsTeacherLoginModalOpen(false)}
          className="absolute right-4 top-4 w-9 h-9 rounded-full tq-muted hover:opacity-80 tq-text-muted flex items-center justify-center font-bold transition-colors cursor-pointer"
          title="Cerrar ventana"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Active teacher header + Logout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b tq-border pr-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 tq-brand-badge border rounded-2xl flex items-center justify-center shadow-2xs shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider tq-text-accent block">
                Sesión Activa Docente
              </span>
              <h2 className="text-lg font-black tq-text leading-tight">
                Prof. {currentTeacher?.name}
              </h2>
              <span className="text-[11px] tq-text-muted block">
                {currentTeacher?.email || 'Escuela Ricardo Silva Arriagada'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={logoutTeacher}
            className="px-3 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-center cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>

        {/* Cloud Sync Banner inside Modal */}
        <div
          className={`mt-4 p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
            isCloudTeacher
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : 'tq-tint border-[var(--tq-border-strong)] tq-text'
          }`}
        >
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-bold block">
                {isCloudTeacher
                  ? 'Base de Datos en la Nube Activa'
                  : 'Modo Local (cambios no se sincronizan a otros equipos)'}
              </span>
              <span className="text-[11px] opacity-80 block">
                {isCloudTeacher
                  ? cloudSyncMessage || 'Cambios sincronizados automáticamente.'
                  : 'Conecta tu cuenta Google para sincronizar con todos tus alumnos.'}
              </span>
            </div>
          </div>
          {!isCloudTeacher && (
            <button
              type="button"
              onClick={() => void loginTeacherWithGoogle()}
              className="px-3 py-1.5 tq-btn-gradient rounded-xl text-xs font-bold shrink-0 cursor-pointer"
            >
              Conectar Google
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 tq-muted p-1 rounded-2xl my-4 border gap-1">
          <button
            type="button"
            onClick={() => { setTab('password'); setErrorMsg(null); setSuccessNotice(null); }}
            className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              tab === 'password' ? 'tq-card tq-text-accent shadow-xs' : 'tq-text-muted hover:tq-text'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Mi Clave</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('theme'); setErrorMsg(null); setSuccessNotice(null); }}
            className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              tab === 'theme' ? 'tq-card tq-text-accent shadow-xs' : 'tq-text-muted hover:tq-text'
            }`}
          >
            <Palette className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Apariencia</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('switch'); setErrorMsg(null); setSuccessNotice(null); }}
            className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              tab === 'switch' ? 'tq-card tq-text-accent shadow-xs' : 'tq-text-muted hover:tq-text'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Cambiar</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(null); setSuccessNotice(null); }}
            className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              tab === 'register' ? 'tq-card tq-text-accent shadow-xs' : 'tq-text-muted hover:tq-text'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Nuevo</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs rounded-2xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-2xl font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePasswordChange} className="space-y-3">
            {currentTeacher?.hasCustomPassword === false && (
              <p className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 font-medium">
                Actualmente estás usando la clave inicial (<strong>1234</strong>). Te recomendamos cambiarla ahora por una clave personal para proteger tus listas y notas.
              </p>
            )}
            <div>
              <label className="block text-xs font-bold tq-text-2 mb-1">
                Clave Actual:
              </label>
              <input
                type="password"
                value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                placeholder="Ingresa tu clave actual"
                className="w-full px-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold tq-text-2 mb-1">
                  Nueva Clave Personal (mín. 4):
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Nueva clave"
                  className="w-full px-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold tq-text-2 mb-1">
                  Confirmar Nueva Clave:
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repetir nueva clave"
                  className="w-full px-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!currentPass || newPass.trim().length < 4}
              className="w-full py-3 tq-btn-primary disabled:opacity-40 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Guardar Nueva Clave Docente</span>
            </button>
          </form>
        )}

        {tab === 'theme' && (
          <div className="space-y-4">
            <ThemePaletteSelector
              variant="cards"
              title="Paleta de Colores de tu Plataforma"
              subtitle="Elige entre la paleta estándar o 4 paletas adicionales (pasteles, claro, nocturno vivo o vibrante). Se guarda para tu perfil docente."
            />
          </div>
        )}

        {tab === 'switch' && (
          teachers.length === 0 ? (
            <div className="p-4 tq-subtle border rounded-2xl text-center space-y-2">
              <p className="text-xs font-bold tq-text">No hay otras cuentas locales guardadas</p>
              <p className="text-[11px] tq-text-muted">
                Para cambiar de docente en la nube, presiona «Cerrar sesión» arriba e inicia sesión con otra cuenta de Google, o crea un docente local en la pestaña «Nuevo».
              </p>
            </div>
          ) : (
            <form onSubmit={handleSwitchTeacher} className="space-y-3.5">
              <p className="text-[11px] tq-text-muted">
                Para acceder al espacio privado de otro docente debes ingresar su clave correspondiente.
              </p>
              <div>
                <label className="block text-xs font-bold tq-text-2 mb-1">
                  Seleccionar Cuenta Docente:
                </label>
                <select
                  value={targetTeacherId}
                  onChange={e => {
                    setTargetTeacherId(e.target.value);
                    setSwitchPassword('');
                    setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      Prof. {t.name} {t.id === currentTeacher?.id ? '(Actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold tq-text-2 mb-1">
                  Clave de Prof. {targetTeacherObj?.name || 'Docente'}:
                </label>
                <div className="relative">
                  <input
                    type={showSwitchPass ? 'text' : 'password'}
                    value={switchPassword}
                    onChange={e => setSwitchPassword(e.target.value)}
                    placeholder="Ingresa la clave de esta cuenta"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSwitchPass(prev => !prev)}
                    className="absolute right-3 top-2.5 tq-text-muted hover:tq-text cursor-pointer"
                  >
                    {showSwitchPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!targetTeacherId || !switchPassword.trim()}
                className="w-full py-3 tq-btn-primary disabled:opacity-40 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Validar Clave e Ingresar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegisterNew} className="space-y-3">
            <div>
              <label className="block text-xs font-bold tq-text-2 mb-1">
                Nombre y Apellidos del Docente:
              </label>
              <div className="relative">
                <User className="w-4 h-4 tq-text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Ej: Rodrigo Fuentes"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tq-text-2 mb-1">
                Correo Electrónico (opcional):
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 tq-text-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="docente@slepchinchorro.cl"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium border-2 tq-input rounded-xl focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold tq-text-2 mb-1">
                  Clave Personal (mín. 4):
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Clave secreta"
                  className="w-full px-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
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
                  className="w-full px-3.5 py-2.5 text-xs font-bold border-2 tq-input rounded-xl focus:outline-hidden"
                />
              </div>
            </div>

              <button
              type="submit"
              disabled={!regName.trim() || regPassword.trim().length < 4}
              className="w-full py-3 tq-btn-primary disabled:opacity-40 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Cuenta Docente e Ingresar</span>
            </button>
          </form>
        )}

        {/* Clear All Workspace Data (to leave platform completely clean before presentation) */}
        <div className="mt-5 pt-4 border-t tq-border">
          {confirmClearAll ? (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-2">
              <p className="text-[11px] font-bold text-rose-900 dark:text-rose-100">
                ¿Confirmas vaciar todas tus listas de estudiantes, evaluaciones y notas {isCloudTeacher ? 'de tu nube' : 'locales'} para dejar la plataforma en blanco?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  disabled={isClearingAll}
                  className="px-3 py-1.5 tq-card border tq-border tq-text-2 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isClearingAll}
                  onClick={async () => {
                    setIsClearingAll(true);
                    setErrorMsg(null);
                    try {
                      await clearTeacherWorkspaceAll();
                      setConfirmClearAll(false);
                      setSuccessNotice('Espacio de trabajo vaciado correctamente.');
                      setTimeout(() => {
                        setSuccessNotice(null);
                        setIsTeacherLoginModalOpen(false);
                      }, 1200);
                    } catch (err) {
                      setErrorMsg(err instanceof Error ? err.message : 'No se pudo vaciar el espacio.');
                    } finally {
                      setIsClearingAll(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {isClearingAll ? 'Vaciando...' : 'Sí, dejar en blanco'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] tq-text-muted">
                ¿Quieres limpiar pruebas anteriores y dejar todo en cero?
              </span>
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-3 py-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar espacio de trabajo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
