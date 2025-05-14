import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionDetailComponent } from './prediction-detail.component';

describe('PredictionDetailComponent', () => {
  let component: PredictionDetailComponent;
  let fixture: ComponentFixture<PredictionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
