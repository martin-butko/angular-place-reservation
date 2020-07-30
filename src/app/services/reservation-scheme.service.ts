import { ReservationScheme } from './../model_classes/reservation-scheme';
import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Shape } from '../model_classes/shape';

@Injectable({
  providedIn: 'root'
})
export class ReservationSchemeService {

  private databasePath = '/reservation-schemes';
  reservationSchemesRef: AngularFirestoreCollection<ReservationScheme>;

  constructor(
    private firestore: AngularFirestore
  ) {
    this.reservationSchemesRef = this.firestore.collection<ReservationScheme>(this.databasePath);
  }

  /**
   * Returns actuall Date (now) from database
   * @returns Date
   */
  getDatabaseDateNow(): Date {
    return firebase.firestore.Timestamp.now().toDate();
  }

  /**
   * Returns actuall millis since Unix epoch
   * @returns number
   */
  getDatabaseNowMilis(): number {
    return firebase.firestore.Timestamp.now().toMillis();
  }

  /**
   * Returns Promise about creating ReservationScheme in database
   * @param newReservationScheme - ReservationScheme to save
   * @returns Promise<void>
   */
  createReservationScheme(newReservationScheme: ReservationScheme): Promise<void> {
    const newKey = this.firestore.createId();
    let doc = this.reservationSchemesRef.doc<ReservationScheme>(newKey);
    newReservationScheme.key = newKey;
    return doc.set(Object.assign({}, newReservationScheme));
  }

  /**
   * Returns Observable of all ReservationSchemes from database
   * @returns Observable<ReservationScheme[]>
   */
  getAllReservationSchemes(): Observable<ReservationScheme[]> {
    return this.reservationSchemesRef.valueChanges();
  }

  /**
   * Returns Observable of ReservationScheme by key from database
   * @param resSchemeKey - ReservationScheme key id
   * @returns Observable<ReservationScheme>
   */
  getReservationSchemeByKey(resSchemeKey: string): Observable<ReservationScheme> {
    return this.reservationSchemesRef.doc<ReservationScheme>(resSchemeKey).valueChanges();
  }

  /**
   * Returns Promise about deleting ReservationScheme in database
   * @param resSchemeKey - ReservationScheme key id
   * @returns Promise<void>
   */
  deleteReservationSchemeByKey(resSchemeKey: string): Promise<void> {
    return this.reservationSchemesRef.doc<ReservationScheme>(resSchemeKey).delete();
  }

  /**
   * Returns Promise about updating ReservationScheme in database
   * @param updatedReservationScheme - updated ReservationScheme
   * @returns Promise<void>
   */
  updateReservationScheme(updatedReservationScheme: ReservationScheme): Promise<void> {
    return this.reservationSchemesRef.doc<ReservationScheme>(updatedReservationScheme.key).update(updatedReservationScheme);
  }

  /**
   * Returns Promise about updating fields of ReservationScheme in database
   * @param resSchemeKey - ReservationScheme key id
   * @param fields - object containing fields like array of shapes, etc.
   * @returns Promise<void>
   */
  updateReservationSchemeFields(resSchemeKey: string, fields): Promise<void> {
    return this.reservationSchemesRef.doc(resSchemeKey).update(fields);
  }

  /**
   * Returns Promise about creating new Shape in ReservationScheme
   * @param resSchemeKey - ReservationScheme key id
   * @param newShape - new Shape to add in ReservationScheme
   * @returns Promise<void>
   */
  addNewShapeInReservationScheme(resSchemeKey: string, newShape: Shape): Promise<void> {
    // New key for Shape
    const newKey = this.firestore.createId();
    newShape.key = newKey;
    return this.reservationSchemesRef.doc(resSchemeKey).update(
      {
        shapes: firebase.firestore.FieldValue.arrayUnion(Object.assign({}, newShape))
      }
    );
  }

  /**
   * Returns method updateReservationSchemeFields(resSchemeKey: string, fields): Promise<void>
   * @param reservationScheme - ReservationScheme linked with reservation
   * @param shapeToReserve - Shape which is going to be reserved
   * @param updatedArrayOfShapes - updated array of shapes - will be replaced for old array in ResScheme
   * @param userKey - user key id
   * @param userInfo - info about user linked with reservation
   * @returns Promise<void>
   */
  reserveShapeInReservationScheme(
    reservationScheme: ReservationScheme, shapeToReserve: Shape, updatedArrayOfShapes,
    userKey: string, userInfo: string): Promise<void> {
    // Payment , Email, QR code generation, etc.
    // ..
    // ..


    // Then ↓
    return this.updateReservationSchemeFields(reservationScheme.key, {shapes: updatedArrayOfShapes});
  }

  /**
   * Returns Promise about deleting Shape in ReservationScheme
   * @param resSchemeKey - ReservationScheme key id
   * @param shape - shape to delete
   * @returns Promise<void>
   */
  deleteShapeInReservationScheme(resSchemeKey: string, shape: Shape): Promise<void> {
    return this.reservationSchemesRef.doc(resSchemeKey).update(
      {
        shapes: firebase.firestore.FieldValue.arrayRemove(Object.assign({}, shape))
      }
    );
  }
}
