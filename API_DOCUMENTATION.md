# 🚀 Super Predictor API Documentation

## 📋 Overview

The Super Predictor API provides comprehensive lottery prediction and analytics capabilities with secure authentication, rate limiting, and comprehensive error handling.

**Base URL:** `http://localhost:3001/api/v1`  
**Authentication:** JWT Bearer Token  
**Rate Limiting:** Varies by endpoint (see individual endpoints)  
**Response Format:** JSON

---

## 🔐 Authentication

### Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-001",
      "email": "user@example.com",
      "role": "user",
      "name": "Demo User"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

### Register
**POST** `/auth/register`

Create new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Rate Limit:** 5 requests per 15 minutes

### Refresh Token
**POST** `/auth/refresh`

Refresh JWT token.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Rate Limit:** 10 requests per minute

---

## 🎯 Prediction Endpoints

### Generate Prediction
**POST** `/predictions/generate`

Generate a new lottery prediction.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "numbers": [1, 2, 3],
  "gameType": "pick3",
  "strategy": "hot-numbers"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pred-001",
    "numbers": [1, 2, 3],
    "gameType": "pick3",
    "strategy": "hot-numbers",
    "confidence": 0.85,
    "result": "pending",
    "createdAt": "2025-09-13T10:00:00.000Z"
  }
}
```

**Rate Limit:** 10 requests per minute

### Batch Generate Predictions
**POST** `/predictions/batch`

Generate multiple predictions at once.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "predictions": [
    {
      "numbers": [1, 2, 3],
      "gameType": "pick3",
      "strategy": "hot-numbers"
    },
    {
      "numbers": [4, 5, 6],
      "gameType": "pick4",
      "strategy": "frequency"
    }
  ]
}
```

**Rate Limit:** 5 requests per minute

### Get Prediction by ID
**GET** `/predictions/:id`

Retrieve a specific prediction.

**Headers:**
```
Authorization: Bearer <jwt_token> (optional for public predictions)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pred-001",
    "numbers": [1, 2, 3],
    "gameType": "pick3",
    "strategy": "hot-numbers",
    "confidence": 0.85,
    "result": "win",
    "createdAt": "2025-09-13T10:00:00.000Z"
  }
}
```

### Get Prediction History
**GET** `/predictions`

Retrieve paginated prediction history.

**Headers:**
```
Authorization: Bearer <jwt_token> (optional)
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `gameType` (string): Filter by game type
- `status` (string): Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pred-001",
      "numbers": [1, 2, 3],
      "gameType": "pick3",
      "result": "win",
      "createdAt": "2025-09-13T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get Prediction Statistics
**GET** `/predictions/stats/overview`

Get prediction performance statistics.

**Headers:**
```
Authorization: Bearer <jwt_token> (optional)
```

**Query Parameters:**
- `period` (string): Time period (default: "30d")

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPredictions": 150,
    "successfulPredictions": 45,
    "accuracy": 30.0,
    "averageConfidence": 0.75,
    "bestGameType": "pick3",
    "bestStrategy": "hot-numbers",
    "period": "30d"
  }
}
```

---

## 📊 Analytics Endpoints

### Performance Analytics
**GET** `/analytics/performance`

Get detailed performance analytics.

**Headers:**
```
Authorization: Bearer <jwt_token> (optional)
```

**Query Parameters:**
- `period` (string): Time period (default: "30d")
- `gameType` (string): Filter by game type
- `strategy` (string): Filter by strategy

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPredictions": 150,
    "successfulPredictions": 45,
    "accuracy": 30.0,
    "averageConfidence": 0.75,
    "bestGameType": "pick3",
    "bestStrategy": "hot-numbers",
    "period": "30d"
  }
}
```

**Rate Limit:** 20 requests per minute

### Trend Analysis
**GET** `/analytics/trends`

Analyze prediction trends over time.

**Query Parameters:**
- `period` (string): Time period (default: "90d")
- `metric` (string): Metric to analyze (default: "accuracy")
- `gameType` (string): Filter by game type

**Response:**
```json
{
  "success": true,
  "data": {
    "metric": "accuracy",
    "data": [
      {
        "date": "2025-09-13",
        "value": 30.0,
        "count": 15
      }
    ],
    "trend": "increasing",
    "changePercent": 15.5
  }
}
```

### Pattern Analysis
**GET** `/analytics/patterns`

Discover successful prediction patterns.

**Query Parameters:**
- `gameType` (string): Game type (required)
- `minOccurrences` (number): Minimum pattern occurrences (default: 3)
- `period` (string): Time period (default: "180d")

**Response:**
```json
{
  "success": true,
  "data": {
    "gameType": "pick3",
    "patterns": [
      {
        "pattern": "1-2-3",
        "occurrences": 5,
        "successRate": 80.0,
        "lastSeen": "2025-09-13T10:00:00.000Z",
        "confidence": 80.0
      }
    ],
    "totalPatterns": 12,
    "avgSuccessRate": 65.5
  }
}
```

### Accuracy Over Time
**GET** `/analytics/accuracy`

Track prediction accuracy over time.

**Query Parameters:**
- `period` (string): Time period (default: "30d")
- `granularity` (string): Time granularity (default: "daily")

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "granularity": "daily",
    "data": [
      {
        "timestamp": "2025-09-13",
        "accuracy": 30.0,
        "totalPredictions": 15,
        "successfulPredictions": 4
      }
    ]
  }
}
```

### Generate Analytics Report
**POST** `/analytics/reports`

Generate comprehensive analytics report.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "reportType": "performance",
  "period": "30d",
  "format": "json"
}
```

**Supported Report Types:**
- `performance` - Performance metrics
- `trends` - Trend analysis
- `patterns` - Pattern discovery
- `comprehensive` - All analytics combined

### Dashboard Summary
**GET** `/analytics/dashboard`

Get dashboard overview with key metrics.

**Headers:**
```
Authorization: Bearer <jwt_token> (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "todayStats": {
      "predictions": 5,
      "accuracy": 40.0,
      "bestGameType": "pick3"
    },
    "weekStats": {
      "predictions": 35,
      "accuracy": 35.0,
      "trend": "improving"
    },
    "monthStats": {
      "predictions": 150,
      "accuracy": 30.0,
      "improvement": 5.5
    },
    "recentActivity": [
      {
        "id": "pred-001",
        "gameType": "pick3",
        "numbers": [1, 2, 3],
        "success": true,
        "timestamp": "2025-09-13T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 💾 Data Management Endpoints

### Import Data
**POST** `/data/import`

Import prediction data from external sources.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "data": [
    {
      "numbers": [1, 2, 3],
      "gameType": "pick3",
      "result": "win"
    }
  ],
  "format": "json"
}
```

**Supported Formats:** `csv`, `json`, `xlsx`

**Rate Limit:** 5 requests per 5 minutes

### Export Data
**GET** `/data/export`

Export prediction data.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `format` (string): Export format (default: "json")
- `gameType` (string): Filter by game type
- `startDate` (string): Start date filter
- `endDate` (string): End date filter

**Rate Limit:** 3 requests per 5 minutes

### Validate Data
**POST** `/data/validate`

Validate data format before import.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "data": [
    {
      "numbers": [1, 2, 3],
      "gameType": "pick3"
    }
  ],
  "format": "json"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "validation": {
      "total": 1,
      "valid": 1,
      "invalid": 0,
      "errors": []
    }
  }
}
```

### Data Statistics
**GET** `/data/stats`

Get data management statistics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPredictions": 150,
    "totalImported": 45,
    "totalExported": 23,
    "lastImport": "2025-09-13T10:00:00.000Z",
    "lastExport": "2025-09-13T11:00:00.000Z",
    "storageUsed": "2.3 MB"
  }
}
```

---

## ⚠️ Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "timestamp": "2025-09-13T10:00:00.000Z"
}
```

### Common Error Codes:
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Rate Limiting Headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1631542800
Retry-After: 60
```

---

## 🔧 Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- TypeScript

### Installation
```bash
cd backend
npm install
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run serve
```

### Environment Variables
```env
PORT=3001
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📈 API Performance

- **Response Time:** < 200ms average
- **Uptime:** 99.9% target
- **Concurrent Users:** 1000+ supported
- **Rate Limits:** Configurable per endpoint
- **Caching:** Built-in response caching

---

## 🔒 Security Features

- JWT authentication with expiration
- Password hashing and validation
- Rate limiting and abuse prevention
- CORS configuration
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention

---

*Last Updated: September 13, 2025*  
*API Version: 1.0.0*