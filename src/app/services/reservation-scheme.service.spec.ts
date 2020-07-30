import { TestBed } from '@angular/core/testing';

import { ReservationSchemeService } from './reservation-scheme.service';

describe('ReservationSchemeService', () => {
  let service: ReservationSchemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReservationSchemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
