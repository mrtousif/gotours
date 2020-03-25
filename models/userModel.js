const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        minlength: 3,
        maxlength: 50,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        minlength: 6,
        maxlength: 50,
        trim: true,
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false // exclude the field from result by default
    },
    confirmPassword: {
        type: String,
        required: true,
        validate: {
            // custom validator with 'this' keyword runs only on user creations not update
            validator: function(password) {
                // return true if password === confirmPassword
                return password === this.password;
                // 'this' only points to current doc on new document creation
            },
            message: 'Password did not match'
        }
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    accountCreatedAt: {
        type: Date,
        default: Date.now()
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    resetTokenExpiresAt: Date,
    active: {
        type: Boolean,
        default: true
    }
});

// instance method - it is available to all documents in a collection
userSchema.methods.correctPassword = async function(candidatePass, userPass) {
    // check if given login password is same as user password
    // candidatePass is not hashed but userPass is hashed
    // bcrypt takes care of that
    // returns true or false
    return await bcrypt.compare(candidatePass, userPass);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    // if passwordChangedAt field exist then compare
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        console.log(
            `PasswordChangedAt: ${changedTimestamp}, JWT_issued_at: ${JWTTimestamp}`
        );
        // returns true if changed
        return changedTimestamp > JWTTimestamp;
    }
    // password not changed
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    // temporary password for user to create real one
    const resetToken = crypto.randomBytes(32).toString('hex');
    // hashing - does not need strong encryption using builtin crypto
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    // validity of the reset token 20 minute
    this.resetTokenExpiresAt = Date.now() + 20 * 60 * 1000;

    // console.log({ resetToken, passwordResetToken: this.passwordResetToken });
    return resetToken;
};

// pre save mongoose document middleware
// encrypt password before saving to the db
userSchema.pre('save', async function(next) {
    // encrypted form of the password is saved to the database
    // exit if password field is not modified
    if (!this.isModified('password')) return next();

    // hash the password with the cost of 12 --- Strong Encryption
    this.password = await bcrypt.hash(this.password, 12);
    // password is created a bit before the current timestamp
    this.passwordChangedAt = Date.now() - 1000;
    // delete password confirm field
    this.confirmPassword = undefined;
    this.passwordResetToken = undefined;
    this.resetTokenExpiresAt = undefined;
    next();
});

// userSchema.pre(/^find/, function(next) {
//     // this points to the current query
//     this.find({ active: true });
//     next();
// });

userSchema.pre('save', async function(next) {
    // check if password is not modified or new document is created
    if (!this.isModified('password') || this.isNew) return next();
    // update the passwordChangedAt
    // password is created a bit before the current timestamp
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// creating model
const User = mongoose.model('User', userSchema);

module.exports = User;
