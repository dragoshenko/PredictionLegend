import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublishResultsComponent } from './publish-results.component';

describe('PublishResultsComponent', () => {
  let component: PublishResultsComponent;
  let fixture: ComponentFixture<PublishResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublishResultsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublishResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
