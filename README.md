# HAL's Penny

An intelligent AI expense tracker built with Node.js, Express, Socket.IO, and React. HAL's Penny helps you track expenses through natural language conversations with advanced AI capabilities.

## Features

- 🤖 AI-powered expense tracking through natural language
- 💬 Real-time chat interface with WebSocket communication
- 🧠 Multi-tier AI system (Anthropic Claude → OpenAI → Regex fallback)
- ⚡ Optimize/Regular mode for token usage control
- 📊 Interactive charts and expense visualization
- 🎨 Modern, responsive UI with glassmorphism design
- 📱 Mobile-friendly design
- 💾 SQLite database for persistent storage
- 🔄 Session memory and conversation context

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd expense-tracker-app
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Usage

1. Start the server using one of the commands above
2. Open your browser and navigate to `http://localhost:3000`
3. Start chatting with the bot!

## Project Structure

```
expense-tracker-app/
├── public/
│   ├── index.html      # Main HTML file
│   ├── style.css       # CSS styles
│   └── script.js       # Frontend JavaScript
├── server.js           # Express server
├── package.json        # Dependencies and scripts
├── .env               # Environment variables
└── README.md          # This file
```

## Technologies Used

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with modern design
- **Icons**: Font Awesome

## Customization

### Adding New Bot Responses

Edit the `chatbotResponses` object in `server.js` to add new response patterns:

```javascript
const chatbotResponses = {
  greeting: [
    "Hello! How can I help you today?",
    // Add more responses here
  ],
  // Add more categories...
};
```

### Styling

Modify `public/style.css` to customize the appearance of the chat interface.

## API Endpoints

- `GET /` - Serves the main chat interface
- WebSocket connection for real-time messaging

## License

ISC
