// modelo para crear errores
class HttpError extends Error {
  constructor(message, errorCode) {
    super(message);
    this.code = errorCode;
  }
}

module.exports = HttpError;
