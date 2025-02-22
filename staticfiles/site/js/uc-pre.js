document.addEventListener('DOMContentLoaded', () => {
    const whatSourceTag = document.getElementById('what-source-tag-input');

    const selectedSourcesHolder = document.getElementById('selected-sources-holder');

    const botPromptInput = document.getElementById('bot-prompt-input');

    const botPromptCaptureInput = document.getElementById('prompt-capture-input');

    const botLabelInput = document.getElementById('bot-label-input');

    const botAvatarInput = document.getElementById('bot-avatar-input');

    // triggers
    const saveBotTrigger = document.getElementById('save-chatbot-trigger');

    const addPromptTrigger = document.getElementById('add-prompt-button');

    const allSourceAdds = document.querySelectorAll('.source-add');

    // nodes: are 3 but the last one is not needed 
    const editorNodes = Array.from(document.querySelectorAll('.node'));

    const [dataNode, promptNode] = editorNodes;

    // console.log('nodes:', dataNode, promptNode);


    // other
    const choiceOffcanvas = document.getElementById('sources-choice-offcanvas');

    const promptModal = document.getElementById('prompt-entry-modal');




    const stepIndicator = new StepIndicator("has-steps", [
        "Data",
        "Prompt",
        "Chat",
    ]);

    // stepIndicator.update(1);
    // stepIndicator.update(2);
    // stepIndicator.reset(3);

    function resetUpdateNodes(nodeTag, shouldUpdate) {
        // determine the new style
        let newStyle = shouldUpdate === 1 ? 'data' : 'missing';

        let specificNode = nodeTag === 1 ? dataNode : promptNode;

        // remove old styling
        if (newStyle === 'data') {
            specificNode.classList.remove('missing');
        } else {
            specificNode.classList.remove('data');
        }

        // load new
        specificNode.classList.add(newStyle);
    }

    function preSaveCheck() {
        // checks exist
        let dataPresent = getSelectedSources().length > 0;

        let promptPresent = botPromptInput.value.trim().length > 0;

        // alert progress
        if (dataPresent) {
            stepIndicator.update(1);

            resetUpdateNodes(1, 1);
        } else {
            stepIndicator.reset(1);

            resetUpdateNodes(1, 2);
        }

        if (promptPresent) {
            stepIndicator.update(2);

            resetUpdateNodes(2, 1);
        } else {
            stepIndicator.reset(2);

            resetUpdateNodes(2, 2);
        }

        // collection of checks to run before acceptance
        let checksToRun = [dataPresent, promptPresent];

        if (checksToRun.every(checkResult => checkResult === true)) {
            // only activate the button when all are present
            saveBotTrigger.disabled = false;

            stepIndicator.update(3);

        } else {
            saveBotTrigger.disabled = true;

            stepIndicator.reset(3);
        }

    }

    function getSelectedSources() {
        return selectedSourcesHolder.value.split('|').filter(sourceTag => sourceTag.trim().length > 0);
    }

    function updateSourcesList(addTag, addStatus) {
        // present
        let availableSources = getSelectedSources()

        if (addStatus == 1) {
            availableSources.push(addTag);

        } else {
            // get rid of that tag
            availableSources = availableSources.filter(sourceTag => sourceTag !== addTag);
        }

        // merged
        let newSources = availableSources.join("|");

        // make the update
        selectedSourcesHolder.value = newSources;

        // updated tag list
        // console.log('sources:', newSources);

        // run save checks
        preSaveCheck();
    }

    allSourceAdds.forEach(eachAddTrigger => {
        eachAddTrigger.addEventListener('change', () => {
            // get the tag
            let addTag = eachAddTrigger.getAttribute('data-src-tag');

            let addStatus = eachAddTrigger.checked ? 1 : 0;

            // console.log(addTag, '>', addStatus);

            // make the 100
            updateSourcesList(addTag, addStatus);
        });
    });


    choiceOffcanvas.addEventListener('hidden.bs.offcanvas', (e) => {
        allSourceAdds.forEach(eachAddTrigger => {
            // deactivate all
            eachAddTrigger.checked = false;
        });
    });

    choiceOffcanvas.addEventListener('show.bs.offcanvas', (e) => {
        // get the sources
        let presentSources = getSelectedSources();

        if (presentSources.length > 0) {
            presentSources.forEach(eachSourceTag => {
                // get and check those that match
                let itemId = `switch-add-${eachSourceTag}`;

                document.getElementById(itemId).checked = true;
            })
        }
    });

    addPromptTrigger.addEventListener('click', (e) => {
        // get the date
        let promptData = botPromptCaptureInput.value.trim();

        if (promptData.length > 0) {
            // store the prompt
            botPromptInput.value = promptData;

            // check
            preSaveCheck();

            // alert
            new Toast("Your prompt details were updated...");
        } else {
            new Toast("You didn't provide a system prompt", "danger");
        }
    });

    promptModal.addEventListener('hidden.bs.modal', (e) => {
        botPromptCaptureInput.value = "";
    });

    promptModal.addEventListener('show.bs.modal', (e) => {
        // load the active prompt
        botPromptCaptureInput.value = botPromptInput.value;
    });

    document.querySelectorAll('.bot-editor').forEach(eachBotEditor => {
        eachBotEditor.addEventListener('click', (e) => {
            e.preventDefault();

            // get the details
            whatSourceTag.value = eachBotEditor.getAttribute('data-bot-tag');

            selectedSourcesHolder.value = eachBotEditor.getAttribute('data-bot-src');

            botPromptInput.value = eachBotEditor.getAttribute('data-bot-prompt');

            let botLabel = eachBotEditor.getAttribute('data-bot-label');

            botLabelInput.value = botLabel;

            botAvatarInput.value = eachBotEditor.getAttribute('data-bot-avatar');

            // checks
            preSaveCheck();

            botLabelInput.scrollTo({
                left: 0,
                behavior: 'smooth'
            });

            new Toast(`Configuration for the ChatBot (${botLabel}) has been loaded in the editor..`, "primary")

        });
    });



})