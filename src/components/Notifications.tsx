import { Bell, CheckCheck, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/helpers';

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: 'text-emerald-400 bg-emerald-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  error: 'text-red-400 bg-red-500/10',
  info: 'text-blue-400 bg-blue-500/10',
};

export default function Notifications() {
  const { notifications, markNotificationRead, clearNotifications, darkMode } = useStore();
  const unread = notifications.filter(n => !n.read).length;

  const card = darkMode ? 'bg-gray-900/80 border-gray-800/60' : 'bg-white border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  const formatRelative = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className={cn('rounded-2xl border p-6', card)}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-violet-400" />
            <h2 className={cn('text-lg font-bold', textPrimary)}>Alertas del sistema</h2>
            {unread > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{unread} nuevas</span>
            )}
          </div>
          {unread > 0 && (
            <button onClick={clearNotifications} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-400 transition-colors">
              <CheckCheck className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <p className={cn('font-medium', textPrimary)}>Sin alertas</p>
            <p className={cn('text-sm mt-1', textSecondary)}>Todo está en orden</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const Icon = ICONS[n.type];
              const colorClass = COLORS[n.type];
              return (
                <div
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-150',
                    n.read
                      ? darkMode ? 'bg-gray-900/30 opacity-60' : 'bg-gray-50/50 opacity-60'
                      : darkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-50 shadow-sm border border-gray-200'
                  )}
                >
                  <div className={cn('p-2 rounded-xl flex-shrink-0', colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', textPrimary, !n.read && 'font-semibold')}>{n.title}</p>
                      <span className="text-xs text-gray-500 flex-shrink-0">{formatRelative(n.timestamp)}</span>
                    </div>
                    <p className={cn('text-sm mt-0.5', textSecondary)}>{n.message}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 bg-violet-400 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
