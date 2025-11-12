// API Configuration
const API_KEY = 'sk-or-v1-9039abfbf45b4d7aa48fc89d1200625a8edf3583576aa6fb701375a625d2f5fx';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const IMAGE_API_URL = 'https://openrouter.ai/api/v1/images';

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearChat');
const newChatBtn = document.getElementById('newChatBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const chatSessions = document.getElementById('chatSessions');
const sessionTitle = document.getElementById('sessionTitle');
const aboutToggle = document.getElementById('aboutToggle');
const aboutContent = document.getElementById('aboutContent');

// Session management
let currentSessionId = null;
let sessions = {};
let chatHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSessions();
    setupEventListeners();
    // If no previous session found, create a fresh one, otherwise render existing
    if (!currentSessionId) {
        createNewSession();
    } else {
        loadSessionMessages();
        renderSessions();
    }
    // Restore sidebar desktop collapsed state
    const collapsed = localStorage.getItem('stgem-sidebar-collapsed');
    if (collapsed === 'true' && window.innerWidth > 768) {
        sidebar.classList.add('collapsed');
        if (sidebarToggle && sidebarToggle.setAttribute) sidebarToggle.setAttribute('aria-expanded', 'false');
    }
    // Restore About section state
    const aboutOpen = localStorage.getItem('stgem-about-open');
    if (aboutOpen === 'true') {
        aboutContent.hidden = false;
        aboutToggle.setAttribute('aria-expanded', 'true');
    }

    // Handle resize transitions between desktop and mobile
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            // Mobile: remove desktop collapse class; use overlay open state only
            sidebar.classList.remove('collapsed');
        } else {
            // Desktop: remove mobile overlay class; apply persisted collapsed state
            sidebar.classList.remove('open');
            const collapsedNow = localStorage.getItem('stgem-sidebar-collapsed') === 'true';
            sidebar.classList.toggle('collapsed', collapsedNow);
        }
    });
});

// Setup Event Listeners
function setupEventListeners() {
    sendBtn.addEventListener('click', handleSendMessage);
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    userInput.addEventListener('input', autoResize);
    
    clearBtn.addEventListener('click', clearCurrentChat);
    newChatBtn.addEventListener('click', createNewSession);
    sidebarToggle.addEventListener('click', toggleSidebar);
    if (aboutToggle) {
        aboutToggle.addEventListener('click', () => {
            const isOpen = aboutToggle.getAttribute('aria-expanded') === 'true';
            aboutToggle.setAttribute('aria-expanded', String(!isOpen));
            aboutContent.hidden = isOpen;
            localStorage.setItem('stgem-about-open', String(!isOpen));
        });
    }
}

// Detect /image command
function isImageCommand(text) {
    return /^\s*(?:\/image|\/img)\b/i.test(text);
}

// Extract prompt from /image command
function extractImagePrompt(text) {
    return text.replace(/^\s*(?:\/image|\/img)\b\s*/i, '').trim() || 'A beautiful landscape in the style of digital art';
}

// Call OpenRouter Images API
async function generateImage(prompt) {
    const body = {
        // You can change to another available model if desired
        model: 'openai/dall-e-3',
        prompt,
        size: '1024x1024',
        n: 1
    };

    const res = await fetch(IMAGE_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'HTTP-Referer': window.location.href,
            'X-Title': 'ST-GEM AI Chatbot'
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`Image API Error ${res.status}: ${t}`);
    }
    const data = await res.json();
    // Support both url and b64_json formats
    const item = data.data && data.data[0] ? data.data[0] : null;
    return {
        imageUrl: item && (item.url || item.image_url) || null,
        b64: item && (item.b64_json || item.b64) || null
    };
}

// Add image message to chat
function addImageMessage(src, altText = 'Generated Image') {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const img = document.createElement('img');
    img.src = src;
    img.alt = altText;
    contentDiv.appendChild(img);

    // Optional: show caption under image
    const caption = document.createElement('div');
    caption.style.marginTop = '8px';
    caption.style.fontSize = '13px';
    caption.style.opacity = '0.8';
    caption.innerText = altText;
    contentDiv.appendChild(caption);

    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Save to history with type=image
    chatHistory.push({ role: 'assistant', type: 'image', content: src, alt: altText });
    saveSessions();
}

// Auto-resize textarea
function autoResize() {
    userInput.style.height = 'auto';
    userInput.style.height = userInput.scrollHeight + 'px';
}

// Handle Send Message
async function handleSendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Remove welcome message if exists
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // If message is an image command, handle image generation
    if (isImageCommand(message)) {
        sendBtn.disabled = true;
        const typingIndicator = showTypingIndicator();
        try {
            const prompt = extractImagePrompt(message);
            const { imageUrl, b64 } = await generateImage(prompt);
            typingIndicator.remove();
            if (imageUrl) {
                addImageMessage(imageUrl, prompt);
            } else if (b64) {
                const dataUri = `data:image/png;base64,${b64}`;
                addImageMessage(dataUri, prompt);
            } else {
                addMessage('No image returned from the API.', 'assistant');
            }
        } catch (err) {
            console.error(err);
            typingIndicator.remove();
            addMessage('Image generation failed. Please try another prompt.', 'assistant');
        } finally {
            sendBtn.disabled = false;
            userInput.focus();
        }
        return;
    }
    
    // Disable send button
    sendBtn.disabled = true;
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    
    try {
        // Get AI response
        const response = await getAIResponse(message);
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Stream assistant message
        streamAssistantMessage(response);
        
    } catch (error) {
        console.error('Error:', error);
        typingIndicator.remove();
        addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Add Message to Chat
function addMessage(text, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = renderText(text);
    
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Save to history
    chatHistory.push({ role, content: text });
    
    // Update session title if this is the first user message
    if (role === 'user' && chatHistory.filter(m => m.role === 'user').length === 1) {
        // Quick local heuristic first
        const fallbackTitle = generateSessionTitle(text);
        updateSessionTitle(fallbackTitle);
        renderSessions();
        saveSessions();
        // Improve title asynchronously via AI summarization (non-blocking)
        summarizeSessionTitleWithAI(text).then(aiTitle => {
            if (!aiTitle) return;
            updateSessionTitle(aiTitle);
            renderSessions();
            saveSessions();
        }).catch(() => {/* ignore errors, keep fallback */});
    }
    
    saveSessions();
}

// Render simple formatting (convert newlines to <br>)
function renderText(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}

// Stream assistant message with typewriter effect
function streamAssistantMessage(fullText, speed = 12) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message assistant';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    wrapper.appendChild(contentDiv);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    let i = 0;
    const plain = fullText || '';
    const interval = setInterval(() => {
        // Append one more character and render with basic newline support
        const slice = plain.slice(0, i++);
        contentDiv.innerHTML = renderText(slice);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if (i > plain.length) {
            clearInterval(interval);
            // Save to history when done streaming
            chatHistory.push({ role: 'assistant', content: fullText });
            saveSessions();
        }
    }, speed);
}

// Show Typing Indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typing-indicator';
    
    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'typing-indicator';
    indicatorDiv.innerHTML = '<span>💬</span><span>🤖</span><span>⚙️</span><span>💡</span>';
    
    typingDiv.appendChild(indicatorDiv);
    chatContainer.appendChild(typingDiv);
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return typingDiv;
}

// Get AI Response
async function getAIResponse(userMessage) {
    const messages = [
        {
            role: 'system',
            content: 'You are ST-GEM AI, a helpful and friendly AI assistant. Provide clear, concise, and helpful responses.'
        },
        ...chatHistory.slice(-10).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        })),
        {
            role: 'user',
            content: userMessage
        }
    ];
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'HTTP-Referer': window.location.href,
            'X-Title': 'ST-GEM AI Chatbot'
        },
        body: JSON.stringify({
            model: 'openai/gpt-3.5-turbo',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        })
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// Session Management
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createNewSession() {
    const sessionId = generateSessionId();
    const session = {
        id: sessionId,
        title: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
    };
    
    sessions[sessionId] = session;
    currentSessionId = sessionId;
    chatHistory = [];
    
    updateSessionTitle('New Chat');
    clearChatDisplay();
    renderSessions();
    saveSessions();
}

function switchToSession(sessionId) {
    if (sessions[sessionId]) {
        // Save current session before switching
        if (currentSessionId && sessions[currentSessionId]) {
            sessions[currentSessionId].messages = [...chatHistory];
            sessions[currentSessionId].lastActivity = new Date().toISOString();
        }
        
        currentSessionId = sessionId;
        chatHistory = [...sessions[sessionId].messages];
        
        updateSessionTitle(sessions[sessionId].title);
        loadSessionMessages();
        renderSessions();
        saveSessions();
    }
}

function deleteSession(sessionId) {
    if (confirm('Are you sure you want to delete this chat session?')) {
        delete sessions[sessionId];
        
        if (currentSessionId === sessionId) {
            const remainingSessions = Object.keys(sessions);
            if (remainingSessions.length > 0) {
                switchToSession(remainingSessions[0]);
            } else {
                createNewSession();
            }
        }
        
        renderSessions();
        saveSessions();
    }
}

function updateSessionTitle(title) {
    sessionTitle.textContent = title;
    if (currentSessionId && sessions[currentSessionId]) {
        sessions[currentSessionId].title = title;
    }
}

function generateSessionTitle(firstMessage) {
    const words = firstMessage.split(' ').slice(0, 4).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
}

// Ask the model to summarize a short session title (3-6 words)
async function summarizeSessionTitleWithAI(text) {
    try {
        const system = {
            role: 'system',
            content: 'You generate ultra-concise chat session titles. Output only 3-6 keyword-style words in Title Case without quotes or punctuation.'
        };
        const user = {
            role: 'user',
            content: `Create a short session title for this first user message:\n${text}`
        };
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'ST-GEM AI Chatbot'
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [system, user],
                temperature: 0.2,
                max_tokens: 20
            })
        });
        if (!response.ok) throw new Error('title api error');
        const data = await response.json();
        let title = (data.choices?.[0]?.message?.content || '').trim();
        // sanitize: remove trailing punctuation/newlines
        title = title.replace(/[\-–—:;,.!?]+$/g, '').replace(/\s+/g, ' ').slice(0, 60);
        // fallback if model returned empty
        if (!title) {
            return generateSessionTitle(text);
        }
        return title;
    } catch (e) {
        // Fallback to local heuristic
        return generateSessionTitle(text);
    }
}

function clearCurrentChat() {
    if (confirm('Are you sure you want to clear this chat?')) {
        chatHistory = [];
        if (currentSessionId && sessions[currentSessionId]) {
            sessions[currentSessionId].messages = [];
            sessions[currentSessionId].title = 'New Chat';
        }
        updateSessionTitle('New Chat');
        clearChatDisplay();
        renderSessions();
        saveSessions();
    }
}

function clearChatDisplay() {
    chatContainer.innerHTML = `
        <div class="welcome-message">
            <h2>Welcome to ST-GEM AI</h2>
            <p>Your intelligent assistant powered by advanced AI. Ask me anything!</p>
            <div class="welcome-commands">
                <p><strong>Commands:</strong></p>
                <p>• Type normally for AI chat</p>
                <p>• Use <code>/image [prompt]</code> for image generation</p>
            </div>
        </div>
    `;
}

function toggleSidebar() {
    if (window.innerWidth <= 768) {
        const isOpen = sidebar.classList.toggle('open');
        if (sidebarToggle && sidebarToggle.setAttribute) {
            sidebarToggle.setAttribute('aria-expanded', String(isOpen));
        }
    } else {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        localStorage.setItem('stgem-sidebar-collapsed', String(isCollapsed));
        if (sidebarToggle && sidebarToggle.setAttribute) {
            sidebarToggle.setAttribute('aria-expanded', String(!isCollapsed));
        }
    }
}

function renderSessions() {
    const sessionList = Object.values(sessions).sort((a, b) => 
        new Date(b.lastActivity) - new Date(a.lastActivity)
    );
    
    chatSessions.innerHTML = sessionList.map(session => {
        const date = new Date(session.lastActivity).toLocaleDateString();
        const isActive = session.id === currentSessionId;
        
        return `
            <div class="chat-session ${isActive ? 'active' : ''}" data-session-id="${session.id}">
                <div class="session-preview">${session.title}</div>
                <div class="session-date">${date}</div>
                <button class="session-delete" data-session-id="${session.id}">×</button>
            </div>
        `;
    }).join('');
    
    // Add event listeners
    chatSessions.querySelectorAll('.chat-session').forEach(element => {
        element.addEventListener('click', (e) => {
            if (!e.target.classList.contains('session-delete')) {
                const sessionId = element.dataset.sessionId;
                switchToSession(sessionId);
            }
        });
    });
    
    chatSessions.querySelectorAll('.session-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const sessionId = button.dataset.sessionId;
            deleteSession(sessionId);
        });
    });
}

function loadSessionMessages() {
    clearChatDisplay();
    
    if (chatHistory.length > 0) {
        // Remove welcome message
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        // Restore messages
        chatHistory.forEach(msg => {
            if (msg.type === 'image') {
                addImageMessage(msg.content, msg.alt || 'Generated Image');
            } else {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.role}`;
                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
                contentDiv.innerHTML = renderText(msg.content);
                messageDiv.appendChild(contentDiv);
                chatContainer.appendChild(messageDiv);
            }
        });
        
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Save Sessions to LocalStorage
function saveSessions() {
    // Update current session before saving
    if (currentSessionId && sessions[currentSessionId]) {
        sessions[currentSessionId].messages = [...chatHistory];
        sessions[currentSessionId].lastActivity = new Date().toISOString();
    }
    
    localStorage.setItem('stgem-sessions', JSON.stringify(sessions));
    localStorage.setItem('stgem-current-session', currentSessionId);
}

// Load Sessions from LocalStorage
function loadSessions() {
    const savedSessions = localStorage.getItem('stgem-sessions');
    const savedCurrentSession = localStorage.getItem('stgem-current-session');
    
    if (savedSessions) {
        sessions = JSON.parse(savedSessions);
        
        if (savedCurrentSession && sessions[savedCurrentSession]) {
            currentSessionId = savedCurrentSession;
            chatHistory = [...sessions[currentSessionId].messages];
            updateSessionTitle(sessions[currentSessionId].title);
        }
        
        renderSessions();
        
        if (chatHistory.length > 0) {
            loadSessionMessages();
        }
    }
}
