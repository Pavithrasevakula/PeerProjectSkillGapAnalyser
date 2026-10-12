# TeamSync - Intelligent Team Formation System

> Smart team building with AI-powered matching algorithms for collaborative projects

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-007FFF?style=flat&logo=mui&logoColor=white)](https://mui.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [Database Operations](#database-operations)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**TeamSync** is an intelligent team formation system that uses sophisticated algorithms to match team members based on complementary skills, role requirements, and availability. The platform ensures optimal team composition for collaborative projects through data-driven decision making.

### Problem Statement

Traditional team formation methods face several challenges:
- Time-consuming manual processes
- Random assignment or friendship-based grouping
- Resulting skill gaps and unbalanced teams
- Suboptimal project outcomes

### Solution

An AI-powered platform that provides:
- **Skill Complementarity Matching** - Focuses on complementary rather than similar skills
- **Quantitative Compatibility Scores** - Data-driven matching with 85%+ accuracy
- **Real-time Updates** - Live team recommendations and status updates
- **Skill Gap Visualization** - Interactive radar charts for team analysis
- **Automated Recommendations** - Efficient algorithmic candidate ranking

---

## Features

### Core Features

**Authentication & User Management**
- Firebase Authentication with email/password
- Comprehensive user profiles with skills, roles, and availability
- Five-level skill proficiency system (1-5)

**Intelligent Matching Algorithm**
- 55% weight on Marginal Skill Gain (complementarity)
- 20% weight on Role Compatibility
- 15% weight on Availability Overlap
- 10% weight on Experience Diversity

**Team Balance Index (TBI)**
- 40% Skill Coverage
- 25% Role Diversity
- 15% Experience Mix (entropy)
- 20% Availability Fit

**Project Management**
- Create and browse projects across multiple domains
- Define skill and role requirements
- Specify team size and composition needs
- Set project deadlines and status

**Application System**
- Role-based application submission
- Real-time match score calculation
- Candidate impact preview functionality
- Application acceptance/rejection with explanations

**Data Visualization**
- Interactive skill radar charts using Chart.js
- Team compatibility index cards
- Match score breakdowns
- Comprehensive skill gap analysis

**Real-time Synchronization**
- Firestore triggers for instant updates
- Live team formation notifications
- Dynamic recommendation refresh
- WebSocket-based real-time communication

---

## Tech Stack

### Frontend
- **React 18** - UI framework with hooks
- **Vite** - Modern build tool and development server
- **Material-UI (MUI)** - Component library
- **React Router v6** - Client-side routing
- **Chart.js** - Data visualization library
- **Firebase SDK** - Client-side Firebase integration

### Backend
- **Firebase Cloud Functions** - Serverless compute
- **Node.js + Express** - REST API framework
- **Firebase Admin SDK** - Server-side Firebase operations

### Database & Authentication
- **Firestore** - NoSQL document database
- **Firebase Authentication** - User management
- **Firestore Security Rules** - Row-level security

### Development & Testing
- **Jest** - Unit testing framework
- **Firebase Emulators** - Local development environment
- **Git** - Version control
- **ESLint** - Code linting

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React)                        │
│  • Authentication UI      • Project Management          │
│  • Profile Management     • Application System           │
│  • Skill Radar Charts     • Team Dashboard              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS / REST API
┌────────────────────▼────────────────────────────────────┐
│              CLOUD FUNCTIONS (Node.js)                   │
│  • Matching Engine        • Team Formation Logic        │
│  • Callable Functions     • HTTP Endpoints              │
│  • Firestore Triggers     • Recommendation Service      │
└────────────────────┬────────────────────────────────────┘
                     │ Admin SDK
┌────────────────────▼────────────────────────────────────┐
│              FIRESTORE DATABASE (NoSQL)                  │
│                                                          │
│  Collections:                Subcollections:            │
│  ├─ users                    └─ applications            │
│  ├─ projects                    (per project)           │
│  └─ teams                                               │
└──────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm or yarn package manager
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project (free tier supported)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pavithrasevakula/PeerProjectSkillGapAnalyser.git
   cd PeerProjectSkillGapAnalyser
   ```

2. **Install dependencies**
   ```bash
   cd functions && npm install
   cd ../frontend && npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password provider)
   - Create a Firestore Database in production mode
   - Download service account key

4. **Set up environment variables**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

5. **Deploy Firestore rules and indexes**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

6. **Deploy Cloud Functions**
   ```bash
   firebase deploy --only functions
   ```

7. **Run locally**
   ```bash
   # Terminal 1: Start development server
   cd frontend && npm run dev
   
   # Access at http://localhost:5173
   ```

8. **Seed demo data (optional)**
   ```bash
   cd functions
   GOOGLE_APPLICATION_CREDENTIALS=service-account-key.json npm run seed
   ```

For detailed setup instructions, refer to [SETUP.md](SETUP.md)

---

## Demo Accounts

All demo accounts use password: `Demo@123`

### Advanced Level Users
- **rahul.verma@teamsync.demo** - Computer Vision Expert
- **rohan.patel@teamsync.demo** - NLP Specialist
- **aditya.nair@teamsync.demo** - Blockchain Developer
- **arjun.reddy@teamsync.demo** - DevOps Engineer

### Intermediate Level Users
- **ananya.singh@teamsync.demo** - Full-Stack Developer
- **priya.sharma@teamsync.demo** - UI/UX Designer
- **vikram.kumar@teamsync.demo** - Backend Security Specialist
- **divya.iyer@teamsync.demo** - Computer Vision Researcher

### Beginner Level Users
- **sneha.gupta@teamsync.demo** - Mobile Developer
- **kavya.menon@teamsync.demo** - Backend Developer

For complete demo account details including skills and specializations, refer to [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md)

---

## Database Operations

The project includes 57 comprehensive NoSQL commands demonstrating:

- **DDL Operations** (7 commands) - Schema definition and structure
- **DML Operations** (6 commands) - Insert, Select, Update, Delete
- **Complex Queries** (20 commands) - Aggregations, filtering, sorting
- **Views & Triggers** (3 commands) - Firestore triggers and computed views
- **Indexing** (2 commands) - Query optimization
- **Transactions** (3 commands) - ACID compliance
- **Statistics** (3 commands) - Analytics and reporting
- **Web App CRUD** (8 commands) - Application-level operations

All commands are documented in [FINAL_DATABASE_COMMANDS.md](FINAL_DATABASE_COMMANDS.md)

Execute commands from the `functions` directory:
```bash
cd functions
# Copy and execute commands from FINAL_DATABASE_COMMANDS.md
```

---

## Project Structure

```
TeamSync/
│
├── frontend/                     # React application
│   ├── src/
│   │   ├── pages/               # Page components
│   │   ├── components/          # Reusable components
│   │   ├── firebase.js          # Firebase configuration
│   │   ├── api.js               # API client
│   │   └── App.jsx              # Root component
│   ├── .env.example             # Environment template
│   └── package.json
│
├── functions/                    # Cloud Functions
│   ├── src/
│   │   ├── matching/            # Matching algorithm
│   │   │   ├── engine.js        # Core matching logic
│   │   │   └── config.js        # Algorithm weights
│   │   ├── services/            # Business logic services
│   │   ├── triggers.js          # Firestore triggers
│   │   ├── callables.js         # Callable functions
│   │   └── api.js               # REST endpoints
│   ├── scripts/
│   │   ├── seed.js              # Demo data generator
│   │   └── evaluate.js          # Algorithm evaluation
│   ├── test/
│   │   └── engine.test.js       # Unit tests
│   └── package.json
│
├── firebase.json                 # Firebase configuration
├── firestore.rules               # Security rules
├── firestore.indexes.json        # Database indexes
├── README.md                     # Project documentation
├── SETUP.md                      # Detailed setup guide
├── DEMO_CREDENTIALS.md           # Demo account information
└── FINAL_DATABASE_COMMANDS.md    # Database operations reference
```

---

## Testing

### Run Unit Tests
```bash
cd functions
npm test
```

### Evaluate Matching Algorithm
```bash
cd functions
npm run evaluate
```

The evaluation compares three strategies:
- **Random Baseline** - Random team assignment
- **Keyword Matching** - Simple skill overlap
- **Complementarity Algorithm** - Production matching engine

Results are saved to `functions/scripts/evaluation_results.json`

---

## Key Metrics

- **500+ Demo Users** - Comprehensive test dataset
- **100+ Sample Projects** - Across multiple domains
- **85%+ Match Accuracy** - Algorithm performance benchmark
- **Sub-2-second Response** - Real-time recommendation generation
- **Scalable Architecture** - Supports growth to production scale

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/NewFeature`)
3. Commit your changes (`git commit -m 'Add NewFeature'`)
4. Push to the branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

**Project Repository:** [TeamSync on GitHub](https://github.com/Pavithrasevakula/PeerProjectSkillGapAnalyser)

---

## Acknowledgments

- Firebase for backend infrastructure
- Material-UI for component library
- Chart.js for data visualization
- The open-source community

---

## Related Documentation

- [Detailed Setup Guide](SETUP.md)
- [Database Commands Reference](FINAL_DATABASE_COMMANDS.md)
- [Demo Account Credentials](DEMO_CREDENTIALS.md)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)

---

Copyright (c) 2024 TeamSync Project
