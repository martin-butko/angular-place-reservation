# Angular Place Dynamic Reservation System
- *This application was created as a result of a diploma thesis.*

- Author: Martin Butko

- Open source
***
The reservation system is intended for creating reservation schemes for various types of events, such as workshops, cinemas, presentations, etc.
You can create events and set image (representing event map scheme) as background of SVG canvas.
In event, you can add places on canvas. Places can be:
  - Drag&Dropped within the canvas
  - Resized
  - Rotated
 
You can also integrate reservation components into your own project.
# Dependencies
`package.json`
```sh
"@angular/fire": "^5.4.2",
"@fortawesome/fontawesome-free": "^5.14.0",
"@svgdotjs/svg.draggable.js": "^3.0.2",
"@svgdotjs/svg.js": "^3.0.16",
"bootstrap": "^4.4.1",
"chart.js": "^2.9.3",
"firebase": "^7.8.1",
"primeicons": "^2.0.0",
"primeng": "^9.0.1",
```
Dependencies are required to run project and can be installed by command: `npm install` inside cloned directory.
# Backend
#### (Default) Firebase
1) You need to create Firebase project (it's free) on: https://console.firebase.google.com/
2) In Firebase console: go to Project settings > General
3) In Your apps: select your app and click Firebase SDK snippet > Config
4) Copy data from firebaseConfig
5) Paste it to `enviroment.ts` file inside Angular project

`enviroment.ts`
```sh
export const environment = {
  production: false,
  firebase: {
    // insert your Firebase config data here
  }
};
```
#### Custom backend
You need to edit methods in services: `file.service.ts` and `reservation-scheme.service.ts`
All methods are commented and you can adjust them for your backend.

# Component's inputs and outputs
###### `<app-reservations></app-reservations>`
#### Inputs
| Name | Type | Description | Default |
| ------ | ------ | ------ | ------ |
| isAdmin | boolean | Indicate if user is admin | `false` |
| userKey | string | Key ID of user | `''` |
| userInfo | string | Informations about user | `''` |


###### `<app-reservation-detail></app-reservation-detail>`
#### Inputs
| Name | Type | Description | Default |
| ------ | ------ | ------ | ------ |
| isAdmin | boolean | Indicate if user is admin | `false` |
| userKey | string | Key ID of user | `''` |
| userInfo | string | Informations about user | `''` |
| reservationSchemeKey | string | Key ID of ReservationScheme to show | `null` |
| canvasWidth | number | Width of canvas (px) | `500` |
| canvasHeight | number | Height of canvas (px) | `500` |
| minShapeSize | number | Min. size of place (px) | `20` |
| maxShapeSize | number | Max. size of place (px) | `150` |
| minutesToHold | number | Minutes to hold place selected by user | `10` |
#### Outputs
| Name | Type | Description | Default |
| ------ | ------ | ------ | ------ |
| onGoBack | EventEmitter | Fire event after clicking '*Späť na zoznam*' button | `onGoBack()` from *reservations* component|
