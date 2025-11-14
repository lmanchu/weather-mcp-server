# Weather MCP Server - Sample Implementation

> **Reference implementation for ASUS and OEM partners**
>
> A simple, production-ready MCP server demonstrating how to integrate external services with AI PCs using the Model Context Protocol.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-0.5.0-blue)](https://github.com/modelcontextprotocol)

<a href="https://glama.ai/mcp/servers/@lmanchu/weather-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@lmanchu/weather-mcp-server/badge" alt="Weather Server MCP server" />
</a>

---

## 🎯 Purpose

This sample MCP server demonstrates:

- ✅ How to create an MCP server from scratch
- ✅ How to expose tools (functions) to AI clients
- ✅ How to integrate external APIs (OpenWeather API)
- ✅ Production-ready error handling
- ✅ Clean, well-documented code

**Perfect for**: OEM partners building AI PC features, developers learning MCP, proof-of-concept projects

---

## 🌟 Features

### Available Tools

1. **`get_current_weather`** - Get real-time weather for any city
   - Temperature, conditions, humidity, wind speed
   - Supports both Celsius and Fahrenheit

2. **`get_weather_forecast`** - Get 5-day forecast
   - Daily high/low temperatures
   - Weather conditions per day

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- OpenWeather API key (free tier available)

### Installation

```bash
# Clone or download this repository
cd weather-mcp-server

# Install dependencies
npm install

# Configure API key
cp .env.example .env
# Edit .env and add your OpenWeather API key
```

### Get API Key

1. Visit [OpenWeather API](https://openweathermap.org/api)
2. Sign up for free account
3. Generate API key
4. Add to `.env` file

### Run the Server

```bash
# Start the server
npm start

# Or with auto-reload during development
npm run dev
```

---

## 📖 Usage Examples

### Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/absolute/path/to/weather-mcp-server/index.js"],
      "env": {
        "OPENWEATHER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Test with AI Client

Once configured, you can ask your AI assistant:

```
"What's the weather like in Taipei?"
"Give me a 5-day forecast for Tokyo"
"What's the temperature in New York in Fahrenheit?"
```

The AI will automatically call the appropriate MCP tools!

---

## 🏗️ Architecture

```
┌─────────────────┐
│   AI Client     │ (Claude, ChatGPT, etc.)
│  (Claude Desktop)│
└────────┬────────┘
         │ MCP Protocol (stdio)
         ↓
┌─────────────────┐
│  Weather MCP    │ ← This server
│     Server      │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│ OpenWeather API │
└─────────────────┘
```

### Key Components

- **`index.js`** - Main server implementation
- **`@modelcontextprotocol/sdk`** - Official MCP SDK
- **`StdioServerTransport`** - Communicates via stdin/stdout
- **`OpenWeather API`** - External weather data source

---

## 📁 Project Structure

```
weather-mcp-server/
├── package.json          # Dependencies and scripts
├── index.js              # Main MCP server code
├── .env.example          # Environment variables template
├── .env                  # Your API keys (git-ignored)
├── README.md             # This file
├── README.zh-TW.md       # 繁體中文版
├── PARTNER-GUIDE.md      # Detailed guide for OEM partners
└── examples/
    └── client-example.js # Example client code
```

---

## 🛠️ Development

### Code Structure

The server is organized into clear sections:

1. **Configuration** - API keys, URLs
2. **WeatherServer Class** - Main server logic
3. **Tool Registration** - Define available tools
4. **Tool Handlers** - Implement tool functionality
5. **Error Handling** - Robust error management

### Adding New Tools

```javascript
// 1. Add tool definition in setupToolHandlers()
{
  name: 'your_new_tool',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter description' }
    },
    required: ['param1']
  }
}

// 2. Add handler in CallToolRequestSchema
case 'your_new_tool':
  return await this.yourNewTool(args.param1);

// 3. Implement the method
async yourNewTool(param1) {
  // Your logic here
  return {
    content: [{
      type: 'text',
      text: 'Result'
    }]
  };
}
```

---

## 🧪 Testing

### Manual Testing

```bash
# Test the MCP server directly
npm test
```

### Integration Testing

Use the included `examples/client-example.js` to test tool calls programmatically.

---

## 📝 API Reference

### Tool: `get_current_weather`

**Parameters:**
- `city` (string, required) - City name (e.g., "Taipei", "Tokyo")
- `units` (string, optional) - "metric" (default) or "imperial"

**Returns:**
```
🌤️ Current Weather in Taipei, TW

Temperature: 25.3°C (feels like 26.1°C)
Condition: Clear - clear sky
Humidity: 65%
Wind Speed: 3.2 m/s
Pressure: 1013 hPa
Visibility: 10.0 km

Last updated: 11/14/2025, 10:30:00 AM
```

### Tool: `get_weather_forecast`

**Parameters:**
- `city` (string, required) - City name
- `units` (string, optional) - "metric" (default) or "imperial"

**Returns:**
```
📅 5-Day Weather Forecast for Taipei, TW

11/14/2025:
  High: 26.5°C | Low: 22.1°C
  Condition: Clear

11/15/2025:
  High: 27.2°C | Low: 23.4°C
  Condition: Clouds

...
```

---

## 🔒 Security Best Practices

### Implemented in this sample:

- ✅ API keys stored in environment variables (not in code)
- ✅ Input validation for all parameters
- ✅ Proper error handling (no sensitive data leakage)
- ✅ HTTPS for external API calls
- ✅ Minimal dependencies (reduces attack surface)

### For production deployments:

- 🔐 Use secrets management system (AWS Secrets Manager, Azure Key Vault)
- 🔐 Implement rate limiting
- 🔐 Add request logging/monitoring
- 🔐 Use TLS for MCP communication if deployed remotely

---

## 🌐 Localization

This server supports multiple languages through the OpenWeather API:

```javascript
// Add language parameter to API call
const url = `${API_BASE_URL}/weather?q=${city}&units=${units}&lang=zh_tw&appid=${API_KEY}`;
```

Supported languages: en, zh_tw, zh_cn, ja, ko, and [50+ more](https://openweathermap.org/current#multi)

---

## 🐛 Troubleshooting

### Common Issues

**"City not found"**
- Check spelling of city name
- Try including country code: "Taipei,TW"

**"Weather API error: Unauthorized"**
- Verify your API key in `.env`
- Check API key is active at openweathermap.org

**"Module not found"**
- Run `npm install`
- Check Node.js version >= 18.0.0

**MCP server not detected in Claude**
- Verify `claude_desktop_config.json` path
- Restart Claude Desktop
- Check server logs for errors

---

## 📚 Learn More

### MCP Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Claude MCP Guide](https://docs.anthropic.com/claude/docs/mcp)

### Weather API

- [OpenWeather API Docs](https://openweathermap.org/api)
- [API Response Examples](https://openweathermap.org/current#current_JSON)

---

## 🤝 For OEM Partners

**See `PARTNER-GUIDE.md` for**:
- Detailed integration guide
- Deployment options
- Customization examples
- Production checklist
- Support information

**Contact**: partners@irisgo.ai

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Credits

- **Created by**: IrisGo.AI Team
- **MCP Protocol**: Anthropic
- **Weather Data**: OpenWeather
- **For**: ASUS and AI PC OEM partners

---

## 📮 Support

- **Issues**: [GitHub Issues](https://github.com/irisgo-ai/weather-mcp-server/issues)
- **Email**: support@irisgo.ai
- **Documentation**: [docs.irisgo.ai](https://docs.irisgo.ai)

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0