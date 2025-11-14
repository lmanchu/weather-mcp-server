# Partner Integration Guide - Weather MCP Server

> **Comprehensive guide for ASUS and OEM partners**
> Integrating MCP Servers into AI PC products

**Version**: 1.0.0
**Last Updated**: 2025-11-14
**For**: ASUS, AI PC OEM Partners, System Integrators

---

## Table of Contents

1. [Introduction](#introduction)
2. [Integration Overview](#integration-overview)
3. [Deployment Options](#deployment-options)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [Customization Examples](#customization-examples)
6. [Production Checklist](#production-checklist)
7. [Security Considerations](#security-considerations)
8. [Testing & Validation](#testing--validation)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Support & Resources](#support--resources)

---

## Introduction

### What is MCP?

**Model Context Protocol (MCP)** is an open standard that enables AI applications to connect with external data sources and tools. It's the foundation for building AI PC features that can interact with real-world services.

### Why This Weather Server?

This weather MCP server is a **production-ready reference implementation** that demonstrates:

- ✅ How to build MCP servers from scratch
- ✅ Best practices for error handling and security
- ✅ Integration with external APIs (OpenWeather)
- ✅ Clean, maintainable code structure
- ✅ Complete documentation

**Use this as a template** for building your own MCP servers for AI PC features.

### What You'll Learn

By the end of this guide, you'll be able to:

1. Deploy the weather MCP server on customer PCs
2. Customize the server for your specific needs
3. Create your own MCP servers for custom features
4. Ensure production-ready security and reliability

---

## Integration Overview

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AI PC (Customer Device)               │
│                                                          │
│  ┌────────────────┐         ┌──────────────────────┐   │
│  │   AI Client    │ ◄─MCP──► │   Weather MCP Server │   │
│  │ (Claude, etc.) │  stdio  │   (Node.js Process)   │   │
│  └────────────────┘         └──────────┬───────────┘   │
│                                         │               │
└─────────────────────────────────────────┼───────────────┘
                                          │ HTTPS
                                          ▼
                            ┌──────────────────────────┐
                            │   OpenWeather API        │
                            │   (External Service)     │
                            └──────────────────────────┘
```

### System Requirements

**Minimum Requirements**:
- Node.js >= 18.0.0
- 100MB disk space
- Internet connection for API calls
- Windows 10/11, macOS 10.15+, or Linux

**Recommended**:
- Node.js >= 20.0.0
- 250MB disk space (for logs and cache)
- Stable internet connection

### Integration Models

**Model 1: Pre-installed** (Recommended for OEMs)
- MCP server pre-installed with AI PC image
- API keys managed centrally or per-user
- Automatic updates via system update mechanism

**Model 2: User-installed** (For advanced users)
- User downloads and configures manually
- User provides their own API keys
- Self-managed updates

**Model 3: Cloud-hosted** (Enterprise)
- MCP server runs on cloud infrastructure
- Shared across multiple client devices
- Centralized management and monitoring

---

## Deployment Options

### Option 1: Local Installation (Recommended for AI PCs)

**Best for**: Pre-installed on AI PC products

**Deployment Steps**:

```bash
# 1. Choose installation directory
INSTALL_DIR="C:\Program Files\ASUS\MCP Servers\Weather"  # Windows
# or
INSTALL_DIR="/usr/local/lib/asus-mcp/weather"  # Linux/macOS

# 2. Copy server files
mkdir -p "$INSTALL_DIR"
cp -r weather-mcp-server/* "$INSTALL_DIR/"

# 3. Install dependencies
cd "$INSTALL_DIR"
npm install --production

# 4. Configure API key (see Configuration section)
echo "OPENWEATHER_API_KEY=your_key" > .env

# 5. Set permissions (Linux/macOS)
chmod 755 index.js
chown -R root:root "$INSTALL_DIR"

# 6. Create system service (optional, see below)
```

**System Service Setup (Windows)**:

Create `weather-mcp.xml` for Task Scheduler:

```xml
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2">
  <RegistrationInfo>
    <Description>ASUS Weather MCP Server</Description>
  </RegistrationInfo>
  <Triggers>
    <BootTrigger>
      <Enabled>true</Enabled>
    </BootTrigger>
  </Triggers>
  <Actions>
    <Exec>
      <Command>node</Command>
      <Arguments>"C:\Program Files\ASUS\MCP Servers\Weather\index.js"</Arguments>
      <WorkingDirectory>C:\Program Files\ASUS\MCP Servers\Weather</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
```

Register with:
```cmd
schtasks /create /xml weather-mcp.xml /tn "ASUS\Weather MCP Server"
```

**System Service Setup (Linux systemd)**:

Create `/etc/systemd/system/weather-mcp.service`:

```ini
[Unit]
Description=ASUS Weather MCP Server
After=network.target

[Service]
Type=simple
User=mcp-server
WorkingDirectory=/usr/local/lib/asus-mcp/weather
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="NODE_ENV=production"
EnvironmentFile=/usr/local/lib/asus-mcp/weather/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl enable weather-mcp.service
systemctl start weather-mcp.service
```

**System Service Setup (macOS LaunchAgent)**:

Create `~/Library/LaunchAgents/com.asus.weather-mcp.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.asus.weather-mcp</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/asus-mcp/weather/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/weather-mcp.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/weather-mcp.error.log</string>
</dict>
</plist>
```

Load:
```bash
launchctl load ~/Library/LaunchAgents/com.asus.weather-mcp.plist
```

### Option 2: Docker Container

**Best for**: Consistent cross-platform deployment

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY index.js ./

# Create non-root user
RUN addgroup -g 1001 -S mcp && \
    adduser -S mcp -u 1001

USER mcp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"

# Start server
CMD ["node", "index.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  weather-mcp:
    build: .
    container_name: asus-weather-mcp
    restart: unless-stopped
    environment:
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
    networks:
      - mcp-network
    stdin_open: true
    tty: true

networks:
  mcp-network:
    driver: bridge
```

Deploy:
```bash
docker-compose up -d
```

### Option 3: Cloud Deployment

**Best for**: Enterprise customers with centralized management

**AWS Lambda Example**:

```javascript
// lambda-handler.js
import { WeatherServer } from './index.js';

export const handler = async (event) => {
  const server = new WeatherServer();

  // Parse MCP request from event
  const request = JSON.parse(event.body);

  // Handle request
  const response = await server.handleRequest(request);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response)
  };
};
```

**Azure Functions Example**:

```javascript
// function.json
{
  "bindings": [
    {
      "authLevel": "function",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}

// index.js
module.exports = async function (context, req) {
  const server = new WeatherServer();
  const response = await server.handleRequest(req.body);
  context.res = {
    status: 200,
    body: response
  };
};
```

---

## Step-by-Step Integration

### Step 1: Environment Setup

**For OEM Pre-installation**:

1. **Determine installation path**:
   ```bash
   # Windows
   C:\Program Files\[OEM-Name]\MCP Servers\Weather

   # macOS
   /Library/Application Support/[OEM-Name]/MCP/Weather

   # Linux
   /opt/[oem-name]/mcp/weather
   ```

2. **Set up Node.js environment**:
   - Bundle Node.js runtime if not already included in AI PC
   - Use Node.js 20 LTS for stability
   - Consider using pkg or nexe to create standalone executable

3. **API Key Management**:

   **Option A: Centralized API Key** (Recommended for free tier)
   ```bash
   # Share one API key across all installations
   # Monitor usage centrally
   # Implement rate limiting per device
   ```

   **Option B: Per-User API Key**
   ```bash
   # User creates their own OpenWeather account
   # User enters API key during setup wizard
   # More scalable for large deployments
   ```

### Step 2: AI Client Configuration

**Claude Desktop Configuration**:

Create or modify `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["C:\\Program Files\\ASUS\\MCP Servers\\Weather\\index.js"],
      "env": {
        "OPENWEATHER_API_KEY": "${OPENWEATHER_API_KEY}",
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Environment Variable Resolution**:

```javascript
// config-helper.js
const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(
    process.env.APPDATA || process.env.HOME,
    'Claude',
    'claude_desktop_config.json'
  );

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Resolve environment variables
  Object.keys(config.mcpServers).forEach(serverName => {
    const server = config.mcpServers[serverName];
    if (server.env) {
      Object.keys(server.env).forEach(key => {
        const value = server.env[key];
        if (value.startsWith('${') && value.endsWith('}')) {
          const envVar = value.slice(2, -1);
          server.env[key] = process.env[envVar] || '';
        }
      });
    }
  });

  return config;
}
```

### Step 3: Testing Integration

**Basic Test**:

```bash
# Test server starts correctly
cd "C:\Program Files\ASUS\MCP Servers\Weather"
node index.js

# Expected output:
# Weather MCP server running on stdio
# Ready to receive requests from AI clients
```

**Interactive Test**:

Use the included test client:

```bash
node examples/client-example.js
```

**Integration Test with AI Client**:

1. Start Claude Desktop (or your AI client)
2. Ask: "What's the weather in Taipei?"
3. Verify the AI calls the MCP server and returns weather data

### Step 4: Production Deployment

**Checklist before deployment**:

- [ ] API key configured and tested
- [ ] Server starts without errors
- [ ] System service configured (if applicable)
- [ ] Logging configured
- [ ] Error handling tested
- [ ] Network connectivity verified
- [ ] AI client configuration deployed
- [ ] User documentation prepared

---

## Customization Examples

### Example 1: Add New Weather Tool (Air Quality)

**Add to tool list** (index.js:76-117):

```javascript
{
  name: 'get_air_quality',
  description: 'Get air quality index (AQI) for a specific city',
  inputSchema: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'City name',
      },
      lat: {
        type: 'number',
        description: 'Latitude (optional, more accurate)',
      },
      lon: {
        type: 'number',
        description: 'Longitude (optional, more accurate)',
      },
    },
    required: ['city'],
  },
}
```

**Add handler** (index.js:121-146):

```javascript
case 'get_air_quality':
  return await this.getAirQuality(args.city, args.lat, args.lon);
```

**Implement method**:

```javascript
async getAirQuality(city, lat, lon) {
  // If coordinates not provided, get them from city name first
  if (!lat || !lon) {
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (!geoData.length) {
      throw new Error(`City "${city}" not found`);
    }

    lat = geoData[0].lat;
    lon = geoData[0].lon;
  }

  // Get air quality data
  const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Air Quality API error: ${response.statusText}`);
  }

  const data = await response.json();
  const aqi = data.list[0].main.aqi;
  const components = data.list[0].components;

  const aqiLevels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  const aqiText = `
🌍 Air Quality in ${city}

AQI Level: ${aqi}/5 (${aqiLevels[aqi - 1]})

Components:
- PM2.5: ${components.pm2_5} μg/m³
- PM10: ${components.pm10} μg/m³
- NO₂: ${components.no2} μg/m³
- O₃: ${components.o3} μg/m³
- CO: ${components.co} μg/m³

Last updated: ${new Date().toLocaleString()}
  `.trim();

  return {
    content: [{ type: 'text', text: aqiText }],
  };
}
```

### Example 2: Add Caching to Reduce API Calls

**Install cache library**:

```bash
npm install node-cache
```

**Add to index.js**:

```javascript
import NodeCache from 'node-cache';

class WeatherServer {
  constructor() {
    // ... existing code ...

    // Cache for 5 minutes (300 seconds)
    this.cache = new NodeCache({ stdTTL: 300 });
  }

  async getCurrentWeather(city, units = 'metric') {
    const cacheKey = `weather:${city}:${units}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.error(`[Cache HIT] ${cacheKey}`);
      return cached;
    }

    console.error(`[Cache MISS] ${cacheKey}`);

    // Fetch from API (existing code)
    const url = `${API_BASE_URL}/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`;
    const response = await fetch(url);
    // ... rest of existing code ...

    const result = {
      content: [{ type: 'text', text: weatherText }],
    };

    // Store in cache
    this.cache.set(cacheKey, result);

    return result;
  }
}
```

### Example 3: Add Rate Limiting

**Install rate limiter**:

```bash
npm install express-rate-limit
```

**Add to index.js**:

```javascript
import rateLimit from 'express-rate-limit';

class WeatherServer {
  constructor() {
    // ... existing code ...

    // Track requests per client (by session)
    this.requestCounts = new Map();
    this.RATE_LIMIT = 60; // 60 requests per hour
  }

  async getCurrentWeather(city, units = 'metric') {
    // Check rate limit
    const clientId = process.env.CLIENT_ID || 'default';
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // Clean old entries
    if (!this.requestCounts.has(clientId)) {
      this.requestCounts.set(clientId, []);
    }

    const requests = this.requestCounts.get(clientId);
    const recentRequests = requests.filter(time => time > oneHourAgo);

    if (recentRequests.length >= this.RATE_LIMIT) {
      throw new Error(`Rate limit exceeded. Maximum ${this.RATE_LIMIT} requests per hour.`);
    }

    // Record this request
    recentRequests.push(now);
    this.requestCounts.set(clientId, recentRequests);

    // Continue with normal flow
    // ... existing code ...
  }
}
```

### Example 4: Add Logging

**Install logger**:

```bash
npm install winston
```

**Add to index.js**:

```javascript
import winston from 'winston';
import path from 'path';

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log')
    }),
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

class WeatherServer {
  async getCurrentWeather(city, units = 'metric') {
    logger.info('Weather request received', { city, units });

    try {
      const url = `${API_BASE_URL}/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        logger.error('Weather API error', {
          city,
          status: response.status,
          statusText: response.statusText
        });

        if (response.status === 404) {
          throw new Error(`City "${city}" not found`);
        }
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      logger.info('Weather request successful', { city });

      // ... rest of code ...
    } catch (error) {
      logger.error('Error in getCurrentWeather', {
        city,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

### Example 5: Custom Branding

**Customize server name and messages**:

```javascript
class WeatherServer {
  constructor() {
    this.server = new Server(
      {
        name: 'asus-weather-assistant',  // Custom name
        version: '1.0.0-asus',            // Custom version
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  async getCurrentWeather(city, units = 'metric') {
    // ... existing code ...

    const weatherText = `
🌤️ ASUS AI PC Weather Assistant

Current Weather in ${data.name}, ${data.sys.country}

Temperature: ${data.main.temp}${tempUnit} (feels like ${data.main.feels_like}${tempUnit})
Condition: ${data.weather[0].main} - ${data.weather[0].description}
Humidity: ${data.main.humidity}%
Wind Speed: ${data.wind.speed} ${speedUnit}

Powered by ASUS AI PC
Last updated: ${new Date(data.dt * 1000).toLocaleString()}
    `.trim();

    return {
      content: [{ type: 'text', text: weatherText }],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ASUS Weather Assistant running');
    console.error('Powered by ASUS AI PC Technology');
  }
}
```

---

## Production Checklist

### Pre-Deployment

**Code Quality**:
- [ ] Code reviewed and tested
- [ ] All console.error() changed to proper logging
- [ ] Error messages don't expose sensitive information
- [ ] Input validation for all parameters
- [ ] Rate limiting implemented
- [ ] Caching implemented (if needed)

**Security**:
- [ ] API keys not hardcoded
- [ ] Environment variables properly configured
- [ ] HTTPS used for all external API calls
- [ ] No sensitive data in logs
- [ ] Dependencies scanned for vulnerabilities (`npm audit`)
- [ ] Principle of least privilege applied

**Configuration**:
- [ ] Production environment variables set
- [ ] Logging configured and tested
- [ ] Log rotation configured
- [ ] System service configured (if applicable)
- [ ] Health check endpoint (if using HTTP)
- [ ] Monitoring configured

**Documentation**:
- [ ] User documentation prepared
- [ ] Troubleshooting guide created
- [ ] Support contact information included
- [ ] Version number documented

### Deployment

**Installation**:
- [ ] Server installed in correct location
- [ ] File permissions set correctly
- [ ] Dependencies installed (`npm ci --production`)
- [ ] Configuration files in place
- [ ] System service registered
- [ ] Server starts successfully

**Integration**:
- [ ] AI client configuration deployed
- [ ] Test queries executed successfully
- [ ] Error scenarios tested
- [ ] Performance benchmarked

**Verification**:
- [ ] Server responds to requests
- [ ] External API calls work
- [ ] Caching works (if implemented)
- [ ] Rate limiting works (if implemented)
- [ ] Logging works
- [ ] System service auto-starts (if applicable)

### Post-Deployment

**Monitoring**:
- [ ] Set up alerts for errors
- [ ] Monitor API usage and costs
- [ ] Track response times
- [ ] Monitor disk usage (logs)

**Maintenance**:
- [ ] Update schedule defined
- [ ] Backup strategy for configuration
- [ ] Rollback plan prepared
- [ ] Support escalation path defined

---

## Security Considerations

### API Key Management

**DO**:
- ✅ Store API keys in environment variables or secrets manager
- ✅ Use separate API keys for dev/staging/production
- ✅ Rotate API keys regularly (every 90 days)
- ✅ Monitor API usage for anomalies
- ✅ Implement rate limiting

**DON'T**:
- ❌ Hardcode API keys in source code
- ❌ Commit API keys to version control
- ❌ Share API keys across multiple products
- ❌ Use production API keys in development
- ❌ Expose API keys in error messages or logs

**Enterprise Secrets Management**:

```javascript
// Using AWS Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getApiKey() {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const command = new GetSecretValueCommand({ SecretId: "weather-api-key" });
  const response = await client.send(command);
  return JSON.parse(response.SecretString).OPENWEATHER_API_KEY;
}

// Using Azure Key Vault
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

async function getApiKey() {
  const credential = new DefaultAzureCredential();
  const client = new SecretClient("https://your-keyvault.vault.azure.net", credential);
  const secret = await client.getSecret("weather-api-key");
  return secret.value;
}
```

### Input Validation

**Always validate user inputs**:

```javascript
async getCurrentWeather(city, units = 'metric') {
  // Validate city name
  if (!city || typeof city !== 'string') {
    throw new Error('City name is required and must be a string');
  }

  if (city.length > 100) {
    throw new Error('City name too long (max 100 characters)');
  }

  // Sanitize city name (prevent injection)
  const sanitizedCity = city.replace(/[^\w\s,-]/g, '');

  // Validate units
  const validUnits = ['metric', 'imperial'];
  if (!validUnits.includes(units)) {
    throw new Error(`Invalid units. Must be one of: ${validUnits.join(', ')}`);
  }

  // Continue with validated inputs
  // ...
}
```

### Network Security

**TLS/HTTPS**:
- Always use HTTPS for external API calls
- Validate SSL certificates
- Don't disable certificate verification

```javascript
import https from 'https';
import fetch from 'node-fetch';

// Good: Uses HTTPS with certificate validation
const response = await fetch('https://api.openweathermap.org/...', {
  agent: new https.Agent({
    rejectUnauthorized: true  // Verify SSL certificates
  })
});

// Bad: Disables certificate verification (NEVER DO THIS)
const response = await fetch('https://api.openweathermap.org/...', {
  agent: new https.Agent({
    rejectUnauthorized: false  // ❌ Security risk!
  })
});
```

### Error Handling

**Don't expose sensitive information**:

```javascript
// Good: Generic error message
async getCurrentWeather(city, units) {
  try {
    const url = `${API_BASE_URL}/weather?q=${city}&appid=${API_KEY}`;
    const response = await fetch(url);
    // ...
  } catch (error) {
    logger.error('Weather API error', { city, error: error.message });
    throw new Error('Unable to fetch weather data. Please try again later.');
  }
}

// Bad: Exposes API details and potentially API key
async getCurrentWeather(city, units) {
  const url = `${API_BASE_URL}/weather?q=${city}&appid=${API_KEY}`;
  const response = await fetch(url);  // ❌ Unhandled error might expose API key
  return response.json();
}
```

### Dependency Security

**Regular audits**:

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Update all dependencies
npm update

# Check for outdated packages
npm outdated
```

**Lock dependencies**:
- Use `package-lock.json` to lock dependency versions
- Review dependency updates before applying
- Use tools like Dependabot or Renovate for automated updates

---

## Testing & Validation

### Unit Tests

**Install testing framework**:

```bash
npm install --save-dev jest
```

**Create `test/weather-server.test.js`**:

```javascript
import { WeatherServer } from '../index.js';

describe('WeatherServer', () => {
  let server;

  beforeEach(() => {
    server = new WeatherServer();
  });

  describe('getCurrentWeather', () => {
    test('should return weather data for valid city', async () => {
      const result = await server.getCurrentWeather('Taipei', 'metric');

      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Taipei');
      expect(result.content[0].text).toContain('°C');
    });

    test('should throw error for invalid city', async () => {
      await expect(
        server.getCurrentWeather('InvalidCityName12345')
      ).rejects.toThrow('City "InvalidCityName12345" not found');
    });

    test('should support imperial units', async () => {
      const result = await server.getCurrentWeather('New York', 'imperial');

      expect(result.content[0].text).toContain('°F');
      expect(result.content[0].text).toContain('mph');
    });
  });

  describe('getWeatherForecast', () => {
    test('should return 5-day forecast', async () => {
      const result = await server.getWeatherForecast('Tokyo', 'metric');

      expect(result.content[0].text).toContain('5-Day Weather Forecast');
      expect(result.content[0].text).toContain('Tokyo');
    });
  });
});
```

**Run tests**:

```bash
npm test
```

### Integration Tests

**Create `test/integration.test.js`**:

```javascript
import { spawn } from 'child_process';

describe('MCP Integration', () => {
  test('server should start and respond to requests', (done) => {
    const serverProcess = spawn('node', ['index.js']);

    let output = '';

    serverProcess.stderr.on('data', (data) => {
      output += data.toString();

      if (output.includes('Weather MCP server running')) {
        // Send MCP request
        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        };

        serverProcess.stdin.write(JSON.stringify(request) + '\n');
      }
    });

    serverProcess.stdout.on('data', (data) => {
      const response = JSON.parse(data.toString());

      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('tools');
      expect(response.result.tools).toHaveLength(2);

      serverProcess.kill();
      done();
    });

    setTimeout(() => {
      serverProcess.kill();
      done(new Error('Timeout'));
    }, 5000);
  });
});
```

### Performance Tests

**Create `test/performance.test.js`**:

```javascript
import { WeatherServer } from '../index.js';

describe('Performance', () => {
  let server;

  beforeEach(() => {
    server = new WeatherServer();
  });

  test('should handle 100 concurrent requests', async () => {
    const startTime = Date.now();

    const requests = Array(100).fill().map(() =>
      server.getCurrentWeather('Taipei', 'metric')
    );

    const results = await Promise.all(requests);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(results).toHaveLength(100);
    expect(duration).toBeLessThan(10000);  // Should complete in < 10 seconds

    console.log(`100 concurrent requests completed in ${duration}ms`);
  });

  test('response time should be under 2 seconds', async () => {
    const startTime = Date.now();

    await server.getCurrentWeather('Taipei', 'metric');

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000);
    console.log(`Response time: ${duration}ms`);
  });
});
```

### Load Testing

**Using Apache Bench (ab)**:

```bash
# Install Apache Bench
# macOS: brew install httpd
# Ubuntu: sudo apt-get install apache2-utils

# Create test script
cat > test-request.json << 'EOF'
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_current_weather",
    "arguments": {
      "city": "Taipei",
      "units": "metric"
    }
  }
}
EOF

# If you've wrapped the MCP server in HTTP endpoint:
ab -n 1000 -c 10 -p test-request.json -T application/json http://localhost:3000/mcp
```

---

## Monitoring & Maintenance

### Health Checks

**Add health check endpoint** (if using HTTP wrapper):

```javascript
import express from 'express';

const app = express();

app.get('/health', async (req, res) => {
  try {
    // Check if API key is configured
    if (!API_KEY || API_KEY === 'demo') {
      return res.status(500).json({
        status: 'unhealthy',
        reason: 'API key not configured'
      });
    }

    // Check if external API is reachable
    const response = await fetch(`${API_BASE_URL}/weather?q=Taipei&appid=${API_KEY}`);

    if (!response.ok) {
      return res.status(500).json({
        status: 'unhealthy',
        reason: 'External API unreachable'
      });
    }

    res.json({
      status: 'healthy',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      reason: error.message
    });
  }
});

app.listen(3001, () => {
  console.log('Health check endpoint running on http://localhost:3001/health');
});
```

### Metrics Collection

**Add metrics tracking**:

```bash
npm install prom-client
```

```javascript
import promClient from 'prom-client';

// Create metrics registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const weatherRequestCounter = new promClient.Counter({
  name: 'weather_requests_total',
  help: 'Total number of weather requests',
  labelNames: ['city', 'units', 'status'],
  registers: [register]
});

const weatherRequestDuration = new promClient.Histogram({
  name: 'weather_request_duration_seconds',
  help: 'Duration of weather requests in seconds',
  labelNames: ['city'],
  registers: [register]
});

class WeatherServer {
  async getCurrentWeather(city, units = 'metric') {
    const end = weatherRequestDuration.startTimer({ city });

    try {
      const result = await this._fetchWeather(city, units);

      weatherRequestCounter.inc({ city, units, status: 'success' });
      end();

      return result;
    } catch (error) {
      weatherRequestCounter.inc({ city, units, status: 'error' });
      end();

      throw error;
    }
  }
}

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Log Management

**Log rotation configuration**:

```javascript
import winston from 'winston';
import 'winston-daily-rotate-file';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/weather-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',  // Keep logs for 14 days
      zippedArchive: true
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',  // Keep error logs for 30 days
      zippedArchive: true
    })
  ]
});
```

### Update Strategy

**Versioning**:
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Document breaking changes
- Maintain backward compatibility when possible

**Update process**:

```bash
# 1. Test new version in staging
cd /opt/asus-mcp/weather-staging
git pull
npm install
npm test

# 2. Backup current production version
cp -r /opt/asus-mcp/weather /opt/asus-mcp/weather-backup-$(date +%Y%m%d)

# 3. Deploy new version
cd /opt/asus-mcp/weather
git pull
npm install --production

# 4. Restart service
systemctl restart weather-mcp

# 5. Verify deployment
systemctl status weather-mcp
curl http://localhost:3001/health

# 6. Monitor logs for errors
journalctl -u weather-mcp -f
```

**Rollback plan**:

```bash
# If issues detected, rollback immediately
systemctl stop weather-mcp
rm -rf /opt/asus-mcp/weather
mv /opt/asus-mcp/weather-backup-YYYYMMDD /opt/asus-mcp/weather
systemctl start weather-mcp
```

---

## Support & Resources

### Documentation

- **MCP Specification**: https://spec.modelcontextprotocol.io/
- **MCP SDK**: https://github.com/modelcontextprotocol/sdk
- **OpenWeather API**: https://openweathermap.org/api
- **Node.js Docs**: https://nodejs.org/docs/

### IrisGo.AI Support

**For ASUS and OEM Partners**:

- **Email**: partners@irisgo.ai
- **Technical Support**: support@irisgo.ai
- **Documentation**: https://docs.irisgo.ai
- **GitHub Issues**: https://github.com/irisgo-ai/weather-mcp-server/issues

**Support Levels**:

1. **Community Support** (Free)
   - GitHub issues
   - Documentation
   - Example code

2. **Partner Support** (For ASUS and OEMs)
   - Email support (24-hour response)
   - Technical consultation
   - Custom integration assistance
   - Priority bug fixes

3. **Enterprise Support** (Custom contract)
   - Dedicated support engineer
   - Custom feature development
   - On-site training
   - SLA guarantees

### Common Issues & Solutions

**Issue 1: "Module not found"**

```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue 2: "Unauthorized" error from Weather API**

```bash
# Solution: Verify API key
echo $OPENWEATHER_API_KEY  # Should not be empty
# Test API key directly
curl "https://api.openweathermap.org/data/2.5/weather?q=Taipei&appid=$OPENWEATHER_API_KEY"
```

**Issue 3: Server not responding**

```bash
# Check if server is running
ps aux | grep "node.*index.js"

# Check logs for errors
tail -f logs/error.log

# Restart service
systemctl restart weather-mcp
```

**Issue 4: High response times**

```bash
# Enable caching (see Customization Examples)
# Monitor API response times
# Consider using geographically closer API endpoints
```

### Getting Help

**Before contacting support**:

1. Check the troubleshooting section in README.md
2. Review server logs for errors
3. Verify API key is configured correctly
4. Test with a simple curl command
5. Check network connectivity

**When reporting issues, include**:

- Server version
- Node.js version (`node --version`)
- Operating system
- Error messages (from logs)
- Steps to reproduce
- Expected vs actual behavior

### Contributing

We welcome contributions! If you've built improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## Appendix

### A. API Cost Estimation

**OpenWeather Free Tier**:
- 1,000 API calls per day
- 60 calls per minute

**Cost scenarios**:

```
Scenario 1: Light usage (10 users, 10 queries/day each)
- Total: 100 queries/day
- Cost: Free (well within limits)

Scenario 2: Medium usage (100 users, 10 queries/day each)
- Total: 1,000 queries/day
- Cost: Free (at limit)

Scenario 3: Heavy usage (1,000 users, 10 queries/day each)
- Total: 10,000 queries/day
- Cost: ~$40/month (paid plan needed)
```

**Recommendations**:
- Implement caching to reduce API calls
- Use rate limiting per user
- Monitor usage and upgrade plan as needed

### B. Alternative Weather APIs

If OpenWeather doesn't meet your needs:

1. **WeatherAPI.com**
   - Free tier: 1 million calls/month
   - Good for high-volume deployments

2. **Visual Crossing**
   - Free tier: 1,000 calls/day
   - Includes historical data

3. **Tomorrow.io**
   - Free tier: 500 calls/day
   - Advanced weather features

4. **AccuWeather**
   - Limited free tier
   - Very accurate forecasts

**Migration guide**: Simply change the API endpoint and response parsing logic in index.js

### C. Building Custom MCP Servers

**Use this weather server as a template for**:

- Stock market data
- News aggregation
- Translation services
- Calendar integration
- Email integration
- Task management
- File operations
- Database queries

**Template structure**:

```javascript
class CustomMCPServer {
  constructor() {
    this.server = new Server(
      { name: 'custom-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // 1. Register tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        { name: 'tool_name', description: '...', inputSchema: {...} }
      ]
    }));

    // 2. Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'tool_name':
          return await this.toolHandler(request.params.arguments);
      }
    });
  }

  async toolHandler(args) {
    // Your logic here
    return { content: [{ type: 'text', text: 'Result' }] };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-14
**Maintained by**: IrisGo.AI Team
**Contact**: partners@irisgo.ai

---

© 2025 IrisGo.AI. Licensed under MIT License.
