import { Shape } from './shape';
export class ReservationScheme {
    key: string;
    name: string;
    mapKey: string;
    createdBy: string;
    // optional attributes
    shapes?: Shape[];
    info?: string;
    reservationsStart?: string;
    reservationsEnd?: string;

    constructor(name?: string, createdBy?: string) {
        this.key = null;
        if (name) {
            this.name = name;
        } else {
            this.name = '';
        }
        this.mapKey = null;
        this.createdBy = createdBy;
        this.shapes = [];
        this.info = '';
    }
}
