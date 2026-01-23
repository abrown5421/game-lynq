import { Router } from "express";
import { SessionModel } from "../entities/session/session.model";
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

router.post("/:id/start", async (req, res) => {
  try {
    const session = await SessionModel.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Not found" });

    session.status = "playing";
    await session.save();

    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;