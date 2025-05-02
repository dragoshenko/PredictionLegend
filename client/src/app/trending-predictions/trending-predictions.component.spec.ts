import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendingPredictionsComponent } from './trending-predictions.component';

describe('TrendingPredictionsComponent', () => {
  let component: TrendingPredictionsComponent;
  let fixture: ComponentFixture<TrendingPredictionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendingPredictionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrendingPredictionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
