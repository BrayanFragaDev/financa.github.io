'use strict';
// Logica pura (sem Firebase) para decidir o que avisar. Datas sao textos AAAA-MM-DD.

function addDays(ds, n) {
  const [y, m, d] = ds.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.getUTCFullYear() + '-' + String(t.getUTCMonth() + 1).padStart(2, '0') + '-' + String(t.getUTCDate()).padStart(2, '0');
}

// Data de hoje no fuso de Sao Paulo
function todaySP(now) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now || new Date());
  const g = k => parts.find(p => p.type === k).value;
  return g('year') + '-' + g('month') + '-' + g('day');
}

const brl = v => 'R$ ' + (Math.round(v * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function names(list) {
  const shown = list.slice(0, 3).map(t => (t.desc || 'Conta') + ' ' + brl(t.amount));
  const extra = list.length - shown.length;
  return shown.join(', ') + (extra > 0 ? ' e mais ' + extra : '');
}

// txs: lancamentos da casa. Retorna null se nao ha nada a avisar.
function buildMessage(txs, today) {
  const tomorrow = addDays(today, 1);
  const open = txs.filter(t => t && t.type === 'despesa' && t.paid !== true && typeof t.amount === 'number' && typeof t.date === 'string');
  const hoje = open.filter(t => t.date === today);
  const amanha = open.filter(t => t.date === tomorrow);
  const atras = open.filter(t => t.date < today);
  if (!hoje.length && !amanha.length && !atras.length) return null;
  const sum = l => l.reduce((a, t) => a + t.amount, 0);
  const lines = [];
  if (hoje.length) lines.push('Hoje: ' + names(hoje));
  if (amanha.length) lines.push('Amanhã: ' + names(amanha));
  if (atras.length) lines.push(atras.length + (atras.length === 1 ? ' atrasada' : ' atrasadas') + ' (' + brl(sum(atras)) + ')');
  const n = hoje.length + amanha.length + atras.length;
  const title = hoje.length
    ? (hoje.length === 1 ? '1 conta vence hoje' : hoje.length + ' contas vencem hoje')
    : amanha.length ? (amanha.length === 1 ? '1 conta vence amanhã' : amanha.length + ' contas vencem amanhã')
    : (atras.length === 1 ? '1 conta atrasada' : atras.length + ' contas atrasadas');
  return { title, body: lines.join(' · '), count: n };
}

module.exports = { addDays, todaySP, buildMessage, brl };
