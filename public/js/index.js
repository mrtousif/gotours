/* eslint-disable */

import '@babel/polyfill';
import displayMap from './mapbox';
import { login, logout } from './login';
import { updateUserAccount } from './updateUserAccount';

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
    btnSavePassword: document.querySelector('.btn--save-password')
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

        const name = doms.name.value;
        const email = doms.email.value;
        updateUserAccount({ name, email }, 'data');
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
