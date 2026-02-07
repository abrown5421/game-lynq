import { ComponentType } from "react";
import { ISession } from "../../types/session.types";
import IpodWarPlayerUI from "../../features/ipodWar/IpodWarPlayerUI";
import FishbowlPlayerUI from "../../features/fishbowl/FishbowlPlayerUI";
import LiarsDicePlayerUI from "../../features/liarDice/LiarsDicePlayerUI";

export const playerRegistry: Record<
  string,
  ComponentType<{ session: ISession }>
> = {
  "697408ea5d35a3062508ec49": IpodWarPlayerUI,
  "6977a0bc7e16edd197f28936": FishbowlPlayerUI,
  "69868d66311eb90d675c6127" : LiarsDicePlayerUI
};
