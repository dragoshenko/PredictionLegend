import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPredictionsComponent } from './my-predictions.component';

describe('MyPredictionsComponent', () => {
  let component: MyPredictionsComponent;
  let fixture: ComponentFixture<MyPredictionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPredictionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyPredictionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
