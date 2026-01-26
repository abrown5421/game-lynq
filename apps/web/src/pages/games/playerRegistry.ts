import { ComponentType } from "react";
import { ISession } from "../../types/session.types";
import IpodWarPlayerUI from "../../features/ipodWar/IpodWarPlayerUI";

export const playerRegistry: Record<
  string,
  ComponentType<{ session: ISession }>
> = {
  "697408ea5d35a3062508ec49": IpodWarPlayerUI,
};
