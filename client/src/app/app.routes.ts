// app.routes.ts - UPDATED VERSION
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
import { MyPredictionsComponent } from './my-predictions/my-predictions.component';
import { PredictionDetailsComponent } from './prediction-details/prediction-details.component';
import { PublishedPostsComponent } from './published-posts/published-posts.component';
import { PostViewComponent } from './post-view/post-view.component';

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
  { path: 'published-posts', component: PublishedPostsComponent },
  { path: 'prediction-details/:id', component: PredictionDetailsComponent },
  { path: 'post-view/:id', component: PostViewComponent },

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
      { path: 'my-predictions', component: MyPredictionsComponent },
      { path: 'password-change-warning', component: PasswordChangeWarningComponent },

      // Prediction creation flow with proper parameter ordering
      { path: 'create-prediction', component: CreatePredictionComponent },
      {
        path: 'edit-template/:id/:type',
        component: EditTemplateComponent,
        data: { title: 'Edit Template' }
      },
      {
        path: 'select-teams/:predictionId/:templateId/:type',
        component: SelectTeamsComponent,
        data: { title: 'Select Teams' }
      },
      {
        path: 'create-post/:predictionId/:templateId/:type',
        component: CreatePostComponent,
        data: { title: 'Create Post' }
      },

      // Discussion creation/editing (protected)
      { path: 'discussions/create', component: DiscussionListComponent },
      { path: 'discussions/edit/:id', component: DiscussionListComponent },
      { path: 'my-discussions', component: DiscussionListComponent },
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
