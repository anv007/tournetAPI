class AppError extends Error{  //AppError class inheritance from built-in Error class
    constructor(message, statusCode) { 
        super(message); 

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail':'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor); 
        
    }
}

module.exports = AppError;