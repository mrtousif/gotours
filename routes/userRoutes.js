const express = require('express');

const userCtrl = require('./../controllers/userController');
const authCtrl = require('./../controllers/authController');

const router = express.Router();

// auth
router.post('/signup', authCtrl.signup);
router.post('/login', authCtrl.login);
router.get('/logout', authCtrl.logout);

router.post('/forgot-password', authCtrl.forgotPassword);
router.patch('/reset-password/:resetToken', authCtrl.resetPassword);

router.use(authCtrl.protect);
// all routes from this line is protected by authCtrl.protect middleware
// and user info is loaded into req.user

router.patch('/update-password', authCtrl.updatePassword);
router.patch('/update-me', userCtrl.uploadUserPhoto, userCtrl.updateMe);

router.patch('/deactivate-me', userCtrl.deactivateMe);
router.delete('/delete-me', userCtrl.deleteUser);
router.get('/account', userCtrl.getMe, userCtrl.getUser);

// restricted to admin
router.use(authCtrl.restrictTo('admin'));

router
    .route('/')
    .get(userCtrl.getAllUsers)
    .post(userCtrl.createUser);

router
    .route('/:id')
    .get(userCtrl.getUser)
    .patch(userCtrl.updateUser)
    .delete(userCtrl.deleteUser);

module.exports = router;
