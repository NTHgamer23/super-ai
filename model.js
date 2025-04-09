// Simple machine learning model for the chatbot
class ChatModel {
    constructor() {
        this.model = null;
        this.vocabulary = {};
        this.responseMap = {};
        this.vocabSize = 0;
        this.maxSeqLength = 10;
        this.sessionMemory = {};
        this.currentSession = null;
        this.initializeModel();
    }

    // Create or retrieve a session
    getSession(sessionId) {
        if (!this.sessionMemory[sessionId]) {
            this.sessionMemory[sessionId] = {
                context: [],
                preferences: {},
                language: 'en'
            };
        }
        this.currentSession = this.sessionMemory[sessionId];
        return this.currentSession;
    }

    // Add context to current session
    addContext(input, response) {
        if (this.currentSession) {
            this.currentSession.context.push({
                input,
                response,
                timestamp: Date.now()
            });
            // Keep only last 5 interactions for context
            if (this.currentSession.context.length > 5) {
                this.currentSession.context.shift();
            }
        }
    }

    // Initialize TensorFlow.js model
    async initializeModel() {
        this.model = tf.sequential();
        this.model.add(tf.layers.embedding({
            inputDim: 1000,
            outputDim: 16,
            inputLength: this.maxSeqLength
        }));
        this.model.add(tf.layers.flatten());
        this.model.add(tf.layers.dense({units: 16, activation: 'relu'}));
        this.model.add(tf.layers.dense({units: 8, activation: 'relu'}));
        this.model.add(tf.layers.dense({units: 1, activation: 'sigmoid'}));

        this.model.compile({
            optimizer: 'adam',
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        // Initialize vocabulary with basic words
        const basicWords = [
            'hello', 'hi', 'hey', 'greetings',
            'bye', 'goodbye', 'see', 'you',
            'who', 'what', 'how', 'are',
            'can', 'do', 'help', 'thanks'
        ];
        
        basicWords.forEach((word, index) => {
            this.vocabulary[word] = index + 1; // Start from 1 (0 is for padding)
        });
        this.vocabSize = basicWords.length + 1;
    }

    // Preprocess text into numerical sequence
    preprocessText(text) {
        const words = text.toLowerCase().split(/\s+/);
        const sequence = words.map(word => {
            if (this.vocabulary[word]) {
                return this.vocabulary[word];
            } else {
                // Add new word to vocabulary
                this.vocabSize++;
                this.vocabulary[word] = this.vocabSize;
                return this.vocabSize;
            }
        });

        // Pad or truncate sequence
        if (sequence.length > this.maxSeqLength) {
            return sequence.slice(0, this.maxSeqLength);
        } else {
            return sequence.concat(
                Array(this.maxSeqLength - sequence.length).fill(0)
            );
        }
    }

    // Train the model with new data
    async train(inputText, isPositive) {
        const sequence = this.preprocessText(inputText);
        const xs = tf.tensor2d([sequence], [1, this.maxSeqLength]);
        const ys = tf.tensor2d([[isPositive ? 1 : 0]], [1, 1]);

        await this.model.fit(xs, ys, {
            epochs: 5,
            batchSize: 1
        });

        xs.dispose();
        ys.dispose();
    }

    // Predict if input is positive or negative
    async predict(inputText) {
        const sequence = this.preprocessText(inputText);
        const xs = tf.tensor2d([sequence], [1, this.maxSeqLength]);
        const prediction = await this.model.predict(xs).data();
        xs.dispose();
        return prediction[0];
    }

    // Learn from user feedback
    async learnFromFeedback(inputText, isPositive) {
        await this.train(inputText, isPositive);
        this.responseMap[inputText.toLowerCase()] = isPositive;
    }
}

// Export singleton instance
const chatModel = new ChatModel();
export default chatModel;
