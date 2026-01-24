import { GameModel } from "../entities/game/game.model";
import { createBaseCRUD } from "../shared/base";

const gameRouter = createBaseCRUD(GameModel);

export default gameRouter;
