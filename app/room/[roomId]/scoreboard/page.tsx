"use client";

import { useParams } from "next/navigation";
import { useRoom } from "@/lib/hooks";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, User, Target, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function ScoreboardPage() {
  return (
    <AuthGuard>
      <ScoreboardContent />
    </AuthGuard>
  );
}

function ScoreboardContent() {
  const params = useParams();
  const roomId = params.roomId as string;

  const { data: room, isLoading, error } = useRoom(roomId);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <p className="text-destructive mb-4">Room not found or failed to load.</p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Rooms
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
            <p className="text-muted-foreground">Loading scoreboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mock data for demonstration
  const mockScoreboard = [
    { 
      id: "1", 
      playerName: "Alice", 
      gamesWon: 5, 
      gamesPlayed: 8, 
      winRate: 62.5,
      averageRoundsSurvived: 4.2,
      totalEliminations: 3
    },
    { 
      id: "2", 
      playerName: "Bob", 
      gamesWon: 3, 
      gamesPlayed: 7, 
      winRate: 42.9,
      averageRoundsSurvived: 3.1,
      totalEliminations: 1
    },
    { 
      id: "3", 
      playerName: "Charlie", 
      gamesWon: 2, 
      gamesPlayed: 6, 
      winRate: 33.3,
      averageRoundsSurvived: 2.8,
      totalEliminations: 2
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/room/${roomId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Room
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Scoreboard</h1>
            <p className="text-muted-foreground">
              Player statistics for {room?.name}
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockScoreboard.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(...mockScoreboard.map(p => p.gamesPlayed))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Winner</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockScoreboard.sort((a, b) => b.gamesWon - a.gamesWon)[0]?.playerName}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(mockScoreboard.reduce((sum, p) => sum + p.winRate, 0) / mockScoreboard.length).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scoreboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>Player Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">#</th>
                    <th className="text-left p-4 font-medium">Player</th>
                    <th className="text-left p-4 font-medium">Games Won</th>
                    <th className="text-left p-4 font-medium">Games Played</th>
                    <th className="text-left p-4 font-medium">Win Rate</th>
                    <th className="text-left p-4 font-medium">Avg Rounds Survived</th>
                    <th className="text-left p-4 font-medium">Eliminations</th>
                  </tr>
                </thead>
                <tbody>
                  {mockScoreboard
                    .sort((a, b) => b.winRate - a.winRate)
                    .map((player, index) => (
                    <tr key={player.id} className="border-b hover:bg-accent/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-4 font-medium">{player.playerName}</td>
                      <td className="p-4">{player.gamesWon}</td>
                      <td className="p-4">{player.gamesPlayed}</td>
                      <td className="p-4">
                        <div className={`font-medium ${player.winRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {player.winRate.toFixed(1)}%
                        </div>
                      </td>
                      <td className="p-4">{player.averageRoundsSurvived.toFixed(1)}</td>
                      <td className="p-4">{player.totalEliminations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {mockScoreboard.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No game statistics available yet. Play some games to see the scoreboard!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              📊 <strong>Note:</strong> This is a demo scoreboard with mock data. 
              The actual implementation will fetch real statistics from the backend API 
              using the <code>/rooms/{roomId}/scoreboard</code> endpoint.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
