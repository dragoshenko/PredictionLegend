import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomPredictionComponent } from './custom-prediction.component';

describe('CustomPredictionComponent', () => {
  let component: CustomPredictionComponent;
  let fixture: ComponentFixture<CustomPredictionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomPredictionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomPredictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
