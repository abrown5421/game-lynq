import { ComponentType } from "react";
import { ISession } from "../../types/session.types";
import IpodWarSettings from "../../features/ipodWar/IpodWarSettings";

export const gameSettingsRegistry: Record<
  string,
  ComponentType<{ session: ISession }>
> = {
  "697408ea5d35a3062508ec49": IpodWarSettings,
};
