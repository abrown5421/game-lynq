import { ComponentType } from "react";
import { ISession } from "../../types/session.types";
import IpodWarHostUI from "../../features/ipodWar/IpodWarHostUI";

export const hostRegistry: Record<
  string,
  ComponentType<{ session: ISession }>
> = {
  "697408ea5d35a3062508ec49": IpodWarHostUI,
};
