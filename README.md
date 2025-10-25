# 🎭 Undercover Game Frontend

A modern web application for playing the Undercover word guessing game with friends. Built with Next.js 16, TypeScript, React Query, and Tailwind CSS.

![Undercover Game](https://img.shields.io/badge/Game-Undercover-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4)

## 🎮 About the Game

Undercover is a social deduction game where players receive either a "civilian" word or an "undercover" word. Through discussion and voting, players must identify and eliminate the undercover agents while the undercover players try to blend in and survive.

## 🚀 Quick Start

1. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your backend API URL
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Start development server:**
   ```bash
   yarn dev
   ```

4. **Open in browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## 📋 Full Setup Instructions

For detailed setup instructions, project structure, and API documentation, see **[SETUP.md](./SETUP.md)**.

## ✨ Features

- 🏠 **Room Management** - Create and manage game rooms
- 👥 **Player Management** - Add players and organize seating order
- 🎯 **Game Flow** - Start games and manage game states
- 📝 **Word Management** - Add and manage word pairs for the game
- 📊 **Scoreboard** - Track player statistics and performance
- 🎨 **Modern UI** - Responsive design with dark/light mode
- ⚡ **Real-time Updates** - Powered by React Query for fast data sync

## 🛠 Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript with strict mode
- **Styling:** Tailwind CSS v4 with CSS custom properties
- **State Management:** React Query (TanStack Query) for server state
- **HTTP Client:** Axios with interceptors
- **UI Components:** Custom components with shadcn/ui design patterns
- **Icons:** Lucide React

## 🎯 Project Status

This is the initial implementation of the Undercover Game frontend. Core room and game management features are implemented and ready for use with the backend API.

### ✅ Implemented
- Room creation and management
- Player management (add, list, reorder)
- Game creation and basic controls
- Word pair management
- Responsive UI with modern design
- Full TypeScript coverage

### 🚧 Coming Soon
- Real-time game rounds and voting
- Player role assignment and reveals
- Game results and winner determination
- Advanced statistics and analytics
- Real-time multiplayer features

## 🔗 Related Projects

- **Backend API:** [Undercover Game Backend](../guess-the-word-back/) (NestJS + TypeORM + PostgreSQL)

## 📄 License

This project is part of the Undercover Game suite. See the main project for licensing information.
