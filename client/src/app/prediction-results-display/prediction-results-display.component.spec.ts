import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionResultsDisplayComponent } from './prediction-results-display.component';

describe('PredictionResultsDisplayComponent', () => {
  let component: PredictionResultsDisplayComponent;
  let fixture: ComponentFixture<PredictionResultsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionResultsDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionResultsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
