/* eslint-disable */

import axios from 'axios';
import displayAlert from './alerts';

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:8000/api/v1/users/login',
            data: { email, password }
        });

        // const res = await fetch('http://127.0.0.1:8000/api/v1/users/login', {
        //     method: 'POST',
        //     body: new FormData()
        // });
        if (res.data.status === 'success') {
            displayAlert('success', 'Logged in successfully');
            window.setTimeout(() => {
                // load root page after 2 second
                location.assign('/');
            }, 2000);
        }
        // const data = await res.json();
        console.log(res);
    } catch (error) {
        displayAlert('error', error.response.data.message);
        // console.error(error);
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:8000/api/v1/users/logout'
        });

        // const res = await fetch('http://127.0.0.1:8000/api/v1/users/login', {
        //     method: 'POST',
        //     body: new FormData()
        // });

        if (res.data.status === 'success') {
            location.assign('/login');
            // location.reload(true);
            // setting it to true forces the page to reload and
            // gets a fresh copy from the server not from the cache
        }
    } catch (error) {
        displayAlert('error', 'Error logging out. Try again');
    }
};
