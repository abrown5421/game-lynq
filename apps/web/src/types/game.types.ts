export interface IGame {
  _id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  image?: string;
  config: {
    initialState: any;
    initialPhase?: string;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameDto {
  name: string;
  description: string;
  minPlayers?: number;
  maxPlayers?: number;
  image?: string;
  config?: {
    initialState: any;
    initialPhase?: string;
    [key: string]: any;
  };
  isActive?: boolean;
}

export interface UpdateGameDto {
  name?: string;
  description?: string;
  minPlayers?: number;
  maxPlayers?: number;
  image?: string;
  config?: {
    initialState?: any;
    initialPhase?: string;
    [key: string]: any;
  };
  isActive?: boolean;
}