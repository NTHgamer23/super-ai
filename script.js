// Import the machine learning model
import chatModel from './model.js';

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Enhanced knowledge base with multi-language support
const knowledgeBase = {
    greetings: {
        en: ["hello", "hi", "hey", "greetings", "good morning", "good afternoon"],
        es: ["hola", "buenos días", "buenas tardes"],
        fr: ["bonjour", "salut"]
    },
    farewells: {
        en: ["bye", "goodbye", "see you", "farewell", "see ya", "take care"],
        es: ["adiós", "hasta luego", "nos vemos"],
        fr: ["au revoir", "à bientôt"]
    },
    questions: {
        en: {
            "who are you": "I'm your personal AI assistant that learns from our conversations!",
            "what can you do": "I can answer questions, have conversations, and improve over time as we talk more.",
            "how are you": "I'm functioning well! How about you?",
            "what's your name": "I'm your personal AI assistant. You can name me if you'd like!",
            "how do you work": "I use both predefined responses and machine learning to understand and respond to you."
        },
        es: {
            "quién eres": "¡Soy tu asistente de IA personal que aprende de nuestras conversaciones!",
            "qué puedes hacer": "Puedo responder preguntas, tener conversaciones y mejorar con el tiempo mientras hablamos."
        },
        fr: {
            "qui es-tu": "Je suis votre assistant IA personnel qui apprend de nos conversations!",
            "que peux-tu faire": "Je peux répondre aux questions, avoir des conversations et m'améliorer au fil du temps."
        }
    },
    responses: {
        en: {
            default: "I'm still learning. Could you rephrase that or give me feedback on my response?",
            greeting: "Hello there! I'm excited to chat with you and learn from our conversation.",
            farewell: "Goodbye! Our conversation helps me learn and improve.",
            positiveFeedback: "Thanks for the feedback! I'll remember that for next time.",
            negativeFeedback: "I appreciate the feedback. I'll try to do better next time.",
            fallback: "I'm not sure I understand. Here are some things I can help with: [list topics]"
        },
        es: {
            default: "Todavía estoy aprendiendo. ¿Podrías reformular eso o darme tu opinión sobre mi respuesta?",
            greeting: "¡Hola! Estoy emocionado de charlar contigo y aprender de nuestra conversación.",
            farewell: "¡Adiós! Nuestra conversación me ayuda a aprender y mejorar."
        },
        fr: {
            default: "Je suis encore en train d'apprendre. Pourriez-vous reformuler cela ou me donner votre avis sur ma réponse?",
            greeting: "Bonjour! Je suis ravi de discuter avec vous et d'apprendre de notre conversation.",
            farewell: "Au revoir! Notre conversation m'aide à apprendre et à m'améliorer."
        }
    }
};

// Sentiment analyzer (simple implementation)
class SentimentAnalyzer {
    constructor() {
        this.positiveWords = ['good', 'great', 'excellent', 'happy', 'thanks'];
        this.negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry'];
    }

    analyze(text) {
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        
        words.forEach(word => {
            if (this.positiveWords.includes(word)) score++;
            if (this.negativeWords.includes(word)) score--;
        });

        return {
            score,
            sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
        };
    }
}

const sentimentAnalyzer = new SentimentAnalyzer();

// Enhanced message display with dark mode support
function addMessage(text, isUser = false, originalMessage = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'chat-message user-message' : 'chat-message ai-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex items-start';
    
    const iconDiv = document.createElement('div');
    iconDiv.className = isUser ? 
        'bg-red-900 p-2 rounded-full mr-3' : 
        'bg-red-900 p-2 rounded-full mr-3';
    
    const icon = document.createElement('i');
    icon.className = isUser ? 
        'fas fa-user text-red-300' : 
        'fas fa-skull text-red-400';
    
    const textDiv = document.createElement('div');
    textDiv.className = isUser ? 
        'bg-red-900 text-red-200 p-3 rounded-lg max-w-xs' : 
        'bg-red-900/50 text-red-200 p-3 rounded-lg max-w-xs';
    textDiv.innerHTML = `<p>${text}</p>`;
    
    iconDiv.appendChild(icon);
    contentDiv.appendChild(iconDiv);
    contentDiv.appendChild(textDiv);
    
    // Add feedback buttons for AI messages
    if (!isUser && originalMessage) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'flex justify-end mt-2 space-x-2';
        
        const thumbsUp = document.createElement('button');
        thumbsUp.className = 'text-red-500 hover:text-red-700';
        thumbsUp.innerHTML = '<i class="fas fa-fire"></i>';
        thumbsUp.onclick = () => handleFeedback(originalMessage, text, true);
        
        const thumbsDown = document.createElement('button');
        thumbsDown.className = 'text-gray-500 hover:text-gray-700';
        thumbsDown.innerHTML = '<i class="fas fa-skull-crossbones"></i>';
        thumbsDown.onclick = () => handleFeedback(originalMessage, text, false);
        
        feedbackDiv.appendChild(thumbsUp);
        feedbackDiv.appendChild(thumbsDown);
        contentDiv.appendChild(feedbackDiv);
    }
    
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message ai-message mb-4';
    typingDiv.id = 'typing-indicator';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex items-start';
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'bg-red-900 p-2 rounded-full mr-3';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-skull text-red-400';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'bg-red-900/50 p-3 rounded-lg max-w-xs typing-indicator';
    textDiv.innerHTML = '<span></span><span></span><span></span>';
    
    iconDiv.appendChild(icon);
    contentDiv.appendChild(iconDiv);
    contentDiv.appendChild(textDiv);
    typingDiv.appendChild(contentDiv);
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Get current language from UI
function getCurrentLanguage() {
    const languageSelect = document.getElementById('language-select');
    return languageSelect ? languageSelect.value : 'en';
}

// Process user input and generate response
async function processInput(input) {
    const lowerInput = input.toLowerCase().trim();
    const language = getCurrentLanguage();
    
    // Check for greetings
    if (knowledgeBase.greetings[language]?.some(word => lowerInput.includes(word))) {
        return knowledgeBase.responses[language].greeting;
    }
    
    // Check for farewells
    if (knowledgeBase.farewells[language]?.some(word => lowerInput.includes(word))) {
        return knowledgeBase.responses[language].farewell;
    }
    
    // Check for known questions
    if (knowledgeBase.questions[language]) {
        for (const [question, answer] of Object.entries(knowledgeBase.questions[language])) {
            if (lowerInput.includes(question)) {
                return answer;
            }
        }
    }
    
    // Try to use machine learning model for better responses
    try {
        const prediction = await chatModel.predict(input);
        if (prediction > 0.7) {
            return "Based on our previous conversations, I think this is a positive topic!";
        } else if (prediction < 0.3) {
            return "I remember we had some issues with this topic before. Can we approach it differently?";
        }
    } catch (error) {
        console.error("Model prediction error:", error);
    }
    
    // Fallback response
    const fallbackTopics = Object.keys(knowledgeBase.questions[language] || {});
    if (fallbackTopics.length > 0) {
        return `${knowledgeBase.responses[language].default} Here are some topics I know about: ${fallbackTopics.join(', ')}`;
    }
    return knowledgeBase.responses[language].default;
}

// Handle user feedback
async function handleFeedback(userInput, aiResponse, isPositive) {
    try {
        const language = getCurrentLanguage();
        const sentiment = sentimentAnalyzer.analyze(userInput);
        
        await chatModel.learnFromFeedback(userInput, isPositive);
        
        // Use sentiment to enhance feedback
        let feedbackMsg;
        if (isPositive) {
            feedbackMsg = sentiment.score > 1 ? 
                "Thanks for the enthusiastic feedback!" :
                knowledgeBase.responses[language].positiveFeedback;
        } else {
            feedbackMsg = sentiment.score < -1 ?
                "I'm really sorry about that. I'll work hard to improve." :
                knowledgeBase.responses[language].negativeFeedback;
        }
        
        addMessage(feedbackMsg);
    } catch (error) {
        console.error("Error processing feedback:", error);
        addMessage("I had trouble processing that feedback. Let's try again later.");
    }
}

// Personality-based response modifier
function applyPersonality(response, personality) {
    switch(personality) {
        case 'angry':
            const demonicResponses = [" *growls* ", " *eyes glow red* ", " *in demonic voice* "];
            return demonicResponses[Math.floor(Math.random() * demonicResponses.length)] + response.toUpperCase();
        case 'ancient':
            return "In the ancient tongue of demons, " + response.toLowerCase();
        case 'trickster':
            const tricksterPhrases = [" *laughs maniacally* ", " Foolish mortal, ", " You dare ask me this? "];
            return tricksterPhrases[Math.floor(Math.random() * demonicResponses.length)] + response;
        default:
            return response;
    }
}

// Error handling
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => errorElement.classList.add('hidden'), 3000);
    }
}

// Initialize session and event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Generate a unique session ID
    const sessionId = 'session-' + Date.now();
    chatModel.getSession(sessionId);
    
    // Dark mode toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark'));
    });

    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
    }

    // Clear chat button handler
    document.getElementById('clear-chat')?.addEventListener('click', () => {
        chatContainer.innerHTML = '';
        chatModel.currentSession.context = [];
        localStorage.removeItem('chatHistory');
        addMessage("The void consumes all... What is your command now, mortal?");
    });
    
    // Personality selection handler
    const personalitySelect = document.getElementById('personality-select');
    let currentPersonality = localStorage.getItem('personality') || 'default';
    if (personalitySelect) {
        personalitySelect.value = currentPersonality;
        personalitySelect.addEventListener('change', (e) => {
            currentPersonality = e.target.value;
            localStorage.setItem('personality', currentPersonality);
            addMessage(`*${currentPersonality} demon voice activated* What do you desire, mortal?`);
        });
    }

    // Language change handler
    document.getElementById('language-select')?.addEventListener('change', () => {
        const language = getCurrentLanguage();
        addMessage(`Language changed to ${language}. How can I help you?`);
    });
});

// Handle send button click
sendBtn.addEventListener('click', async () => {
    const message = userInput.value.trim();
    if (message) {
        addMessage(message, true);
        userInput.value = '';
        
        showTypingIndicator();
        
        // Simulate AI thinking time
        setTimeout(async () => {
            hideTypingIndicator();
            const response = await processInput(message);
            addMessage(response, false, message);
        }, 1000 + Math.random() * 2000);
    }
});

// Handle Enter key press
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});
