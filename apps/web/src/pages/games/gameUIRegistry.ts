import { ComponentType } from "react";
import { ISession } from "../../types/session.types";
import IpodWarGameUI from "../../features/ipodWar/IpodWarGameUI";

export const gameUIRegistry: Record<
  string,
  ComponentType<{ session: ISession }>
> = {
  "697408ea5d35a3062508ec49": IpodWarGameUI,
};
