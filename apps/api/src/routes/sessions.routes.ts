import { SessionModel } from "../entities/session/session.model";
import { GameModel } from "../entities/game/game.model";
import { createBaseCRUD } from "../shared/base";
import mongoose from "mongoose";

const router = createBaseCRUD(SessionModel);

const generateCode = () =>
  Math.random().toString(36).substring(2, 6).toUpperCase();

router.post("/create", async (req, res) => {
  try {
    const { hostId } = req.body;

    const session = await SessionModel.create({
      hostId,
      code: generateCode(),
    });

    res.status(201).json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/join", async (req, res) => {
  try {
    const { code, name, userId, unId } = req.body;

    const session = await SessionModel.findOne({ code });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const unIdToUse = userId || unId;
    
    let existingPlayer = null;
    if (unIdToUse) {
      existingPlayer = session.players.find(
        (p) => 
          (p.userId && p.userId.toString() === userId) || 
          (p.unId && p.unId === unId)
      );
    }

    if (existingPlayer) {
      existingPlayer.name = name;
      existingPlayer.connected = true;
      await session.save();
      return res.json(session);
    }

    const nameExists = session.players.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (nameExists) {
      return res.status(400).json({ error: "Name already taken in this session" });
    }

    const unIdExists = session.players.find(
      (p) => 
        (p.userId && p.userId.toString() === unIdToUse) || 
        (p.unId && p.unId === unIdToUse)
    );
    if (unIdExists) {
      return res.status(400).json({ error: "User ID already in this session" });
    }

    session.players.push({
      name,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      unId: unId || undefined,
      connected: true,
      joinedAt: new Date(),
    });

    await session.save();
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/leave", async (req, res) => {
  try {
    const { playerName } = req.body;

    const session = await SessionModel.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Not found" });

    session.players = session.players.filter(
      (p) => p.name !== playerName
    );

    await session.save();
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/remove-player", async (req, res) => {
  try {
    const { playerName } = req.body;

    const session = await SessionModel.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Not found" });

    session.players = session.players.filter(
      (p) => p.name !== playerName
    );

    await session.save();
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/update-player-name", async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    const session = await SessionModel.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Not found" });

    const nameExists = session.players.find(
      (p) => p.name.toLowerCase() === newName.toLowerCase() && p.name !== oldName
    );
    if (nameExists) {
      return res.status(400).json({ error: "Name already taken in this session" });
    }

    const player = session.players.find((p) => p.name === oldName);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    player.name = newName;
    await session.save();

    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/select-game", async (req, res) => {
  try {
    const { gameId } = req.body;
    
    const session = await SessionModel.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const game = await GameModel.findById(gameId);
    if (!game || !game.isActive) {
      return res.status(400).json({ error: "Invalid or inactive game" });
    }

    if (session.players.length < game.minPlayers) {
      return res.status(400).json({ 
        error: `Need at least ${game.minPlayers} players for this game` 
      });
    }

    if (session.players.length > game.maxPlayers) {
      return res.status(400).json({ 
        error: `This game supports a maximum of ${game.maxPlayers} players` 
      });
    }

    const playerIds = session.players.map(p => 
      (p.userId?.toString() || p.unId) as string
    );
    
    const initialScores: Record<string, number> = {};
    playerIds.forEach(id => {
      initialScores[id] = 0;
    });

    session.selectedGameId = game._id as mongoose.Types.ObjectId;
    session.gameState = {
      type: game.id,
      data: game.config.initialState || {},
      round: 0,
      scores: initialScores,
      phase: game.config.initialPhase || "waiting",
    };

    await session.save();
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/start", async (req, res) => {
  try {
    const session = await SessionModel.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Not found" });

    if (!session.selectedGameId) {
      return res.status(400).json({ error: "No game selected" });
    }

    session.status = "playing";
    await session.save();

    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/game-action", async (req, res) => {
  try {
    const { action, payload } = req.body;
    const session = await SessionModel.findById(req.params.id);
    
    if (!session || !session.selectedGameId || !session.gameState) {
      return res.status(404).json({ error: "Game not found or not started" });
    }
    
    switch (action) {
      case "updatePhase":
        session.gameState.phase = payload.phase;
        break;
      
      case "updateScore":
        if (!session.gameState.scores) {
          session.gameState.scores = {};
        }
        session.gameState.scores[payload.playerId] = payload.score;
        break;
      
      case "incrementRound":
        session.gameState.round = (session.gameState.round || 0) + 1;
        break;
      
      case "updateData":
        session.gameState.data = {
          ...session.gameState.data,
          ...payload.data,
        };
        break;
      
      default:
        return res.status(400).json({ error: "Unknown action" });
    }

    await session.save();
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/end-game", async (req, res) => {
  try {
    const session = await SessionModel.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Not found" });

    session.status = "ended";
    await session.save();

    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;