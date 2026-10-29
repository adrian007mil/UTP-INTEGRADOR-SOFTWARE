import { html } from '../../html.js';
import { $, delegate } from '../../dom.js';
import { formatDate } from '../../components/order-timeline.js';
import { showError } from '../../error-view.js';
import { adminLayout } from './admin-layout.js';

const ROLE_FILTERS = [['', 'Todos'], ['CLIENTE', 'Clientes'], ['ADMIN', 'Administradores']];

function userRow(user, currentId) {
  const active = user.estado === 'A';
  const toggle = user.id === currentId
    ? html`<span class="muted">Tu cuenta</span>`
    : html`<label class="switch"><input type="checkbox" data-user="${user.id}" ${active ? 'checked' : ''}><span>${active ? 'Activo' : 'Inactivo'}</span></label>`;
  return html`<tr class="${active ? '' : 'row-disabled'}"><td>${user.nombres} ${user.apellidos}<br><small>${user.usuario}</small></td><td>${user.email}</td>
    <td>${user.dni}</td><td>${user.rol === 'ADMIN' ? 'Administrador' : 'Cliente'}</td><td>${user.ultimoAcceso ? formatDate(user.ultimoAcceso) : '—'}</td><td>${toggle}</td></tr>`;
}

export default {
  title: 'Usuarios',
  access: 'admin',
  async render(ctx) {
    const filters = { texto: ctx.query.get('q') ?? '', rol: ctx.query.get('rol') ?? '' };
    const users = await ctx.services.adminUsers.list(filters);
    const roles = ROLE_FILTERS.map(([value, label]) => html`<option value="${value}" ${value === filters.rol ? 'selected' : ''}>${label}</option>`);
    return adminLayout(ctx.path, { title: 'Usuarios' }, html`<form class="admin-filters" id="userFilters">
        <label class="search-box"><span>⌕</span><input name="q" type="search" value="${filters.texto}" placeholder="Buscar por nombre, correo, usuario o DNI"></label>
        <label class="filter-select"><span>Rol:</span><select name="rol">${roles}</select></label></form>
      <div class="admin-table-wrap"><table><thead><tr><th>USUARIO</th><th>CORREO</th><th>DNI</th><th>ROL</th><th>ÚLTIMO ACCESO</th><th>ESTADO</th></tr></thead>
        <tbody>${users.map(u => userRow(u, ctx.user.id))}</tbody></table></div>`);
  },
  mount(root, ctx) {
    const form = $('#userFilters', root);
    const apply = () => ctx.navigate(`#/admin/usuarios?${new URLSearchParams(new FormData(form)).toString()}`);
    form.addEventListener('change', apply);
    form.addEventListener('submit', event => { event.preventDefault(); apply(); });
    delegate(root, 'change', '[data-user]', async (event, input) => {
      try {
        await ctx.services.adminUsers.setActive(Number(input.dataset.user), input.checked);
        ctx.toast(input.checked ? 'Usuario activado' : 'Usuario desactivado');
        await ctx.refresh();
      } catch (error) {
        showError(error, ctx);
      }
    });
  },
};
