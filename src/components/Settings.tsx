import { useState } from 'react';
import { Settings as SettingsIcon, Store, Users, Shield, Bell, Palette, Database, Globe, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/helpers';

const SECTIONS = [
  { id: 'general', label: 'General', icon: Store, desc: 'Información de la empresa y sucursal' },
  { id: 'users', label: 'Usuarios y roles', icon: Users, desc: 'Gestión de accesos y permisos' },
  { id: 'security', label: 'Seguridad', icon: Shield, desc: 'Autenticación y auditoría' },
  { id: 'notifications', label: 'Notificaciones', icon: Bell, desc: 'Alertas y canales de comunicación' },
  { id: 'appearance', label: 'Apariencia', icon: Palette, desc: 'Tema, idioma y personalización' },
  { id: 'integrations', label: 'Integraciones', icon: Globe, desc: 'WhatsApp, facturación electrónica, ecommerce' },
  { id: 'data', label: 'Datos y respaldos', icon: Database, desc: 'Exportar, importar y backup automático' },
];

const PLANS = [
  { id: 'basic', label: 'Básico', price: '$49.000/mes', features: ['1 caja', '1 sucursal', 'Reportes esenciales', 'Soporte por email'], current: false },
  { id: 'pro', label: 'Profesional', price: '$129.000/mes', features: ['Multi-caja', 'Reportes avanzados', 'App gerencial', 'Dashboard analítico', 'WhatsApp integrado', 'Soporte prioritario'], current: true },
  { id: 'enterprise', label: 'Enterprise', price: 'Personalizado', features: ['Multi-sucursal', 'Multi-empresa', 'IA predictiva', 'Facturación DIAN', 'API pública', 'SLA garantizado'], current: false },
];

export default function Settings() {
  const { darkMode, toggleDarkMode } = useStore();
  const [activeSection, setActiveSection] = useState('general');

  const handleExportBackup = () => {
    const state = useStore.getState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexuspos_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      try {
        const targetState = JSON.parse(e.target?.result as string);
        if (targetState && Array.isArray(targetState.products) && Array.isArray(targetState.sales)) {
          useStore.setState(targetState, true);
          alert('¡Base de datos restaurada con éxito!');
        } else {
          alert('El archivo no tiene el formato válido de NexusPOS.');
        }
      } catch (err) {
        alert('Error al leer el archivo de copia de seguridad.');
      }
    };
  };

  const handleResetDatabase = () => {
    if (window.confirm('¿Está seguro de que desea restablecer la base de datos? Se perderán todas las ventas y cambios de inventario registrados.')) {
      localStorage.removeItem('nexuspos-store');
      window.location.reload();
    }
  };

  const card = darkMode ? 'bg-gray-900/80 border-gray-800/60' : 'bg-white border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = darkMode
    ? 'bg-gray-800/60 border-gray-700 text-white placeholder-gray-500 focus:border-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500';

  return (
    <div className="flex-1 overflow-hidden flex gap-4 p-4">
      {/* Left nav */}
      <div className={cn('w-64 rounded-2xl border flex-shrink-0 overflow-y-auto', card)}>
        <div className={cn('p-4 border-b', darkMode ? 'border-gray-800/60' : 'border-gray-200')}>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-violet-400" />
            <h3 className={cn('font-semibold text-sm', textPrimary)}>Configuración</h3>
          </div>
        </div>
        <nav className="p-2 space-y-0.5">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all text-left group',
                activeSection === s.id
                  ? 'bg-violet-600/20 text-violet-300'
                  : darkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <s.icon className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-gray-500 truncate">{s.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {activeSection === 'general' && (
          <>
            <div className={cn('rounded-2xl border p-6', card)}>
              <h3 className={cn('font-bold text-lg mb-5', textPrimary)}>Información de la empresa</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Nombre del negocio</label>
                  <input defaultValue="Tienda La Esperanza" className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)} />
                </div>
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>NIT / RUC</label>
                  <input defaultValue="900.123.456-7" className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)} />
                </div>
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Teléfono</label>
                  <input defaultValue="+57 300 123 4567" className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)} />
                </div>
                <div className="col-span-2">
                  <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Dirección</label>
                  <input defaultValue="Cra 15 #45-22, Medellín, Antioquia" className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)} />
                </div>
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>País</label>
                  <select className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)}>
                    <option>Colombia</option>
                    <option>México</option>
                    <option>Perú</option>
                  </select>
                </div>
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Moneda</label>
                  <select className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)}>
                    <option>COP — Peso colombiano</option>
                    <option>MXN — Peso mexicano</option>
                    <option>PEN — Sol peruano</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Guardar cambios
                </button>
              </div>
            </div>

            <div className={cn('rounded-2xl border p-6', card)}>
              <h3 className={cn('font-bold mb-4', textPrimary)}>Configuración de impuestos</h3>
              <div className="space-y-3">
                {[
                  { label: 'IVA General', rate: '19%', active: true },
                  { label: 'IVA Reducido', rate: '5%', active: true },
                  { label: 'Exento de IVA', rate: '0%', active: true },
                ].map(tax => (
                  <div key={tax.label} className={cn('flex items-center justify-between p-3 rounded-xl', darkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
                    <div>
                      <p className={cn('text-sm font-medium', textPrimary)}>{tax.label}</p>
                      <p className="text-xs text-gray-500">Tasa: {tax.rate}</p>
                    </div>
                    <div className={cn('w-10 h-5 rounded-full transition-colors cursor-pointer relative', tax.active ? 'bg-violet-600' : darkMode ? 'bg-gray-700' : 'bg-gray-300')}>
                      <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', tax.active ? 'translate-x-5' : 'translate-x-0.5')} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeSection === 'appearance' && (
          <div className={cn('rounded-2xl border p-6', card)}>
            <h3 className={cn('font-bold text-lg mb-5', textPrimary)}>Apariencia</h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn('font-medium', textPrimary)}>Modo oscuro</p>
                  <p className={cn('text-sm', textSecondary)}>Interfaz oscura para condiciones de poca luz</p>
                </div>
                <button onClick={toggleDarkMode} className={cn('w-12 h-6 rounded-full transition-colors relative', darkMode ? 'bg-violet-600' : 'bg-gray-300')}>
                  <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', darkMode ? 'translate-x-7' : 'translate-x-1')} />
                </button>
              </div>
              {[
                { label: 'Sonidos de caja', desc: 'Feedback sonoro en ventas y alertas', active: true },
                { label: 'Animaciones reducidas', desc: 'Menor uso de animaciones para mejor rendimiento', active: false },
                { label: 'Modo táctil optimizado', desc: 'Botones más grandes para pantallas táctiles', active: true },
              ].map(opt => (
                <div key={opt.label} className="flex items-center justify-between">
                  <div>
                    <p className={cn('font-medium', textPrimary)}>{opt.label}</p>
                    <p className={cn('text-sm', textSecondary)}>{opt.desc}</p>
                  </div>
                  <div className={cn('w-12 h-6 rounded-full transition-colors relative cursor-pointer', opt.active ? 'bg-violet-600' : darkMode ? 'bg-gray-700' : 'bg-gray-300')}>
                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', opt.active ? 'translate-x-7' : 'translate-x-1')} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'integrations' && (
          <div className={cn('rounded-2xl border p-6', card)}>
            <h3 className={cn('font-bold text-lg mb-5', textPrimary)}>Integraciones disponibles</h3>
            <div className="space-y-3">
              {[
                { name: 'WhatsApp Business', desc: 'Envío de tickets y alertas por WhatsApp', status: 'disponible', emoji: '💬' },
                { name: 'Facturación DIAN', desc: 'Facturación electrónica Colombia (próximamente)', status: 'pronto', emoji: '🧾' },
                { name: 'WooCommerce', desc: 'Sincronización con tienda en línea', status: 'pronto', emoji: '🛍️' },
                { name: 'Shopify', desc: 'Gestión unificada online/offline', status: 'pronto', emoji: '🏪' },
                { name: 'Google Analytics', desc: 'Análisis de tráfico y comportamiento', status: 'disponible', emoji: '📊' },
                { name: 'Siigo', desc: 'Integración contable automática', status: 'pronto', emoji: '📚' },
              ].map(int => (
                <div key={int.name} className={cn('flex items-center gap-4 p-4 rounded-xl', darkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
                  <span className="text-2xl">{int.emoji}</span>
                  <div className="flex-1">
                    <p className={cn('font-medium text-sm', textPrimary)}>{int.name}</p>
                    <p className={cn('text-xs', textSecondary)}>{int.desc}</p>
                  </div>
                  <button className={cn('text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                    int.status === 'disponible'
                      ? 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 border border-violet-500/30'
                      : 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                  )}>
                    {int.status === 'disponible' ? 'Conectar' : 'Próximamente'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'users' && (
          <div className={cn('rounded-2xl border p-6', card)}>
            <h3 className={cn('font-bold text-lg mb-5', textPrimary)}>Usuarios y Permisos</h3>
            <div className="space-y-4">
              {[
                { name: 'Carlos Mendoza', email: 'admin@nexuspos.com', role: 'Administrador', initial: 'CM' },
                { name: 'Laura García', email: 'cajera@nexuspos.com', role: 'Cajero', initial: 'LG' },
                { name: 'Diego Herrera', email: 'gerente@nexuspos.com', role: 'Gerente', initial: 'DH' },
              ].map(user => (
                <div key={user.email} className={cn('flex items-center justify-between p-3.5 rounded-xl border', darkMode ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-gray-50/50')}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-400">
                      {user.initial}
                    </div>
                    <div>
                      <p className={cn('font-semibold text-sm', textPrimary)}>{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/20">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className={cn('rounded-2xl border p-6', card)}>
            <h3 className={cn('font-bold text-lg mb-5', textPrimary)}>Seguridad y Accesos</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-800/60">
                <div>
                  <p className={cn('font-semibold text-sm', textPrimary)}>Autenticación con PIN</p>
                  <p className="text-xs text-gray-500">Permite a los cajeros iniciar sesión de forma rápida con PIN de 4 dígitos</p>
                </div>
                <div className="w-10 h-5 bg-violet-600 rounded-full relative cursor-pointer">
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-800/60">
                <div>
                  <p className={cn('font-semibold text-sm', textPrimary)}>Bloqueo de Cuenta por Intentos</p>
                  <p className="text-xs text-gray-500">Bloquea temporalmente el acceso tras 5 intentos fallidos durante 15 minutos</p>
                </div>
                <div className="w-10 h-5 bg-violet-600 rounded-full relative cursor-pointer">
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-800/60">
                <div>
                  <p className={cn('font-semibold text-sm', textPrimary)}>Registro de Auditoría (Audit Log)</p>
                  <p className="text-xs text-gray-500">Registra todos los eventos sensibles (anulación de ventas, cambio de stock)</p>
                </div>
                <div className="w-10 h-5 bg-violet-600 rounded-full relative cursor-pointer">
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className={cn('rounded-2xl border p-6', card)}>
            <h3 className={cn('font-bold text-lg mb-5', textPrimary)}>Canales de Comunicación</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-700/60">
                <div>
                  <p className={cn('font-semibold text-sm', textPrimary)}>Alertas de Stock Bajo en Pantalla</p>
                  <p className="text-xs text-gray-500">Muestra globos de alerta visual cuando un artículo está bajo el mínimo</p>
                </div>
                <div className="w-10 h-5 bg-violet-600 rounded-full relative cursor-pointer">
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-700/60">
                <div>
                  <p className={cn('font-semibold text-sm', textPrimary)}>Notificación de Cierre de Caja por Email</p>
                  <p className="text-xs text-gray-500">Envía un reporte ejecutivo al administrador al cerrar el turno</p>
                </div>
                <div className="w-10 h-5 bg-gray-700 rounded-full relative cursor-pointer">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'data' && (
          <div className={cn('rounded-2xl border p-6', card)}>
            <h3 className={cn('font-bold text-lg mb-5', textPrimary)}>Gestión de Datos y Respaldos</h3>
            <p className={cn('text-sm mb-6', textSecondary)}>
              Administra el almacenamiento local de tu punto de venta. Puedes realizar copias de seguridad manuales de todo tu inventario, ventas y configuraciones, o restaurar un respaldo previo.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Export Card */}
              <div className={cn('p-5 rounded-xl border flex flex-col justify-between', darkMode ? 'bg-gray-800/30 border-gray-700/60' : 'bg-gray-50 border-gray-200')}>
                <div>
                  <h4 className={cn('font-bold text-sm mb-1', textPrimary)}>Exportar Copia de Seguridad</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Descarga un archivo conteniendo todo tu inventario actual, histórico de ventas, arqueos de caja y configuraciones en formato seguro JSON.
                  </p>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Database className="w-3.5 h-3.5" />
                  Descargar Respaldo (.json)
                </button>
              </div>

              {/* Import Card */}
              <div className={cn('p-5 rounded-xl border flex flex-col justify-between', darkMode ? 'bg-gray-800/30 border-gray-700/60' : 'bg-gray-50 border-gray-200')}>
                <div>
                  <h4 className={cn('font-bold text-sm mb-1', textPrimary)}>Restaurar Copia de Seguridad</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Carga un archivo de respaldo previo en formato `.json` para restaurar instantáneamente el estado completo de tu punto de venta.
                  </p>
                </div>
                <label className="w-full bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer text-center">
                  <Database className="w-3.5 h-3.5" />
                  Seleccionar y Cargar Archivo
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className={cn('p-5 rounded-xl border-2 border-red-500/20', darkMode ? 'bg-red-500/5' : 'bg-red-50/20')}>
              <h4 className="font-bold text-sm text-red-400 mb-1">Zona de Peligro</h4>
              <p className="text-xs text-gray-500 mb-4">
                Estas acciones borrarán de forma definitiva tu base de datos local y restaurarán los valores por defecto de demostración del sistema.
              </p>
              <button
                onClick={handleResetDatabase}
                className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              >
                Restablecer base de datos a valores de fábrica
              </button>
            </div>
          </div>
        )}

        {/* Plan info */}
        <div className={cn('rounded-2xl border p-6', card)}>
          <h3 className={cn('font-bold mb-4', textPrimary)}>Plan actual y facturación</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <div key={plan.id} className={cn('rounded-xl p-4 border-2 transition-all', plan.current ? 'border-violet-500 bg-violet-600/5' : darkMode ? 'border-gray-700' : 'border-gray-200')}>
                {plan.current && (
                  <span className="bg-violet-600 text-white text-xs px-2 py-0.5 rounded-full font-medium mb-2 inline-block">Plan actual</span>
                )}
                <p className={cn('font-bold text-lg', textPrimary)}>{plan.label}</p>
                <p className="text-violet-400 font-semibold text-sm mb-3">{plan.price}</p>
                <ul className="space-y-1.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="text-emerald-400">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {!plan.current && (
                  <button className="mt-4 w-full bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 text-xs py-2 rounded-lg transition-colors border border-violet-500/30">
                    {plan.id === 'enterprise' ? 'Contactar ventas' : 'Actualizar plan'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
