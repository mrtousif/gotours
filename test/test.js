const { expect } = require('chai');
const app = require('../app');
const request = require('supertest')(app);

require('../server');

// describe('POST /notes', () => {
//     // before(done => {
//     //     db.connect();
//     // });
//     it('creates new notes', () => {});
// });

describe('GET /api/v1/tours', function() {
    it('returns all tours in json', async function() {
        // request(app)
        //     .get('/api/v1/tours')
        //     .set('Accept', 'application/json')
        //     .expect('Content-Type', /json/)
        //     .expect(200, done);

        const res = await request.get('/api/v1/tours');

        expect(res.status).to.eql(200);
        expect(res.body.data.docs.length).to.above(0);
    });
});

describe('POST /api/v1/users/login', function() {
    it('logs in a user', async function() {
        const response = await request.post('/api/v1/users/login').send({
            email: 'toustif@gotours.com',
            password: '1234567890'
        });

        expect(response.status).to.eql(200);

        const { body } = response;
        expect(body).to.include.keys('token', 'data', 'status');
        expect(body.token.length).to.above(10);
        expect(body.status).to.eql('success');
    });
});

describe('GET /api/v1/users', function() {
    it('requires admin role', async function() {
        const response = await request.get('/api/v1/users');

        expect(response.status).to.oneOf([403, 401]);
    });
});

// request(app)
//     .get('/api/v1/tours')
//     .expect('Content-Type', /json/)
//     // .expect('Content-Length', '15')
//     .expect(200)
//     .end(function(err, res) {
//         if (err) throw err;
//     });
