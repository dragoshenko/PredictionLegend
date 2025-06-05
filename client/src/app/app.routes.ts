// client/src/app/app.routes.ts - UPDATED with Counter Prediction View

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
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { UserDetailComponent } from './admin/user-detail/user-detail.component';
import { AdminComponent } from './admin/admin.component';
import { MyPredictionsComponent } from './my-predictions/my-predictions.component';
import { PredictionDetailsComponent } from './prediction-details/prediction-details.component';
import { PublishedPostsComponent } from './published-posts/published-posts.component';
import { PostViewComponent } from './post-view/post-view.component';
import { MyPredictionViewComponent } from './my-prediction-view/my-prediction-view.component';
import { MyCounterPredictionViewComponent } from './my-counter-prediction-view/my-counter-prediction-view.component';

export const routes: Routes = [
  // Public routes (no authentication required)
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'verify-email', component: VerificationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },


  // Public content routes
  {
    path: 'categories',
    component: CategoriesComponent,
    data: { title: 'Categories' }
  },
  {
    path: 'site-predictions',
    component: SitePredictionsComponent,
    data: { title: 'Site Predictions' }
  },
  {
    path: 'trending-predictions',
    component: TrendingPredictionsComponent,
    data: { title: 'Trending Predictions' }
  },
  {
    path: 'published-posts',
    component: PublishedPostsComponent,
    data: { title: 'Published Predictions' }
  },

  // Prediction detail routes (public - anyone can view)
  {
    path: 'prediction-details/:id',
    component: PredictionDetailsComponent,
    data: { title: 'Prediction Details' }
  },
  {
    path: 'post-view/:id',
    component: PostViewComponent,
    data: { title: 'Post View' }
  },

  // Protected routes (require authentication)
  {
    path: '',
    runGuardsAndResolvers: 'always',
    canActivate: [AuthGuard],
    children: [
      // User profile and settings
      {
        path: 'profile',
        component: ProfileComponent,
        data: { title: 'Profile' }
      },
      {
        path: 'my-predictions',
        component: MyPredictionsComponent,
        data: { title: 'My Predictions' }
      },
      {
        path: 'my-prediction/:id',
        component: MyPredictionViewComponent,
        data: { title: 'My Prediction View' }
      },
      // NEW: Counter Prediction View Route
      {
        path: 'my-counter-prediction/:id/:type',
        component: MyCounterPredictionViewComponent,
        data: { title: 'My Counter Prediction' }
      },
      {
        path: 'password-change-warning',
        component: PasswordChangeWarningComponent,
        data: { title: 'Password Change Warning' }
      },

      // Prediction creation flow (step-by-step process)
      {
        path: 'create-prediction',
        component: CreatePredictionComponent,
        data: { title: 'Create Prediction' }
      },
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
    ]
  },

  // Admin routes (require admin role)
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        component: AdminDashboardComponent,
        data: { title: 'Admin Dashboard' }
      },
      {
        path: 'users/:id',
        component: UserDetailComponent,
        data: { title: 'User Details' }
      },
    ]
  },

  // Redirect routes for common mistakes/old URLs
  { path: 'prediction/:id', redirectTo: '/prediction-details/:id', pathMatch: 'full' },
  { path: 'post/:id', redirectTo: '/post-view/:id', pathMatch: 'full' },
  { path: 'predictions', redirectTo: '/published-posts', pathMatch: 'full' },

  // Catch all route - must be last
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

/*
UPDATED Route Structure with Counter Predictions:

PUBLIC ROUTES (No Auth Required):
- / - Home page
- /auth - Login/Register
- /verify-email - Email verification
- /forgot-password - Password reset request
- /reset-password - Password reset with code
- /categories - Browse categories
- /site-predictions - Browse site predictions
- /trending-predictions - Trending content
- /published-posts - All published predictions (main discovery page)
- /prediction-details/:id - View prediction details + counter predictions (PUBLIC)
- /post-view/:id - Alternative post view

PROTECTED ROUTES (Auth Required):
- /profile - User profile management
- /my-predictions - User's own predictions AND counter predictions list
- /my-prediction/:id - View own original prediction details (PRIVATE - owner only)
- /my-counter-prediction/:id/:type - View own counter prediction details (NEW!)
- /password-change-warning - Security notifications
- /create-prediction - Start prediction creation flow
- /edit-template/:id/:type - Step 2: Template editing
- /select-teams/:predictionId/:templateId/:type - Step 3: Team selection
- /create-post/:predictionId/:templateId/:type - Step 4: Post creation

ADMIN ROUTES (Admin Role Required):
- /admin - Admin dashboard
- /admin/users/:id - User management

NEW COUNTER PREDICTION FEATURES:

1. Enhanced "My Predictions" Page:
   - Shows both original predictions AND counter predictions
   - Counter predictions have special badges and styling
   - Clear distinction between "My Prediction" vs "Counter to: Original Title"
   - Separate stats for original predictions vs counter predictions
   - Filter by post type (original vs counter)

2. My Counter Prediction View (/my-counter-prediction/:id/:type):
   - Shows ONLY the user's counter prediction data
   - Displays original prediction info at the top
   - "View Original" button that redirects to /prediction-details/:originalId
   - Shows performance stats for the counter prediction
   - Compare, share, and delete options

3. Route Parameters:
   - :id - The counter prediction post ID (PostRank.Id, PostBingo.Id, etc.)
   - :type - The type of counter prediction ("ranking", "bingo", "bracket")

4. Navigation Flow:
   - My Predictions → Click counter prediction → My Counter Prediction View
   - My Counter Prediction View → "View Original" → Public Prediction Details
   - Public Prediction Details shows all counter predictions including yours

5. Data Separation:
   - /my-prediction/:id - Shows only YOUR original prediction data (private view)
   - /my-counter-prediction/:id/:type - Shows only YOUR counter prediction (private view)
   - /prediction-details/:id - Shows original + ALL counter predictions (public view)

This ensures clean separation between:
- Private management of your own content
- Public discovery and interaction with others' content
- Clear identification of counter predictions vs original predictions
*/
