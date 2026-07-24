// Wraps an async route handler so a rejected promise is forwarded to Express's
// error-handling middleware via next(err) instead of becoming an unhandled
// promise rejection. In Express 4 an un-awaited rejection is NOT caught by the
// framework, and Node's default behaviour for an unhandled rejection is to
// crash the process — which is exactly what took the whole server down.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
