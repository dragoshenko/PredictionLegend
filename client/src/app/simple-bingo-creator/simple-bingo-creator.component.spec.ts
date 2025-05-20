import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleBingoCreatorComponent } from './simple-bingo-creator.component';

describe('SimpleBingoCreatorComponent', () => {
  let component: SimpleBingoCreatorComponent;
  let fixture: ComponentFixture<SimpleBingoCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleBingoCreatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimpleBingoCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
