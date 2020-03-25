const hideAlert = () => {
    const element = document.querySelector('.alert');
    if (element) {
        element.parentElement.removeChild(element);
    }
};

export default function(type, message) {
    hideAlert();
    const markup = `<div class="alert alert--${type}">${message} </div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
    window.setTimeout(hideAlert, 4000);
}
