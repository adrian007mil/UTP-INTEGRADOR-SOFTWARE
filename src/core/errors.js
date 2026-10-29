export class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = new.target.name;
    this.code = code ?? new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super(message);
    this.fields = fields;
  }
}

export class NotFoundError extends AppError {}
export class AuthError extends AppError {}
export class ForbiddenError extends AppError {}
export class ConflictError extends AppError {}
export class StorageCorruptedError extends AppError {}

export class PaymentDeclinedError extends AppError {
  constructor(message, reason) {
    super(message);
    this.reason = reason;
  }
}
