import { html } from '../html.js';
import { SHIPMENT_STATES } from '../../core/shipment-state.js';

const LABELS = { PROCESANDO: 'Procesando', ENVIADO: 'Enviado', ENTREGADO: 'Entregado' };
const DATE_FORMAT = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

export const formatDate = iso => DATE_FORMAT.format(new Date(iso));

export const ORDER_STATUS = {
  PENDIENTE_PAGO: { label: 'Pendiente de pago', tone: 'warning' },
  PAGADO: { label: 'Pagado', tone: 'ok' },
};

export function statusPill(estado) {
  const status = ORDER_STATUS[estado] ?? { label: LABELS[estado] ?? estado, tone: estado === 'ENTREGADO' ? 'ok' : 'info' };
  return html`<span class="status-pill ${status.tone}">${status.label}</span>`;
}

export function orderTimeline(envio, seguimientos) {
  if (!envio) return '';
  const reached = new Set(seguimientos.map(s => s.estado));
  const steps = SHIPMENT_STATES.map(estado => {
    const record = seguimientos.find(s => s.estado === estado);
    return html`<li class="${reached.has(estado) ? 'done' : ''}"><b>${LABELS[estado]}</b>
      <small>${record ? formatDate(record.fechaRegistro) : 'Pendiente'}</small>${record ? html`<span>${record.descripcion}</span>` : ''}</li>`;
  });
  const tracking = envio.codigoSeguimiento ? html`<p class="tracking">${envio.empresa} · Código de seguimiento <b>${envio.codigoSeguimiento}</b></p>` : '';
  return html`<section class="order-block"><h2>Seguimiento del envío</h2><ol class="timeline">${steps}</ol>${tracking}</section>`;
}
