export const DEMO_ACCOUNTS = {
  cliente: { usuario: 'cliente.demo', contrasena: 'Demo2026!' },
  admin: { usuario: 'admin', contrasena: 'Admin2026!' },
};

export const SEED_USERS = [
  {
    rol: 'ADMIN', nombres: 'Valeria', apellidos: 'Rojas Paredes', dni: '40000001',
    email: 'admin@omnimelody.pe', usuario: DEMO_ACCOUNTS.admin.usuario,
    contrasena: DEMO_ACCOUNTS.admin.contrasena, telefono: '912345678',
  },
  {
    rol: 'CLIENTE', nombres: 'Lucía', apellidos: 'Fernández Quispe', dni: '70000001',
    email: 'cliente@omnimelody.pe', usuario: DEMO_ACCOUNTS.cliente.usuario,
    contrasena: DEMO_ACCOUNTS.cliente.contrasena, telefono: '987654321',
  },
];
