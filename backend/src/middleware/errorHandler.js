// errorHandler.js (ESM)
const errorHandler = (err, req, res, next) => {
    // Set a default status code and message
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'An unexpected error occurred.';

    // Handle Mongoose Bad ObjectId Error
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = `Resource not found with ID: ${err.value}`;
    }

    // Handle Mongoose Duplicate Key Error (e.g., duplicate email)
    if (err.code === 11000) {
        statusCode = 400;
        message = `Duplicate field value entered: ${Object.keys(err.keyValue)}`;
    }

    // Handle JWT Errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Not authorized, token failed.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Not authorized, token expired.';
    }

    // Send the structured error response
    res.status(statusCode).json({
        success: false,
        message: message,
        // Only show stack trace if NOT in production
        details: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export default errorHandler;