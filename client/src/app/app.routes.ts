import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CustomPredictionComponent } from './custom-prediction/custom-prediction.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'create-prediction', component: CustomPredictionComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' } // Catch all route
];
