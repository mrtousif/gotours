/* eslint-disable */

import '@babel/polyfill';
import displayMap from './mapbox';
import { login, logout } from './login';
import { updateUserAccount } from './updateUserAccount';
import { bookTour } from './stripe';

const doms = {
    map: document.querySelector('#map'),
    formLogin: document.querySelector('.form--login'),
    email: document.querySelector('#email'),
    password: document.querySelector('#password'),
    logoutBtn: document.querySelector('.nav__el--logout'),
    formUserData: document.querySelector('.form-user-data'),
    name: document.querySelector('#name'),
    userPassword: document.querySelector('.form-user-password'),
    passwordCurrent: document.querySelector('#password-current'),
    passwordConfirm: document.querySelector('#password-confirm'),
    btnSavePassword: document.querySelector('.btn--save-password'),
    photo: document.querySelector('#photo'),
    bookTour: document.querySelector('#book-tour')
};

if (doms.map) {
    const locations = JSON.parse(doms.map.dataset.locations);
    displayMap(locations);
}

if (doms.formLogin) {
    doms.formLogin.addEventListener('submit', e => {
        e.preventDefault();
        // const email = document.getElementById('email').value;
        // const password = document.getElementById('password').value;
        const email = doms.email.value;
        const password = doms.password.value;
        login(email, password);
    });
}

if (doms.logoutBtn) {
    doms.logoutBtn.addEventListener('click', logout);
}

if (doms.formUserData) {
    doms.formUserData.addEventListener('submit', e => {
        e.preventDefault();
        // file upload
        const form = new FormData();
        form.append('name', doms.name.value);
        form.append('email', doms.email.value);
        form.append('photo', doms.photo.files[0]);

        updateUserAccount(form, 'data');
    });
}

if (doms.userPassword) {
    doms.userPassword.addEventListener('submit', async e => {
        e.preventDefault();
        doms.btnSavePassword.textContent = 'Updating...';
        const currentPassword = doms.passwordCurrent.value;
        const password = doms.password.value;
        const confirmPassword = doms.passwordConfirm.value;

        await updateUserAccount(
            { currentPassword, password, confirmPassword },
            'password'
        );
        // clear input fields
        doms.btnSavePassword.textContent = 'Save password';
        doms.passwordCurrent.value = '';
        doms.password.value = '';
        doms.passwordConfirm.value = '';
    });
}

if (doms.bookTour) {
    doms.bookTour.addEventListener('click', e => {
        e.target.textContent = 'Processing...';
        const { tourId } = e.target.dataset;
        bookTour(tourId);
    });
}
