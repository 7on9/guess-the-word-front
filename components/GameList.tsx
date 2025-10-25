"use client";

import { useState } from "react";
import { useCreateGame, type Game } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Gamepad2, Clock, Trophy, Play } from "lucide-react";
import Link from "next/link";

interface GameListProps {
  roomId: string;
  games?: Array<Game>;
  isLoading: boolean;
}

export function GameList({ roomId, games, isLoading }: GameListProps) {
  const createGameMutation = useCreateGame();

  const handleCreateGame = async () => {
    try {
      const newGame = await createGameMutation.mutateAsync({ roomId });
      // Navigate to the new game page
      window.location.href = `/room/${roomId}/game/${newGame.id}`;
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

  const getStatusBadge = (status: Game['status']) => {
    const statusConfig = {
      waiting: { label: "Waiting", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      active: { label: "Active", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      finished: { label: "Finished", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          Games ({games?.length || 0})
        </CardTitle>
        
        <Button 
          size="sm" 
          onClick={handleCreateGame}
          disabled={createGameMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          {createGameMutation.isPending ? "Creating..." : "New Game"}
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">Loading games...</p>
          </div>
        )}

        <div className="space-y-3">
          {games?.map((game) => (
            <GameItem key={game.id} game={game} roomId={roomId} />
          ))}
          
          {games && games.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No games created yet. Start your first game!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GameItem({ game, roomId }: { game: Game; roomId: string }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: Game['status']) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'finished':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Gamepad2 className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Game['status']) => {
    const statusConfig = {
      waiting: { label: "Waiting", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      active: { label: "Active", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      finished: { label: "Finished", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <Link href={`/room/${roomId}/game/${game.id}`}>
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          {getStatusIcon(game.status)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium">Game #{game.id.slice(-6)}</p>
            {getStatusBadge(game.status)}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Created {formatDate(game.createdAt)}</span>
            {game.startedAt && (
              <span>Started {formatDate(game.startedAt)}</span>
            )}
            {game.endedAt && (
              <span>Ended {formatDate(game.endedAt)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
