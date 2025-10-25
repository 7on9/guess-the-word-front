"use client";

import { useState } from "react";
import { useAddPlayer, type Player } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, User, GripVertical } from "lucide-react";

interface PlayerListProps {
  roomId: string;
  players?: Array<Player>;
  isLoading: boolean;
}

export function PlayerList({ roomId, players, isLoading }: PlayerListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");

  const addPlayerMutation = useAddPlayer();

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      await addPlayerMutation.mutateAsync({ 
        roomId, 
        name: newPlayerName.trim() 
      });
      setNewPlayerName("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add player:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Players ({players?.length || 0})
        </CardTitle>
        
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Player
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isAdding && (
          <form onSubmit={handleAddPlayer} className="flex gap-2">
            <Input
              type="text"
              placeholder="Player name..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={addPlayerMutation.isPending || !newPlayerName.trim()}
            >
              {addPlayerMutation.isPending ? "Adding..." : "Add"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewPlayerName("");
              }}
            >
              Cancel
            </Button>
          </form>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">Loading players...</p>
          </div>
        )}

        <div className="space-y-2">
          {players?.map((player, index) => (
            <PlayerItem key={player.id} player={player} index={index} />
          ))}
          
          {players && players.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No players in this room yet. Add the first player to get started!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PlayerItem({ player, index }: { player: Player; index: number }) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground">
        <GripVertical className="h-4 w-4" />
        <span className="text-sm font-medium">#{index + 1}</span>
      </div>
      
      <div className="flex-1">
        <p className="font-medium">{player.name}</p>
        <p className="text-xs text-muted-foreground">
          Added {new Date(player.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
