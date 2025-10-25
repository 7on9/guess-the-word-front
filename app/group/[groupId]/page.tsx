"use client";

import { useParams } from "next/navigation";
import { useGroup, useRooms, useCreateRoom, useAddPlayerToGroup, useReorderGroupPlayers, type Group } from "@/lib/hooks";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Plus, Gamepad2, Clock, UserPlus, Move, GripVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function GroupDetailPage() {
  return (
    <AuthGuard>
      <GroupDetailContent />
    </AuthGuard>
  );
}

function GroupDetailContent() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [gameMode, setGameMode] = useState<'classic' | 'extended'>('classic');
  
  // Player management state
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerAvatar, setNewPlayerAvatar] = useState("");
  const [reorderMode, setReorderMode] = useState(false);
  const [localPlayers, setLocalPlayers] = useState<Array<{id?: string, name: string, avatar?: string, userId?: string}>>([]);

  const { data: group, isLoading: groupLoading, error: groupError } = useGroup(groupId);
  const { data: rooms, isLoading: roomsLoading } = useRooms(); // Get all user's rooms
  const createRoomMutation = useCreateRoom();
  const addPlayerMutation = useAddPlayerToGroup();
  const reorderPlayersMutation = useReorderGroupPlayers();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const newRoom = await createRoomMutation.mutateAsync({
        name: newRoomName.trim(),
        groupId: groupId,
        gameMode: gameMode,
      });
      setNewRoomName("");
      setIsCreatingRoom(false);
      // Navigate to the new room
      window.location.href = `/room/${newRoom.id}`;
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      await addPlayerMutation.mutateAsync({
        groupId: groupId,
        player: {
          name: newPlayerName.trim(),
          avatar: newPlayerAvatar.trim() || undefined,
        },
      });
      setNewPlayerName("");
      setNewPlayerAvatar("");
      setIsAddingPlayer(false);
    } catch (error) {
      console.error("Failed to add player:", error);
    }
  };

  const handleReorderPlayers = async () => {
    if (!group || !localPlayers.length) return;

    try {
      await reorderPlayersMutation.mutateAsync({
        groupId: groupId,
        players: localPlayers,
      });
      setReorderMode(false);
    } catch (error) {
      console.error("Failed to reorder players:", error);
    }
  };

  const movePlayer = (fromIndex: number, toIndex: number) => {
    const newPlayers = [...localPlayers];
    const [movedPlayer] = newPlayers.splice(fromIndex, 1);
    newPlayers.splice(toIndex, 0, movedPlayer);
    setLocalPlayers(newPlayers);
  };

  // Initialize local players when group data changes or reorder mode starts
  const initializeReorderMode = () => {
    if (group?.players) {
      setLocalPlayers([...group.players]);
      setReorderMode(true);
    }
  };

  if (groupError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <p className="text-destructive mb-4">Group not found or failed to load.</p>
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

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <p className="text-muted-foreground">Loading group...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter rooms that belong to this group
  const groupRooms = rooms?.filter(room => room.groupId === groupId) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{group?.name}</h1>
              {group?.description && (
                <p className="text-muted-foreground">{group.description}</p>
              )}
            </div>
          </div>

          {!isCreatingRoom && (
            <Button onClick={() => setIsCreatingRoom(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          )}
        </div>

        {/* Create Room Form */}
        {isCreatingRoom && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Room</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Room Name *</label>
                    <Input
                      type="text"
                      placeholder="Friday Night Game"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Game Mode</label>
                    <select
                      value={gameMode}
                      onChange={(e) => setGameMode(e.target.value as 'classic' | 'extended')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="classic">Classic</option>
                      <option value="extended">Extended (with Mr. White)</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createRoomMutation.isPending || !newRoomName.trim()}
                  >
                    {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreatingRoom(false);
                      setNewRoomName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Group Players */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players ({group?.players?.length || 0})
              </CardTitle>
              
              <div className="flex items-center gap-2">
                {!isAddingPlayer && !reorderMode && (
                  <>
                    {group?.players && group.players.length > 1 && (
                      <Button 
                        onClick={initializeReorderMode}
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Move className="h-4 w-4" />
                        Reorder
                      </Button>
                    )}
                    <Button 
                      onClick={() => setIsAddingPlayer(true)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Player
                    </Button>
                  </>
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
                        setLocalPlayers([]);
                      }}
                      variant="outline" 
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Player Form */}
            {isAddingPlayer && (
              <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <form onSubmit={handleAddPlayer} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Player Name *</label>
                      <Input
                        type="text"
                        placeholder="Enter player name"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Avatar URL</label>
                      <Input
                        type="text"
                        placeholder="Optional avatar URL"
                        value={newPlayerAvatar}
                        onChange={(e) => setNewPlayerAvatar(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      size="sm"
                      disabled={addPlayerMutation.isPending || !newPlayerName.trim()}
                    >
                      {addPlayerMutation.isPending ? "Adding..." : "Add Player"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsAddingPlayer(false);
                        setNewPlayerName("");
                        setNewPlayerAvatar("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Player List */}
            {(reorderMode ? localPlayers : group?.players) && (reorderMode ? localPlayers : group?.players)!.length > 0 ? (
              <div className="space-y-2">
                {(reorderMode ? localPlayers : group?.players)!.map((player, index) => (
                  <div 
                    key={player.id || index} 
                    className={`flex items-center gap-3 p-3 border rounded-lg ${
                      reorderMode ? 'bg-muted/20 border-dashed' : ''
                    }`}
                  >
                    {reorderMode && (
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
                          disabled={index === localPlayers.length - 1}
                          onClick={() => movePlayer(index, index + 1)}
                          className="h-6 w-6 p-0"
                        >
                          ↓
                        </Button>
                      </div>
                    )}
                    
                    {reorderMode && (
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    )}
                    
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
                    <div className="flex-1">
                      <p className="font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground">Player {index + 1}</p>
                    </div>
                    
                    {reorderMode && (
                      <div className="text-sm text-muted-foreground font-mono">
                        #{index + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No players in this group yet. Add some players to start creating rooms.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Rooms from this Group */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Rooms ({groupRooms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roomsLoading ? (
              <p className="text-muted-foreground text-center py-4">Loading rooms...</p>
            ) : groupRooms.length > 0 ? (
              <div className="space-y-2">
                {groupRooms.map((room) => (
                  <Link key={room.id} href={`/room/${room.id}`}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium">{room.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="capitalize">{room.gameMode} mode</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(room.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No rooms created from this group yet. Create your first room to start playing!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
