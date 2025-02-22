class StepIndicator {
    constructor(containerId, steps = ['Data', 'Prompt', 'Chat']) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with ID "${containerId}" not found`);
            return;
        }
        this.steps = steps;
        this.defaultColor = '#71869d';
        this.activeColors = {
            default: '#098842',
            last: '#fdba74'
        };
        this.render();
    }

    render() {
        // Create main container
        this.stepsContainer = document.createElement('div');
        this.stepsContainer.className = 'ucc-steps-container';

        // Create steps
        this.steps.forEach((stepName, index) => {
            const stepNumber = index + 1;
            const isLastStep = index === this.steps.length - 1;

            // Create step wrapper (includes node and connector)
            const stepWrapper = document.createElement('div');
            stepWrapper.className = 'ucc-step-wrapper';

            // Create step node
            const stepNode = document.createElement('div');
            stepNode.className = 'ucc-step-node';

            // Create circle
            const circle = document.createElement('div');
            circle.className = 'ucc-circle';
            circle.textContent = stepNumber;
            circle.dataset.stepIndex = index;
            if (isLastStep) {
                circle.classList.add('ucc-last-node');
            }

            // Create label
            const label = document.createElement('div');
            label.className = 'ucc-step-label';
            label.textContent = stepName;

            // Append circle and label to step node
            stepNode.appendChild(circle);
            stepNode.appendChild(label);
            stepWrapper.appendChild(stepNode);

            // Add connector line (except for last step)
            if (index < this.steps.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'ucc-connector';
                stepWrapper.appendChild(connector);
            }

            this.stepsContainer.appendChild(stepWrapper);
        });

        // Append to container
        this.container.appendChild(this.stepsContainer);
    }

    update(stepNumber) {
        if (stepNumber < 1 || stepNumber > this.steps.length) {
            console.error(`Invalid step number: ${stepNumber}`);
            return;
        }

        const circles = this.container.querySelectorAll('.ucc-circle');
        const targetIndex = stepNumber - 1;

        // Update only the specified node
        const isLastNode = targetIndex === this.steps.length - 1;
        const activeColor = isLastNode ? this.activeColors.last : this.activeColors.default;
        circles[targetIndex].style.backgroundColor = activeColor;
    }

    reset(stepNumber) {
        if (stepNumber < 1 || stepNumber > this.steps.length) {
            console.error(`Invalid step number: ${stepNumber}`);
            return;
        }

        const circles = this.container.querySelectorAll('.ucc-circle');
        circles[stepNumber - 1].style.backgroundColor = this.defaultColor;
    }

    resetAll() {
        const circles = this.container.querySelectorAll('.ucc-circle');
        circles.forEach(circle => {
            circle.style.backgroundColor = this.defaultColor;
        });
    }

    // Method to set custom colors if needed
    setColors(defaultColor, activeColor, lastNodeColor) {
        if (defaultColor) this.defaultColor = defaultColor;
        if (activeColor) this.activeColors.default = activeColor;
        if (lastNodeColor) this.activeColors.last = lastNodeColor;

        // Apply default color to all nodes
        const circles = this.container.querySelectorAll('.ucc-circle');
        circles.forEach(circle => {
            circle.style.backgroundColor = this.defaultColor;
        });
    }
}