export type AnchorPoint = 'top' | 'bottom' | 'left' | 'right'

export interface DrawerProps {
  open: boolean;
  drawerContent: string;
  anchor: AnchorPoint;
  title?: string
}
