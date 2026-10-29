import { html } from '../../html.js';
import { $, delegate } from '../../dom.js';
import { handleSubmit } from '../../components/form-errors.js';
import { showError } from '../../error-view.js';
import { adminLayout } from './admin-layout.js';

function categoryItem(categoria) {
  return html`<div class="category-row"><span><b>${categoria.nombre}</b> <small>${categoria.totalProductos} productos</small></span>
    <span class="row-actions"><button class="text-link" data-rename="${categoria.id}" data-name="${categoria.nombre}" data-desc="${categoria.descripcion ?? ''}">Renombrar</button>
      <button class="text-link danger" data-delete="${categoria.id}">Eliminar</button></span></div>`;
}

function tree(categories) {
  return html`<ul class="category-tree">${categories.map(padre => html`<li class="category-parent">${categoryItem(padre)}
    ${padre.hijas.length ? html`<ul>${padre.hijas.map(hija => html`<li>${categoryItem(hija)}</li>`)}</ul>` : ''}</li>`)}</ul>`;
}

function newCategoryForm(categories) {
  const parents = categories.map(c => html`<option value="${c.id}">${c.nombre}</option>`);
  return html`<form class="form-card" id="categoryForm" novalidate><h2>Nueva categoría</h2><div class="form-grid">
      <label class="form-field">Nombre<input name="nombre"></label>
      <label class="form-field">Pertenece a<select name="idCategoriaPadre"><option value="">(Categoría principal)</option>${parents}</select></label></div>
    <label class="form-field">Descripción<input name="descripcion"></label><button class="button button-dark" type="submit">Crear categoría</button></form>`;
}

export default {
  title: 'Categorías',
  access: 'admin',
  async render(ctx) {
    const categories = await ctx.services.adminCategories.list();
    return adminLayout(ctx.path, { eyebrow: 'CATÁLOGO', title: 'Categorías' }, html`<div class="admin-split">${tree(categories)}${newCategoryForm(categories)}</div>`);
  },
  mount(root, ctx) {
    const run = action => async (event, button) => {
      try {
        if (await action(button)) await ctx.refresh();
      } catch (error) {
        showError(error, ctx);
      }
    };
    delegate(root, 'click', '[data-rename]', run(async button => {
      const nombre = window.prompt('Nuevo nombre de la categoría', button.dataset.name);
      if (!nombre) return false;
      await ctx.services.adminCategories.update(Number(button.dataset.rename), { nombre, descripcion: button.dataset.desc });
      return true;
    }));
    delegate(root, 'click', '[data-delete]', run(async button => {
      if (!window.confirm('¿Eliminar esta categoría?')) return false;
      await ctx.services.adminCategories.remove(Number(button.dataset.delete));
      return true;
    }));
    handleSubmit($('#categoryForm', root), ctx, async data => {
      await ctx.services.adminCategories.create(data);
      ctx.toast('Categoría creada');
      await ctx.refresh();
    });
  },
};
