/**
 * Converte data UTC do banco para horário de Brasília (UTC-3)
 * @param {string} utcDate - Data em formato UTC do SQLite
 * @returns {string} Data formatada em pt-BR (DD/MM/YYYY HH:MM:SS)
 */
export function formatDateBR(utcDate) {
  if (!utcDate) return null;
  
  // SQLite salva no formato "YYYY-MM-DD HH:MM:SS" sem timezone
  // Assumir que está em horário local (Brasília)
  const date = new Date(utcDate);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

/**
 * Converte data UTC para formato ISO em horário de Brasília
 * @param {string} utcDate - Data em formato UTC do SQLite
 * @returns {string} Data em formato ISO (YYYY-MM-DD HH:MM:SS)
 */
export function toISOBR(utcDate) {
  if (!utcDate) return null;
  
  const date = new Date(utcDate);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formata apenas a data (sem hora) - DD/MM/YYYY
 * @param {string} utcDate - Data em formato UTC do SQLite
 * @returns {string} Data formatada (DD/MM/YYYY)
 */
export function formatDateOnlyBR(utcDate) {
  if (!utcDate) return null;
  
  const date = new Date(utcDate);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formata apenas o horário (sem data) - HH:MM:SS
 * @param {string} utcDate - Data em formato UTC do SQLite
 * @returns {string} Horário formatado (HH:MM:SS)
 */
export function formatTimeOnlyBR(utcDate) {
  if (!utcDate) return null;
  
  const date = new Date(utcDate);
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Retorna data/hora atual no formato do SQLite em horário de Brasília
 * @returns {string} Data no formato YYYY-MM-DD HH:MM:SS
 */
export function getCurrentDateTimeBR() {
  const date = new Date();
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Retorna data/hora atual no formato do SQLite (UTC)
 * @returns {string} Data no formato YYYY-MM-DD HH:MM:SS
 */
export function getCurrentDateTimeUTC() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Retorna tempo decorrido (ex: "há 2 horas")
 * @param {string} utcDate - Data em formato UTC do SQLite
 * @returns {string} Tempo decorrido em linguagem natural
 */
export function timeAgo(utcDate) {
  if (!utcDate) return '-';
  
  const date = new Date(utcDate);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  
  return formatDateOnlyBR(utcDate);
}
