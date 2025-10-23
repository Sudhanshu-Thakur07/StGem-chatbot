# ST-GEM AI Chatbot

A modern, ChatGPT-like chatbot interface powered by AI. Built with vanilla JavaScript, HTML, and CSS for simplicity and ease of use.

![ST-GEM AI](https://img.shields.io/badge/ST--GEM-AI-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🤖 **AI-Powered Conversations** - Intelligent responses using advanced AI models
- 💬 **Real-time Chat Interface** - Smooth, responsive chat experience
- 💾 **Chat History** - Automatically saves conversations in browser storage
- 🎨 **Modern UI** - Beautiful gradient design with smooth animations
- 📱 **Responsive Design** - Works perfectly on desktop and mobile devices
- ⌨️ **Keyboard Shortcuts** - Press Enter to send, Shift+Enter for new line
- 🧹 **Clear Chat** - Easy option to clear conversation history

## Demo

The chatbot provides a clean, intuitive interface similar to ChatGPT with:
- User messages displayed on the right in purple gradient
- AI responses on the left in white cards
- Typing indicator while AI is thinking
- Auto-scrolling to latest messages

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/st-gem-ai.git
   cd st-gem-ai
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - No build process or dependencies required!

## Usage

1. Type your message in the input box at the bottom
2. Press Enter or click the send button
3. Wait for ST-GEM AI to respond
4. Continue the conversation naturally
5. Use "Clear Chat" button to start fresh

## Project Structure

```
st-gem-ai/
│
├── index.html          # Main HTML structure
├── style.css           # Styling and animations
├── script.js           # JavaScript logic and API integration
└── README.md           # Project documentation
```

## Technologies Used

- **HTML5** - Structure and semantics
- **CSS3** - Styling, gradients, and animations
- **JavaScript (ES6+)** - Logic and API integration
- **OpenRouter API** - AI model access
- **LocalStorage** - Chat history persistence

## Configuration

The chatbot uses the OpenRouter API. The API key is configured in `script.js`:

```javascript
const API_KEY = 'your-api-key-here';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
```

**Note:** For production use, consider implementing proper API key management and security measures.

## Features in Detail

### Chat History
- Conversations are automatically saved to browser's LocalStorage
- History persists across browser sessions
- Can be cleared using the "Clear Chat" button

### Responsive Design
- Adapts to different screen sizes
- Mobile-friendly interface
- Touch-optimized controls

### Typing Indicator
- Shows animated dots while AI is generating response
- Provides visual feedback during processing

### Auto-resize Input
- Text area automatically expands as you type
- Maximum height limit for better UX

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## Customization

### Changing Colors
Edit the gradient colors in `style.css`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Changing AI Model
Modify the model in `script.js`:
```javascript
model: 'openai/gpt-3.5-turbo'
```

### Adjusting Response Length
Change `max_tokens` in the API request:
```javascript
max_tokens: 1000
```

## Security Considerations

⚠️ **Important:** This is a basic implementation for project purposes. For production use:

1. Never expose API keys in client-side code
2. Implement backend API proxy
3. Add rate limiting
4. Implement user authentication
5. Sanitize user inputs
6. Add HTTPS enforcement

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenRouter for providing AI API access
- Inspired by ChatGPT's interface design
- Built for educational and project purposes

## Contact

Project Link: [](st-gem-chatbot.netlify.app)

---

Made with ❤️ for learning and development purposes
