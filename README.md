# Model Gateway

## Project Description
To accelerate the adoption and simplify the participation of Data Scientists (Workers) on the Allora Network. This project delivers a production-grade, API-first HTTP server that abstracts the complexities of blockchain interaction. It acts as a managed "Model-to-Chain" gateway, handling wallet management, automated fee payment, transaction signing, and performance monitoring, allowing data scientists to focus solely on their ML models.

## Getting Started

Follow the setup instructions to get a local copy up and running.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   Docker (for PostgreSQL and Redis)
*   All blockchain interactions are handled via API/RPC; the Allora CLI is no longer required for runtime.

### Installation

1.  Clone the repository:
    ```sh
    git clone <repository-url>
    cd model-gateway
    ```
2.  Install NPM packages:
    ```sh
    npm install
    ```
3.  Set up local environment variables:
    ```sh
    cp .env.example .env.local
    ```
    You will then need to populate `.env.local` with your local configuration for the database, Redis, etc.

### Running the Application (Development)

```sh
npm run start
```

### Building for Production

```sh
npm run build
```

### Running in Production

```sh
npm run serve
```