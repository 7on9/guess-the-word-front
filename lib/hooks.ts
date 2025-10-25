import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

// Types matching the real API
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  players: Array<Player>;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  userId?: string;
  createdAt?: string;
}

export interface Room {
  id: string;
  name: string;
  groupId: string;
  gameMode: 'classic' | 'extended';
  createdAt: string;
  group?: Group;
}

export interface Game {
  id: string;
  roomId: string;
  status: 'waiting' | 'not_started' | 'active' | 'in_progress' | 'finished' | 'completed';
  gameMode: 'classic' | 'extended';
  undercoverCount: number;
  mrWhiteCount: number;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  players?: Array<GamePlayer>;
}

export interface GamePlayer {
  id: string;
  name: string;
  avatar?: string;
  role?: 'civilian' | 'undercover' | 'mr_white';
  isEliminated: boolean;
  orderIndex: number;
}

export interface WordPair {
  id: string;
  civilianWord: string;
  undercoverWord: string;
  createdAt: string;
}

// Group Hooks (using Groups as primary entity for the UI)
export const useGroups = () =>
  useQuery({
    queryKey: ["groups"],
    queryFn: async (): Promise<Array<Group>> => {
      const response = await api.get("/groups");
      return response.data;
    },
  });

export const useGroup = (groupId: string) =>
  useQuery({
    queryKey: ["groups", groupId],
    queryFn: async (): Promise<Group> => {
      const response = await api.get(`/groups/${groupId}`);
      return response.data;
    },
    enabled: !!groupId,
  });

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; players: Array<{name: string, avatar?: string}> }): Promise<Group> => {
      const response = await api.post("/groups", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { groupId: string; name?: string; description?: string; players?: Array<{id?: string, name: string, avatar?: string, userId?: string}> }): Promise<Group> => {
      const { groupId, ...updateData } = data;
      
      // If only partial data is provided, get current group data to preserve other fields
      if (!data.name || !data.players) {
        const currentGroupResponse = await api.get(`/groups/${groupId}`);
        const currentGroup = currentGroupResponse.data;
        
        const completeUpdateData = {
          name: data.name || currentGroup.name,
          description: data.description !== undefined ? data.description : currentGroup.description,
          players: data.players || currentGroup.players || []
        };
        
        const response = await api.put(`/groups/${groupId}`, completeUpdateData);
        return response.data;
      } else {
        // Complete data provided, can update directly
        const response = await api.put(`/groups/${groupId}`, updateData);
        return response.data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", variables.groupId] });
    },
  });
};

export const useAddPlayerToGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { groupId: string; player: {name: string, avatar?: string} }): Promise<Group> => {
      // First get the current group data
      const currentGroupResponse = await api.get(`/groups/${data.groupId}`);
      const currentGroup = currentGroupResponse.data;
      
      // Add the new player to the existing players array
      const updatedPlayers = [...(currentGroup.players || []), data.player];
      
      // Update the group with the new players array
      const response = await api.put(`/groups/${data.groupId}`, {
        name: currentGroup.name,
        description: currentGroup.description,
        players: updatedPlayers
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", variables.groupId] });
    },
  });
};

export const useReorderGroupPlayers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { groupId: string; players: Array<{id?: string, name: string, avatar?: string, userId?: string}> }): Promise<Group> => {
      // First get the current group data to preserve other fields
      const currentGroupResponse = await api.get(`/groups/${data.groupId}`);
      const currentGroup = currentGroupResponse.data;
      
      // Update the group with the reordered players array
      const response = await api.put(`/groups/${data.groupId}`, {
        name: currentGroup.name,
        description: currentGroup.description,
        players: data.players
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", variables.groupId] });
    },
  });
};

// Room Hooks (rooms are created from groups)
export const useRooms = () =>
  useQuery({
    queryKey: ["rooms"],
    queryFn: async (): Promise<Array<Room>> => {
      const response = await api.get("/rooms");
      return response.data;
    },
  });

export const useRoom = (roomId: string) =>
  useQuery({
    queryKey: ["rooms", roomId],
    queryFn: async (): Promise<Room> => {
      const response = await api.get(`/rooms/${roomId}`);
      return response.data;
    },
    enabled: !!roomId,
  });

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; groupId?: string; gameMode: 'classic' | 'extended' }): Promise<Room> => {
      const response = await api.post("/rooms", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

// Player Hooks (players are managed through groups and games)
export const useAddPlayerToGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { gameId: string; name: string; avatar?: string }): Promise<GamePlayer> => {
      const response = await api.post(`/games/${data.gameId}/players`, { 
        name: data.name,
        avatar: data.avatar 
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["games", variables.gameId] });
    },
  });
};

export const useReorderGamePlayers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { gameId: string; playerOrder: Array<string> }) => {
      const response = await api.put(`/games/${data.gameId}/players/reorder`, {
        playerOrder: data.playerOrder,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["games", variables.gameId] });
    },
  });
};

// Game Hooks
export const useGame = (gameId: string) =>
  useQuery({
    queryKey: ["games", gameId],
    queryFn: async (): Promise<Game> => {
      const response = await api.get(`/games/${gameId}`);
      return response.data;
    },
    enabled: !!gameId,
  });

export const useCreateGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      roomId: string; 
      gameMode?: 'classic' | 'extended';
      undercoverCount?: number;
      mrWhiteCount?: number;
    }): Promise<Game> => {
      const response = await api.post(`/games/rooms/${data.roomId}/games`, {
        gameMode: data.gameMode || 'classic',
        undercoverCount: data.undercoverCount,
        mrWhiteCount: data.mrWhiteCount,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rooms", variables.roomId] });
    },
  });
};

export const useStartGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (gameId: string): Promise<void> => {
      await api.post(`/games/${gameId}/start`);
    },
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: ["games", gameId] });
    },
  });
};

export const useConfigureGameRoles = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      gameId: string; 
      undercoverCount: number; 
      mrWhiteCount: number 
    }): Promise<void> => {
      await api.put(`/games/${data.gameId}/roles`, {
        undercoverCount: data.undercoverCount,
        mrWhiteCount: data.mrWhiteCount,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["games", variables.gameId] });
    },
  });
};

// Word Management Hooks
export const useWords = () =>
  useQuery({
    queryKey: ["words"],
    queryFn: async (): Promise<Array<WordPair>> => {
      const response = await api.get("/words");
      return response.data;
    },
  });

export const useCreateWords = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { words: Array<{ civilianWord: string; undercoverWord: string }> }): Promise<void> => {
      const response = await api.post("/words/upload", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["words"] });
    },
  });
};

export const useDeleteWord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (wordId: string): Promise<void> => {
      await api.delete(`/words/${wordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["words"] });
    },
  });
};

export const useRandomWord = () =>
  useQuery({
    queryKey: ["words", "random"],
    queryFn: async (): Promise<WordPair> => {
      const response = await api.get("/words/random");
      return response.data;
    },
    enabled: false, // Only fetch when explicitly called
  });

// Compatibility hooks for existing UI components
export const useRoomPlayers = (groupId: string) => {
  const { data: group } = useGroup(groupId);
  return {
    data: group?.players || [],
    isLoading: !group,
    error: null,
  };
};

export const useRoomGames = (roomId: string) => {
  // Since games are not directly listed by room in the new API,
  // we'll need to implement this differently or modify the UI
  return {
    data: [],
    isLoading: false,
    error: null,
  };
};

export const useAddPlayer = () => {
  // This would need to be handled through group management
  // For now, return a placeholder
  return useMutation({
    mutationFn: async () => {
      throw new Error("Player management moved to group level");
    },
  });
};
