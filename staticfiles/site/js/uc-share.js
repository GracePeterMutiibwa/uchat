document.addEventListener('DOMContentLoaded', () => {
    const snippetStoreInput = document.getElementById('code-snippet-holder');

    const positionToggler = document.getElementById('display-position-input');

    const shareTagInput = document.getElementById('bot-share-tag-input');

    const shareBotModal = document.getElementById('bot-share-modal');

    const baseUrlHolder = document.getElementById('ucfetch-meta-input');

    function buildWidgetUrl(botTag) {
        // get
        let baseURL = baseUrlHolder.getAttribute('data-base-url');

        let completeWidgetUrl = `${baseURL}get-widget/${botTag}/`;

        return completeWidgetUrl
    }

    function loadSnippet() {
        // get the position
        let newPosition = parseInt(positionToggler.value);

        let foundTag = shareTagInput.value;

        // merge
        let widgetConfig = `${foundTag}-${newPosition}`;

        // generate url
        let craftedUrl = buildWidgetUrl(widgetConfig);

        let snippetToShow = `<script>window.$uchat = window.$uchat || {};$uchat.ready = function () {};</script><script src="${craftedUrl}" defer></script>`;

        // load
        snippetStoreInput.value = snippetToShow;
    }

    document.querySelectorAll('.share-trigger').forEach(eachShareTrigger => {
        eachShareTrigger.addEventListener('click', (e) => {
            e.preventDefault();

            // get and load
            shareTagInput.value = eachShareTrigger.getAttribute('data-bot-tag');

            loadSnippet();
        })
    });

    positionToggler.addEventListener('change', (e) => {
        // load snippet based on position
        loadSnippet();
    });

    shareBotModal.addEventListener('hidden.bs.modal', (e) => {
        // reset
        shareTagInput.value = "";
    });
});