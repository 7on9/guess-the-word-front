"use client";

import { useParams } from "next/navigation";
import { useRoom, useGroup, useCreateGame, useAddMultiplePlayersToGame } from "@/lib/hooks";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Gamepad2, Plus, Play, Trophy } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function RoomDetailPage() {
  return (
    <AuthGuard>
      <RoomDetailContent />
    </AuthGuard>
  );
}

function RoomDetailContent() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const { data: room, isLoading: roomLoading, error: roomError } = useRoom(roomId);
  const { data: group, isLoading: groupLoading } = useGroup(room?.groupId || '');
  
  // Initialize gameMode from room's gameMode
  const [gameMode, setGameMode] = useState<'classic' | 'extended'>('classic');
  const [undercoverCount, setUndercoverCount] = useState(1);
  const [mrWhiteCount, setMrWhiteCount] = useState(0);

  // Update gameMode and mrWhiteCount when room data loads
  useEffect(() => {
    if (room) {
      setGameMode(room.gameMode);
      setMrWhiteCount(room.gameMode === 'extended' ? 1 : 0);
    }
  }, [room]);

  const createGameMutation = useCreateGame();
  const addPlayersToGameMutation = useAddMultiplePlayersToGame();

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingGame(true);

    try {
      // Step 1: Create the game
      const newGame = await createGameMutation.mutateAsync({
        roomId: roomId,
        gameMode: gameMode,
        undercoverCount: undercoverCount,
        mrWhiteCount: mrWhiteCount,
      });

      // Step 2: If room has a group, automatically add all group players to the game
      if (group?.players && group.players.length > 0) {
        const playersToAdd = group.players.map(player => ({
          name: player.name,
          avatar: player.avatar
        }));

        console.log(`Adding ${playersToAdd.length} players from group "${group.name}" to game ${newGame.id}...`);
        console.log("Players to add:", playersToAdd);
        
        try {
          const result = await addPlayersToGameMutation.mutateAsync({
            gameId: newGame.id,
            players: playersToAdd
          });
          
          console.log("Players successfully added to game!");
          console.log("Add players result:", result);
          
          // Wait a moment for the query to invalidate and refetch
          console.log("Waiting for data to refresh...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (addPlayersError) {
          console.error("Failed to add players to game:", addPlayersError);
          // Continue anyway to show the game, but log the error
          alert(`Game created but failed to add players: ${addPlayersError}`);
        }
      } else {
        console.log("No group or players found to transfer");
        console.log("Group data:", group);
      }

      setIsCreatingGame(false);
      // Navigate to the new game
      console.log(`Navigating to game: /room/${roomId}/game/${newGame.id}`);
      window.location.href = `/room/${roomId}/game/${newGame.id}`;
    } catch (error) {
      console.error("Failed to create game or add players:", error);
      setIsCreatingGame(false);
    }
  };

  if (roomError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <p className="text-destructive mb-4">Room not found or failed to load.</p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Groups
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (roomLoading || groupLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <p className="text-muted-foreground">Loading room...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={room?.groupId ? `/group/${room.groupId}` : "/"}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Group
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{room?.name}</h1>
              <p className="text-muted-foreground">
                {room?.gameMode && <span className="capitalize">{room.gameMode} mode</span>}
                {group?.name && <> • From {group.name}</>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreatingGame && (
              <Button 
                onClick={() => {
                  console.log("Create Game button clicked");
                  setIsCreatingGame(true);
                }} 
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Game
              </Button>
            )}
            {isCreatingGame && (
              <span className="text-sm text-muted-foreground">Form is open below ↓</span>
            )}
          </div>
        </div>

        {/* Create Game Form */}
        {isCreatingGame && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Game</CardTitle>
            </CardHeader>
          <CardContent>
            {group?.players && group.players.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Auto-Transfer Players:</strong> All {group.players.length} players from the group "{group.name}" will be automatically added to this game.
                </p>
              </div>
            )}
            <form onSubmit={handleCreateGame} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Game Mode</label>
                    <select
                      value={gameMode}
                      onChange={(e) => {
                        const mode = e.target.value as 'classic' | 'extended';
                        setGameMode(mode);
                        setMrWhiteCount(mode === 'extended' ? 1 : 0);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="classic">Classic</option>
                      <option value="extended">Extended (with Mr. White)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Undercover Players</label>
                    <Input
                      type="number"
                      min="1"
                      max={Math.floor((group?.players?.length || 3) / 3)}
                      value={undercoverCount}
                      onChange={(e) => setUndercoverCount(parseInt(e.target.value))}
                    />
                  </div>
                  {gameMode === 'extended' && (
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
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createGameMutation.isPending || addPlayersToGameMutation.isPending}
                    onClick={() => {
                      console.log("Submit button clicked - states:", {
                        isCreatingGame,
                        createGamePending: createGameMutation.isPending,
                        addPlayersPending: addPlayersToGameMutation.isPending,
                        gameMode,
                        groupPlayersCount: group?.players?.length || 0
                      });
                    }}
                  >
                    {createGameMutation.isPending 
                      ? "Creating Game..." 
                      : addPlayersToGameMutation.isPending 
                      ? "Adding Players..." 
                      : "Create Game"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreatingGame(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Players in Group</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {group?.players?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Room Mode</CardTitle>
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {room?.gameMode || "Classic"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Group Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Players ({group?.players?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {group?.players && group.players.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {group.players.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {player.avatar ? (
                      <img 
                        src={player.avatar} 
                        alt={player.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground">Player {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No players available. Go back to the group to add players.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Ready to Play?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You have <strong>{group?.players?.length || 0} players</strong> from the <strong>{group?.name}</strong> group ready to play.
              Create a game to start playing Undercover!
            </p>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• <strong>Classic mode:</strong> Civilians vs Undercover agents</p>
              <p>• <strong>Extended mode:</strong> Adds Mr. White (doesn't know any word)</p>
              <p>• Minimum 3 players recommended</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
