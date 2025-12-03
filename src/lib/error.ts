// Base HTTP error class
export class HttpError extends Error {
  // Attribut
  status: number;

  constructor(message: string, status: number) {
    super(message);

    this.status = status;
  }
}

// Bad request error
export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(message, 400);
  }
}

// Not authenticated
export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(message, 401);
  }
}

// Authenticated but no rights
export class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(message, 403);
  }
}

// Not found error
export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(message, 404);
  }
}

// Conflict error
export class ConflictError extends HttpError {
  constructor(message: string) {
    super(message, 409);
  }
}
