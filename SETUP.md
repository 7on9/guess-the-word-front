# 🎭 Undercover Game Frontend Setup

This is the frontend application for the Undercover Game, built with Next.js 16, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### 1. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

**Note:** Replace `http://localhost:3001` with your backend API URL.

### 2. Install Dependencies

```bash
yarn install
```

### 3. Run Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
/app                          # Next.js App Router
├── /page.tsx                 # Dashboard (rooms list)
├── /room/[roomId]/page.tsx   # Room detail (players + games)
├── /room/[roomId]/game/
│   └── [gameId]/page.tsx     # Game management
├── /room/[roomId]/scoreboard/page.tsx  # Room scoreboard
└── /words/page.tsx           # Word management

/components                   # React components
├── RoomList.tsx             # Room list and creation
├── PlayerList.tsx           # Player management
├── GameList.tsx             # Game list and creation
├── /ui/                     # UI components (Button, Card, Input, etc.)
└── providers.tsx            # React Query provider

/lib                         # Utilities and configuration
├── api.ts                   # Axios instance
├── hooks.ts                 # React Query hooks
├── queryClient.ts           # React Query configuration
└── utils.ts                 # Utility functions
```

## 🎮 Features Implemented

### ✅ Core Pages
- **Dashboard** - List all rooms, create new rooms
- **Room Detail** - Manage players and games for a room
- **Game Detail** - Start and manage individual games
- **Words Management** - Add/remove word pairs for the game
- **Scoreboard** - View player statistics (mock data for now)

### ✅ Components
- **RoomList** - Room cards with stats, creation form
- **PlayerList** - Add/reorder players with drag-and-drop UI
- **GameList** - Create games, view game status
- **UI Components** - Button, Card, Input with proper styling

### ✅ API Integration
- **React Query** - Data fetching, caching, and mutations
- **Axios** - HTTP client with interceptors
- **TypeScript** - Full type safety for API responses

### ✅ Styling
- **Tailwind CSS v4** - Modern utility-first styling
- **Design System** - Consistent colors, spacing, and typography
- **Dark Mode** - Automatic dark/light mode support
- **Responsive** - Mobile-friendly layouts

## 🔌 Backend API Endpoints Used

The frontend communicates with these backend endpoints:

### Rooms
- `GET /rooms` - List all rooms
- `POST /rooms` - Create new room
- `GET /rooms/:id` - Get room details

### Players
- `GET /rooms/:roomId/players` - List room players
- `POST /rooms/:roomId/players` - Add player
- `PATCH /rooms/:roomId/players/order` - Reorder players

### Games
- `GET /rooms/:roomId/games` - List room games
- `POST /rooms/:roomId/games` - Create new game
- `GET /games/:gameId` - Get game details
- `POST /games/:gameId/start` - Start game

### Words
- `GET /words` - List word pairs
- `POST /words` - Create word pair
- `DELETE /words/:id` - Delete word pair

## 🚧 To Be Implemented

The following features are planned for future implementation:

### Game Flow
- Round management and voting system
- Real-time game state updates
- Player role assignment (Civilian, Undercover, Mr. White)
- Elimination and winner determination

### Enhanced UI
- Game result pages with detailed statistics
- Loading skeletons and better loading states
- Toast notifications for actions
- Modal dialogs for confirmations

### Additional Features
- Player reordering with drag-and-drop
- Game history and replay
- Export/import word lists
- Room settings and customization

## 🧪 Development Commands

```bash
# Development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Lint code
yarn lint
```

## 🔧 Configuration Notes

- **API URL**: Configure `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- **React Query**: Configured with 5-minute stale time and 10-minute cache time
- **Styling**: Uses CSS custom properties for theming
- **TypeScript**: Strict mode enabled with path aliases (@/...)

## 🚀 Deployment

1. Build the application:
```bash
yarn build
```

2. Set environment variables in your deployment platform:
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

3. Deploy the built application to your hosting provider (Vercel, Netlify, etc.)

---

This frontend is designed to work seamlessly with the Undercover Game NestJS backend. Make sure your backend is running and accessible at the configured API URL.
