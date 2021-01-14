const { importData, deleteData } = require('../dev-data/data/importTestData');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
// const { expect } = require('chai');
const app = require('../app');
// const request = require('supertest')(app);
// let mongoServer;
const mongoServer = new MongoMemoryServer();

before(async () => {
    try {
        const mongoUri = await mongoServer.getUri();
        console.log(mongoUri);
        const port = process.env.PORT;
        const server = app.listen(port, () => {
            console.log(`Server running on port ${port} ....`);
        });
        const opts = {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true,
        };
        await mongoose.connect(mongoUri, opts);
        console.log('Database connected');

        // clear database
        await deleteData();
        await importData();
    } catch (error) {
        console.error(error);
    }
});

after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    // server.close(() => {
    //     // kill
    //     process.exit(1);
    // });
});
