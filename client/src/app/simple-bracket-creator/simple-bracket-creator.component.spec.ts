import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleBracketCreatorComponent } from './simple-bracket-creator.component';

describe('SimpleBracketCreatorComponent', () => {
  let component: SimpleBracketCreatorComponent;
  let fixture: ComponentFixture<SimpleBracketCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleBracketCreatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimpleBracketCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
