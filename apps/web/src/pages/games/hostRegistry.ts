import { ComponentType } from "react";
import { ISession } from "../../types/session.types";
import IpodWarHostUI from "../../features/ipodWar/IpodWarHostUI";
import FishbowlHostUI from "../../features/fishbowl/FishbowlHostUI";
import LiarsDiceHostUI from "../../features/liarDice/LiarsDiceHostUI";

export const hostRegistry: Record<
  string,
  ComponentType<{ session: ISession }>
> = {
  "697408ea5d35a3062508ec49": IpodWarHostUI,
  "6977a0bc7e16edd197f28936": FishbowlHostUI,
  "69868d66311eb90d675c6127" : LiarsDiceHostUI
};
