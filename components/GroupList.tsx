"use client";

import { useState } from "react";
import { useGroups, useCreateGroup, useCreateRoom, type Group } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Gamepad2, Clock, Trash2 } from "lucide-react";
import Link from "next/link";

export function GroupList() {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [players, setPlayers] = useState([{ name: "", avatar: "" }]);
  
  // Room creation state
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [roomGameMode, setRoomGameMode] = useState<'classic' | 'extended'>('classic');

  const { data: groups, isLoading, error } = useGroups();
  const createGroupMutation = useCreateGroup();
  const createRoomMutation = useCreateRoom();

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length === 0) {
      alert("Please add at least one player to the group.");
      return;
    }

    try {
      await createGroupMutation.mutateAsync({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        players: validPlayers.map(p => ({ name: p.name.trim(), avatar: p.avatar.trim() || undefined })),
      });
      setNewGroupName("");
      setNewGroupDescription("");
      setPlayers([{ name: "", avatar: "" }]);
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !selectedGroupId) return;

    try {
      const newRoom = await createRoomMutation.mutateAsync({
        name: newRoomName.trim(),
        groupId: selectedGroupId,
        gameMode: roomGameMode,
      });
      setNewRoomName("");
      setSelectedGroupId("");
      setRoomGameMode('classic');
      setIsCreatingRoom(false);
      // Navigate to the new room
      window.location.href = `/room/${newRoom.id}`;
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const addPlayerField = () => {
    setPlayers([...players, { name: "", avatar: "" }]);
  };

  const removePlayerField = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index: number, field: 'name' | 'avatar', value: string) => {
    const updatedPlayers = [...players];
    updatedPlayers[index][field] = value;
    setPlayers(updatedPlayers);
  };

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Failed to load groups. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Player Groups</h1>
          <p className="text-muted-foreground">
            Manage your player groups and create game rooms to start playing Undercover
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/words">
            <Button variant="outline">
              Manage Words
            </Button>
          </Link>
          
          {!isCreating && !isCreatingRoom && (
            <>
              <Button 
                onClick={() => setIsCreatingRoom(true)} 
                variant="outline"
                className="flex items-center gap-2"
                disabled={!groups || groups.length === 0}
                title={!groups || groups.length === 0 ? "Create a group first to enable room creation" : "Create a new room from existing groups"}
              >
                <Gamepad2 className="h-4 w-4" />
                Create Room
              </Button>
              <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </>
          )}
        </div>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Group Name *</label>
                  <Input
                    type="text"
                    placeholder="My Friends Group"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    type="text"
                    placeholder="Group for weekend games"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Players *</label>
                  <Button type="button" variant="outline" size="sm" onClick={addPlayerField}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Player
                  </Button>
                </div>
                
                {players.map((player, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Player name"
                      value={player.name}
                      onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Avatar URL (optional)"
                      value={player.avatar}
                      onChange={(e) => updatePlayer(index, 'avatar', e.target.value)}
                      className="flex-1"
                    />
                    {players.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlayerField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createGroupMutation.isPending || !newGroupName.trim()}
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    setNewGroupName("");
                    setNewGroupDescription("");
                    setPlayers([{ name: "", avatar: "" }]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isCreatingRoom && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
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
                  <label className="text-sm font-medium">Select Group *</label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Choose a group...</option>
                    {groups?.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.players?.length || 0} players)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Game Mode</label>
                  <select
                    value={roomGameMode}
                    onChange={(e) => setRoomGameMode(e.target.value as 'classic' | 'extended')}
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
                  disabled={createRoomMutation.isPending || !newRoomName.trim() || !selectedGroupId}
                >
                  {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreatingRoom(false);
                    setNewRoomName("");
                    setSelectedGroupId("");
                    setRoomGameMode('classic');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center p-8">
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups?.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
        
        {groups && groups.length === 0 && !isLoading && (
          <div className="col-span-full text-center p-8 text-muted-foreground">
            No groups available. Create your first group to add players, then you can create rooms to start playing!
          </div>
        )}
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Link href={`/group/${group.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="truncate">{group.name}</span>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          {group.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {group.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{group.players?.length || 0} players</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Created {formatDate(group.createdAt)}</span>
          </div>
          
          {group.players && group.players.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {group.players.slice(0, 3).map((player, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 text-xs bg-muted rounded-full"
                >
                  {player.name}
                </span>
              ))}
              {group.players.length > 3 && (
                <span className="px-2 py-1 text-xs bg-muted rounded-full">
                  +{group.players.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
