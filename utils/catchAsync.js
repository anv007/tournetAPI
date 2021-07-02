
module.exports = fn => { 
    return (req,res,next) => {
        fn(req,res,next).catch(err => next(err)); //forwards to the global error handler
    };
};