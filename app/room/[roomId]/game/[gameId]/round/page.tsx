"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useGame, useCurrentRound, useSubmitVote, useProcessRound, useNextRound, useEliminatePlayer } from "@/lib/hooks";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageCircle, Vote, Crown, Target, Clock, Users, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function RoundPage() {
  return (
    <AuthGuard>
      <RoundContent />
    </AuthGuard>
  );
}

function RoundContent() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const gameId = params.gameId as string;

  // State management
  const [gamePhase, setGamePhase] = useState<'describing' | 'voting' | 'results'>('describing');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string>('');
  const [selectedEliminationTarget, setSelectedEliminationTarget] = useState<string>('');
  const [description, setDescription] = useState('');
  const [hasSubmittedDescription, setHasSubmittedDescription] = useState(false);
  const [hasSubmittedVote, setHasSubmittedVote] = useState(false);
  const [showingEliminationPanel, setShowingEliminationPanel] = useState(false);

  // API hooks
  const { data: game, isLoading: gameLoading } = useGame(gameId);
  const { data: currentRound, isLoading: roundLoading } = useCurrentRound(gameId);
  const submitVoteMutation = useSubmitVote();
  const processRoundMutation = useProcessRound();
  const nextRoundMutation = useNextRound();
  const eliminatePlayerMutation = useEliminatePlayer();

  // Auto-refresh current round every 3 seconds during active gameplay
  useEffect(() => {
    const interval = setInterval(() => {
      // This will refetch the current round data
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Determine game phase based on round status
  useEffect(() => {
    if (currentRound) {
      if (currentRound.status === 'describing') {
        setGamePhase('describing');
      } else if (currentRound.status === 'voting') {
        setGamePhase('voting');
      } else if (currentRound.status === 'completed') {
        setGamePhase('results');
      }
    }
  }, [currentRound]);

  const handleSubmitDescription = async () => {
    if (!description.trim()) return;
    
    try {
      // This would need to be implemented in the backend
      console.log('Submitting description:', description);
      setHasSubmittedDescription(true);
      setDescription('');
    } catch (error) {
      console.error('Failed to submit description:', error);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedVoteTarget || !game?.players) return;

    // Find the current user's game player ID (for now, we'll use the first player as a demo)
    const currentPlayer = game.players[0]; // This should be determined by authentication
    
    try {
      await submitVoteMutation.mutateAsync({
        gameId: gameId,
        voterId: currentPlayer.gamePlayerId,
        votedForId: selectedVoteTarget,
      });
      setHasSubmittedVote(true);
      console.log('Vote submitted successfully');
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  };

  const handleProcessRound = async () => {
    try {
      await processRoundMutation.mutateAsync(gameId);
      console.log('Round processed successfully');
    } catch (error) {
      console.error('Failed to process round:', error);
    }
  };

  const handleNextRound = async () => {
    try {
      await nextRoundMutation.mutateAsync(gameId);
      console.log('Next round started');
    } catch (error) {
      console.error('Failed to start next round:', error);
    }
  };

  const handleEliminatePlayer = async () => {
    if (!selectedEliminationTarget) {
      alert("Please select a player to eliminate.");
      return;
    }

    const player = game?.players?.find(p => p.id === selectedEliminationTarget);
    const playerName = player?.name;
    
    console.log('Elimination debug:', {
      selectedEliminationTarget,
      player,
      playerName,
      allPlayers: game?.players?.map(p => ({ id: p.id, gamePlayerId: p.gamePlayerId, name: p.name }))
    });
    
    if (!confirm(`Are you sure you want to eliminate ${playerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await eliminatePlayerMutation.mutateAsync({
        gameId: gameId,
        playerId: selectedEliminationTarget, // This is the Player ID, not GamePlayer ID
      });
      
      console.log('Player eliminated successfully:', result);
      
      // Show elimination result
      if (result.gameFinished) {
        alert(`${playerName} eliminated! Game finished - ${result.winner} wins!`);
        handleEndGame(); // Navigate to results
      } else {
        alert(`${playerName} eliminated! Role was: ${result.role}`);
        setGamePhase('results'); // Show round results
      }
      
      setShowingEliminationPanel(false);
      setSelectedEliminationTarget('');
    } catch (error: any) {
      console.error('Failed to eliminate player:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to eliminate player: ${errorMessage}`);
    }
  };

  const handleEndGame = () => {
    router.push(`/room/${roomId}/game/${gameId}/result`);
  };

  if (gameLoading || roundLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game || !currentRound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Game or Round Not Found</h2>
          <p className="text-muted-foreground mb-4">
            Unable to load the current game or round data.
          </p>
          <Link href={`/room/${roomId}/game/${gameId}`}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Game
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentPlayer = game.players?.find(p => p.gamePlayerId === currentRound.starterId);
  const alivePlayers = game.players?.filter(p => !p.isEliminated) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/room/${roomId}/game/${gameId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Game Info
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Round {currentRound.roundNumber}</h1>
              <p className="text-muted-foreground">
                {game.gameMode === 'classic' ? 'Classic Mode' : 'Extended Mode'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Players Alive</div>
            <div className="text-2xl font-bold">{alivePlayers.length}</div>
          </div>
        </div>

        {/* Game Phase Indicator */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {gamePhase === 'describing' && <MessageCircle className="h-5 w-5" />}
              {gamePhase === 'voting' && <Vote className="h-5 w-5" />}
              {gamePhase === 'results' && <Target className="h-5 w-5" />}
              
              {gamePhase === 'describing' && 'Description Phase'}
              {gamePhase === 'voting' && 'Voting Phase'}
              {gamePhase === 'results' && 'Round Results'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gamePhase === 'describing' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Description Round - Everyone describes their word!
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Each player takes turns describing their word without saying it directly. 
                    Try to blend in if you're undercover, or figure out the word if you're Mr. White!
                  </p>
                </div>

                {currentPlayer && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm">
                      <Crown className="h-4 w-4 inline mr-1" />
                      Current speaker: <strong>{currentPlayer.name}</strong>
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Description</label>
                  <Textarea
                    placeholder="Describe your word without saying it directly..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={hasSubmittedDescription}
                  />
                  <Button 
                    onClick={handleSubmitDescription}
                    disabled={!description.trim() || hasSubmittedDescription}
                    className="w-full"
                  >
                    {hasSubmittedDescription ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Description Submitted
                      </>
                    ) : (
                      'Submit Description'
                    )}
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => setGamePhase('voting')} variant="outline">
                      Move to Voting Phase
                    </Button>
                    <Button 
                      onClick={() => setShowingEliminationPanel(!showingEliminationPanel)} 
                      variant="destructive"
                    >
                      Direct Elimination (Host)
                    </Button>
                  </div>

                  {showingEliminationPanel && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3">
                        🚨 Host Elimination
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        Directly eliminate a player without voting. Use this for host decisions or game management.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="grid gap-2">
                          {alivePlayers.map((player) => (
                            <label key={player.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-red-100 dark:hover:bg-red-900/10 cursor-pointer">
                              <input
                                type="radio"
                                name="elimination"
                                value={player.id}
                                checked={selectedEliminationTarget === player.id}
                                onChange={(e) => setSelectedEliminationTarget(e.target.value)}
                                className="w-4 h-4"
                              />
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-sm font-semibold">
                                  {player.name.charAt(0)}
                                </div>
                                <span>{player.name}</span>
                              </div>
                            </label>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={handleEliminatePlayer}
                            disabled={!selectedEliminationTarget || eliminatePlayerMutation.isPending}
                            variant="destructive"
                            className="flex-1"
                          >
                            {eliminatePlayerMutation.isPending ? "Eliminating..." : "Eliminate Selected Player"}
                          </Button>
                          <Button 
                            onClick={() => {
                              setShowingEliminationPanel(false);
                              setSelectedEliminationTarget('');
                            }}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {gamePhase === 'voting' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    Voting Phase - Who is the undercover?
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Vote for the player you think is undercover. The player with the most votes will be eliminated.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Vote to Eliminate:</h3>
                  <div className="grid gap-2">
                    {alivePlayers.map((player) => (
                      <label key={player.gamePlayerId} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <input
                          type="radio"
                          name="vote"
                          value={player.gamePlayerId}
                          checked={selectedVoteTarget === player.gamePlayerId}
                          onChange={(e) => setSelectedVoteTarget(e.target.value)}
                          disabled={hasSubmittedVote}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">
                            {player.name.charAt(0)}
                          </div>
                          <span>{player.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <Button 
                    onClick={handleSubmitVote}
                    disabled={!selectedVoteTarget || hasSubmittedVote}
                    className="w-full"
                  >
                    {hasSubmittedVote ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Vote Submitted
                      </>
                    ) : (
                      'Submit Vote'
                    )}
                  </Button>
                </div>

                <div className="flex justify-center gap-2">
                  <Button 
                    onClick={handleProcessRound}
                    disabled={processRoundMutation.isPending}
                    variant="outline"
                  >
                    Process Votes (Host)
                  </Button>
                  <Button 
                    onClick={() => setShowingEliminationPanel(!showingEliminationPanel)} 
                    variant="destructive"
                    size="sm"
                  >
                    Direct Elimination
                  </Button>
                </div>

                {showingEliminationPanel && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3">
                      🚨 Host Elimination
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      Skip voting and directly eliminate a player.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        {alivePlayers.map((player) => (
                          <label key={player.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-red-100 dark:hover:bg-red-900/10 cursor-pointer">
                            <input
                              type="radio"
                              name="elimination-voting"
                              value={player.id}
                              checked={selectedEliminationTarget === player.id}
                              onChange={(e) => setSelectedEliminationTarget(e.target.value)}
                              className="w-4 h-4"
                            />
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-sm font-semibold">
                                {player.name.charAt(0)}
                              </div>
                              <span>{player.name}</span>
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleEliminatePlayer}
                          disabled={!selectedEliminationTarget || eliminatePlayerMutation.isPending}
                          variant="destructive"
                          className="flex-1"
                        >
                          {eliminatePlayerMutation.isPending ? "Eliminating..." : "Eliminate Selected Player"}
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowingEliminationPanel(false);
                            setSelectedEliminationTarget('');
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {gamePhase === 'results' && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Round Complete!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Voting has finished. Check the results below.
                  </p>
                </div>

                {currentRound.eliminatedPlayerId && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="font-semibold text-red-800 dark:text-red-200">
                      Player Eliminated: {game.players?.find(p => p.gamePlayerId === currentRound.eliminatedPlayerId)?.name}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={handleNextRound}
                    disabled={nextRoundMutation.isPending}
                  >
                    Next Round
                  </Button>
                  <Button 
                    onClick={handleEndGame}
                    variant="outline"
                  >
                    End Game
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players ({alivePlayers.length} alive)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {game.players?.map((player, index) => (
                <div 
                  key={player.gamePlayerId} 
                  className={`p-3 border rounded-lg ${player.isEliminated ? 'opacity-50 bg-red-50 dark:bg-red-900/10' : 'bg-muted/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-semibold">
                      {player.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{player.name}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>#{player.orderIndex || index + 1}</span>
                        {player.isEliminated && <span className="text-red-500">❌ Eliminated</span>}
                        {player.gamePlayerId === currentRound.starterId && !player.isEliminated && (
                          <span className="text-yellow-600">👑 Speaking</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
