// Analytics Manager with Real-time Updates
const AnalyticsManager = {
    charts: {},
    updateInterval: null,

    // Initialize analytics
    init() {
        console.log('📊 Analytics Manager initialized');
        this.createAllGraphs();
    },

    // Create all graphs
    createAllGraphs() {
        this.createProbabilityGraph();
        this.createPerformanceGraph();
        this.createLetterFrequencyGraph();
    },

    // Update all graphs
    updateAllGraphs() {
        this.updateProbabilityGraph();
        this.updatePerformanceGraph();
        this.updateLetterFrequencyGraph();
    },

    // Real-time Probability Distribution Graph
    updateProbabilityGraph(probabilities = null) {
        const data = probabilities || AIEngine.state.currentProbabilities;
        
        if (!data || data.length === 0) {
            // Show dummy data if no real data
            const dummyData = CONFIG.WORDS.slice(0, 8).map(word => ({
                word,
                score: Math.random() * 10
            }));
            this.renderProbabilityGraph(dummyData);
            return;
        }

        this.renderProbabilityGraph(data.slice(0, 10));
    },

    // Render probability graph
    renderProbabilityGraph(data) {
        const trace = {
            x: data.map(d => d.word.toUpperCase()),
            y: data.map(d => d.score),
            type: 'bar',
            marker: {
                color: data.map(d => d.score),
                colorscale: [
                    [0, '#30363d'],
                    [0.5, '#58a6ff'],
                    [1, '#2ea043']
                ],
                line: {
                    color: '#79c0ff',
                    width: 2
                }
            },
            hovertemplate: '<b>%{x}</b><br>Score: %{y:.2f}<extra></extra>'
        };

        const layout = {
            paper_bgcolor: '#0d1117',
            plot_bgcolor: '#0d1117',
            font: { color: '#c9d1d9', family: 'monospace' },
            xaxis: { 
                gridcolor: '#30363d',
                title: { text: 'Top Word Candidates', font: { size: 12 } }
            },
            yaxis: { 
                gridcolor: '#30363d',
                title: { text: 'Probability Score', font: { size: 12 } }
            },
            margin: { t: 20, b: 50, l: 50, r: 20 },
            transition: {
                duration: 500,
                easing: 'cubic-in-out'
            }
        };

        const config = { 
            responsive: true, 
            displayModeBar: false 
        };

        Plotly.react('probabilityGraph', [trace], layout, config);
    },

    // Performance Over Time Graph
    updatePerformanceGraph() {
        const history = AIEngine.state.performanceHistory;
        
        if (!history || history.length === 0) {
            // Dummy data
            const dummy = Array.from({ length: 10 }, (_, i) => ({
                game: i + 1,
                guesses: Math.floor(Math.random() * 3) + 3,
                won: Math.random() > 0.3
            }));
            this.renderPerformanceGraph(dummy);
            return;
        }

        this.renderPerformanceGraph(history.slice(-30));
    },

    // Render performance graph
    renderPerformanceGraph(history) {
        const trace = {
            x: history.map(h => h.game),
            y: history.map(h => h.guesses),
            type: 'scatter',
            mode: 'lines+markers',
            line: { 
                color: '#58a6ff',
                width: 3,
                shape: 'spline'
            },
            marker: {
                size: 8,
                color: history.map(h => h.won ? '#2ea043' : '#f85149'),
                line: {
                    color: '#c9d1d9',
                    width: 1
                }
            },
            hovertemplate: '<b>Game %{x}</b><br>Guesses: %{y}<extra></extra>'
        };

        // Add trend line
        const trendTrace = {
            x: history.map(h => h.game),
            y: this.calculateTrendLine(history.map(h => h.guesses)),
            type: 'scatter',
            mode: 'lines',
            line: {
                color: '#d29922',
                width: 2,
                dash: 'dash'
            },
            name: 'Trend',
            hoverinfo: 'skip'
        };

        const layout = {
            paper_bgcolor: '#0d1117',
            plot_bgcolor: '#0d1117',
            font: { color: '#c9d1d9', family: 'monospace' },
            xaxis: { 
                gridcolor: '#30363d',
                title: { text: 'Game Number', font: { size: 12 } }
            },
            yaxis: { 
                gridcolor: '#30363d',
                title: { text: 'Guesses to Solve', font: { size: 12 } },
                range: [0, 7]
            },
            margin: { t: 20, b: 50, l: 50, r: 20 },
            showlegend: false,
            transition: {
                duration: 500,
                easing: 'cubic-in-out'
            }
        };

        const config = { 
            responsive: true, 
            displayModeBar: false 
        };

        Plotly.react('performanceGraph', [trace, trendTrace], layout, config);
    },

    // Calculate trend line
    calculateTrendLine(values) {
        if (values.length < 2) return values;
        
        const n = values.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumX2 += i * i;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return values.map((_, i) => slope * i + intercept);
    },

    // Letter Frequency Graph
    updateLetterFrequencyGraph() {
        const frequencies = AIEngine.state.letterFrequency;
        
        if (!frequencies || Object.keys(frequencies).length === 0) {
            return;
        }

        const sorted = Object.entries(frequencies)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15);

        this.renderLetterFrequencyGraph(sorted);
    },

    // Render letter frequency graph
    renderLetterFrequencyGraph(data) {
        const trace = {
            x: data.map(([letter]) => letter.toUpperCase()),
            y: data.map(([, freq]) => freq),
            type: 'bar',
            marker: {
                color: '#58a6ff',
                line: {
                    color: '#79c0ff',
                    width: 2
                }
            },
            hovertemplate: '<b>%{x}</b><br>Frequency: %{y:.3f}<extra></extra>'
        };

        const layout = {
            paper_bgcolor: '#0d1117',
            plot_bgcolor: '#0d1117',
            font: { color: '#c9d1d9', family: 'monospace' },
            xaxis: { 
                gridcolor: '#30363d',
                title: { text: 'Letters', font: { size: 12 } }
            },
            yaxis: { 
                gridcolor: '#30363d',
                title: { text: 'Frequency Score', font: { size: 12 } }
            },
            margin: { t: 20, b: 50, l: 50, r: 20 },
            transition: {
                duration: 500,
                easing: 'cubic-in-out'
            }
        };

        const config = { 
            responsive: true, 
            displayModeBar: false 
        };

        Plotly.react('letterGraph', [trace], layout, config);
    },

    // Start real-time updates
    startRealTimeUpdates() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            if (GameState.mode === 'ai' && !GameState.gameOver) {
                this.updateProbabilityGraph();
            }
        }, 1000); // Update every second during AI gameplay
    },

    // Stop real-time updates
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    },

    // Create stats display
    updateStatsDisplay() {
        const stats = AIEngine.getStats();
        
        const elements = {
            'gamesPlayed': stats.gamesPlayed,
            'winRate': stats.winRate + '%',
            'avgGuesses': stats.avgGuesses,
            'learningRate': stats.learningProgress + '%'
        };

        for (let [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }
    }
};

// Export
window.AnalyticsManager = AnalyticsManager;
