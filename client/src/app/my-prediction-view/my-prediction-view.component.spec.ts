import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPredictionViewComponent } from './my-prediction-view.component';

describe('MyPredictionViewComponent', () => {
  let component: MyPredictionViewComponent;
  let fixture: ComponentFixture<MyPredictionViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPredictionViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyPredictionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
