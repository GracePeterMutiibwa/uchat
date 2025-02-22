class ResponseCall {
    constructor(apiUrl, messageQueue) {
        this.api_url = apiUrl;

        this.message_queue = messageQueue;
    }

    seek(sCallBack, eCallBack) {
        // console.log('here:', this.message_queue);

        axios.post(
            this.api_url,
            this.message_queue,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).then(response => {
            sCallBack(response.data);
        })
            .catch(anyError => {
                eCallBack(anyError);
            });
    }
}

class PersistenceManager {
    constructor(dbName, storeName, dbVersion, indexNameAndPath) {
        this.db_name = dbName;

        this.store_name = storeName;

        this.db_version = dbVersion;

        this.db_instance = null;

        this.index_name_path = indexNameAndPath || null;
    }


    initializeDB() {
        return new Promise((resolve, reject) => {
            const dbRequest = indexedDB.open(this.db_name, this.db_version);

            // events
            dbRequest.onerror = (failedEvent) => {
                reject(failedEvent.target.errorCode);
            }

            dbRequest.onsuccess = (openEvent) => {
                // initialize
                this.db_instance = openEvent.target.result;

                resolve(this.db_instance);
            }

            // on first time: will be fired
            // 1. Create a store and necessary indexes
            dbRequest.onupgradeneeded = (upgradeEvent) => {
                let db = upgradeEvent.target.result;

                // create a store
                let dataStore = db.createObjectStore(
                    this.store_name,
                    {
                        autoIncrement: true
                    }
                )

                // an index on the tag property (from store)
                // {name: 'some', age: 12, tag: 'some-uuid'}
                if (this.index_name_path) {
                    let tagIndex = dataStore.createIndex(
                        this.index_name_path,
                        this.index_name_path, {
                        unique: true
                    }
                    )
                }


            }
        });

    }

    getTransaction(transactionType) {
        let newTransaction;

        if (transactionType === 1) {
            newTransaction = this.db_instance.transaction(this.store_name, 'readwrite');

        } else {
            newTransaction = this.db_instance.transaction(this.store_name, 'readonly');
        }

        // is transaction done?: close the db for all transactions
        newTransaction.oncomplete = (e) => {
            this.db_instance.close();
        };

        return newTransaction
    }

    read() {
        return new Promise((resolve, reject) => {
            let foundRecords = [];
            let storeToReadFrom = this.getTransaction(2).objectStore(this.store_name);

            let request = storeToReadFrom.openCursor();

            request.onsuccess = (event) => {
                let cursor = event.target.result;
                if (cursor) {
                    foundRecords.push(cursor.value);
                    cursor.continue();

                } else {
                    // No more records, resolve the promise
                    resolve(foundRecords);
                }
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    add(dataToAdd) {
        // 1. get transaction & and add to the store
        let attachedStore = this.getTransaction(1).objectStore(this.store_name);

        let queryInstance = attachedStore.put(dataToAdd);


        queryInstance.onerror = (e) => {
            console.log('Issues:', e.target.errorCode);
        };
    }
}

class Chatbot {
    constructor(options = {}) {
        this.options = {
            endpoint: options.api_endpoint || "",
            variant: options.variant || 1,
            avatar: options.avatar || 'https://picsum.photos/200',
            title: options.title || 'Chat Assistant',
            welcomeMessage: options.welcomeMessage || 'Hello! How can I help you today?',
            default: "Oops, check your network, it appears to be down..."
        }

        this.init();
    }

    init() {
        this.createElements();
        this.attachEventListeners();
        this.setUpStorage();
    }

    setUpStorage() {
        this.dbManager = new PersistenceManager(
            'uchat',
            'queue',
            1,
            'stamp'
        )
    }

    generateNewTag() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    saveRecordIntoStorage(recordToSave) {
        this.dbManager.initializeDB().then(() => {
            // console.log('>', dbManager);
            this.dbManager.add(recordToSave);
        }

        ).catch(error => {
            console.log('i-e:', error)
        })
    }

    formatAndRecordQueries(dataQuery, queryType) {
        this.saveRecordIntoStorage(
            {
                role: queryType == 1 ? 'user' : 'assistant',
                content: dataQuery,
                stamp: this.generateNewTag()
            }
        )
    }

    async loadBotResponse(queryMessage, typingHandle) {
        try {
            // Save user message
            await this.formatAndRecordQueries(queryMessage, 1);

            // Initialize DB
            await this.dbManager.initializeDB();

            // Read messages - now returns a promise
            const rawMessageQueue = await this.dbManager.read();

            // Make API call
            new ResponseCall(
                this.options.endpoint,
                rawMessageQueue
            ).seek(
                (aiResponse) => {
                    // save ai response
                    this.formatAndRecordQueries(aiResponse.message, 2);

                    // show the ai message
                    typingHandle.remove();

                    this.addMessage(aiResponse.message, 'bot');
                },
                (e) => {
                    console.log('API Error:', e);

                    typingHandle.remove();

                    this.addMessage('There was an API error, please try again', 'bot');
                }
            );
        } catch (error) {
            console.log('Error:', error);

            typingHandle.remove();

            this.addMessage('There was an issue, please refresh and try again', 'bot');
        }
    }

    createElements() {
        // Create toggle button
        const toggleButton = document.createElement('div');
        toggleButton.className = `uc-chat-toggle uc-variant-${this.options.variant}`;
        toggleButton.innerHTML = `
            <i class="bx bx-message-dots"></i>
        `;

        // Create chatbot container
        const chatbot = document.createElement('div');
        chatbot.className = `uc-chatbot uc-variant-${this.options.variant}`;
        chatbot.innerHTML = `
            <div class="uc-chat-header">
                <div class="uc-chat-avatar">
                    <img src="${this.options.avatar}" alt="${this.options.title}">
                </div>
                <div class="uc-chat-title">${this.options.title}</div>
                <div class="uc-chat-close">✕</div>
            </div>
            <div class="uc-chat-messages">
                <div class="uc-message uc-message-bot">
                    ${this.options.welcomeMessage}
                </div>
            </div>
            <div class="uc-chat-input">
                <form class="uc-input-form">
                    <textarea 
                        class="uc-message-input" 
                        placeholder="Type your inquiry and press enter"
                        rows="1"
                    ></textarea>
                    <button type="submit" class="uc-send-button">
                        <i class='bx bx-send'></i>
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(toggleButton);

        document.body.appendChild(chatbot);

        // Store elements as properties
        this.toggleButton = toggleButton;

        this.chatbot = chatbot;

        this.closeButton = chatbot.querySelector('.uc-chat-close');

        this.messagesContainer = chatbot.querySelector('.uc-chat-messages');

        this.inputForm = chatbot.querySelector('.uc-input-form');

        this.messageInput = chatbot.querySelector('.uc-message-input');
    }

    attachEventListeners() {
        this.toggleButton.addEventListener('click', () => this.openChat());

        this.closeButton.addEventListener('click', () => this.closeChat());

        this.messageInput.addEventListener('input', () => this.adjustTextareaHeight());

        this.inputForm.addEventListener('submit', (e) => this.handleSubmit(e));

        this.messageInput.addEventListener('keypress', (e) => this.handleKeyPress(e));

        window.addEventListener('resize', () => this.handleResize());
    }

    openChat() {
        this.chatbot.style.display = 'flex';
        this.toggleButton.style.display = 'none';
        // Trigger reflow
        this.chatbot.offsetHeight;
        this.chatbot.classList.add('show');
        this.messageInput.focus();
    }

    closeChat() {
        this.chatbot.classList.remove('show');
        setTimeout(() => {
            this.chatbot.style.display = 'none';
            this.toggleButton.style.display = 'flex';
        }, 300);
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    handleNetworkIssues(handleElement) {
        handleElement.remove();

        this.addMessage(this.options.default, 'bot');
    }


    handleSubmit(e) {
        e.preventDefault();

        const message = this.messageInput.value.trim();

        if (!message) return;

        const userMessageContainer = this.addMessage(message, 'user');

        this.messageInput.value = '';

        this.messageInput.style.height = 'auto';

        let typingHandle = this.showTypingIndicator(userMessageContainer);

        if (!navigator.onLine) {
            this.handleNetworkIssues(typingHandle);
        } else {
            // get response
            let userQuery = userMessageContainer.textContent.toLowerCase()

            this.loadBotResponse(userQuery, typingHandle);
        }

    }

    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.inputForm.dispatchEvent(new Event('submit'));
        }
    }

    handleResize() {
        if (window.innerWidth < 768) {
            this.chatbot.style.borderRadius = '0';
        } else {
            this.chatbot.style.borderRadius = '12px';
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `uc-message uc-message-${sender}`;
        messageDiv.textContent = text;
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return messageDiv;
    }

    showTypingIndicator(afterElement) {
        const typingIndicator = document.createElement('div');

        typingIndicator.className = 'uc-typing-indicator';

        typingIndicator.innerHTML = `
                <span class="uc-typing-dot"></span>
                <span class="uc-typing-dot"></span>
                <span class="uc-typing-dot"></span>
            `;

        afterElement.insertAdjacentElement('afterend', typingIndicator);

        typingIndicator.style.display = 'block';

        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        return typingIndicator;
    }

}

function loadRequirements() {
    // Create new link elements
    const boxiconsLink = document.createElement('link');

    boxiconsLink.href = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';

    boxiconsLink.rel = 'stylesheet';

    const chatbotLink = document.createElement('link');

    chatbotLink.href = 'https://uchat.pythonanywhere.com/static/_uc/ubot.css';

    chatbotLink.rel = 'stylesheet';

    // js
    const axiosScript = document.createElement('script');

    axiosScript.src = 'https://uchat.pythonanywhere.com/static/site/js/axios.min.js';

    axiosScript.defer = true;

    // add the new link elements to the head
    document.head.appendChild(boxiconsLink);

    document.head.appendChild(chatbotLink);

    document.head.appendChild(axiosScript);
};

function loadUChat() {
    loadRequirements();

    // make the bot appear
    const bot = new Chatbot(w.$uchat.config);

    console.log();
}