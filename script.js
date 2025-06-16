// Enhanced Stock Analysis Application with AI Prediction
class StockAnalyzer {
    constructor() {
        this.chart = null;
        this.currentStock = null;
        this.watchlist = this.loadWatchlist();
        this.isComparisonMode = false;
        this.comparisonStock = null;
        this.predictionModel = null;
        this.predictions = null;

        // API Configuration
        this.API_CONFIG = {
            ALPHA_VANTAGE: {
                key: 'XRCVL3EKHESVCKFY',
                baseUrl: 'https://www.alphavantage.co/query'
            },

            FINNHUB: {
                key: 'd16l8vhr01qvtdbj9otgd16l8vhr01qvtdbj9ou',
                baseUrl: 'https://finnhub.io/api/v1'
            },

            NEWS_API: {
                key: 'ae648bc67c8245cc8a86bd6760365bd',
                baseUrl: 'https://newsapi.org/v2'
            }
        };

        this.initializeEventListeners();
        this.initializeChart();
        this.updateWatchlistDisplay();
        this.createFloatingElements();
        this.checkAPIConfiguration();
    }

    checkAPIConfiguration() {
        const hasValidKeys = Object.values(this.API_CONFIG).some(config =>
            config.key && config.key !== 'YOUR_API_KEY' && !config.key.includes('YOUR_')
        );

        if (!hasValidKeys) {
            this.showSetupMessage();
        }
    }

    showSetupMessage() {
        const setupMessage = document.createElement('div');
        setupMessage.className = 'setup-message';
        setupMessage.innerHTML = `
            <h3>🔧 API Setup Required</h3>
            <p>To use real stock data, configure your API keys in the application:</p>
            <ul>
                <li><strong>Alpha Vantage:</strong> <a href="https://www.alphavantage.co/support/#api-key" target="_blank">Get Free API Key</a></li>
                <li><strong>Finnhub:</strong> <a href="https://finnhub.io/register" target="_blank">Get Free API Key</a></li>
                <li><strong>News API:</strong> <a href="https://newsapi.org/register" target="_blank">Get Free API Key</a></li>
            </ul>
            <p>Demo mode with AI predictions will be used until APIs are configured.</p>
            <button onclick="this.parentElement.remove()">Got it!</button>
        `;
        setupMessage.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: var(--glass-bg); backdrop-filter: blur(10px);
            border: 1px solid var(--accent-blue); border-radius: 15px;
            padding: 2rem; max-width: 500px; z-index: 1000; color: var(--text-primary);
        `;
        document.body.appendChild(setupMessage);
    }

    initializeEventListeners() {
        document.getElementById('search-btn').addEventListener('click', () => this.searchStock());
        document.getElementById('stock-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchStock();
        });
        document.getElementById('compare-btn').addEventListener('click', () => this.toggleComparisonMode());
        document.getElementById('predict-btn').addEventListener('click', () => this.runPrediction());
        document.getElementById('add-to-watchlist').addEventListener('click', () => this.addToWatchlist());
        document.getElementById('contrast-toggle').addEventListener('click', () => this.toggleContrast());
        document.getElementById('prediction-days').addEventListener('change', () => this.updatePrediction());
        document.getElementById('prediction-model').addEventListener('change', () => this.updatePrediction());

        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            if (toggle.id !== 'contrast-toggle') {
                toggle.addEventListener('click', () => this.toggleIndicator(toggle));
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        document.getElementById('stock-input').focus();
                        break;
                }
            }
        });
    }

    createFloatingElements() {
        const container = document.querySelector('.background-animation');
        for (let i = 0; i < 25; i++) {
            const element = document.createElement('div');
            element.className = 'floating-element';
            element.style.left = Math.random() * 100 + '%';
            element.style.animationDelay = Math.random() * 15 + 's';
            element.style.animationDuration = (Math.random() * 10 + 10) + 's';
            container.appendChild(element);
        }
    }

    initializeChart() {
        const ctx = document.getElementById('stock-chart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(26, 26, 46, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(0, 212, 255, 0.5)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.dataset.label && context.dataset.label.includes('Prediction')) {
                                    label += '$' + context.parsed.y.toFixed(2) + ' (Predicted)';
                                } else if (context.dataset.yAxisID === 'rsi') {
                                    label += context.parsed.y.toFixed(2);
                                } else if (context.dataset.yAxisID === 'macd') {
                                    label += context.parsed.y.toFixed(4);
                                } else if (context.dataset.yAxisID === 'volume') {
                                    label += context.parsed.y.toFixed(1) + 'M';
                                } else {
                                    label += '$' + context.parsed.y.toFixed(2);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                        ticks: { color: '#b0b0b0', maxTicksLimit: 10, font: { size: 11 } }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                        ticks: {
                            color: '#b0b0b0',
                            font: { size: 11 },
                            callback: function(value) { return '$' + value.toFixed(2); }
                        }
                    }
                },
                elements: {
                    point: { radius: 0, hoverRadius: 5 },
                    line: { borderJoinStyle: 'round' }
                },
                animation: { duration: 750, easing: 'easeInOutQuart' }
            }
        });
    }

    async searchStock() {
        const symbol = document.getElementById('stock-input').value.trim().toUpperCase();
        if (!symbol) {
            this.showError('Please enter a stock symbol');
            return;
        }

        this.showLoading();

        try {
            let stockData;

            if (this.isAPIConfigured()) {
                stockData = await this.fetchRealStockData(symbol);
            } else {
                console.log('Using demo data - configure API keys for real data');
                stockData = await this.generateDemoData(symbol);
            }

            if (this.isComparisonMode && this.currentStock) {
                this.comparisonStock = { symbol, data: stockData };
                this.updateComparisonChart();
            } else {
                this.currentStock = { symbol, data: stockData };
                this.updateMainChart();
            }

            this.calculateIndicators();
            this.updateStockInfo();
            this.fetchNews(symbol);
            this.hideLoading();

        } catch (error) {
            console.error('Error fetching stock data:', error);
            this.showError(`Failed to fetch data for ${symbol}. Please check the symbol and try again.`);
            this.hideLoading();
        }
    }

    isAPIConfigured() {
        return this.API_CONFIG.ALPHA_VANTAGE.key &&
               !this.API_CONFIG.ALPHA_VANTAGE.key.includes('YOUR_') &&
               this.API_CONFIG.ALPHA_VANTAGE.key.length > 10;
    }

    async fetchRealStockData(symbol) {
        try {
            const response = await fetch(
                `${this.API_CONFIG.ALPHA_VANTAGE.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.API_CONFIG.ALPHA_VANTAGE.key}`
            );

            const data = await response.json();

            if (data['Error Message']) throw new Error('Invalid stock symbol');
            if (data['Note']) throw new Error('API call limit reached. Please try again later.');

            const timeSeries = data['Time Series (Daily)'];
            if (!timeSeries) throw new Error('No data available for this symbol');

            const stockData = Object.entries(timeSeries)
                .slice(0, 100)
                .reverse()
                .map(([date, values]) => ({
                    date,
                    price: parseFloat(values['4. close']),
                    volume: parseInt(values['5. volume']),
                    high: parseFloat(values['2. high']),
                    low: parseFloat(values['3. low']),
                    open: parseFloat(values['1. open'])
                }));

            return stockData;

        } catch (error) {
            console.error('Alpha Vantage API error:', error);

            if (this.API_CONFIG.FINNHUB.key && !this.API_CONFIG.FINNHUB.key.includes('YOUR_')) {
                return await this.fetchFinnhubData(symbol);
            }

            throw error;
        }
    }

    async fetchFinnhubData(symbol) {
        try {
            const to = Math.floor(Date.now() / 1000);
            const from = to - (100 * 24 * 60 * 60);

            const response = await fetch(
                `${this.API_CONFIG.FINNHUB.baseUrl}/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${this.API_CONFIG.FINNHUB.key}`
            );

            const data = await response.json();

            if (data.s !== 'ok') throw new Error('No data available for this symbol');

            const stockData = data.t.map((timestamp, index) => ({
                date: new Date(timestamp * 1000).toISOString().split('T')[0],
                price: data.c[index],
                volume: data.v[index],
                high: data.h[index],
                low: data.l[index],
                open: data.o[index]
            }));

            return stockData;

        } catch (error) {
            console.error('Finnhub API error:', error);
            throw error;
        }
    }

    async generateDemoData(symbol) {
        const days = 100;
        const data = [];
        let price = 100 + Math.random() * 200;

        for (let i = 0; i < days; i++) {
            const change = (Math.random() - 0.5) * 10;
            price = Math.max(price + change, 10);

            const date = new Date();
            date.setDate(date.getDate() - (days - i));

            data.push({
                date: date.toISOString().split('T')[0],
                price: parseFloat(price.toFixed(2)),
                volume: Math.floor(Math.random() * 10000000) + 1000000,
                high: price * (1 + Math.random() * 0.05),
                low: price * (1 - Math.random() * 0.05),
                open: price * (0.95 + Math.random() * 0.1)
            });
        }

        return data;
    }

    // AI Prediction Methods
    async runPrediction() {
        if (!this.currentStock) {
            this.showError('Please select a stock first');
            return;
        }

        const predictionSection = document.getElementById('prediction-section');
        predictionSection.style.display = 'block';

        const modelType = document.getElementById('prediction-model').value;
        const days = parseInt(document.getElementById('prediction-days').value);

        this.showTrainingProgress();

        try {
            switch (modelType) {
                case 'lstm':
                    try {
                        await this.trainLSTMModel(days);
                    } catch (lstmError) {
                        console.warn('LSTM failed, falling back to Linear Regression:', lstmError.message);
                        this.showNotification('LSTM failed, using Linear Regression instead');
                        await this.trainLinearModel(days);
                    }
                    break;
                case 'linear':
                    await this.trainLinearModel(days);
                    break;
                case 'sma':
                    await this.calculateMovingAveragePrediction(days);
                    break;
            }

            this.hideTrainingProgress();
            this.displayPredictionResults();
            this.updateChart();

        } catch (error) {
            console.error('Prediction error:', error);
            this.hideTrainingProgress();

            // Final fallback to Moving Average if all else fails
            try {
                this.showNotification('Falling back to Moving Average prediction...');
                this.showTrainingProgress();
                await this.calculateMovingAveragePrediction(days);
                this.hideTrainingProgress();
                this.displayPredictionResults();
                this.updateChart();
            } catch (fallbackError) {
                this.hideTrainingProgress();
                this.showError(`All prediction methods failed. Please try again with different data.`);
            }
        }
    }

    async trainLSTMModel(predictionDays) {
        // Check if TensorFlow.js is available
        if (typeof tf === 'undefined') {
            throw new Error('TensorFlow.js not loaded');
        }

        const prices = this.currentStock.data.map(d => d.price);
        const sequenceLength = 10;

        if (prices.length < sequenceLength + 5) {
            throw new Error('Insufficient data for LSTM training. Need at least 15 data points.');
        }

        // Normalize data
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const range = maxPrice - minPrice;

        if (range === 0) {
            throw new Error('Price data has no variation');
        }

        const normalizedPrices = prices.map(p => (p - minPrice) / range);

        // Prepare training data
        const xs = [];
        const ys = [];

        for (let i = sequenceLength; i < normalizedPrices.length; i++) {
            xs.push(normalizedPrices.slice(i - sequenceLength, i));
            ys.push(normalizedPrices[i]);
        }

        if (xs.length === 0) {
            throw new Error('Insufficient data for LSTM training');
        }

        try {
            // Create properly formatted tensors
            const xData = xs.map(sequence => sequence.map(val => [val]));
            const yData = ys.map(y => [y]);

            const xTensor = tf.tensor3d(xData);
            const yTensor = tf.tensor2d(yData);

            // Build simplified model for web
            this.predictionModel = tf.sequential({
                layers: [
                    tf.layers.lstm({
                        units: 20,
                        returnSequences: false,
                        inputShape: [sequenceLength, 1]
                    }),
                    tf.layers.dense({ units: 10, activation: 'relu' }),
                    tf.layers.dense({ units: 1, activation: 'linear' })
                ]
            });

            this.predictionModel.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'meanSquaredError',
                metrics: ['mae']
            });

            // Train model with reduced epochs for web performance
            const epochs = 15;
            await this.predictionModel.fit(xTensor, yTensor, {
                epochs: epochs,
                batchSize: Math.min(8, Math.floor(xs.length / 2)),
                validationSplit: 0.1,
                shuffle: true,
                verbose: 0,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        this.updateTrainingProgress(epoch + 1, epochs);
                    }
                }
            });

            // Generate predictions
            const predictions = [];
            let lastSequence = normalizedPrices.slice(-sequenceLength);

            for (let i = 0; i < predictionDays; i++) {
                const inputData = [lastSequence.map(val => [val])];
                const inputTensor = tf.tensor3d(inputData);

                const prediction = this.predictionModel.predict(inputTensor);
                const predictionValue = await prediction.data();

                const denormalizedPrediction = (predictionValue[0] * range) + minPrice;
                predictions.push(Math.max(denormalizedPrediction, 0));

                // Update sequence for next prediction
                lastSequence = [...lastSequence.slice(1), predictionValue[0]];

                inputTensor.dispose();
                prediction.dispose();
            }

            this.predictions = {
                values: predictions,
                dates: this.generateFutureDates(predictionDays),
                confidence: this.calculateConfidence(predictions, prices),
                model: 'LSTM Neural Network'
            };

            // Cleanup tensors
            xTensor.dispose();
            yTensor.dispose();

        } catch (error) {
            console.error('LSTM training error:', error);
            throw new Error(`LSTM training failed: ${error.message}`);
        }
    }

    async trainLinearModel(predictionDays) {
        const prices = this.currentStock.data.map(d => d.price);
        const days = prices.map((_, i) => i);

        // Simple linear regression
        const n = prices.length;
        const sumX = days.reduce((a, b) => a + b, 0);
        const sumY = prices.reduce((a, b) => a + b, 0);
        const sumXY = days.reduce((sum, x, i) => sum + x * prices[i], 0);
        const sumXX = days.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Generate predictions
        const predictions = [];
        for (let i = 0; i < predictionDays; i++) {
            const futureDay = n + i;
            const prediction = slope * futureDay + intercept;
            predictions.push(Math.max(prediction, 0));
        }

        this.predictions = {
            values: predictions,
            dates: this.generateFutureDates(predictionDays),
            confidence: this.calculateLinearConfidence(slope, prices),
            model: 'Linear Regression'
        };

        // Simulate training progress
        for (let i = 0; i <= 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            this.updateTrainingProgress(i + 1, 10);
        }
    }

    async calculateMovingAveragePrediction(predictionDays) {
        const prices = this.currentStock.data.map(d => d.price);
        const windowSize = Math.min(20, Math.floor(prices.length / 2));

        // Calculate different moving averages
        const sma = this.calculateSMA(prices, windowSize);
        const ema = this.calculateEMA(prices, windowSize);

        // Use weighted average of SMA and EMA for prediction
        const lastSMA = sma[sma.length - 1] || prices[prices.length - 1];
        const lastEMA = ema[ema.length - 1] || prices[prices.length - 1];
        const basePrediction = (lastSMA * 0.4 + lastEMA * 0.6);

        // Add trend component
        const recentLength = Math.min(10, prices.length);
        const recentPrices = prices.slice(-recentLength);
        const trend = recentPrices.length > 1 ?
            (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices.length : 0;

        const predictions = [];
        for (let i = 0; i < predictionDays; i++) {
            const prediction = basePrediction + (trend * i);
            predictions.push(Math.max(prediction, 0));
        }

        this.predictions = {
            values: predictions,
            dates: this.generateFutureDates(predictionDays),
            confidence: this.calculateSMAConfidence(sma, prices),
            model: 'Moving Average'
        };

        // Simulate training progress
        for (let i = 0; i <= 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            this.updateTrainingProgress(i + 1, 5);
        }
    }

    generateFutureDates(days) {
        const dates = [];
        const lastDate = new Date(this.currentStock.data[this.currentStock.data.length - 1].date);

        for (let i = 1; i <= days; i++) {
            const futureDate = new Date(lastDate);
            futureDate.setDate(lastDate.getDate() + i);
            dates.push(futureDate.toISOString().split('T')[0]);
        }

        return dates;
    }

    calculateConfidence(predictions, historicalPrices) {
        if (!predictions || !historicalPrices || predictions.length === 0 || historicalPrices.length === 0) {
            return 50;
        }

        const volatility = this.calculateVolatility(historicalPrices);
        const trendConsistency = this.calculateTrendConsistency(predictions);

        // Confidence decreases with volatility and increases with trend consistency
        const baseConfidence = 85;
        const volatilityPenalty = Math.min(volatility * 100, 30);
        const trendBonus = trendConsistency * 10;

        return Math.max(Math.min(baseConfidence - volatilityPenalty + trendBonus, 95), 45);
    }

    calculateLinearConfidence(slope, prices) {
        const r2 = this.calculateRSquared(prices);
        return Math.max(Math.min(r2 * 100, 90), 40);
    }

    calculateSMAConfidence(sma, prices) {
        if (!sma || sma.length === 0 || !prices || prices.length === 0) {
            return 50;
        }

        const recentLength = Math.min(20, sma.length, prices.length);
        const recentPrices = prices.slice(-recentLength);
        const recentSMA = sma.slice(-recentLength);

        const deviations = recentPrices.map((price, i) => Math.abs(price - recentSMA[i]));
        const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
        const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;

        const accuracy = avgPrice > 0 ? 1 - (avgDeviation / avgPrice) : 0;
        return Math.max(Math.min(accuracy * 100, 85), 35);
    }

    calculateVolatility(prices) {
        if (!prices || prices.length < 2) return 0.5;

        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            if (prices[i-1] > 0) {
                returns.push((prices[i] - prices[i-1]) / prices[i-1]);
            }
        }

        if (returns.length === 0) return 0.5;

        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;

        return Math.sqrt(variance);
    }

    calculateTrendConsistency(predictions) {
        if (!predictions || predictions.length < 3) return 0.5;

        let consistentMoves = 0;
        for (let i = 2; i < predictions.length; i++) {
            const direction1 = predictions[i] > predictions[i-1] ? 1 : -1;
            const direction2 = predictions[i-1] > predictions[i-2] ? 1 : -1;
            if (direction1 === direction2) consistentMoves++;
        }

        return consistentMoves / (predictions.length - 2);
    }

    calculateRSquared(prices) {
        if (!prices || prices.length < 2) return 0;

        const n = prices.length;
        const x = prices.map((_, i) => i);
        const y = prices;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

        const denominator = (n * sumXX - sumX * sumX);
        if (denominator === 0) return 0;

        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;

        const totalSumSquares = sumYY - (sumY * sumY) / n;
        if (totalSumSquares === 0) return 0;

        const residualSumSquares = y.reduce((sum, yi, i) => {
            const predicted = slope * x[i] + intercept;
            return sum + Math.pow(yi - predicted, 2);
        }, 0);

        return Math.max(0, 1 - (residualSumSquares / totalSumSquares));
    }

    showTrainingProgress() {
        const trainingProgress = document.getElementById('training-progress');
        trainingProgress.classList.add('active');
        document.getElementById('training-epoch').textContent = 'Epoch 0/50';
        document.getElementById('progress-fill').style.width = '0%';
    }

    updateTrainingProgress(epoch, totalEpochs) {
        const progress = (epoch / totalEpochs) * 100;
        document.getElementById('training-epoch').textContent = `Epoch ${epoch}/${totalEpochs}`;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }

    hideTrainingProgress() {
        const trainingProgress = document.getElementById('training-progress');
        trainingProgress.classList.remove('active');
    }

    displayPredictionResults() {
        if (!this.predictions || !this.predictions.values || this.predictions.values.length === 0) {
            this.showError('No predictions available');
            return;
        }

        const resultsContainer = document.getElementById('prediction-results');
        const currentPrice = this.currentStock.data[this.currentStock.data.length - 1].price;

        const shortTerm = this.predictions.values[Math.min(6, this.predictions.values.length - 1)];
        const mediumTerm = this.predictions.values[Math.min(13, this.predictions.values.length - 1)];
        const longTerm = this.predictions.values[this.predictions.values.length - 1];

        const shortChange = ((shortTerm - currentPrice) / currentPrice) * 100;
        const mediumChange = ((mediumTerm - currentPrice) / currentPrice) * 100;
        const longChange = ((longTerm - currentPrice) / currentPrice) * 100;

        resultsContainer.innerHTML = `
            <div class="prediction-card">
                <div class="prediction-label">7-Day Prediction</div>
                <div class="prediction-value">$${shortTerm.toFixed(2)}</div>
                <div class="prediction-change ${shortChange >= 0 ? 'positive' : 'negative'}">
                    ${shortChange >= 0 ? '+' : ''}${shortChange.toFixed(2)}%
                </div>
            </div>
            <div class="prediction-card">
                <div class="prediction-label">14-Day Prediction</div>
                <div class="prediction-value">$${mediumTerm.toFixed(2)}</div>
                <div class="prediction-change ${mediumChange >= 0 ? 'positive' : 'negative'}">
                    ${mediumChange >= 0 ? '+' : ''}${mediumChange.toFixed(2)}%
                </div>
            </div>
            <div class="prediction-card">
                <div class="prediction-label">${this.predictions.dates.length}-Day Prediction</div>
                <div class="prediction-value">$${longTerm.toFixed(2)}</div>
                <div class="prediction-change ${longChange >= 0 ? 'positive' : 'negative'}">
                    ${longChange >= 0 ? '+' : ''}${longChange.toFixed(2)}%
                </div>
            </div>
            <div class="prediction-card">
                <div class="prediction-label">Model Used</div>
                <div class="prediction-value" style="font-size: 1.2rem;">${this.predictions.model}</div>
                <div class="prediction-change" style="color: var(--text-secondary);">
                    ${this.predictions.values.length} day forecast
                </div>
            </div>
        `;

        // Update confidence indicator
        const confidence = this.predictions.confidence;
        document.getElementById('confidence-percentage').textContent = `${confidence.toFixed(1)}%`;
        document.getElementById('confidence-fill').style.width = `${confidence}%`;

        this.showNotification(`AI prediction completed with ${confidence.toFixed(1)}% confidence`);
    }

    async updatePrediction() {
        if (this.currentStock && this.predictions) {
            await this.runPrediction();
        }
    }

    updateMainChart() {
        if (!this.currentStock || !this.chart) return;

        const data = this.currentStock.data;
        const labels = data.map(d => d.date);
        const prices = data.map(d => d.price);

        this.chart.data.labels = labels;
        this.chart.data.datasets = [];

        // Reset scales
        this.chart.options.scales = {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                ticks: { color: '#b0b0b0', maxTicksLimit: 10 }
            },
            y: {
                type: 'linear',
                position: 'left',
                grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                ticks: {
                    color: '#b0b0b0',
                    callback: function(value) { return '$' + value.toFixed(2); }
                }
            }
        };

        // Main stock price line
        this.chart.data.datasets.push({
            label: this.currentStock.symbol,
            data: prices,
            borderColor: 'rgb(0, 212, 255)',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5
        });

        // Add prediction data if available and enabled
        if (this.predictions && document.getElementById('prediction-toggle').classList.contains('active')) {
            const allLabels = [...labels, ...this.predictions.dates];
            const allPrices = [...prices, ...new Array(this.predictions.dates.length).fill(null)];
            const predictionPrices = [...new Array(prices.length - 1).fill(null), prices[prices.length - 1], ...this.predictions.values];

            this.chart.data.labels = allLabels;
            this.chart.data.datasets[0].data = allPrices;

            this.chart.data.datasets.push({
                label: 'AI Prediction',
                data: predictionPrices,
                borderColor: 'rgb(139, 92, 246)',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
            });
        }

        // Add technical indicators
        if (document.getElementById('sma-toggle').classList.contains('active')) {
            const sma = this.calculateSMA(prices, 20);
            if (sma.length > 0) {
                const paddedSMA = new Array(19).fill(null).concat(sma);

                this.chart.data.datasets.push({
                    label: 'SMA (20)',
                    data: paddedSMA,
                    borderColor: 'rgb(0, 255, 136)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 3
                });
            }
        }

        if (document.getElementById('rsi-toggle').classList.contains('active')) {
            const rsiValues = this.calculateRSIArray(prices, 14);
            if (rsiValues.length > 0) {
                const paddedRSI = new Array(14).fill(null).concat(rsiValues);

                this.chart.data.datasets.push({
                    label: 'RSI',
                    data: paddedRSI,
                    borderColor: 'rgb(255, 165, 0)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    yAxisID: 'rsi'
                });

                this.chart.options.scales.rsi = {
                    type: 'linear',
                    position: 'right',
                    min: 0,
                    max: 100,
                    grid: { drawOnChartArea: false, color: 'rgba(255, 165, 0, 0.2)' },
                    ticks: {
                        color: '#ff9500',
                        stepSize: 25,
                        callback: function(value) { return value.toFixed(0); }
                    },
                    title: { display: true, text: 'RSI', color: '#ff9500' }
                };
            }
        }

        if (document.getElementById('macd-toggle').classList.contains('active')) {
            const macdValues = this.calculateMACDArray(prices);
            if (macdValues.length > 0) {
                const paddedMACD = new Array(25).fill(null).concat(macdValues);

                this.chart.data.datasets.push({
                    label: 'MACD',
                    data: paddedMACD,
                    borderColor: 'rgb(255, 0, 255)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    yAxisID: 'macd'
                });

                this.chart.options.scales.macd = {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false, color: 'rgba(255, 0, 255, 0.2)' },
                    ticks: {
                        color: '#ff00ff',
                        callback: function(value) { return value.toFixed(3); }
                    },
                    title: { display: true, text: 'MACD', color: '#ff00ff' }
                };
            }
        }

        if (document.getElementById('volume-toggle').classList.contains('active')) {
            const volumes = data.map(d => d.volume / 1000000);

            this.chart.data.datasets.push({
                label: 'Volume (M)',
                data: volumes,
                type: 'bar',
                backgroundColor: 'rgba(255, 0, 128, 0.4)',
                borderColor: 'rgba(255, 0, 128, 0.8)',
                borderWidth: 1,
                yAxisID: 'volume'
            });

            this.chart.options.scales.volume = {
                type: 'linear',
                position: 'right',
                grid: { drawOnChartArea: false, color: 'rgba(255, 0, 128, 0.2)' },
                ticks: {
                    color: '#ff0080',
                    callback: function(value) { return value.toFixed(1) + 'M'; }
                },
                title: { display: true, text: 'Volume', color: '#ff0080' }
            };
        }

        this.chart.update('active');
    }

    updateChart() {
        if (this.isComparisonMode && this.comparisonStock) {
            this.updateComparisonChart();
        } else {
            this.updateMainChart();
        }
    }

    updateComparisonChart() {
        if (!this.currentStock || !this.comparisonStock || !this.chart) return;

        const data1 = this.currentStock.data;
        const data2 = this.comparisonStock.data;

        const minLength = Math.min(data1.length, data2.length);
        const labels = data1.slice(-minLength).map(d => d.date);
        const prices1 = data1.slice(-minLength).map(d => d.price);
        const prices2 = data2.slice(-minLength).map(d => d.price);

        this.chart.data.labels = labels;
        this.chart.data.datasets = [];

        // Reset scales for comparison
        this.chart.options.scales = {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                ticks: { color: '#b0b0b0', maxTicksLimit: 10 }
            },
            y: {
                type: 'linear',
                position: 'left',
                grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                ticks: {
                    color: '#b0b0b0',
                    callback: function(value) { return value.toFixed(2); }
                }
            }
        };

        this.chart.data.datasets = [
            {
                label: this.currentStock.symbol,
                data: prices1,
                borderColor: 'rgb(0, 212, 255)',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
            },
            {
                label: this.comparisonStock.symbol,
                data: prices2,
                borderColor: 'rgb(255, 0, 128)',
                backgroundColor: 'rgba(255, 0, 128, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
            }
        ];

        this.chart.update('active');
    }

    calculateIndicators() {
        if (!this.currentStock) return;

        const prices = this.currentStock.data.map(d => d.price);
        const volumes = this.currentStock.data.map(d => d.volume);

        const rsi = this.calculateRSI(prices, 14);
        const macd = this.calculateMACD(prices);
        const sma = this.calculateSMA(prices, 20);
        const currentSMA = sma.length > 0 ? sma[sma.length - 1] : 0;
        const avgVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;

        document.getElementById('rsi-value').textContent = rsi.toFixed(2);
        document.getElementById('macd-value').textContent = macd.toFixed(4);
        document.getElementById('sma-value').textContent = `${currentSMA.toFixed(2)}`;
        document.getElementById('volume-value').textContent = this.formatVolume(avgVolume);
    }

    calculateRSI(prices, period = 14) {
        if (!prices || prices.length < period + 1) return 50;

        const gains = [];
        const losses = [];

        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }

        const recentGains = gains.slice(-period);
        const recentLosses = losses.slice(-period);

        const avgGain = recentGains.reduce((a, b) => a + b, 0) / period;
        const avgLoss = recentLosses.reduce((a, b) => a + b, 0) / period;

        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    calculateRSIArray(prices, period = 14) {
        if (!prices || prices.length < period + 1) return [];

        const rsiValues = [];

        for (let i = period; i < prices.length; i++) {
            const periodPrices = prices.slice(i - period, i + 1);
            const gains = [];
            const losses = [];

            for (let j = 1; j < periodPrices.length; j++) {
                const change = periodPrices[j] - periodPrices[j - 1];
                gains.push(change > 0 ? change : 0);
                losses.push(change < 0 ? Math.abs(change) : 0);
            }

            const avgGain = gains.reduce((a, b) => a + b, 0) / period;
            const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

            if (avgLoss === 0) {
                rsiValues.push(100);
            } else {
                const rs = avgGain / avgLoss;
                rsiValues.push(100 - (100 / (1 + rs)));
            }
        }

        return rsiValues;
    }

    calculateMACD(prices) {
        if (!prices || prices.length < 26) return 0;

        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);

        if (ema12.length === 0 || ema26.length === 0) return 0;

        return ema12[ema12.length - 1] - ema26[ema26.length - 1];
    }

    calculateMACDArray(prices) {
        if (!prices || prices.length < 26) return [];

        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        const macdLine = [];

        const minLength = Math.min(ema12.length, ema26.length);
        for (let i = 25; i < minLength; i++) {
            macdLine.push(ema12[i] - ema26[i]);
        }

        return macdLine;
    }

    calculateEMA(prices, period) {
        if (!prices || prices.length === 0) return [];

        const ema = [];
        const multiplier = 2 / (period + 1);

        ema[0] = prices[0];

        for (let i = 1; i < prices.length; i++) {
            ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
        }

        return ema;
    }

    calculateSMA(prices, period) {
        if (!prices || prices.length < period) return [];

        const sma = [];
        for (let i = period - 1; i < prices.length; i++) {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
        return sma;
    }

    updateStockInfo() {
        if (!this.currentStock || this.currentStock.data.length < 2) return;

        const data = this.currentStock.data;
        const currentPrice = data[data.length - 1].price;
        const previousPrice = data[data.length - 2].price;
        const change = currentPrice - previousPrice;
        const changePercent = (change / previousPrice) * 100;

        document.getElementById('stock-title').textContent = this.currentStock.symbol;
        document.getElementById('stock-price').textContent = `${currentPrice.toFixed(2)}`;

        const changeElement = document.getElementById('price-change');
        changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
        changeElement.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;

        this.updateSentiment(changePercent);
    }

    updateSentiment(changePercent) {
        const sentimentElement = document.getElementById('sentiment-indicator');
        let sentiment = '😐';

        if (changePercent > 2) sentiment = '🚀';
        else if (changePercent > 0.5) sentiment = '😊';
        else if (changePercent < -2) sentiment = '📉';
        else if (changePercent < -0.5) sentiment = '😟';

        sentimentElement.textContent = sentiment;
        sentimentElement.title = `Sentiment: ${changePercent.toFixed(2)}% change`;
    }

    async fetchNews(symbol) {
        try {
            if (this.API_CONFIG.NEWS_API.key && !this.API_CONFIG.NEWS_API.key.includes('YOUR_')) {
                const response = await fetch(
                    `${this.API_CONFIG.NEWS_API.baseUrl}/everything?q=${symbol}&sortBy=publishedAt&pageSize=5&apiKey=${this.API_CONFIG.NEWS_API.key}`
                );

                const data = await response.json();

                if (data.status === 'ok' && data.articles) {
                    this.displayNews(data.articles);
                    return;
                }
            }

            this.generateDemoNews(symbol);

        } catch (error) {
            console.error('Error fetching news:', error);
            this.generateDemoNews(symbol);
        }
    }

    generateDemoNews(symbol) {
        const demoNews = [
            {
                title: `${symbol} AI Model Predicts Strong Growth Potential`,
                source: { name: 'AI Financial' },
                publishedAt: new Date().toISOString()
            },
            {
                title: `${symbol} Reports Strong Q4 Earnings, Beats Analyst Expectations`,
                source: { name: 'Financial Times' },
                publishedAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
                title: `Market Analysis: ${symbol} Shows Bullish Technical Patterns`,
                source: { name: 'MarketWatch' },
                publishedAt: new Date(Date.now() - 7200000).toISOString()
            },
            {
                title: `${symbol} Announces Strategic Partnership with Tech Giant`,
                source: { name: 'Reuters' },
                publishedAt: new Date(Date.now() - 10800000).toISOString()
            },
            {
                title: `ML Algorithms Suggest ${symbol} Undervalued in Current Market`,
                source: { name: 'AI Investor' },
                publishedAt: new Date(Date.now() - 14400000).toISOString()
            }
        ];

        this.displayNews(demoNews);
    }

    displayNews(newsData) {
        const container = document.getElementById('news-container');
        container.innerHTML = '';

        newsData.slice(0, 5).forEach(article => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            newsItem.innerHTML = `
                <div class="news-title">${article.title}</div>
                <div class="news-source">${article.source.name || article.source} • ${this.formatTime(article.publishedAt)}</div>
            `;

            if (article.url) {
                newsItem.addEventListener('click', () => window.open(article.url, '_blank'));
                newsItem.style.cursor = 'pointer';
            }

            container.appendChild(newsItem);
        });
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString();
    }

    formatVolume(volume) {
        if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
        if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
        if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
        return volume.toString();
    }

    toggleComparisonMode() {
        this.isComparisonMode = !this.isComparisonMode;
        const btn = document.getElementById('compare-btn');

        if (this.isComparisonMode) {
            btn.textContent = 'Exit Compare';
            btn.style.background = 'linear-gradient(45deg, var(--error-color), var(--accent-pink))';
            this.showNotification('Comparison mode enabled. Search for another stock to compare.');
        } else {
            btn.textContent = 'Compare';
            btn.style.background = 'linear-gradient(45deg, var(--accent-pink), var(--accent-blue))';
            this.comparisonStock = null;
            if (this.currentStock) {
                this.updateMainChart();
            }
            this.showNotification('Comparison mode disabled.');
        }
    }

    toggleIndicator(toggle) {
        toggle.classList.toggle('active');

        if (toggle.id === 'prediction-toggle') {
            const predictionSection = document.getElementById('prediction-section');
            if (toggle.classList.contains('active')) {
                predictionSection.style.display = 'block';
                if (this.currentStock && !this.predictions) {
                    this.runPrediction();
                }
            } else {
                predictionSection.style.display = 'none';
            }
        }

        if (this.currentStock && this.chart) {
            this.updateChart();
        }

        const indicatorName = toggle.id.replace('-toggle', '').toUpperCase();
        const isActive = toggle.classList.contains('active');
        this.showNotification(`${indicatorName} ${isActive ? 'enabled' : 'disabled'}`);
    }

    addToWatchlist() {
        if (!this.currentStock) {
            this.showError('Please select a stock first');
            return;
        }

        const symbol = this.currentStock.symbol;
        if (!this.watchlist.includes(symbol)) {
            this.watchlist.push(symbol);
            this.saveWatchlist();
            this.updateWatchlistDisplay();
            this.showNotification(`${symbol} added to watchlist`);
        } else {
            this.showNotification(`${symbol} is already in your watchlist`);
        }
    }

    removeFromWatchlist(symbol) {
        this.watchlist = this.watchlist.filter(s => s !== symbol);
        this.saveWatchlist();
        this.updateWatchlistDisplay();
        this.showNotification(`${symbol} removed from watchlist`);
    }

    updateWatchlistDisplay() {
        const container = document.getElementById('watchlist');
        container.innerHTML = '';

        if (this.watchlist.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 1rem;">No stocks in watchlist</div>';
            return;
        }

        this.watchlist.forEach(symbol => {
            const item = document.createElement('div');
            item.className = 'watchlist-item';
            item.innerHTML = `
                <span>${symbol}</span>
                <button class="remove-btn" onclick="stockAnalyzer.removeFromWatchlist('${symbol}')" aria-label="Remove ${symbol} from watchlist">×</button>
            `;
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-btn')) return;
                document.getElementById('stock-input').value = symbol;
                this.searchStock();
            });
            container.appendChild(item);
        });
    }

    loadWatchlist() {
        try {
            const saved = localStorage.getItem('stockvision_watchlist');
            const parsed = saved ? JSON.parse(saved) : [];
            return parsed.length > 0 ? parsed : ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
        } catch (error) {
            console.error('Error loading watchlist:', error);
            return ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
        }
    }

    saveWatchlist() {
        try {
            localStorage.setItem('stockvision_watchlist', JSON.stringify(this.watchlist));
        } catch (error) {
            console.error('Error saving watchlist:', error);
        }
    }

    toggleContrast() {
        document.body.classList.toggle('high-contrast');
        const toggle = document.getElementById('contrast-toggle');
        toggle.classList.toggle('active');

        if (this.chart) {
            const isHighContrast = document.body.classList.contains('high-contrast');
            const textColor = isHighContrast ? '#000000' : '#ffffff';
            const gridColor = isHighContrast ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';

            this.chart.options.plugins.legend.labels.color = textColor;
            if (this.chart.options.scales.x) this.chart.options.scales.x.ticks.color = textColor;
            if (this.chart.options.scales.y) this.chart.options.scales.y.ticks.color = textColor;
            if (this.chart.options.scales.x) this.chart.options.scales.x.grid.color = gridColor;
            if (this.chart.options.scales.y) this.chart.options.scales.y.grid.color = gridColor;

            this.chart.update();
        }

        this.showNotification(`High contrast mode ${document.body.classList.contains('high-contrast') ? 'enabled' : 'disabled'}`);
    }

    showLoading() {
        const chartContainer = document.querySelector('.chart-container');

        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        chartContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <div class="loading-text">Loading stock data...</div>
            </div>
        `;
    }

    hideLoading() {
        const chartContainer = document.querySelector('.chart-container');
        chartContainer.innerHTML = '<canvas id="stock-chart"></canvas>';

        this.initializeChart();

        if (this.currentStock) {
            this.updateChart();
        }
    }

    showError(message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;

        const searchSection = document.querySelector('.search-section');
        searchSection.appendChild(errorDiv);

        setTimeout(() => errorDiv.remove(), 5000);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the application
const stockAnalyzer = new StockAnalyzer();

// Auto-load demo stock
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('stock-input').value = 'AAPL';
        stockAnalyzer.searchStock();
    }, 1000);
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Chart resize handler
window.addEventListener('resize', () => {
    if (stockAnalyzer.chart) {
        stockAnalyzer.chart.resize();
    }
});

// Search input debouncing
let searchTimeout;
document.getElementById('stock-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const value = e.target.value.trim().toUpperCase();
        if (value.length >= 2) {
            // Could add autocomplete suggestions here
        }
    }, 300);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'p':
                e.preventDefault();
                if (stockAnalyzer.currentStock) {
                    stockAnalyzer.runPrediction();
                }
                break;
            case 'c':
                e.preventDefault();
                stockAnalyzer.toggleComparisonMode();
                break;
        }
    }
});
