const { expect } = require('chai');
const app = require('../app');
const request = require('supertest')(app);
const User = require('../models/userModel');
// const Tour = require('../models/tourModel');
// const Review = require('../models/reviewModel');
// const Booking = require('../models/bookingModel');
const { importData, deleteData } = require('../dev-data/data/importTestData');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// let mongoServer;
const mongoServer = new MongoMemoryServer();

before(async () => {
    try {
        const mongoUri = await mongoServer.getUri();
        const port = process.env.PORT;
        const server = app.listen(port, () => {
            console.log(`Server running on port ${port} ....`);
        });
        const opts = {};
        await mongoose.connect(mongoUri, opts);
        console.log('Database connected');

        // clear database
        await deleteData();
        await importData();
        //create admin
        await User.create({
            name: 'Tousif Alkon',
            email: 'toustif@alkon.com',
            password: '1234567890',
            confirmPassword: '1234567890',
            role: 'admin',
        });
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

// describe('POST /notes', () => {
//     // before(done => {
//     //     db.connect();
//     // });
//     it('creates new notes', () => {});
// });

describe('GET /api/v1/tours', function () {
    it('returns all tours in json', async function () {
        // request(app)
        //     .get('/api/v1/tours')
        //     .set('Accept', 'application/json')
        //     .expect('Content-Type', /json/)
        //     .expect(200, done);

        const res = await request.get('/api/v1/tours');
        // console.log(res.body);
        expect(res.status).to.eql(200);
        // expect(res.body.data.docs.length).to.above(0);
        expect(res.body.data).to.include.keys('docs');
    });
});

describe('POST /api/v1/users/signup', function () {
    it('signs up a user', async function () {
        const response = await request.post('/api/v1/users/signup').send({
            name: 'Tousif',
            email: 'toustif@gotours.com',
            password: '1234567890',
            confirmPassword: '1234567890',
        });

        expect(response.status).to.eql(201);

        const { body } = response;
        expect(body).to.include.keys('token', 'data', 'status');
        expect(body.token.length).to.above(10);
        expect(body.status).to.eql('success');
    });
});

describe('POST /api/v1/users/login', function () {
    it('logs in a user', async function () {
        const response = await request.post('/api/v1/users/login').send({
            email: 'toustif@alkon.com',
            password: '1234567890',
        });

        expect(response.status).to.eql(200);

        const { body } = response;
        expect(body).to.include.keys('token', 'data', 'status');
        expect(body.token.length).to.above(10);
        expect(body.status).to.eql('success');
    });
});

describe('GET /api/v1/users/:id', function () {
    it('should return the user of the given id', async function () {
        const response = await request.get(
            '/api/v1/users/5c8a1f292f8fb814b56fa184'
        );
        // console.log(response);

        expect(response.status).to.equal(200);
    });
});

describe('GET /api/v1/users', function () {
    it('requires admin role to access the route', async function () {
        const response = await request.get('/api/v1/users');
        // console.log(response);

        expect(response.status).to.oneOf([403, 401]);
    });
});
