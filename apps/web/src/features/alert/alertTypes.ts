type AnchorPoints = {
    y: 'top' | 'center' | 'bottom'
    x: 'left' | 'center' | 'right'
}

export interface AlertProps {
    open: boolean;
    closeable: boolean;
    severity: 'success' | 'warning' | 'error' | 'info'
    message: string;
    anchor: AnchorPoints
}