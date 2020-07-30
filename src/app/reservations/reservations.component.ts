import { ReservationScheme } from './../model_classes/reservation-scheme';
import { Component, OnInit, Input } from '@angular/core';
import { ReservationSchemeService } from '../services/reservation-scheme.service';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent implements OnInit {

  @Input() isAdmin: boolean = false;
  @Input() userKey: string = '';
  @Input() userInfo: string = '';

  reservationSchemes: ReservationScheme[] = [];
  selectedDetailKey: string = null;
  displayDialogAdd: boolean = false;

  displayDialogGraph: boolean = false;
  graphName: string = '';
  graphData: any = null;

  newReservationScheme: ReservationScheme = new ReservationScheme();
  rangeDates: Date[];

  constructor(private reservationSchemeService: ReservationSchemeService) { }

  ngOnInit(): void {
    this.getAllReservationSchemes();
  }

  getAllReservationSchemes() {
    this.reservationSchemeService.getAllReservationSchemes().subscribe(
      (reservationSchemes) => {
        this.reservationSchemes = reservationSchemes;
      }
    );
  }

  showReservationSchemeDetail(reservationScheme: ReservationScheme) {
    this.selectedDetailKey = reservationScheme.key;
  }

  getNumberOfAllShapes(scheme: ReservationScheme) {
    return scheme.shapes.length;
  }

  getNumberOfNotAvailableShapes(scheme: ReservationScheme) {
    if (!scheme.shapes) {
      return 0;
    }
    let res: number = 0;
    scheme.shapes.forEach((shape) => {
      if (!shape.available) {
        res++;
      }
    });
    return res;
  }

  showDialogAdd() {
    this.displayDialogAdd = true;
  }

  onDialogAddHide(event: any) {
    // reset newReservationScheme
    this.newReservationScheme = new ReservationScheme();
    this.rangeDates = null;
  }

  showDialogGraph(scheme: ReservationScheme) {
    this.graphName = scheme.name;
    let notAvailable = this.getNumberOfNotAvailableShapes(scheme);
    let available = this.getNumberOfAllShapes(scheme) - notAvailable;
    this.graphData = {
      labels: ['Dostupné miesta', 'Obsadené miesta'],
      datasets: [
        {
          data: [available, notAvailable],
          backgroundColor: [
            '#00ff44', // Green
            '#ff4336' // Red
          ],
          hoverBackgroundColor: [
            '#00ff44', // Green
            '#ff4336' // Red
          ]
        }
      ]
    };

    this.displayDialogGraph = true;
  }

  addNewReservationScheme() {
    if (!this.isAdmin) {
      return;
    }
    this.newReservationScheme.createdBy = this.userKey;
    if (this.rangeDates) {
      if (this.rangeDates[0]) {
        this.newReservationScheme.reservationsStart = this.rangeDates[0].toString();
      }
      if (this.rangeDates[1]) {
        this.newReservationScheme.reservationsEnd = this.rangeDates[1].toString();
      }
    }
    this.reservationSchemeService.createReservationScheme(this.newReservationScheme).then(
      (success) => {
        this.displayDialogAdd = false;
      });
  }

  deleteReservationSchemeByKey(key: string) {
    this.reservationSchemeService.deleteReservationSchemeByKey(key);
  }

  isReservationSchemeAvailable(scheme: ReservationScheme): boolean {
    let dateNow: Date = new Date();
    let schemeStartDate: Date;
    let schemeEndDate: Date;

    if (scheme.reservationsStart && scheme.reservationsEnd) {
      schemeStartDate = new Date(scheme.reservationsStart);
      schemeEndDate = new Date(scheme.reservationsEnd);
      if (dateNow > schemeStartDate && dateNow < schemeEndDate) {
        return true;
      } else {
        return false;
      }
    } else if (scheme.reservationsStart) {
      schemeStartDate = new Date(scheme.reservationsStart);
      if (dateNow > schemeStartDate) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  onGoBack() {
    this.selectedDetailKey = null;
  }

}
