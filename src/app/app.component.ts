import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'reservation-app';

  isAdmin: boolean = true;
  userKey: string = 'user1';
  userInfo: string = 'John Doe';
}
