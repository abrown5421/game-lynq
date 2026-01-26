import { ComponentType } from "react";
import { ISession } from "../../types/session.types";
import IpodWarHostUI from "../../features/ipodWar/IpodWarHostUI";
import FishbowlHostUI from "../../features/fishbowl/FishbowlHostUI";

export const hostRegistry: Record<
  string,
  ComponentType<{ session: ISession }>
> = {
  "697408ea5d35a3062508ec49": IpodWarHostUI,
  "6977a0bc7e16edd197f28936": FishbowlHostUI,
};
