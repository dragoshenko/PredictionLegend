import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterPredictionComponent } from './counter-prediction.component';

describe('CounterPredictionComponent', () => {
  let component: CounterPredictionComponent;
  let fixture: ComponentFixture<CounterPredictionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterPredictionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CounterPredictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
