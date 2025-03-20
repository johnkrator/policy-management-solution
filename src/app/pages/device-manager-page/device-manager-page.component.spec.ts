import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceManagerPageComponent } from './device-manager-page.component';

describe('DeviceManagerPageComponent', () => {
  let component: DeviceManagerPageComponent;
  let fixture: ComponentFixture<DeviceManagerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceManagerPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeviceManagerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
