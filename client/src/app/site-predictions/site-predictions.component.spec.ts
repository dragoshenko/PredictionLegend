import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitePredictionsComponent } from './site-predictions.component';

describe('SitePredictionsComponent', () => {
  let component: SitePredictionsComponent;
  let fixture: ComponentFixture<SitePredictionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitePredictionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SitePredictionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
