const newPasswordField = document.getElementById('new-password-input');

const confirmPasswordField = document.getElementById('confirm-password-input');

const submitChangesTrigger = document.getElementById('submit-changes-trigger');


function toggleInputElement(elementToToggle, whatToToggle) {
    if (elementToToggle.type === 'password') {
        elementToToggle.type = 'text';

        whatToToggle.innerHTML = '<i class="bi bi-eye"></i>'

    } else {
        elementToToggle.type = 'password';

        whatToToggle.innerHTML = '<i class="bi bi-eye-slash"></i>'
    }

}


function seeIfPasswordsMath() {
    let matchStatus = (confirmPasswordField.value === newPasswordField.value) && (confirmPasswordField.value.trim().length > 0 && newPasswordField.value.trim().length);

    // activate or deactivate the button
    submitChangesTrigger.disabled = !matchStatus;
}


document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.password-toggle').forEach(passwordToggle => {
        passwordToggle.addEventListener('click', () => {
            // get the target
            let attachedTarget = document.getElementById(passwordToggle.getAttribute("data-changes"));

            // update the state
            toggleInputElement(attachedTarget, passwordToggle);
        });
    });

    document.querySelectorAll('.needs-validation').forEach(eachInputElement => {
        eachInputElement.addEventListener('input', () => {
            // track if passwords match
            seeIfPasswordsMath();

            // debug
            // console.log('validated');
        });
    });
})