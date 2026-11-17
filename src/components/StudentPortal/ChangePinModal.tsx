import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KeyRound, Check, X, ShieldCheck, Lock, Sparkles, AlertCircle } from 'lucide-react';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstLoginPrompt?: boolean;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  isFirstLoginPrompt = false,
}) => {
  const { currentStudent, updateStudentPin } = useApp();

  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen || !currentStudent) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate current PIN if not first login prompt or if field is shown
    if (currentPinInput.trim() && currentPinInput.trim() !== currentStudent.pin) {
      setError('El PIN actual no coincide.');
      return;
    }

    const cleanNewPin = newPin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanNewPin) {
      setError('Por favor ingresa un nuevo PIN.');
      return;
    }

    if (!/^\d{4,6}$/.test(cleanNewPin)) {
      setError('El PIN debe contener entre 4 y 6 números (solo dígitos).');
      return;
    }

    if (cleanNewPin !== cleanConfirm) {
      setError('La confirmación del PIN no coincide.');
      return;
    }

    if (cleanNewPin === currentStudent.pin) {
      setError('El nuevo PIN debe ser diferente al actual.');
      return;
    }

    const ok = updateStudentPin(currentStudent.id, cleanNewPin);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPinInput('');
        setNewPin('');
        setConfirmPin('');
        onClose();
      }, 1800);
    } else {
      setError('Hubo un error al actualizar el PIN. Inténtalo nuevamente.');
    }
  };

  const handleQuickReset = () => {
    setError(null);
    setCurrentPinInput('');
    setNewPin('');
    setConfirmPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="tq-card rounded-3xl border-2 shadow-2xl max-w-md w-full p-6 sm:p-7 relative font-sans">
        {/* Close Button */}
        {!success && (
          <button
            type="button"
            onClick={handleQuickReset}
            className="absolute top-4 right-4 w-8 h-8 rounded-full tq-muted hover:opacity-80 tq-text-muted flex items-center justify-center font-bold transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 tq-brand-badge border tq-border rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <KeyRound className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider tq-accent-soft px-2.5 py-0.5 rounded-full border tq-border inline-block">
            {isFirstLoginPrompt ? 'Primer Inicio de Sesión' : 'Seguridad de Acceso'}
          </span>
          <h2 className="text-xl font-black tq-text mt-1">
            Personalizar mi PIN de Acceso
          </h2>
          <p className="text-xs tq-text-muted mt-1">
            Hola <span className="font-bold tq-text">{currentStudent.name}</span>. Puedes cambiar tu PIN inicial por uno personal que solo tú recuerdes.
          </p>
        </div>

        {/* Success screen */}
        {success ? (
          <div className="p-6 text-center space-y-3 bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/70 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">¡PIN actualizado con éxito!</h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Tu nuevo PIN personal es <span className="font-mono font-black text-sm tq-card tq-text px-2 py-0.5 rounded border tq-border">{newPin}</span>.
              <br />
              Úsalo a partir de ahora cada vez que ingreses a tus evaluaciones ThatQuiz.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Info notice about current PIN */}
            <div className="p-3 tq-subtle border rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 tq-text-muted" />
                <span className="tq-text-2 font-medium">PIN actual en sistema:</span>
              </div>
              <span className="font-mono font-bold tq-text-accent tq-card px-2 py-0.5 rounded-md border tq-border">
                {currentStudent.pin}
              </span>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-200 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Inputs */}
            <div>
              <label className="block text-xs font-bold tq-text-2 mb-1">
                Nuevo PIN Personal (4 dígitos numéricos):
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej: 2026"
                className="w-full text-center text-lg font-mono font-black tracking-widest border-2 tq-input rounded-2xl py-2.5 focus:outline-hidden transition-all"
                autoFocus
              />
              <span className="text-[11px] tq-text-muted mt-1 block">
                Te sugerimos 4 números fáciles de recordar (por ejemplo: el año actual, día y mes de tu cumpleaños).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold tq-text-2 mb-1">
                Confirmar Nuevo PIN:
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Repite tu nuevo PIN"
                className="w-full text-center text-lg font-mono font-black tracking-widest border-2 tq-input rounded-2xl py-2.5 focus:outline-hidden transition-all"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {isFirstLoginPrompt && (
                <button
                  type="button"
                  onClick={handleQuickReset}
                  className="w-full sm:w-1/2 py-2.5 px-3 tq-muted hover:opacity-85 tq-text-2 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Mantener PIN actual
                </button>
              )}

              <button
                type="submit"
                disabled={!newPin || newPin.length < 4}
                className={`py-3 px-4 tq-btn-gradient hover:opacity-95 disabled:opacity-40 font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isFirstLoginPrompt ? 'w-full sm:w-1/2' : 'w-full'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Guardar Nuevo PIN</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
