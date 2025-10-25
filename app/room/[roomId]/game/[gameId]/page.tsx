"use client";

import { useParams } from "next/navigation";
import { useGame, useStartGame, useReorderGamePlayers } from "@/lib/hooks";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Clock, Trophy, Users, Move, GripVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function GameDetailPage() {
  return (
    <AuthGuard>
      <GameDetailContent />
    </AuthGuard>
  );
}

function GameDetailContent() {
  const params = useParams();
  const roomId = params.roomId as string;
  const gameId = params.gameId as string;

  // Reorder state
  const [reorderMode, setReorderMode] = useState(false);
  const [localPlayerOrder, setLocalPlayerOrder] = useState<Array<{id: string, name: string, avatar?: string, role?: 'civilian' | 'undercover' | 'mr_white', isEliminated: boolean, orderIndex: number}>>([]);

  const { data: game, isLoading, error } = useGame(gameId);
  const startGameMutation = useStartGame();
  const reorderPlayersMutation = useReorderGamePlayers();

  const handleStartGame = async () => {
    if (!confirm("Are you sure you want to start this game?")) return;

    try {
      await startGameMutation.mutateAsync(gameId);
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  const initializeReorderMode = () => {
    if (game?.players) {
      // Sort by orderIndex
      const sortedPlayers = [...game.players].sort((a, b) => {
        return a.orderIndex - b.orderIndex;
      });
      setLocalPlayerOrder(sortedPlayers);
      setReorderMode(true);
    }
  };

  const handleReorderPlayers = async () => {
    if (!localPlayerOrder.length) return;

    try {
      const playerOrder = localPlayerOrder.map(player => player.id);
      await reorderPlayersMutation.mutateAsync({
        gameId: gameId,
        playerOrder: playerOrder,
      });
      setReorderMode(false);
    } catch (error) {
      console.error("Failed to reorder players:", error);
    }
  };

  const movePlayer = (fromIndex: number, toIndex: number) => {
    const newOrder = [...localPlayerOrder];
    const [movedPlayer] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedPlayer);
    setLocalPlayerOrder(newOrder);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <p className="text-destructive mb-4">Game not found or failed to load.</p>
            <Link href={`/room/${roomId}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Room
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <p className="text-muted-foreground">Loading game...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      waiting: { 
        label: "Waiting to Start", 
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        icon: <Clock className="h-4 w-4" />
      },
      not_started: { 
        label: "Not Started", 
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        icon: <Clock className="h-4 w-4" />
      },
      active: { 
        label: "Game Active", 
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: <Play className="h-4 w-4" />
      },
      in_progress: { 
        label: "In Progress", 
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: <Play className="h-4 w-4" />
      },
      finished: { 
        label: "Game Finished", 
        className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        icon: <Trophy className="h-4 w-4" />
      },
      completed: { 
        label: "Completed", 
        className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        icon: <Trophy className="h-4 w-4" />
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      icon: <Clock className="h-4 w-4" />
    };
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full font-medium ${config.className}`}>
        {config.icon}
        {config.label}
      </div>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not yet";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/room/${roomId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Room
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Game #{gameId.slice(-6)}</h1>
              <p className="text-muted-foreground">
                Manage this Undercover game instance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {getStatusBadge(game?.status || 'waiting')}
          </div>
        </div>

        {/* Game Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Game Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="font-medium capitalize">{game?.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="font-medium">{formatDate(game?.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Started At</label>
                <p className="font-medium">{formatDate(game?.startedAt)}</p>
              </div>
            </div>
            
            {game?.endedAt && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ended At</label>
                <p className="font-medium">{formatDate(game?.endedAt)}</p>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Game Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Game Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(game?.status === 'waiting' || game?.status === 'not_started') && (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  The game is ready to start. Make sure all players are ready before starting.
                </p>
                <Button 
                  onClick={handleStartGame}
                  disabled={startGameMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {startGameMutation.isPending ? "Starting..." : "Start Game"}
                </Button>
              </div>
            )}

            {(game?.status === 'active' || game?.status === 'in_progress') && (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  The game is currently active. Players can participate in rounds.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline">
                    Start New Round
                  </Button>
                  <Button variant="outline">
                    View Current Round
                  </Button>
                  <Button variant="destructive">
                    End Game
                  </Button>
                </div>
              </div>
            )}

            {(game?.status === 'finished' || game?.status === 'completed') && (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  This game has ended. Check the results or start a new game.
                </p>
                <div className="flex gap-2">
                  <Link href={`/room/${roomId}/game/${gameId}/result`}>
                    <Button variant="outline">
                      <Trophy className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                  </Link>
                  <Link href={`/room/${roomId}`}>
                    <Button>
                      Create New Game
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Players Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Game Players ({game?.players?.length || 0})
              </CardTitle>
              
              {(game?.status === 'waiting' || game?.status === 'not_started') && !reorderMode && game?.players && game.players.length > 1 && (
                <Button 
                  onClick={initializeReorderMode}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Move className="h-4 w-4" />
                  Reorder Players
                </Button>
              )}
              
              {reorderMode && (
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleReorderPlayers}
                    size="sm"
                    disabled={reorderPlayersMutation.isPending}
                  >
                    {reorderPlayersMutation.isPending ? "Saving..." : "Save Order"}
                  </Button>
                  <Button 
                    onClick={() => {
                      setReorderMode(false);
                      setLocalPlayerOrder([]);
                    }}
                    variant="outline" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {game?.players && game.players.length > 0 ? (
              <div className="space-y-3">
                {(game.status === 'waiting' || game.status === 'not_started') && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Before starting:</strong> You can reorder players to set the turn order for the game. 
                      The first player will start the first round.
                    </p>
                  </div>
                )}
                
                {(reorderMode ? localPlayerOrder : game.players)
                  .sort((a, b) => {
                    return a.orderIndex - b.orderIndex;
                  })
                  .map((player, index) => (
                  <div 
                    key={player.id} 
                    className={`flex items-center gap-3 p-4 border rounded-lg ${
                      reorderMode ? 'bg-muted/20 border-dashed' : ''
                    }`}
                  >
                    {reorderMode && (
                      <>
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={index === 0}
                            onClick={() => movePlayer(index, index - 1)}
                            className="h-6 w-6 p-0"
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={index === localPlayerOrder.length - 1}
                            onClick={() => movePlayer(index, index + 1)}
                            className="h-6 w-6 p-0"
                          >
                            ↓
                          </Button>
                        </div>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </>
                    )}
                    
                    {player.avatar ? (
                      <img 
                        src={player.avatar} 
                        alt={player.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="font-semibold">{player.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Turn Order: #{player.orderIndex || index + 1}</span>
                        {player.role && <span>Role: {player.role}</span>}
                        {player.isEliminated && <span className="text-red-500">Eliminated</span>}
                      </div>
                    </div>
                    
                    {reorderMode && (
                      <div className="text-sm text-muted-foreground font-mono">
                        #{index + 1}
                      </div>
                    )}
                    
                    {index === 0 && (game?.status === 'waiting' || game?.status === 'not_started') && (
                      <div className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-medium">
                        First Player
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No players in this game yet. Players are added when the game is created from a group.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
