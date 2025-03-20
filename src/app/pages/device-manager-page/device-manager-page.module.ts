import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {DeviceManagerPageComponent} from './device-manager-page.component';

const routes: Routes = [
  {
    path: '',
    component: DeviceManagerPageComponent,
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class DeviceManagerPageModule {
}
