<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# 🔮 Delphi Prediction Engine

Delphi is a headless, autonomous prediction market engine built with **NestJS** and **TypeScript**. It features a hybrid Order Book / AMM matching engine, autonomous AI agents for market discovery and resolution, and a dedicated admin dashboard for management.

## 🚀 Features

-   **Hybrid Matching Engine**: Supports both CLOB (Central Limit Order Book) and CPMM (Constant Product Market Maker) liquidity.
-   **Autonomous Agents**:
    -   **Discovery Agent**: Scans news, crypto, and sports to automatically generate relevant prediction markets.
    -   **Liquidity Agent**: Automatically provisions liquidity to thin markets to ensure tradeability.
    -   **Resolution Agent**: Verifies outcomes via real-world APIs (CoinGecko) or simulated oracles.
-   **Event Sourcing**: Complete audit trail of all market states and trades.
-   **Admin Dashboard**: Dedicated interface for manual market creation, resolution, and system monitoring.
-   **Real-time Updates**: WebSocket gateway for live market data.

## 🛠️ Tech Stack

-   **Backend**: NestJS (Node.js)
-   **Database**: PostgreSQL (Production) / SQLite (Dev), Redis (Queues)
-   **ORM**: TypeORM
-   **Frontend**: Vanilla HTML/JS (Demo Dashboard)

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/delphi-engine.git
    cd delphi-engine
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    The app comes with sensible defaults for development (`sqlite` in-memory or file).
    For production, set `DATABASE_URL` (Postgres).

## ▶️ Running the App

```bash
# Development (Watch Mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`.

## 🖥️ Dashboards

### 📈 User Demo
Access the public trading interface at:
**`http://localhost:3000/`**
- View active markets (Crypto, Sports, News)
- Buy YES/NO shares
- View portfolio and potential payouts

### 🛡️ Admin Console
Access the admin management panel at:
**`http://localhost:3000/admin.html`**
- **Login**: `admin123@gmail.com` / `admin123`
- Create new markets manually
- Force resolve markets
- Pause/Resume trading system-wide

## 📚 API Documentation

Swagger API documentation is automatically generated and available at:
**`http://localhost:3000/api`**

##  deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for a guide on deploying to Railway.

## 📄 License

[MIT licensed](LICENSE).
