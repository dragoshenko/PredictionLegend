import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BracketTemplateManagerComponent } from './bracket-template-manager.component';

describe('BracketTemplateManagerComponent', () => {
  let component: BracketTemplateManagerComponent;
  let fixture: ComponentFixture<BracketTemplateManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BracketTemplateManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BracketTemplateManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
