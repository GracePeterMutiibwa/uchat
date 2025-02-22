document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');

    const modal = document.getElementById('forgotPasswordModal');

    const closeModal = document.getElementById('closeModal')

    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault()
        modal.style.display = 'flex';
    })

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    })

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    })
});