// client/src/app/app.routes.ts - UPDATED VERSION with Counter Prediction Support
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

  // Discussion routes (some public, some protected)
  {
    path: 'discussions',
    component: DiscussionListComponent,
    data: { title: 'Discussions' }
  },
  {
    path: 'discussions/:id',
    component: DiscussionPostComponent,
    data: { title: 'Discussion Post' }
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

      // Discussion creation/editing (protected routes)
      {
        path: 'discussions/create',
        component: DiscussionListComponent,
        data: { title: 'Create Discussion' }
      },
      {
        path: 'discussions/edit/:id',
        component: DiscussionListComponent,
        data: { title: 'Edit Discussion' }
      },
      {
        path: 'my-discussions',
        component: DiscussionListComponent,
        data: { title: 'My Discussions' }
      },

      // Counter prediction routes (protected - require login to create)
      // Note: Viewing counter predictions is handled in prediction-details (public)
      // Creating counter predictions requires authentication
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
Route Structure Explanation:

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
- /prediction-details/:id - View prediction details + counter predictions
- /post-view/:id - Alternative post view
- /discussions - Public discussions
- /discussions/:id - View specific discussions

PROTECTED ROUTES (Auth Required):
- /profile - User profile management
- /my-predictions - User's own predictions
- /password-change-warning - Security notifications
- /create-prediction - Start prediction creation flow
- /edit-template/:id/:type - Step 2: Template editing
- /select-teams/:predictionId/:templateId/:type - Step 3: Team selection
- /create-post/:predictionId/:templateId/:type - Step 4: Post creation
- /discussions/create - Create new discussions
- /discussions/edit/:id - Edit discussions
- /my-discussions - User's discussions

ADMIN ROUTES (Admin Role Required):
- /admin - Admin dashboard
- /admin/users/:id - User management

COUNTER PREDICTION FLOW:
1. User visits /published-posts (public)
2. Clicks "Counter Predict" on a post
3. Navigates to /prediction-details/:id?action=counter-predict
4. If not logged in, redirected to /auth with return URL
5. If logged in, can create counter prediction on details page
6. Counter predictions are submitted via API from PredictionDetailsComponent
7. Results are displayed on the same page

The counter prediction functionality is integrated into the existing
prediction-details page rather than having separate routes, making
the user experience smoother and keeping related content together.
*/
