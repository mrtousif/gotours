const { expect } = require('chai');
const app = require('../app');
const request = require('supertest')(app);

describe('TOUR Service', () => {
    describe('GET /api/v1/tours', function () {
        it('should return all tours', async function () {
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

    describe('GET /api/v1/tours/:id', function () {
        it('should return the tour of given is', async function () {
            // request(app)
            //     .get('/api/v1/tours')
            //     .set('Accept', 'application/json')
            //     .expect('Content-Type', /json/)
            //     .expect(200, done);

            const res = await request.get(
                '/api/v1/tours/5c88fa8cf4afda39709c2955'
            );

            // console.log(res.body);
            expect(res.status).to.eql(200);
            // expect(res.body.data.docs.length).to.above(0);
            expect(res.body.data).to.include.keys('doc');
        });
    });
});
