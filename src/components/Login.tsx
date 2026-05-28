import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ShoppingCart, Eye, EyeOff, Zap, Shield, Wifi, KeyRound } from 'lucide-react';
import { cn } from '../utils/helpers';

export default function Login() {
  const login = useStore(s => s.login);
  const loginWithPin = useStore(s => s.loginWithPin);
  
  const [mode, setMode] = useState<'password' | 'pin'>('password');
  const [email, setEmail] = useState('admin@nexuspos.com');
  const [password, setPassword] = useState('nexus2024');
  const [pin, setPin] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Keyboard support for PIN mode
  useEffect(() => {
    if (mode !== 'pin' || loading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePinPress(e.key);
      } else if (e.key === 'Backspace') {
        handlePinDelete();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        setPin('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, pin, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    const ok = login(email, password);
    if (!ok) setError('Credenciales incorrectas. Intenta de nuevo.');
    setLoading(false);
  };

  const handlePinPress = async (num: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);
    
    if (newPin.length === 4) {
      setLoading(true);
      setError('');
      await new Promise(r => setTimeout(r, 500));
      const ok = loginWithPin(newPin);
      if (!ok) {
        setError('PIN incorrecto. Intenta de nuevo.');
        setPin('');
      }
      setLoading(false);
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const quickLogin = (em: string, isPin = false) => {
    if (isPin) {
      setMode('pin');
      const pinMap: Record<string, string> = {
        'admin@nexuspos.com': '1111',
        'cajera@nexuspos.com': '2222',
        'gerente@nexuspos.com': '3333'
      };
      setPin(pinMap[em] || '');
      // Autofill & login
      setLoading(true);
      setTimeout(() => {
        loginWithPin(pinMap[em] || '');
        setLoading(false);
      }, 300);
    } else {
      setMode('password');
      setEmail(em);
      setPassword('nexus2024');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-2xl shadow-violet-500/40 mb-4">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">NexusPOS</h1>
          <p className="text-gray-400 mt-1 text-sm">Sistema Operativo Empresarial</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              {mode === 'password' ? 'Iniciar sesión' : 'Acceso por PIN'}
            </h2>
            <button
              onClick={() => {
                setMode(mode === 'password' ? 'pin' : 'password');
                setError('');
                setPin('');
              }}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 rounded-lg"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {mode === 'password' ? 'Usar PIN' : 'Usar Contraseña'}
            </button>
          </div>

          {mode === 'password' ? (
            /* PASSWORD MODE */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-800/60 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder-gray-500"
                  placeholder="usuario@nexuspos.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-800/60 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder-gray-500 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : 'Ingresar'}
              </button>
            </form>
          ) : (
            /* PIN MODE */
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Introduce tu PIN de 4 dígitos</p>
                {/* Dots indicator */}
                <div className="flex justify-center gap-4 my-6">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={cn(
                        'w-4 h-4 rounded-full border transition-all duration-150',
                        pin.length > i
                          ? 'bg-violet-500 border-violet-400 scale-110 shadow-lg shadow-violet-500/40'
                          : 'bg-gray-900 border-gray-850'
                      )}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-xs text-center animate-shake">
                  {error}
                </div>
              )}

              {/* On-screen numeric pad */}
              <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <button
                    key={n}
                    type="button"
                    disabled={loading}
                    onClick={() => handlePinPress(String(n))}
                    className="w-14 h-14 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white font-bold text-lg flex items-center justify-center transition-all border border-gray-700/40 shadow active:scale-95 mx-auto disabled:opacity-50"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setPin('')}
                  className="w-14 h-14 rounded-full bg-gray-900/60 hover:bg-gray-850 text-red-400 font-bold text-xs flex items-center justify-center transition-all border border-red-500/10 active:scale-95 mx-auto disabled:opacity-50"
                >
                  BORRAR
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handlePinPress('0')}
                  className="w-14 h-14 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white font-bold text-lg flex items-center justify-center transition-all border border-gray-700/40 shadow active:scale-95 mx-auto disabled:opacity-50"
                >
                  0
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePinDelete}
                  className="w-14 h-14 rounded-full bg-gray-900/60 hover:bg-gray-850 text-violet-400 font-bold text-base flex items-center justify-center transition-all border border-violet-500/10 active:scale-95 mx-auto disabled:opacity-50"
                >
                  ⌫
                </button>
              </div>
            </div>
          )}

          {/* Quick access */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-3 text-center">Acceso rápido (demo)</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', email: 'admin@nexuspos.com' },
                { label: 'Cajera', email: 'cajera@nexuspos.com' },
                { label: 'Gerente', email: 'gerente@nexuspos.com' },
              ].map(u => (
                <button
                  key={u.email}
                  disabled={loading}
                  onClick={() => quickLogin(u.email, mode === 'pin')}
                  className={cn(
                    'text-xs py-2 px-1 rounded-lg border transition-all truncate text-center font-medium',
                    email === u.email && mode === 'password'
                      ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-600 text-center mt-2.5">
              {mode === 'password' ? 'Contraseña: nexus2024' : 'PINs: Admin=1111 · Cajera=2222 · Gerente=3333'}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: Zap, label: 'Ultra rápido', desc: 'Venta en <10s' },
            { icon: Wifi, label: 'Offline-first', desc: 'Sin internet OK' },
            { icon: Shield, label: 'Seguro', desc: 'Auditoría total' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center p-3 bg-gray-900/40 rounded-xl border border-gray-800/50">
              <Icon className="w-5 h-5 text-violet-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-gray-300">{label}</p>
              <p className="text-xs text-gray-550">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
