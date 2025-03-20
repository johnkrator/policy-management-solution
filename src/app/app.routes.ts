import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {LayoutComponent} from './components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {path: '', redirectTo: '', pathMatch: 'full'},
      {
        path: '',
        loadChildren: () => import('../app/pages/home-page/home-page.module').then(m => m.HomePageModule),
      },
      {
        path: 'device-manager',
        loadChildren: () => import('../app/pages/device-manager-page/device-manager-page.module').then(m => m.DeviceManagerPageModule),
      },
      {
        path: '**', redirectTo: '',
      }

    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {
}
