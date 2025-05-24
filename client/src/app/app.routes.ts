import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CategoriesComponent } from './categories/categories.component';
import { SitePredictionsComponent } from './site-predictions/site-predictions.component';
import { TrendingPredictionsComponent } from './trending-predictions/trending-predictions.component';
import { AuthComponent } from './auth/auth.component';
import { ProfileComponent } from './profile/profile.component';
import { AuthGuard } from './_guards/auth.guard';
import { VerificationComponent } from './verification/verification.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PasswordChangeWarningComponent } from './password-change-warning/password-change-warning.component';
import { GoogleGuard } from './_guards/google.guard';
import { CreatePredictionComponent } from './create-prediction/create-prediction.component';
import { EditTemplateComponent } from './edit-template/edit-template.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'verify-email', component: VerificationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: '',
    runGuardsAndResolvers: 'always',
    canActivate: [AuthGuard],
    children: [
      { path: 'profile', component: ProfileComponent },
      { path: 'password-change-warning', component: PasswordChangeWarningComponent },
      { path: 'create-prediction', component: CreatePredictionComponent },
      { path: 'edit-template/:id/:type', component: EditTemplateComponent },
    ]
  },
  { path: 'categories', component: CategoriesComponent },
  { path: 'site-predictions', component: SitePredictionsComponent },
  { path: 'trending-predictions', component: TrendingPredictionsComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' } // Catch all route
];
