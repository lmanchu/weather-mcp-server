#!/usr/bin/env node

/**
 * Weather MCP Server - Sample Implementation
 *
 * This is a reference implementation for ASUS and OEM partners
 * demonstrating how to create an MCP Server for AI PC integration.
 *
 * Features:
 * - Get current weather for any city
 * - Get weather forecast (5 days)
 * - Simple, easy to understand code
 * - Production-ready error handling
 *
 * @author IrisGo.AI
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const API_KEY = process.env.OPENWEATHER_API_KEY || 'demo';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Weather MCP Server Class
 *
 * This server provides weather information through the MCP protocol.
 * It exposes two tools: get_current_weather and get_weather_forecast.
 */
class WeatherServer {
  constructor() {
    this.server = new Server(
      {
        name: 'weather-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Setup tool handlers
   *
   * This method registers all available tools and their handlers.
   */
  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_current_weather',
          description: 'Get current weather information for a specific city',
          inputSchema: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                description: 'City name (e.g., "Taipei", "Tokyo", "New York")',
              },
              units: {
                type: 'string',
                description: 'Temperature units: "metric" (Celsius) or "imperial" (Fahrenheit)',
                enum: ['metric', 'imperial'],
                default: 'metric',
              },
            },
            required: ['city'],
          },
        },
        {
          name: 'get_weather_forecast',
          description: 'Get 5-day weather forecast for a specific city',
          inputSchema: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                description: 'City name (e.g., "Taipei", "Tokyo", "New York")',
              },
              units: {
                type: 'string',
                description: 'Temperature units: "metric" (Celsius) or "imperial" (Fahrenheit)',
                enum: ['metric', 'imperial'],
                default: 'metric',
              },
            },
            required: ['city'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_current_weather':
            return await this.getCurrentWeather(args.city, args.units || 'metric');

          case 'get_weather_forecast':
            return await this.getWeatherForecast(args.city, args.units || 'metric');

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Get current weather for a city
   *
   * @param {string} city - City name
   * @param {string} units - Temperature units (metric/imperial)
   * @returns {Object} MCP response with weather data
   */
  async getCurrentWeather(city, units = 'metric') {
    const url = `${API_BASE_URL}/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`City "${city}" not found`);
      }
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Format the response
    const tempUnit = units === 'metric' ? '°C' : '°F';
    const speedUnit = units === 'metric' ? 'm/s' : 'mph';

    const weatherText = `
🌤️ Current Weather in ${data.name}, ${data.sys.country}

Temperature: ${data.main.temp}${tempUnit} (feels like ${data.main.feels_like}${tempUnit})
Condition: ${data.weather[0].main} - ${data.weather[0].description}
Humidity: ${data.main.humidity}%
Wind Speed: ${data.wind.speed} ${speedUnit}
Pressure: ${data.main.pressure} hPa
Visibility: ${(data.visibility / 1000).toFixed(1)} km

Last updated: ${new Date(data.dt * 1000).toLocaleString()}
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: weatherText,
        },
      ],
    };
  }

  /**
   * Get weather forecast for a city
   *
   * @param {string} city - City name
   * @param {string} units - Temperature units (metric/imperial)
   * @returns {Object} MCP response with forecast data
   */
  async getWeatherForecast(city, units = 'metric') {
    const url = `${API_BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`City "${city}" not found`);
      }
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Format the response
    const tempUnit = units === 'metric' ? '°C' : '°F';

    // Group forecasts by day
    const dailyForecasts = {};

    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = [];
      }
      dailyForecasts[date].push(item);
    });

    // Build forecast text
    let forecastText = `📅 5-Day Weather Forecast for ${data.city.name}, ${data.city.country}\n\n`;

    Object.entries(dailyForecasts).slice(0, 5).forEach(([date, forecasts]) => {
      const temps = forecasts.map(f => f.main.temp);
      const maxTemp = Math.max(...temps);
      const minTemp = Math.min(...temps);
      const conditions = forecasts.map(f => f.weather[0].main);
      const mostCommon = conditions.sort((a,b) =>
        conditions.filter(v => v===a).length - conditions.filter(v => v===b).length
      ).pop();

      forecastText += `${date}:\n`;
      forecastText += `  High: ${maxTemp.toFixed(1)}${tempUnit} | Low: ${minTemp.toFixed(1)}${tempUnit}\n`;
      forecastText += `  Condition: ${mostCommon}\n\n`;
    });

    return {
      content: [
        {
          type: 'text',
          text: forecastText.trim(),
        },
      ],
    };
  }

  /**
   * Start the MCP server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Weather MCP server running on stdio');
    console.error('Ready to receive requests from AI clients');
  }
}

// Start the server
const server = new WeatherServer();
server.run().catch(console.error);
