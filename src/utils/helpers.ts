let idCounter = 0;

export function generateId(): string {
  idCounter++;
  return `${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateSaleId(counter: number): string {
  return `VTA-${String(counter).padStart(5, '0')}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-CO').format(n);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit',
  }).format(new Date(dateStr));
}

export function getHour(dateStr: string): number {
  return new Date(dateStr).getHours();
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}

export function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
}

export function getDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
