import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, raw } from '../../src/ui/html.js';

test('html escapa interpolaciones', () => {
  assert.equal(String(html`<p>${'<img src=x onerror=alert(1)>'}</p>`), '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
});

test('html escapa comillas y ampersand', () => {
  assert.equal(String(html`<a title="${`"x" & 'y'`}">`), '<a title="&quot;x&quot; &amp; &#39;y&#39;">');
});

test('html no re-escapa plantillas anidadas', () => {
  assert.equal(String(html`<ul>${['a', 'b'].map(x => html`<li>${x}</li>`)}</ul>`), '<ul><li>a</li><li>b</li></ul>');
});

test('raw inserta sin escapar', () => {
  assert.equal(String(html`<div>${raw('<b>ok</b>')}</div>`), '<div><b>ok</b></div>');
});

test('null, undefined y false no imprimen nada; números sí', () => {
  assert.equal(String(html`${null}${undefined}${false}${0}${12}`), '012');
});

test('arreglos de texto plano se escapan', () => {
  assert.equal(String(html`${['<a>', '<b>']}`), '&lt;a&gt;&lt;b&gt;');
});
