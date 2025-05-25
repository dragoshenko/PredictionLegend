// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CategoriesComponent } from './categories/categories.component';
import { SitePredictionsComponent } from './site-predictions/site-predictions.component';
import { TrendingPredictionsComponent } from './trending-predictions/trending-predictions.component';
import { AuthComponent } from './auth/auth.component';
import { ProfileComponent } from './profile/profile.component';
import { AuthGuard } from './_guards/auth.guard';
import { adminGuard } from './_guards/admin.guard';
import { VerificationComponent } from './verification/verification.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PasswordChangeWarningComponent } from './password-change-warning/password-change-warning.component';
import { CreatePredictionComponent } from './create-prediction/create-prediction.component';
import { EditTemplateComponent } from './edit-template/edit-template.component';
import { SelectTeamsComponent } from './select-teams/select-teams.component';
import { CreatePostComponent } from './create-post/create-post.component';
import { DiscussionListComponent } from './discussion/discussion-list/discussion-list.component';
import { DiscussionPostComponent } from './discussion/discussion-post/discussion-post.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { UserDetailComponent } from './admin/user-detail/user-detail.component';
import { AdminComponent } from './admin/admin.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'verify-email', component: VerificationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // Public routes
  { path: 'categories', component: CategoriesComponent },
  { path: 'site-predictions', component: SitePredictionsComponent },
  { path: 'trending-predictions', component: TrendingPredictionsComponent },

  // Discussion routes (some public, some protected)
  { path: 'discussions', component: DiscussionListComponent },
  { path: 'discussions/:id', component: DiscussionPostComponent },

  // Protected routes
  {
    path: '',
    runGuardsAndResolvers: 'always',
    canActivate: [AuthGuard],
    children: [
      { path: 'profile', component: ProfileComponent },
      { path: 'password-change-warning', component: PasswordChangeWarningComponent },

      // Prediction creation flow
      { path: 'create-prediction', component: CreatePredictionComponent },
      { path: 'edit-template/:predictionId/:type', component: EditTemplateComponent },
      { path: 'select-teams/:predictionId/:templateId/:type', component: SelectTeamsComponent },
      { path: 'create-post/:predictionId/:templateId/:type', component: CreatePostComponent },

      // Discussion creation/editing (protected)
      { path: 'discussions/create', component: DiscussionListComponent }, // Same component with create form
      { path: 'discussions/edit/:id', component: DiscussionListComponent }, // Edit form
      { path: 'my-discussions', component: DiscussionListComponent }, // User's own discussions
    ]
  },

  // Admin routes
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'users/:id', component: UserDetailComponent },
    ]
  },

  // Catch all route
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
