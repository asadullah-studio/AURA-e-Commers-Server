export function errorHandler(err, req, res, next) {
  console.error('API Error:', err);

  const statusCode = err.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
