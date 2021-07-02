const mongoose = require('mongoose');
const dotenv = require('dotenv'); // coz we need our environment variables here

process.on('uncaughtException', err => { //need to be before the error. Eg- console.log(x) where x is undefined
    console.log('UNCAUGHT EXCEPTION!');
    console.log(err.name, err.message);
    process.exit(1);
});
//console.log(x);

dotenv.config({path: './config.env'}); // this cmd reads the variables from the config file and save them into nodejs environment variables

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(con => {
    //console.log(con.connections); 
    console.log('DB connection success');
});

// console.log(app.get('env')); // gives us the cuurent environment
//console.log(process.env);



/*const testTour = new Tour({ //this was only for testing 
    name: 'park camper',
    price: 900
});

testTour.save().then(doc => {
    console.log(doc);
}).catch(err => {
    console.log('ERROR:', err);
});*/

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`app running on port ${port}...`);
});

process.on('unhandledRejection', err => { //handling unhandled async promises
    console.log('UNHANDLED REJECTION!');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

