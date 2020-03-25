/* 

So, the APIFeatures class expects a mongoose query object as an input. The way we create a query object is by creating a query with Tour.find(), but not executing the query right away, so not using await on it (in case we're using async/await like we do in the course).

Again, by doing this, we end up with a query object onto which we can then chain other methods, such as sort, or another find, as you posted in your example:

this.query.find(JSON.parse(queryStr))

Keep in mind that here, inside the class, this.query is the query object we created in the beginning, so it's like having:

Tour.find().find(JSON.parse(queryStr))

And yes, that is totally acceptable. Again, because the query has not yet executed, it didn't return the actual results yet. That's what we do in the end, which is the reason why in the end we have to use

const tours = await features.query;

*/

class APIFeatures {
    constructor(mongoQuery, reqQueryObj) {
        // build query
        this.query = mongoQuery;
        this.reqQuery = reqQueryObj;
    }

    filter() {
        // to filter the tours
        const queryObj = { ...this.reqQuery };

        const excludeFields = ['sort', 'page', 'limit', 'fields'];

        // deleting excluded fields from the query
        excludeFields.forEach(el => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);

        // replacing gte with $gte
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            match => `$${match}`
        );
        // \b is for exact match
        this.query = this.query.find(JSON.parse(queryStr));

        // this.query = Tour.find(JSON.parse(queryStr));
        return this;
    }

    sort() {
        // to sort tours by fields
        // if sort query exist
        if (this.reqQuery.sort) {
            const sortBy = this.reqQuery.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } //else {
        // sort by most popular
        // this.query = this.query.sort('-ratingsQuantity');
        //}
        return this;
    }

    limitFields() {
        // to select specified fields of tours
        if (this.reqQuery.fields) {
            const fieldNames = this.reqQuery.fields.split(',').join(' ');
            this.query = this.query.select(fieldNames);
        } else {
            // exclude __v field
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        // pagination
        const page = this.reqQuery.page * 1 || 1;
        const limit = this.reqQuery.limit * 1 || 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        // if (this.query.page) {
        // const numTours = await Tour.estimatedDocumentCount();
        // if (skip >= numTours) throw new Error('Thats all folks');
        // }
        return this;
    }
}

module.exports = APIFeatures;
