export class Shape {
    key: string;
    x: number;
    y: number;
    width: number;
    height: number;
    transform: string;
    // optional attributes
    info?: string;
    available?: boolean;
    onHoldBy?: string;
    onHoldTill?: string;
    reservedBy?: string;
    reservationInfo?: string;
    price?: number;

    constructor(x: number, y: number, width: number, height: number, transform: string) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.transform = transform;

        this.info = '';
        this.available = true;
        this.onHoldBy = null;
        this.onHoldTill = null;
        this.reservedBy = null;
        this.reservationInfo = null;
        this.price = null;
    }

}
