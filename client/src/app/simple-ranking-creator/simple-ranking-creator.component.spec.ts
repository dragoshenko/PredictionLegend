import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleRankingCreatorComponent } from './simple-ranking-creator.component';

describe('SimpleRankingCreatorComponent', () => {
  let component: SimpleRankingCreatorComponent;
  let fixture: ComponentFixture<SimpleRankingCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleRankingCreatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimpleRankingCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
