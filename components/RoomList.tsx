"use client";

import { useState } from "react";
import { useRooms, useCreateRoom, type Room } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Gamepad2, Clock } from "lucide-react";
import Link from "next/link";

export function RoomList() {
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const { data: rooms, isLoading, error } = useRooms();
  const createRoomMutation = useCreateRoom();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      await createRoomMutation.mutateAsync({ name: newRoomName.trim() });
      setNewRoomName("");
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Failed to load rooms. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Game Rooms</h1>
          <p className="text-muted-foreground">
            Create or join a room to start playing Undercover
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/words">
            <Button variant="outline">
              Manage Words
            </Button>
          </Link>
          
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          )}
        </div>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRoom} className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter room name..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button 
                type="submit" 
                disabled={createRoomMutation.isPending || !newRoomName.trim()}
              >
                {createRoomMutation.isPending ? "Creating..." : "Create"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false);
                  setNewRoomName("");
                }}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center p-8">
          <p className="text-muted-foreground">Loading rooms...</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms?.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
        
        {rooms && rooms.length === 0 && !isLoading && (
          <div className="col-span-full text-center p-8 text-muted-foreground">
            No rooms available. Create your first room to get started!
          </div>
        )}
      </div>
    </div>
  );
}

function RoomCard({ room }: { room: Room }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Link href={`/room/${room.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="truncate">{room.name}</span>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{room.playersCount || 0} players</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gamepad2 className="h-4 w-4" />
            <span>{room.gamesCount || 0} games</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Created {formatDate(room.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
