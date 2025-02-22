document.addEventListener('DOMContentLoaded', () => {
    const clipOffcanvas = document.getElementById("paste-from-clip-offcanvas");

    const webPageOffcanvas = document.getElementById("url-source-offcanvas");

    // label and source fields
    const clipSrcLabelInput = document.getElementById("clip-source-label-input");

    const clipSrcContentInput = document.getElementById("clip-data-input");

    const urlSrcLabelInput = document.getElementById("url-source-label-input");

    const urlSrcContentInput = document.getElementById("url-data-input");

    // new fields
    const clipTagInput = document.getElementById("clip-tag-input");

    const urlTagInput = document.getElementById("url-tag-input");


    document.querySelectorAll('.ext-trigger').forEach(eachTrigger => {
        eachTrigger.addEventListener('click', (clickedEvent) => {
            clickedEvent.preventDefault();

            // get what is to be opened
            let sourceType = parseInt(eachTrigger.getAttribute('data-src-type'));

            let sourceItemTag = eachTrigger.getAttribute('data-src-tag');

            let sourceLabel = eachTrigger.getAttribute('data-src-label');

            let sourceContent = eachTrigger.getAttribute('data-src-content');

            if (sourceType === 1) {
                clipSrcLabelInput.value = sourceLabel;

                clipSrcContentInput.value = sourceContent;

                clipTagInput.value = sourceItemTag;

                new bootstrap.Offcanvas(clipOffcanvas).show();


            } else {
                urlSrcLabelInput.value = sourceLabel;

                urlSrcContentInput.value = sourceContent;

                // update
                urlTagInput.value = sourceItemTag;

                new bootstrap.Offcanvas(webPageOffcanvas).show();
            }
        })
    })

    // data sources
    if (clipOffcanvas && webPageOffcanvas) {

        [clipOffcanvas, webPageOffcanvas].forEach(eachOffCanvas => {
            eachOffCanvas.addEventListener('hidden.bs.offcanvas', (e) => {
                // on closing it, get the cleanable ares
                eachOffCanvas.querySelectorAll('.ext-clean').forEach(eachAreaToClean => {
                    // reset
                    eachAreaToClean.value = '';
                })

                // reset to new
                eachOffCanvas.querySelector('[name="status"]').value = 'new';

            })
        });
    }


})