// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CustomPredictionComponent } from './custom-prediction/custom-prediction.component';
import { CategoriesComponent } from './categories/categories.component';
import { SitePredictionsComponent } from './site-predictions/site-predictions.component';
import { TrendingPredictionsComponent } from './trending-predictions/trending-predictions.component';
import { AuthComponent } from './auth/auth.component';
import { ProfileComponent } from './profile/profile.component';
import { AuthGuard } from './_guards/auth.guard';
import { VerificationComponent } from './verification/verification.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'verify-email', component: VerificationComponent },
  {
    path: '',
    runGuardsAndResolvers: 'always',
    canActivate: [AuthGuard],
    children: [
      { path: 'create-prediction', component: CustomPredictionComponent },
      { path: 'profile', component: ProfileComponent },
    ]
  },
  { path: 'categories', component: CategoriesComponent },
  { path: 'site-predictions', component: SitePredictionsComponent },
  { path: 'trending-predictions', component: TrendingPredictionsComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' } // Catch all route
];
