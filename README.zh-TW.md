# Weather MCP Server - 天氣查詢範例實作

> **給 ASUS 和 OEM 合作夥伴的參考實作**
>
> 一個簡單、可立即使用的 MCP server，展示如何使用 Model Context Protocol 將外部服務整合到 AI PC。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-0.5.0-blue)](https://github.com/modelcontextprotocol)

---

## 🎯 目的

這個範例 MCP server 展示：

- ✅ 如何從零開始創建 MCP server
- ✅ 如何向 AI 客戶端暴露工具（函數）
- ✅ 如何整合外部 API（OpenWeather API）
- ✅ 生產級錯誤處理
- ✅ 乾淨、完整註釋的代碼

**適合**: OEM 合作夥伴開發 AI PC 功能、學習 MCP 的開發者、概念驗證專案

---

## 🌟 功能特色

### 可用工具

1. **`get_current_weather`** - 查詢任何城市的即時天氣
   - 溫度、天氣狀況、濕度、風速
   - 支援攝氏和華氏

2. **`get_weather_forecast`** - 查詢 5 天天氣預報
   - 每日最高/最低溫度
   - 每日天氣狀況

---

## 🚀 快速開始

### 前置需求

- Node.js >= 18.0.0
- OpenWeather API 金鑰（有免費方案）

### 安裝

```bash
# 下載或複製這個專案
cd weather-mcp-server

# 安裝相依套件
npm install

# 設定 API 金鑰
cp .env.example .env
# 編輯 .env 並加入你的 OpenWeather API 金鑰
```

### 取得 API 金鑰

1. 前往 [OpenWeather API](https://openweathermap.org/api)
2. 註冊免費帳號
3. 產生 API 金鑰
4. 將金鑰加入 `.env` 檔案

### 執行 Server

```bash
# 啟動 server
npm start

# 或在開發時使用自動重載
npm run dev
```

---

## 📖 使用範例

### 在 Claude Desktop 中配置

將以下內容加入你的 `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/絕對路徑/weather-mcp-server/index.js"],
      "env": {
        "OPENWEATHER_API_KEY": "你的_api_金鑰"
      }
    }
  }
}
```

### 與 AI 客戶端測試

配置完成後，你可以詢問 AI 助理：

```
"台北現在的天氣如何？"
"給我東京的 5 天天氣預報"
"紐約現在幾度？用華氏顯示"
```

AI 會自動呼叫適當的 MCP 工具！

---

## 🏗️ 架構

```
┌─────────────────┐
│   AI 客戶端      │ (Claude, ChatGPT 等)
│  (Claude Desktop)│
└────────┬────────┘
         │ MCP 協定 (stdio)
         ↓
┌─────────────────┐
│  Weather MCP    │ ← 這個 server
│     Server      │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│ OpenWeather API │
└─────────────────┘
```

### 關鍵組件

- **`index.js`** - 主要 server 實作
- **`@modelcontextprotocol/sdk`** - 官方 MCP SDK
- **`StdioServerTransport`** - 透過 stdin/stdout 通訊
- **`OpenWeather API`** - 外部天氣資料來源

---

## 📁 專案結構

```
weather-mcp-server/
├── package.json          # 相依套件和腳本
├── index.js              # 主要 MCP server 代碼
├── .env.example          # 環境變數範本
├── .env                  # 你的 API 金鑰（git 忽略）
├── README.md             # 英文版
├── README.zh-TW.md       # 這個檔案
├── PARTNER-GUIDE.md      # 給 OEM 合作夥伴的詳細指南
└── examples/
    └── client-example.js # 客戶端範例代碼
```

---

## 🛠️ 開發

### 代碼結構

Server 組織成清晰的區塊：

1. **設定** - API 金鑰、URL
2. **WeatherServer 類別** - 主要 server 邏輯
3. **工具註冊** - 定義可用工具
4. **工具處理器** - 實作工具功能
5. **錯誤處理** - 強健的錯誤管理

### 新增工具

```javascript
// 1. 在 setupToolHandlers() 中加入工具定義
{
  name: '你的新工具',
  description: '這個工具的功能',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: '參數說明' }
    },
    required: ['param1']
  }
}

// 2. 在 CallToolRequestSchema 中加入處理器
case '你的新工具':
  return await this.yourNewTool(args.param1);

// 3. 實作方法
async yourNewTool(param1) {
  // 你的邏輯
  return {
    content: [{
      type: 'text',
      text: '結果'
    }]
  };
}
```

---

## 🧪 測試

### 手動測試

```bash
# 直接測試 MCP server
npm test
```

### 整合測試

使用包含的 `examples/client-example.js` 以程式化方式測試工具呼叫。

---

## 📝 API 參考

### 工具: `get_current_weather`

**參數:**
- `city` (字串，必填) - 城市名稱（例：「Taipei」、「Tokyo」）
- `units` (字串，選填) - "metric"（預設）或 "imperial"

**回傳:**
```
🌤️ Taipei, TW 的目前天氣

溫度: 25.3°C (體感溫度 26.1°C)
狀況: Clear - clear sky
濕度: 65%
風速: 3.2 m/s
氣壓: 1013 hPa
能見度: 10.0 km

最後更新: 2025/11/14 上午10:30:00
```

### 工具: `get_weather_forecast`

**參數:**
- `city` (字串，必填) - 城市名稱
- `units` (字串，選填) - "metric"（預設）或 "imperial"

**回傳:**
```
📅 Taipei, TW 的 5 天天氣預報

2025/11/14:
  最高: 26.5°C | 最低: 22.1°C
  狀況: Clear

2025/11/15:
  最高: 27.2°C | 最低: 23.4°C
  狀況: Clouds

...
```

---

## 🔒 安全性最佳實踐

### 本範例已實作：

- ✅ API 金鑰儲存在環境變數（不在代碼中）
- ✅ 所有參數的輸入驗證
- ✅ 適當的錯誤處理（不洩漏敏感資料）
- ✅ 外部 API 呼叫使用 HTTPS
- ✅ 最小相依性（減少攻擊面）

### 正式部署建議：

- 🔐 使用機密管理系統（AWS Secrets Manager、Azure Key Vault）
- 🔐 實作速率限制
- 🔐 加入請求記錄/監控
- 🔐 如遠端部署，MCP 通訊使用 TLS

---

## 🌐 在地化

這個 server 透過 OpenWeather API 支援多種語言：

```javascript
// 在 API 呼叫中加入語言參數
const url = `${API_BASE_URL}/weather?q=${city}&units=${units}&lang=zh_tw&appid=${API_KEY}`;
```

支援語言：en, zh_tw, zh_cn, ja, ko，以及 [50+ 種語言](https://openweathermap.org/current#multi)

---

## 🐛 疑難排解

### 常見問題

**「City not found」**
- 檢查城市名稱拼字
- 嘗試包含國家代碼：「Taipei,TW」

**「Weather API error: Unauthorized」**
- 驗證 `.env` 中的 API 金鑰
- 在 openweathermap.org 確認 API 金鑰已啟用

**「Module not found」**
- 執行 `npm install`
- 檢查 Node.js 版本 >= 18.0.0

**Claude 中偵測不到 MCP server**
- 驗證 `claude_desktop_config.json` 路徑
- 重新啟動 Claude Desktop
- 檢查 server 記錄是否有錯誤

---

## 📚 了解更多

### MCP 資源

- [MCP 規格](https://spec.modelcontextprotocol.io/)
- [MCP SDK 文件](https://github.com/modelcontextprotocol/sdk)
- [Claude MCP 指南](https://docs.anthropic.com/claude/docs/mcp)

### 天氣 API

- [OpenWeather API 文件](https://openweathermap.org/api)
- [API 回應範例](https://openweathermap.org/current#current_JSON)

---

## 🤝 給 OEM 合作夥伴

**請參閱 `PARTNER-GUIDE.md` 了解**：
- 詳細整合指南
- 部署選項
- 客製化範例
- 正式環境檢查清單
- 支援資訊

**聯絡**: partners@irisgo.ai

---

## 📄 授權

MIT License - 請參閱 [LICENSE](LICENSE) 檔案

---

## 🙏 致謝

- **創建者**: IrisGo.AI 團隊
- **MCP 協定**: Anthropic
- **天氣資料**: OpenWeather
- **對象**: ASUS 和 AI PC OEM 合作夥伴

---

## 📮 支援

- **問題回報**: [GitHub Issues](https://github.com/irisgo-ai/weather-mcp-server/issues)
- **電子郵件**: support@irisgo.ai
- **文件**: [docs.irisgo.ai](https://docs.irisgo.ai)

---

**最後更新**: 2025-11-14
**版本**: 1.0.0
