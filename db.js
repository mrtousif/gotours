const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
// const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);

const DB = process.env.LOCAL_DB;

function connect() {
    mongoose
        .connect(DB, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        })
        .then(con => {
            // console.log(con.connections);
            console.log('Database Connection successful');
        })
        .catch(err => console.error('Database Connection Failed', err));
    // return new Promise((resolve, reject) => {
    // .then((res, err) => {
    //     if (err) return reject(err);
    //     resolve();
    // });
}

function close() {
    mongoose.disconnect();
    // return mongoose.disconnect();
}

module.exports = { connect, close };
