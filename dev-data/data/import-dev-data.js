const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' });

// const DB = process.env.DATABASE.replace(
//     '<PASSWORD>',
//     process.env.DB_PASSWORD
// );
// const DB = process.env.LOCAL_DB;
const DB = 'mongodb://localhost:27017/natours';

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(con => {
        // console.log(con.connections);
        console.log('Connection successful');
    });

// read json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// import data into the database
const importData = async () => {
    try {
        // create collection named tours and insert data to it
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);

        console.log('Data loaded');
    } catch (error) {
        console.error(error);
    }
    process.exit();
};

// delete data from collections
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data deleted');
    } catch (error) {
        console.error(error);
    }
    process.exit();
};

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
} else {
    console.log('arg 3 required but none given');
}
