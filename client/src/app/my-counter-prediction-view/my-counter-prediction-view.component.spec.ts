import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCounterPredictionViewComponent } from './my-counter-prediction-view.component';

describe('MyCounterPredictionViewComponent', () => {
  let component: MyCounterPredictionViewComponent;
  let fixture: ComponentFixture<MyCounterPredictionViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCounterPredictionViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyCounterPredictionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
