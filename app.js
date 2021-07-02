const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES 

app.use(helmet());  //Set security HTTP headers

console.log(process.env.NODE_ENV);
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); 
}

const limiter = rateLimit({ 
    max: 200,
    windowMs: 60*60*1000,  // timeframe of 1 hour
    message: 'Too many requests from this IP, please try again in an hour'
});
app.use('/api',limiter);

// body parser( reading from body into req.body )=>
app.use(express.json({ limit: '10kb' }));  
                        

// Date sanitization against NoSQL query injection
app.use(mongoSanitize());
// Date sanitization against cross side scripting attacks
app.use(xss());
// Prevent parameter pollution
app.use(hpp({
    whitelist: [ 
        'duration',
        'ratingsAverage',
        'ratingsQuantity',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

// serving static files=>
app.use(express.static(`${__dirname}/public`)); //to server static files

// test middleware
app.use((req,res,next) => {
    req.requestTime = new Date().toISOString();
    //console.log(req.headers);
    next();
});

app.use('/api/v1/tours', tourRouter);  
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//MIDDLEWARE FOR UNHANDLED ROUTES=> (the logic is that if the following code is reached then that means req-res cycle was not finished for the above valid routes)
app.all('*', (req,res,next) => { 
    //better way=>
    next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLING MIDDLEWARE=>
app.use(globalErrorHandler);

module.exports = app;
