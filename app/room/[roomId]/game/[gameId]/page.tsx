"use client";

import { useParams } from "next/navigation";
import { useGame, useStartGame, useReorderGamePlayers, useConfigureGameRoles, useRevealPlayerRole } from "@/lib/hooks";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Play, Clock, Trophy, Users, Move, GripVertical, Shield, Eye, EyeOff, Settings, Shuffle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

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
  const [localPlayerOrder, setLocalPlayerOrder] = useState<Array<{id: string, gamePlayerId: string, name: string, avatar?: string, role?: 'civilian' | 'undercover' | 'mr_white', isEliminated: boolean, orderIndex: number}>>([]);
  
  // Role assignment and revelation state
  const [undercoverCount, setUndercoverCount] = useState(1);
  const [mrWhiteCount, setMrWhiteCount] = useState(0);
  const [currentRevealingPlayerIndex, setCurrentRevealingPlayerIndex] = useState(0);
  const [revealedRole, setRevealedRole] = useState<{ role: string; word: string | null } | null>(null);
  const [showingRole, setShowingRole] = useState(false);
  const [wordRevealed, setWordRevealed] = useState(false);

  const { data: game, isLoading, error } = useGame(gameId);
  const startGameMutation = useStartGame();
  const reorderPlayersMutation = useReorderGamePlayers();
  const configureRolesMutation = useConfigureGameRoles();
  const revealRoleMutation = useRevealPlayerRole();

  // Initialize role counts from game data when it loads
  useEffect(() => {
    if (game) {
      setUndercoverCount(game.undercoverCount);
      setMrWhiteCount(game.mrWhiteCount);
    }
  }, [game]);

  // Debug logging
  console.log("Game data loaded:", {
    gameId,
    game,
    gamePlayers: game?.gamePlayers,
    players: game?.players,
    playersCount: game?.players?.length || 0,
    undercoverCount: game?.undercoverCount,
    mrWhiteCount: game?.mrWhiteCount,
    isLoading,
    error
  });

  const handleConfigureAndStartGame = async () => {
    if (!confirm("Are you sure you want to configure roles and start the game? This cannot be undone!")) return;

    try {
      // First configure the roles
      await configureRolesMutation.mutateAsync({
        gameId: gameId,
        undercoverCount: undercoverCount,
        mrWhiteCount: mrWhiteCount
      });
      console.log("Roles configured successfully");

      // Then start the game (this will assign roles automatically)
      await startGameMutation.mutateAsync(gameId);
      console.log("Game started and roles assigned successfully");
    } catch (error) {
      console.error("Failed to configure roles and start game:", error);
    }
  };

  const handleRevealRole = async () => {
    if (!game?.players || currentRevealingPlayerIndex >= game.players.length) return;

    const player = game.players[currentRevealingPlayerIndex];
    
    try {
      const roleData = await revealRoleMutation.mutateAsync({
        gameId: gameId,
        playerId: player.id
      });
      
      setRevealedRole(roleData);
      setShowingRole(true);
    } catch (error) {
      console.error("Failed to reveal role:", error);
    }
  };

  const handleRoleRevealed = () => {
    setShowingRole(false);
    setRevealedRole(null);
    setWordRevealed(false);
    
    if (game?.players && currentRevealingPlayerIndex < game.players.length - 1) {
      setCurrentRevealingPlayerIndex(currentRevealingPlayerIndex + 1);
    }
  };

  const handleStartRound = async () => {
    if (!confirm("Are you sure you want to start Round 1? All players have seen their roles!")) return;

    try {
      // This could be an endpoint to start the actual round/gameplay
      console.log("Starting Round 1...");
      // For now, we'll use the existing start game endpoint
      // But the game should already be started at this point
    } catch (error) {
      console.error("Failed to start round:", error);
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
      const playerOrder = localPlayerOrder.map(player => player.gamePlayerId);
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
            {/* Phase 1: Configure Roles and Start Game */}
            {(game?.status === 'waiting' || game?.status === 'not_started') && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Phase 1: Configure Roles & Start Game</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Set the number of undercover players and Mr. White, then start the game. Roles will be assigned automatically.
                  </p>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium">Civilian Players</label>
                      <div className="text-lg font-semibold text-green-600">
                        {(game?.players?.length || 0) - undercoverCount - mrWhiteCount}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Undercover Players</label>
                      <Input
                        type="number"
                        min="1"
                        max={Math.floor((game?.players?.length || 3) / 2)}
                        value={undercoverCount}
                        onChange={(e) => setUndercoverCount(parseInt(e.target.value))}
                      />
                    </div>
                    {game?.gameMode === 'extended' && (
                      <div>
                        <label className="text-sm font-medium">Mr. White Players</label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          value={mrWhiteCount}
                          onChange={(e) => setMrWhiteCount(parseInt(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleConfigureAndStartGame}
                  disabled={configureRolesMutation.isPending || startGameMutation.isPending || !game?.players || game.players.length < 3}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {(configureRolesMutation.isPending || startGameMutation.isPending) ? "Starting Game..." : "Configure & Start Game"}
                </Button>
              </div>
            )}

            {/* Phase 2: Role Revelation */}
            {(game?.status === 'active' || game?.status === 'in_progress') && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Phase 2: Role Revelation</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                    Each player will privately see their role. Pass the device to each player one by one.
                  </p>
                  
                  {game?.players && currentRevealingPlayerIndex < game.players.length && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">
                        Current player: <span className="text-lg font-bold">{game.players[currentRevealingPlayerIndex]?.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Player {currentRevealingPlayerIndex + 1} of {game.players.length}
                      </p>
                    </div>
                  )}
                </div>

                {!showingRole ? (
                  <Button 
                    onClick={handleRevealRole}
                    disabled={revealRoleMutation.isPending || !game?.players}
                    className="flex items-center gap-2 w-full"
                  >
                    <Eye className="h-4 w-4" />
                    {revealRoleMutation.isPending ? "Revealing..." : "Click to Reveal Your Word"}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {!wordRevealed ? (
                      <Button 
                        onClick={() => setWordRevealed(true)}
                        className="flex items-center gap-2 w-full h-32 text-xl"
                        variant="secondary"
                      >
                        <Eye className="h-6 w-6" />
                        Tap to See Your Word
                      </Button>
                    ) : (
                      <>
                        <div className="p-6 bg-gray-900 text-white rounded-lg text-center">
                          {revealedRole?.word ? (
                            <div>
                              <p className="text-lg mb-2">Your word is:</p>
                              <p className="text-4xl font-bold text-yellow-400">
                                {revealedRole.word}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-2xl font-bold text-red-400 mb-2">⚪ Mr. White</p>
                              <p className="text-yellow-400">You don't know the word! Try to figure it out.</p>
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          onClick={handleRoleRevealed}
                          variant="outline"
                          className="flex items-center gap-2 w-full"
                        >
                          <EyeOff className="h-4 w-4" />
                          OK - Pass to Next Player
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {game?.players && currentRevealingPlayerIndex >= game.players.length && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-800 dark:text-green-200 font-semibold">
                        ✅ All players have seen their roles! The game is ready to play.
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                        You can now navigate to the rounds page or scoreboard to manage the game.
                      </p>
                    </div>
                  </div>
                )}
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
                        {player.isEliminated && <span className="text-red-500">❌ Eliminated</span>}
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
