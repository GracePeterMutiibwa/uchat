class Chatbot {
    constructor(options = {}) {
        this.options = {
            variant: options.variant || 1,
            avatar: options.avatar || 'https://picsum.photos/200',
            title: options.title || 'Chat Assistant',
            welcomeMessage: options.welcomeMessage || 'Hello! How can I help you today?',
            responses: options.responses || {
                default: "I'm not sure how to respond to that. Could you please rephrase?",
                hello: "Hello! How can I assist you today?",
                help: "I'm here to help! What would you like to know?",
                bye: "Goodbye! Have a great day!"
            }
        };

        this.init();
    }

    init() {
        this.createElements();
        this.attachEventListeners();
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

    handleSubmit(e) {
        e.preventDefault();
        const message = this.messageInput.value.trim();
        if (!message) return;

        const userMessage = this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        this.showTypingIndicator(userMessage);
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

        setTimeout(() => {
            typingIndicator.remove();
            const response = this.getBotResponse(afterElement.textContent.toLowerCase());
            this.addMessage(response, 'bot');
        }, 1500);
    }

    getBotResponse(message) {
        const keywords = Object.keys(this.options.responses);
        const matchedKeyword = keywords.find(keyword => message.includes(keyword));
        return this.options.responses[matchedKeyword] || this.options.responses.default;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const loadRequirements = () => {
        // Create new link elements
        const boxiconsLink = document.createElement('link');
        boxiconsLink.href = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';
        boxiconsLink.rel = 'stylesheet';

        const chatbotLink = document.createElement('link');

        chatbotLink.href = 'https://uchat.pythonanywhere.com/static/_uc/ubot.css';

        chatbotLink.rel = 'stylesheet';

        // add the new link elements to the head
        document.head.appendChild(boxiconsLink);

        document.head.appendChild(chatbotLink);
    };



    loadRequirements();

    const chatbot = new Chatbot({
        variant: 2
    });

    // Or with custom options
    // const chatbot = new Chatbot({
    //     variant: 2, // 1 for left side, 2 for right side
    //     avatar: 'path/to/avatar.jpg',
    //     title: 'Support Chat',
    //     welcomeMessage: 'Welcome! How can I assist you?',
    //     responses: {
    //         default: 'I understand your message. How can I help further?',
    //         hello: 'Hi there! How can I assist you today?',
    //         help: 'I'm here to help! What do you need?',
    //         // Add more custom responses
    //     }
    // });
})