class Stall {
    constructor(message, type = 'spinner') {
        this.message = message;
        // 'spinner' or 'progress'
        this.type = type;
        this.backdrop = null;
        this.progress = 0;
        this.initialize();
    }

    initialize() {
        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'stall-backdrop';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'stall-modal';

        // Add message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'stall-message';
        messageDiv.textContent = this.message;
        modal.appendChild(messageDiv);

        // Add loading indicator
        if (this.type === 'spinner') {
            const spinner = document.createElement('div');
            spinner.className = 'stall-spinner';
            modal.appendChild(spinner);
        } else {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'stall-progress-container';

            const progressBar = document.createElement('div');
            progressBar.className = 'stall-progress-bar';
            this.progressBar = progressBar;

            progressContainer.appendChild(progressBar);
            modal.appendChild(progressContainer);
        }

        this.backdrop.appendChild(modal);
        document.body.appendChild(this.backdrop);
    }

    show() {
        this.backdrop.style.display = 'flex';
        return this;
    }

    hide() {
        this.backdrop.style.display = 'none';
        return this;
    }

    updateProgress(percentage) {
        if (this.type === 'progress' && this.progressBar) {
            this.progress = Math.min(100, Math.max(0, percentage));
            this.progressBar.style.width = `${this.progress}%`;
        }
        return this;
    }

    destroy() {
        if (this.backdrop && this.backdrop.parentNode) {
            this.backdrop.parentNode.removeChild(this.backdrop);
        }
    }
}