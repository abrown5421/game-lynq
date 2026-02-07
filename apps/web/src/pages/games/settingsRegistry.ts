import { ComponentType } from "react";
import { ISession } from "../../types/session.types";
import IpodWarSettings from "../../features/ipodWar/IpodWarSettings";
import FishbowlHostUI from "../../features/fishbowl/FishbowlHostUI";
import FishbowlSettings from "../../features/fishbowl/FishbowlSettings";
import LiarsDiceSettings from "../../features/liarDice/LiarsDiceSettings";

export const settingsRegistry: Record<
  string,
  ComponentType<{ session: ISession }>
> = {
  "697408ea5d35a3062508ec49": IpodWarSettings,
  "6977a0bc7e16edd197f28936": FishbowlSettings,
  "69868d66311eb90d675c6127" : LiarsDiceSettings
};
