import { DEMO_ACCOUNTS } from '../../src/data/seed-users.js';

export const ADDRESS = {
  alias: 'Casa', direccion: 'Av. Arequipa 1234', distrito: 'Miraflores', provincia: 'Lima',
  departamento: 'Lima', referencia: 'Frente al parque', telefono: '987654321',
};

export const OTHER_USER = {
  nombres: 'Otro', apellidos: 'Usuario', dni: '11112222', email: 'otro@x.pe',
  usuario: 'otro.user', contrasena: 'Clave2026', confirmacion: 'Clave2026',
};

export const APPROVED_CARD = { numero: '4111 1111 1111 1111', titular: 'LUCIA FERNANDEZ', vencimiento: '12/28', cvv: '123' };
export const DECLINED_CARD = { ...APPROVED_CARD, numero: '4000000000000002' };

export const loginDemo = services => services.auth.login(DEMO_ACCOUNTS.cliente.usuario, DEMO_ACCOUNTS.cliente.contrasena);
export const loginAdmin = services => services.auth.login(DEMO_ACCOUNTS.admin.usuario, DEMO_ACCOUNTS.admin.contrasena);
