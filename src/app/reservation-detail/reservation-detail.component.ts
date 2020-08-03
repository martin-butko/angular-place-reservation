import { ReservationScheme } from './../model_classes/reservation-scheme';
import { MapImage } from './../model_classes/map-image';
import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { ReservationSchemeService } from '../services/reservation-scheme.service';
import { FileService } from '../services/file.service';

// SVG
import { SVG, find, Rect, Matrix } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.draggable.js';
import { Shape } from '../model_classes/shape';

@Component({
  selector: 'app-reservation-detail',
  templateUrl: './reservation-detail.component.html',
  styleUrls: ['./reservation-detail.component.scss']
})
export class ReservationDetailComponent implements OnInit {
  // USER
  @Input() isAdmin: boolean = true;
  @Input() userKey: string = 'user1';
  @Input() userInfo: string = '';

  // RESERVATION SCHEME
  @Input() reservationSchemeKey: string;
  reservationScheme: ReservationScheme;
  displayDialogSetNotAvailable: boolean = false;
  setNotAvailableInfo: string = '';

  isEditingShape: boolean = false;
  editedShape: Shape = null;
  isEditingScheme: boolean = false;
  editedScheme: ReservationScheme = null;
  rangeDates: Date[];

  // MAP IMAGE
  mapImage: MapImage;
  file: File = null;
  isChangeMapImage: boolean = false;

  // SVG
  @Input() canvasWidth: number = 500;
  @Input() canvasHeight: number = 500;
  @Input() minShapeSize: number = 20;
  @Input() maxShapeSize: number = 150;
  draw: any;
  newShape: any;
  newShapeWidth: number = 50;
  newShapeHeight: number = 50;
  newShapeRotation: number = 5;
  newShapeIsSquare: boolean = true;
  newShapeInfo: string = '';
  newShapePrice: number = 1;
  selectedShape: Shape;

  colorSelected = '#f6ff00'; // yellow
  colorOnHold = '#ffb217'; // orange
  colorAvailable = '#00ff44'; // green
  colorNotAvailable = '#ff4336'; // red

  holdMins: any;
  holdSecs: any;
  interval: any;

  @Input() minutesToHold: number = 10;

  @Output() onGoBack = new EventEmitter();

  constructor(
    private reservationSchemeService: ReservationSchemeService,
    private fileService: FileService
  ) { }

  ngOnInit(): void {
    this.getReservationSchemeByKey(this.reservationSchemeKey);

    // SVG init
    this.initSVG();
  }

  @HostListener('window:beforeunload', [ '$event' ])
  beforeUnloadHandler(event) {
    // event.returnValue = 'Your data will be lost!';
    this.unselectShape();
  }

  startTimer(endDate: Date) {
    let endDateTime = endDate.getTime();
    this.interval = setInterval(() => {
      let now = new Date().getTime();
      let timeLeft = endDateTime - now;
      this.holdMins = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      if (this.holdMins < 10) { this.holdMins = "0" + this.holdMins };
      this.holdSecs = Math.floor((timeLeft % (1000 * 60)) / 1000);
      if (this.holdSecs < 10) { this.holdSecs = "0" + this.holdSecs };

      if (timeLeft < 0) {
        this.unselectShape();
      }

    }, 1000);
  }

  clearTimer() {
    clearInterval(this.interval);
    this.holdMins = null;
    this.holdSecs = null;
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDateFromString(dateString: string): Date {
    return new Date(dateString);
  }

  getReservationSchemeByKey(key: string) {
    this.reservationSchemeService.getReservationSchemeByKey(key).subscribe(
      async (reservationScheme) => {
        this.reservationScheme = reservationScheme;

        // Try to get MapImage
        if (this.reservationScheme) {
          if (this.reservationScheme.mapKey) {
            const mapKeyVal: string = this.reservationScheme.mapKey;
            this.getMapImageByKey(mapKeyVal);
          }
        }

        // Change events
        this.checkShapes();

        // Refresh selected shape due to changes
        if (this.selectedShape) {
          let selectedShapeKey = this.selectedShape.key;
          this.selectedShape = this.getShapeFromArray(selectedShapeKey);
          // If shape doesn't exist anymore, clear timer too
          if (this.selectedShape == null) {
            this.clearTimer();
          }
        }

        // Unselect without update, if shape is not holding by me - ↑ refresh must be done first
        if (this.selectedShape) {
          if (!this.selectedShape.onHoldBy || (this.selectedShape.onHoldBy != this.userKey)) {
            this.selectedShape = null; // If not holding by me OR null
          } else if (this.selectedShape.onHoldTill && this.selectedShape.onHoldBy) {
            let dateNow: Date = this.reservationSchemeService.getDatabaseDateNow();
            let onHoldDate: Date = new Date(this.selectedShape.onHoldTill);
            if (onHoldDate < dateNow || this.selectedShape.onHoldBy != this.userKey) {
              this.selectedShape = null; // If onHolds are not NULL and iam not holding
            }
          }
        }
      }
    );
  }

  checkShapes() {
    if (this.reservationScheme) {
      if (this.reservationScheme.shapes) {
        let dateNow: Date = this.reservationSchemeService.getDatabaseDateNow();
        this.reservationScheme.shapes.forEach((shapeToControll) => {
          if (shapeToControll.onHoldTill && shapeToControll.available) {
            let onHoldDate: Date = new Date(shapeToControll.onHoldTill);
            if (onHoldDate < dateNow) {

              let updatedShapes: Shape[] = JSON.parse(JSON.stringify(this.reservationScheme.shapes));
              let resShape: Shape = null;
              for (let shape of updatedShapes) {
                if (shape.key == shapeToControll.key) {
                  resShape = shape;
                  break;
                }
              }

              resShape.onHoldTill = null;
              resShape.onHoldBy = null;

              this.reservationSchemeService.updateReservationSchemeFields(this.reservationScheme.key, { shapes: updatedShapes }).then(
                (successUpdatedScheme) => {
                }
              );
            }
          }
        });
      }
    }
  }

  // MAP IMAGE - Functions
  getMapImageByKey(key: string) {
    this.fileService.getMapImageByKey(key).subscribe(
      (mapImage) => {
        this.mapImage = mapImage;
      }
    );
  }

  selectFile(event: any) {
    this.file = event.target.files.item(0);
  }

  uploadMapImage() {
    if (this.file) {
      // ↓ This one will flow trough service and attach data on
      this.mapImage = new MapImage();
      this.fileService.uploadMapImage(this.file, this.mapImage).then(
        (successStoragedImage) => {
          this.fileService.saveMapImageData(this.mapImage).then(
            (successUploadedImage) => {
              // Image stored and data too
              const mapKeyVal = this.mapImage.key;
              const resSchemeKeyVal = this.reservationScheme.key;
              // update ResScheme - write MapKey inside Res.Scheme
              this.reservationSchemeService.updateReservationSchemeFields(resSchemeKeyVal, { mapKey: mapKeyVal }).then(
                (successUpdatedScheme) => {
                  // mapKey will be automatically updated in res.Scheme due to Subscribe.
                  //
                  this.isChangeMapImage = false;
                }
              );
            }
          );
        }
      );
    }
  }

  changeMapImage() {
    this.isChangeMapImage = true;
  }

  cancelChangeMapImage() {
    this.isChangeMapImage = false;
  }

  // SVG
  initSVG() {
    this.draw = SVG('#canvas');
  }

  addNewShapeOnCanvas() {
    const width = this.newShapeWidth;
    const height = this.newShapeHeight;
    this.newShape = this.draw.rect(width, height).attr('x', 10).attr('y', 10).id('newShape').draggable();
    this.newShape.fill('#d9eafa');
    this.newShape.stroke({ color: '#000', width: 1, dasharray: '5,5' });
    this.newShape.css('cursor', 'move');
  }

  resizeNewShape(width: number, height: number) {
    if (!isNaN(width) && !isNaN(height)) {
      this.newShapeWidth = width;
      this.newShapeHeight = height;
    }

    if (this.newShapeWidth < this.minShapeSize) {
      this.newShapeWidth = this.minShapeSize;
    }
    if (this.newShapeHeight < this.minShapeSize) {
      this.newShapeHeight = this.minShapeSize;
    }
    if (this.newShapeWidth > this.maxShapeSize) {
      this.newShapeWidth = this.maxShapeSize;
    }
    if (this.newShapeHeight > this.maxShapeSize) {
      this.newShapeHeight = this.maxShapeSize;
    }

    this.newShape.size(this.newShapeWidth, this.newShapeHeight);
  }

  rotateNewShape() {
    if (isNaN(this.newShapeRotation)) {
      this.newShapeRotation = 0;
    }

    this.newShape.rotate(this.newShapeRotation);
  }

  rotateNewShapeBack() {
    if (isNaN(this.newShapeRotation)) {
      this.newShapeRotation = 0;
    }
    this.newShape.rotate(- this.newShapeRotation);
  }

  getTransformOfShape(shape: Shape): string {
    return shape.transform;
  }

  saveNewShape() {
    // Save newShape in database
    // Create newShapeData
    const x = this.newShape.attr('x');
    const y = this.newShape.attr('y');
    const width = this.newShape.attr('width');
    const height = this.newShape.attr('height');
    const transformMatrix = new Matrix(this.newShape);
    const transform = transformMatrix.toString();
    let newShapeData: Shape = new Shape(x, y, width, height, transform);

    // Set additional attributes
    newShapeData.info = this.newShapeInfo;
    newShapeData.available = true;
    newShapeData.price = this.newShapePrice;

    // Save newStandData in database (update res.Scheme)
    this.reservationSchemeService.addNewShapeInReservationScheme(this.reservationScheme.key, newShapeData).then(
      (successAddedShape) => {
      });

    // Re-set newShape pointer
    this.resetNewShape();
  }

  resetNewShape() {
    this.newShape.remove();
    this.newShape = null;
    // this.newShapeSize = 50;
    // this.newShapeRotation = 5;
  }

  getShapeFromArray(key: string): Shape {
    let resShape: Shape = null;
    for (let shape of this.reservationScheme.shapes) {
      if (shape.key == key) {
        resShape = shape;
        break;
      }
    }
    return resShape;
  }

  canSelect(shapeToSelect: Shape): boolean {
    if (!shapeToSelect.available) {
      // Not Available
      if (this.isAdmin) {
        return true;
      } else {
        return false;
      }
    } else if (shapeToSelect.onHoldBy) {
      // On Hold
      if (shapeToSelect.onHoldBy == this.userKey) {
        return true;
      } else {
        return false;
      }
    } else {
      // Available
      return true;
    }
  }

  async selectShape(shapeToSelect: Shape) {
    // Avoid reselecting same shape
    if (this.selectedShape && (this.selectedShape.key == shapeToSelect.key)) {
      return;
    }

    // Check if user can select shape
    if (!this.canSelect(shapeToSelect)) {
      return;
    }

    // Unselect previous shape
    if (this.selectedShape != null) {
      await this.unselectShape();
    }

    let updatedShapes: Shape[] = JSON.parse(JSON.stringify(this.reservationScheme.shapes));
    let resShape: Shape = null;
    for (let shape of updatedShapes) {
      if (shape.key == shapeToSelect.key) {
        resShape = shape;
        break;
      }
    }

    // Collision managing, holding stand for 10 minutes
    let milisNow = this.reservationSchemeService.getDatabaseNowMilis();
    let dateNowPlusHold = new Date(milisNow + this.minutesToHold * 60000);
    resShape.onHoldTill = dateNowPlusHold.toString();

    resShape.onHoldBy = this.userKey;

    this.reservationSchemeService.updateReservationSchemeFields(this.reservationScheme.key, { shapes: updatedShapes }).then(
      (successUpdatedScheme) => {
        this.selectedShape = this.getShapeFromArray(resShape.key);
        if (resShape.available) {
          this.startTimer(new Date(resShape.onHoldTill));
        }
      }
    );
  }

  async unselectShape() {
    if (!this.selectedShape) {
      return;
    }

    if (this.isEditingShape) {
      this.cancelEditedShape();
    }

    // Clear hold timer
    this.clearTimer();

    // In case shape is not holded anymore
    if (this.selectedShape.onHoldBy != this.userKey) {
      this.selectedShape = null;
      return;
    }

    let updatedShapes: Shape[] = JSON.parse(JSON.stringify(this.reservationScheme.shapes));
    let resShape: Shape = null;
    for (let shape of updatedShapes) {
      if (shape.key == this.selectedShape.key) {
        resShape = shape;
        break;
      }
    }

    resShape.onHoldTill = null;
    resShape.onHoldBy = null;

    await this.reservationSchemeService.updateReservationSchemeFields(this.reservationScheme.key, { shapes: updatedShapes }).then(
      (successUpdatedScheme) => {
        this.selectedShape = null;
      }
    );
  }

  setAvailableOfSelected() {
    if (!this.selectedShape) {
      return;
    }
    if (this.selectedShape.available || !this.isAdmin) {
      return;
    }

    let updatedShapes: Shape[] = JSON.parse(JSON.stringify(this.reservationScheme.shapes));
    let resShape: Shape = null;
    for (let shape of updatedShapes) {
      if (shape.key == this.selectedShape.key) {
        resShape = shape;
        break;
      }
    }

    resShape.reservationInfo = null;
    resShape.reservedBy = null;
    resShape.available = true;

    this.reservationSchemeService.updateReservationSchemeFields(this.reservationScheme.key, { shapes: updatedShapes }).then(
      (successUpdatedScheme) => {
        this.selectedShape = this.getShapeFromArray(resShape.key);
      }
    );
  }

  showDialogSetNotAvailable() {
    this.displayDialogSetNotAvailable = true;
  }

  setNotAvailableOfSelected(reservationInfo: string) {
    if (!this.selectedShape) {
      return;
    }
    if (!this.selectedShape.available || !this.isAdmin) {
      return;
    }

    let updatedShapes: Shape[] = JSON.parse(JSON.stringify(this.reservationScheme.shapes));
    let resShape: Shape = null;
    for (let shape of updatedShapes) {
      if (shape.key == this.selectedShape.key) {
        resShape = shape;
        break;
      }
    }

    resShape.reservationInfo = reservationInfo;
    resShape.reservedBy = this.userKey;
    resShape.available = false;

    this.reservationSchemeService.updateReservationSchemeFields(this.reservationScheme.key, { shapes: updatedShapes }).then(
      (successUpdatedScheme) => {
        this.displayDialogSetNotAvailable = false;
        this.setNotAvailableInfo = '';
        this.selectedShape = this.getShapeFromArray(resShape.key);
      }
    );
  }

  reserveSelectedShape() {
    if (!this.selectedShape) {
      return;
    }
    if (!this.selectedShape.available || (this.selectedShape.onHoldBy != this.userKey)) {
      return;
    }

    let updatedShapes: Shape[] = JSON.parse(JSON.stringify(this.reservationScheme.shapes));
    let resShape: Shape = null;
    for (let shape of updatedShapes) {
      if (shape.key == this.selectedShape.key) {
        resShape = shape;
        break;
      }
    }

    resShape.reservationInfo = this.userInfo;
    resShape.reservedBy = this.userKey;
    resShape.available = false;

    // reservationScheme, shapeToReserve, updatedArrayOfShapes, userKey, userInfo
    this.reservationSchemeService.reserveShapeInReservationScheme(
      this.reservationScheme, resShape, updatedShapes, this.userKey, this.userInfo).then(
        (successUpdatedScheme) => {
          // this.selectedShape = null;
          this.unselectShape();
        }
      );
  }

  editReservationScheme() {
    if (!this.isAdmin) {
      return;
    }

    this.editedScheme = JSON.parse(JSON.stringify(this.reservationScheme));
    if (this.editedScheme.reservationsStart) {
      this.rangeDates = [];
      let dateStart: Date = new Date(this.editedScheme.reservationsStart);
      this.rangeDates.push(dateStart);
    }
    if (this.editedScheme.reservationsEnd) {
      let dateEnd: Date = new Date(this.editedScheme.reservationsEnd);
      this.rangeDates.push(dateEnd);
    }

    this.isEditingScheme = true;
  }

  saveEditedReservationScheme() {
    if (!this.isAdmin || !this.editedScheme) {
      return;
    }

    if (this.rangeDates) {
      if (this.rangeDates[0]) {
        this.editedScheme.reservationsStart = this.rangeDates[0].toString();
      } else {
        this.editedScheme.reservationsStart = null;
      }
      if (this.rangeDates[1]) {
        this.editedScheme.reservationsEnd = this.rangeDates[1].toString();
      } else {
        this.editedScheme.reservationsEnd = null;
      }
    } else {
      this.editedScheme.reservationsStart = null;
      this.editedScheme.reservationsEnd = null;
    }

    this.reservationSchemeService.updateReservationScheme(this.editedScheme).then(
      (successUpdatedScheme) => {
        this.cancelEditedReservationScheme();
      }
    );
  }

  cancelEditedReservationScheme() {
    this.isEditingScheme = false;
    this.editedScheme = null;
    this.rangeDates = null;
  }

  editSelectedShape() {
    if (!this.isAdmin) {
      return;
    }

    this.editedShape = JSON.parse(JSON.stringify(this.selectedShape));
    this.isEditingShape = true;
  }

  saveEditedShape() {
    if (!this.isAdmin) {
      return;
    }

    if (!this.selectedShape && !this.editedShape) {
      return;
    }

    let updatedShapes: Shape[] = JSON.parse(JSON.stringify(this.reservationScheme.shapes));
    let resShape: Shape = null;
    for (let shape of updatedShapes) {
      if (shape.key == this.editedShape.key) {
        resShape = shape;
        break;
      }
    }

    resShape.info = this.editedShape.info;
    resShape.price = this.editedShape.price;
    resShape.reservationInfo = this.editedShape.reservationInfo;

    this.reservationSchemeService.updateReservationSchemeFields(this.reservationScheme.key, { shapes: updatedShapes }).then(
      (successUpdatedScheme) => {
        this.isEditingShape = false;
        this.editedShape = null;
        this.selectedShape = this.getShapeFromArray(resShape.key);
      }
    );

  }

  cancelEditedShape() {
    this.isEditingShape = false;
    this.editedShape = null;
  }

  deleteSelectedShape() {
    this.reservationSchemeService.deleteShapeInReservationScheme(this.reservationScheme.key, this.selectedShape).then(
      (successDeletedShape) => {
        // unselect deleted shape
        this.unselectShape();
      }
    );
  }

  deleteShape(shape: Shape) {
    this.reservationSchemeService.deleteShapeInReservationScheme(this.reservationScheme.key, shape).then(
      (successDeletedShape) => {
      }
    );
  }

  isShapeSelected(shape: Shape): boolean {
    if (shape === this.selectedShape) {
      return true;
    } else {
      return false;
    }
  }

  isShapeOnHold(shape: Shape): boolean {
    if (!shape.onHoldTill || !shape.onHoldBy) {
      return false;
    }

    let dateNow: Date = this.reservationSchemeService.getDatabaseDateNow();
    let onHoldDate: Date = new Date(shape.onHoldTill);

    if ((onHoldDate > dateNow) && (shape.onHoldBy != this.userKey)) {
      return true;
    } else {
      return false;
    }
  }

  getFillOfShape(shape: Shape): string {
    if (this.isShapeSelected(shape)) {
      return this.colorSelected; // yellow
    } else if (this.isShapeOnHold(shape) && shape.available) {
      return this.colorOnHold; // orange
    } else if (shape.available) {
      return this.colorAvailable; // green
    } else {
      return this.colorNotAvailable; // red
    }
  }

  getCursorOfShape(shape: Shape): string {
    if (this.canSelect(shape)) {
      return 'pointer';
    } else {
      return 'not-allowed';
    }
  }

  goBack(): void {
    // Unselect shape first
    this.unselectShape();

    this.reservationScheme = null;
    this.onGoBack.emit();
  }

}
