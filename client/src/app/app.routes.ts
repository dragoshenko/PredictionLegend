import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CustomPredictionComponent } from './custom-prediction/custom-prediction.component';
import { CategoriesComponent } from './categories/categories.component';
import { SitePredictionsComponent } from './site-predictions/site-predictions.component';
import { TrendingPredictionsComponent } from './trending-predictions/trending-predictions.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'create-prediction', component: CustomPredictionComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'site-predictions', component: SitePredictionsComponent },
  { path: 'trending-predictions', component: TrendingPredictionsComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' } // Catch all route
];
