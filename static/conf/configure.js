// flow-diagram.js
document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('canvas');
    const svg = document.getElementById('connections');
    const nodes = document.querySelectorAll('.node');
    let selectedNode = null;

    function updateConnections() {
        svg.innerHTML = '';
        const nodes = document.querySelectorAll('.node');
        const isMobile = window.innerWidth <= 768;
        const canvasRect = canvas.getBoundingClientRect();

        if (isMobile) return; // Don't draw connections on mobile

        nodes.forEach((node, i) => {
            if (i < nodes.length - 1) {
                const start = node.getBoundingClientRect();
                const end = nodes[i + 1].getBoundingClientRect();
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

                // Calculate positions relative to canvas
                const startX = start.x - canvasRect.left + start.width;
                const startY = start.y - canvasRect.top + start.height / 2;
                const endX = end.x - canvasRect.left;
                const endY = end.y - canvasRect.top + end.height / 2;
                const midX = (startX + endX) / 2;

                path.setAttribute(
                    'd',
                    `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`
                );
                path.classList.add('connector');
                svg.appendChild(path);
            }
        });
    }

    // Initialize node positions
    nodes.forEach((node, index) => {
        node.style.left = `${50 + index * 200}px`;
        node.style.top = `${50 + index * 100}px`;
    });

    // Drag and drop handlers
    nodes.forEach(node => {
        node.addEventListener('dragstart', (e) => {
            selectedNode = node;
            node.style.opacity = '0.5';
        });

        node.addEventListener('dragend', (e) => {
            selectedNode = null;
            node.style.opacity = '1';
            updateConnections();
        });
    });

    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        if (selectedNode) {
            const rect = canvas.getBoundingClientRect();
            selectedNode.style.left = `${e.clientX - rect.left - selectedNode.offsetWidth / 2}px`;
            selectedNode.style.top = `${e.clientY - rect.top - selectedNode.offsetHeight / 2}px`;
            updateConnections();
        }
    });

    // Update connections on window resize
    window.addEventListener('resize', updateConnections);

    // Initial connection drawing
    updateConnections();
});