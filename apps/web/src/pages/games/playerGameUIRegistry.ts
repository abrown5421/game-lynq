import { ComponentType } from "react";
import { ISession } from "../../types/session.types";
import IpodWarPlayerGameUI from "../../features/ipodWar/IpodWarPlayerGameUI";

export const gameUIRegistry: Record<
  string,
  ComponentType<{ session: ISession }>
> = {
  "697408ea5d35a3062508ec49": IpodWarPlayerGameUI,
};
