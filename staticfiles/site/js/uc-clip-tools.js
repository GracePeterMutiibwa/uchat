
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.copy-trigger').forEach(eachCopyTrigger => {
        eachCopyTrigger.addEventListener('click', async () => {
            // get the source
            let sourceHolder = eachCopyTrigger.getAttribute('data-to-copy');

            let textToCopy;

            // incase source could be plain text or 
            // an input element: [input, textarea, select]
            if (document.querySelector(sourceHolder)) {
                // extract
                textToCopy = document.querySelector(sourceHolder).value;

            } else {
                // plain data
                textToCopy = sourceHolder
            }

            try {
                await navigator.clipboard.writeText(textToCopy);

                setTimeout(() => new Toast('Copied to clipboard'), 100);

            } catch (error) {
                new Toast('Cant copy to clipboard', "danger");
            }
        });
    });

    document.querySelectorAll('.paste-trigger').forEach(eachPasteTrigger => {
        eachPasteTrigger.addEventListener('click', async () => {
            try {
                const dropArea = document.querySelector(eachPasteTrigger.getAttribute('data-paste-area'));

                let clipboardText = await navigator.clipboard.readText();

                dropArea.value = clipboardText;

                // alert
                new Toast('Pasted from the clipboard');

            } catch (error) {
                new Toast('Cant paste from clipboard', "danger");
            }
        });
    });
});
