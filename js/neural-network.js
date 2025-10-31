// Neural Network Visualization
const NeuralNetworkViz = {
    canvas: null,
    ctx: null,
    model: null,
    nodes: [],
    connections: [],
    animationFrame: null,

    // Initialize
    async init() {
        this.canvas = document.getElementById('neuralCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        
        await this.createModel();
        this.setupNetwork();
        this.startAnimation();
    },

    // Resize canvas
    resizeCanvas() {
        if (!this.canvas) return;
        
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = Math.max(300, rect.height - 100);
    },

    // Create TensorFlow model
    async createModel() {
        this.model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [26], units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 16, activation: 'relu' }),
                tf.layers.dense({ units: 5, activation: 'softmax' })
            ]
        });

        this.model.compile({
            optimizer: tf.train.adam(CONFIG.AI_LEARNING_RATE),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        console.log('🧠 Neural Network Model created');
    },

    // Setup network visualization
    setupNetwork() {
        const layers = [26, 64, 32, 16, 5]; // Layer sizes
        const width = this.canvas.width;
        const height = this.canvas.height;
        const layerSpacing = width / (layers.length + 1);

        this.nodes = [];
        this.connections = [];

        // Create nodes
        layers.forEach((size, layerIdx) => {
            const x = layerSpacing * (layerIdx + 1);
            const nodeSpacing = height / (size + 1);

            for (let i = 0; i < size; i++) {
                const y = nodeSpacing * (i + 1);
                this.nodes.push({
                    x, y,
                    layer: layerIdx,
                    index: i,
                    activation: 0,
                    radius: size > 20 ? 3 : 6
                });
            }
        });

        // Create connections (sample, not all)
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const nextLayerNodes = this.nodes.filter(n => n.layer === node.layer + 1);

            // Connect to random subset of next layer
            nextLayerNodes.forEach((nextNode, idx) => {
                if (Math.random() > 0.7 || node.layer === layers.length - 2) {
                    this.connections.push({
                        from: node,
                        to: nextNode,
                        weight: Math.random(),
                        active: false
                    });
                }
            });
        }
    },

    // Animate network
    startAnimation() {
        const animate = () => {
            this.render();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    },

    // Render network
    render() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections
        this.connections.forEach(conn => {
            ctx.beginPath();
            ctx.moveTo(conn.from.x, conn.from.y);
            ctx.lineTo(conn.to.x, conn.to.y);
            ctx.strokeStyle = conn.active 
                ? `rgba(88, 166, 255, ${conn.weight})`
                : `rgba(48, 54, 61, ${conn.weight * 0.3})`;
            ctx.lineWidth = conn.active ? 2 : 1;
            ctx.stroke();
        });

        // Draw nodes
        this.nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            
            if (node.activation > 0) {
                ctx.fillStyle = `rgba(46, 160, 67, ${node.activation})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#2ea043';
            } else {
                ctx.fillStyle = '#58a6ff';
                ctx.shadowBlur = 0;
            }
            
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Draw layer labels
        ctx.fillStyle = '#8b949e';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        
        const layerNames = ['Input', 'Hidden 1', 'Hidden 2', 'Hidden 3', 'Output'];
        const width = this.canvas.width;
        const layerSpacing = width / 6;
        
        layerNames.forEach((name, idx) => {
            ctx.fillText(name, layerSpacing * (idx + 1), 20);
        });
    },

    // Activate network (simulate forward pass)
    async activate(inputData) {
        // Activate input layer
        for (let i = 0; i < 26 && i < this.nodes.length; i++) {
            this.nodes[i].activation = inputData[i] || Math.random();
        }

        // Propagate through layers with delay
        for (let layer = 0; layer < 4; layer++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const layerNodes = this.nodes.filter(n => n.layer === layer + 1);
            layerNodes.forEach(node => {
                node.activation = Math.random() * 0.8 + 0.2;
            });

            // Activate connections
            this.connections.forEach(conn => {
                if (conn.from.layer === layer) {
                    conn.active = true;
                    setTimeout(() => conn.active = false, 300);
                }
            });
        }

        // Reset activations
        setTimeout(() => {
            this.nodes.forEach(n => n.activation = 0);
        }, 2000);
    },

    // Train model with data
    async train(games) {
        if (!this.model || games.length < 10) return;

        const inputs = [];
        const outputs = [];

        games.slice(-50).forEach(game => {
            // Create input vector (simplified)
            const input = new Array(26).fill(0);
            const output = new Array(5).fill(game.won ? 0.8 : 0.2);
            
            inputs.push(input);
            outputs.push(output);
        });

        const xs = tf.tensor2d(inputs);
        const ys = tf.tensor2d(outputs);

        await this.model.fit(xs, ys, {
            epochs: CONFIG.AI_EPOCHS,
            batchSize: CONFIG.AI_BATCH_SIZE,
            verbose: 0,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    this.updateStats(epoch, logs);
                }
            }
        });

        xs.dispose();
        ys.dispose();
    },

    // Update neural stats display
    updateStats(epoch, logs) {
        const statsContainer = document.getElementById('neuralStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="neural-stat">
                <div class="neural-stat-label">Epoch</div>
                <div class="neural-stat-value">${epoch + 1}</div>
            </div>
            <div class="neural-stat">
                <div class="neural-stat-label">Loss</div>
                <div class="neural-stat-value">${logs.loss.toFixed(4)}</div>
            </div>
            <div class="neural-stat">
                <div class="neural-stat-label">Accuracy</div>
                <div class="neural-stat-value">${(logs.acc * 100).toFixed(1)}%</div>
            </div>
        `;
    },

    // Stop animation
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
};

// Export
window.NeuralNetworkViz = NeuralNetworkViz;
