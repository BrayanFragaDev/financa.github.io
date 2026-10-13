'use strict';
const { onSchedule } = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const { addDays, todaySP, buildMessage } = require('./lib');

admin.initializeApp();
const db = admin.firestore();

const LOOKBACK_DAYS = 90; // contas atrasadas so entram ate 90 dias para tras

// Todo dia as 8h (Sao Paulo): avisa cada aparelho cadastrado de cada casa.
exports.avisoDeContas = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'America/Sao_Paulo', region: 'southamerica-east1', timeoutSeconds: 120, memory: '256MiB' },
  async () => {
    const today = todaySP();
    const from = addDays(today, -LOOKBACK_DAYS);
    const to = addDays(today, 1);

    const devs = await db.collectionGroup('devices').get();
    const byHouse = new Map();
    devs.forEach(d => {
      const hid = d.ref.parent.parent && d.ref.parent.parent.id;
      const tok = d.get('token');
      if (!hid || !tok) return;
      if (!byHouse.has(hid)) byHouse.set(hid, []);
      byHouse.get(hid).push({ token: tok, ref: d.ref });
    });

    let sent = 0, removed = 0;
    for (const [hid, devices] of byHouse) {
      try {
        const snap = await db.collection('households').doc(hid).collection('transactions')
          .where('date', '>=', from).where('date', '<=', to).get();
        const msg = buildMessage(snap.docs.map(x => x.data()), today);
        if (!msg) continue;
        for (let i = 0; i < devices.length; i += 500) {
          const chunk = devices.slice(i, i + 500);
          const res = await admin.messaging().sendEachForMulticast({
            tokens: chunk.map(c => c.token),
            data: { title: msg.title, body: msg.body, tag: 'contas-' + today, url: '/' },
            webpush: { headers: { Urgency: 'high', TTL: '43200' } }
          });
          res.responses.forEach((r, k) => {
            if (r.success) { sent++; return; }
            const code = r.error && r.error.code;
            if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token' || code === 'messaging/invalid-argument') {
              chunk[k].ref.delete().catch(() => {}); removed++;
            } else {
              logger.warn('Falha ao enviar', { hid, code });
            }
          });
        }
      } catch (e) {
        logger.error('Erro na casa ' + hid, e);
      }
    }
    logger.info('avisoDeContas concluido', { today, casas: byHouse.size, enviados: sent, removidos: removed });
  }
);
