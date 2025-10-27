"use client";

import { useParams, useRouter } from "next/navigation";
import { useGame, useGameHistory, useCreateGame, useAddMultiplePlayersToGame } from "@/lib/hooks";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Users, Clock, Target, Crown, Shield, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function GameResultPage() {
  return (
    <AuthGuard>
      <GameResultContent />
    </AuthGuard>
  );
}

function GameResultContent() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const gameId = params.gameId as string;

  const { data: game, isLoading: gameLoading } = useGame(gameId);
  const { data: gameHistory, isLoading: historyLoading } = useGameHistory(gameId);
  const createGameMutation = useCreateGame();
  const addPlayersToGameMutation = useAddMultiplePlayersToGame();

  if (gameLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Game Not Found</h2>
          <p className="text-muted-foreground mb-4">Unable to load game results.</p>
          <Link href={`/room/${roomId}`}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Room
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleCreateNewGame = async () => {
    if (!game) return;

    try {
      console.log('Creating new game with same configuration...', {
        roomId,
        gameMode: game.gameMode,
        undercoverCount: game.undercoverCount,
        mrWhiteCount: game.mrWhiteCount,
        currentPlayers: game.players?.length
      });

      // Create new game with same configuration
      const newGame = await createGameMutation.mutateAsync({
        roomId: roomId,
        gameMode: game.gameMode as 'classic' | 'extended',
        undercoverCount: game.undercoverCount,
        mrWhiteCount: game.mrWhiteCount,
      });

      console.log('New game created:', newGame);

      // Add all players from the previous game to the new game
      if (game.players && game.players.length > 0) {
        const playersToAdd = game.players.map(p => ({
          name: p.name,
          avatar: p.avatar
        }));
        
        try {
          await addPlayersToGameMutation.mutateAsync({
            gameId: newGame.id,
            players: playersToAdd
          });
          
          console.log('Players added to new game successfully');
        } catch (error) {
          console.error('Failed to add players to new game:', error);
          alert('Game created but failed to add players. You can add them manually.');
        }
      }

      // Navigate to the new game
      router.push(`/room/${roomId}/game/${newGame.id}`);
      
    } catch (error: any) {
      console.error('Failed to create new game:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to create new game: ${errorMessage}`);
    }
  };

  const getWinnerInfo = () => {
    if (game.status === 'completed' || game.status === 'finished') {
      // Debug log to see what the backend returns
      console.log('Game winnerRole from backend:', game.winnerRole);
      
      // Use the actual winnerRole from the backend
      switch (game.winnerRole) {
        case 'civilians':
          return {
            team: 'Civilians',
            icon: '👥',
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800'
          };
        case 'undercover':
          return {
            team: 'Undercover',
            icon: '🕵️',
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800'
          };
        case 'mr_white':
          return {
            team: 'Mr. White',
            icon: '⚪',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            borderColor: 'border-purple-200 dark:border-purple-800'
          };
        default:
          // Fallback if winnerRole is not set
          return {
            team: 'Unknown',
            icon: '❓',
            color: 'text-gray-600',
            bgColor: 'bg-gray-50 dark:bg-gray-900/20',
            borderColor: 'border-gray-200 dark:border-gray-800'
          };
      }
    }
    return null;
  };

  const winnerInfo = getWinnerInfo();
  const totalRounds = gameHistory?.rounds?.length || 0;
  const gameDuration = game.startedAt && game.endedAt 
    ? Math.round((new Date(game.endedAt).getTime() - new Date(game.startedAt).getTime()) / 1000 / 60)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/room/${roomId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Room
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Game Results</h1>
              <p className="text-muted-foreground">
                {game.gameMode === 'classic' ? 'Classic Mode' : 'Extended Mode'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleCreateNewGame}
              disabled={createGameMutation.isPending || addPlayersToGameMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              title="Create a new game with the same players and settings but a different word"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              {createGameMutation.isPending || addPlayersToGameMutation.isPending ? "Creating..." : "New Game"}
            </Button>
          </div>
        </div>

        {/* Winner Announcement */}
        {winnerInfo && (
          <Card className={`mb-6 ${winnerInfo.bgColor} border-2 ${winnerInfo.borderColor}`}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                <Trophy className={`h-8 w-8 ${winnerInfo.color}`} />
                <span className={winnerInfo.color}>
                  {winnerInfo.icon} {winnerInfo.team} Win!
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg font-semibold mb-2">Congratulations!</p>
              <p className="text-muted-foreground">
                The {winnerInfo.team.toLowerCase()} successfully completed their objective.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Game Statistics */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rounds</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRounds}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Game Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gameDuration}m</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{game.players?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Final Player Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Final Player Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {game.players?.map((player, index) => (
                <div 
                  key={player.gamePlayerId} 
                  className={`p-4 border rounded-lg ${
                    player.isEliminated 
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
                      : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-lg">
                      {player.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        {player.name}
                        {player.role === 'civilian' && <span className="text-blue-600">👥</span>}
                        {player.role === 'undercover' && <span className="text-red-600">🕵️</span>}
                        {player.role === 'mr_white' && <span className="text-purple-600">⚪</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {player.role === 'civilian' && 'Civilian'}
                        {player.role === 'undercover' && 'Undercover'}
                        {player.role === 'mr_white' && 'Mr. White'}
                      </div>
                      <div className="text-sm">
                        {player.isEliminated ? (
                          <span className="text-red-600 font-medium">❌ Eliminated</span>
                        ) : (
                          <span className="text-green-600 font-medium">✅ Survived</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Round History */}
        {gameHistory?.rounds && gameHistory.rounds.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Round History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gameHistory.rounds.map((round: any, index: number) => (
                  <div key={round.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Round {round.roundNumber}</h4>
                      <span className="text-sm text-muted-foreground">
                        {new Date(round.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {round.eliminatedPlayerId && (
                      <div className="text-sm">
                        <span className="text-red-600">
                          Eliminated: {game.players?.find((p: any) => p.gamePlayerId === round.eliminatedPlayerId)?.name}
                        </span>
                      </div>
                    )}
                    
                    {round.votes && round.votes.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {round.votes.length} votes cast
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link href={`/room/${roomId}`}>
            <Button size="lg">
              Play Again
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
