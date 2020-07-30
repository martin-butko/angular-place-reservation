import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { MapImage } from '../model_classes/map-image';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  private databasePath = '/maps';
  mapImageDataRef = this.firestore.collection<MapImage>(this.databasePath);

  uploadTask: AngularFireUploadTask;
  snapshot: Observable<any>;

  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) {
  }

  /**
   * Returns Promise about upload task,
   * on success upload need to set mapImage.url, mapImage.name, mapImage.storagePath
   * @param file - File from <input>
   * @param mapImage - instance of MapImage
   * @returns Promise<any> from upload task
   */
  uploadMapImage(file: File, mapImage: MapImage): Promise<any> {
    const storagePath = `maps/${Date.now()}_${file.name}`;
    const storageRef = this.storage.ref(storagePath);

    // upload task
    this.uploadTask = this.storage.upload(storagePath, file);

    return this.uploadTask.then(
      async (success) => {
        mapImage.url = await storageRef.getDownloadURL().toPromise();
        mapImage.name = file.name;
        mapImage.storagePath = storagePath;
      }
    );
  }

  /**
   * Returns Promise about mapImage save in database,
   * @param mapImage - instance of MapImage
   * @returns Promise<any> from mapImage saved in database
   */
  saveMapImageData(mapImage: MapImage): Promise<void> {
    let newKey = this.firestore.createId();
    let doc = this.mapImageDataRef.doc<MapImage>(newKey);
    mapImage.key = newKey;
    return doc.set(Object.assign({}, mapImage));
  }

  /**
   * Returns Observable of mapImage from database,
   * @param mapImageKey - id key of mapImage
   * @returns Observable<MapImage>
   */
  getMapImageByKey(mapImagekey: string): Observable<MapImage> {
    return this.mapImageDataRef.doc<MapImage>(mapImagekey).valueChanges();
  }
}
