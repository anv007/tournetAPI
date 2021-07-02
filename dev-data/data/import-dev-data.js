const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');


dotenv.config({path: './config.env'}); 

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

//reading json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')); //when we use fs we will basically get a text formt so we use JSON.parse to convert it into an JS object befoe using in create()
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8')); //when we use fs we will basically get a text formt so we use JSON.parse to convert it into an JS object befoe using in create()
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')); //when we use fs we will basically get a text formt so we use JSON.parse to convert it into an JS object befoe using in create()

//importing data into DB
const importData = async () => {
    try{
        await Tour.create(tours); // here we passed an array of objects 
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Data loaded successfully');
    } catch(err) {
        console.log(err);
    }
    process.exit();
}

//delete all data from collection
const deleteData = async () => {
    try{
        await Tour.deleteMany(); // here we passed an array of objects 
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data deleted successfully');
    } catch(err) {
        console.log(err);
    }
    process.exit();
}

if(process.argv[2] === '--import') {
    importData();
} else if(process.argv[2] === '--delete') {
    deleteData();
}

console.log(process.argv);