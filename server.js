const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.error('Uncaught Exception');
    console.error(err);
    console.error('Shutting Down the server...');
    // kill
    process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);

// const DB = process.env.LOCAL_DB;

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
    .catch(err => console.error('Database Connection Failed'));

console.log('Current Env:', app.get('env'));
// console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Running on port ${port} ....`);
});

process.on('unhandledRejection', err => {
    console.log('Unhandled Rejection');
    console.error(err);
    console.log('Shutting Down the server...');
    // safely close
    server.close(() => {
        // kill
        process.exit(1);
    });
});
