import assert from 'node:assert/strict';
import { ValidationError } from '../../src/core/errors.js';

export function fieldsOf(fn) {
  try {
    fn();
  } catch (error) {
    assert.ok(error instanceof ValidationError, `se esperaba ValidationError, llegó ${error.name}: ${error.message}`);
    return error.fields;
  }
  throw new Error('no lanzó ValidationError');
}

export async function fieldsOfAsync(promise) {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof ValidationError, `se esperaba ValidationError, llegó ${error.name}: ${error.message}`);
    return error.fields;
  }
  throw new Error('no lanzó ValidationError');
}
