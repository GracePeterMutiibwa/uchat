
function initiateResetMessagePush(resetTag, holderElement) {
    getCsrfToken = () => {
        let tokenHolder = document.getElementById('update-password-form').querySelector('input[name="csrfmiddlewaretoken"]');

        return tokenHolder.value;

    }

    axios.post(
        "/push-reset/",
        {
            tag: resetTag,
        },
        {
            headers: {
                "X-CSRFToken": getCsrfToken(),
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    ).then(response => {
        // console.log(response.data);
    })
        .catch(anyError => {
            // console.log(anyError)

            window.location.reload();
        })
        .finally(() => {
            // delete the holder
            holderElement.remove();
        });
}

document.addEventListener('DOMContentLoaded', () => {
    // get the tag holder
    const tagInput = document.getElementById('reset-tag-holder');

    // get the reset id
    let attachedTag = tagInput.value;

    // send
    initiateResetMessagePush(attachedTag, tagInput);
});