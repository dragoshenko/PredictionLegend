// client/src/app/admin/user-detail/user-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../_services/admin.service';
import { AdminUserDetail } from '../../_models/admin-user';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
  user: AdminUserDetail | null = null;
  loading = false;
  error: string | null = null;
  availableRoles = ['Admin', 'Moderator', 'Member'];
  selectedRoles: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    const userId = parseInt(this.route.snapshot.paramMap.get('id') || '0');
    if (userId <= 0) {
      this.error = 'Invalid user ID';
      return;
    }

    this.loading = true;
    this.adminService.getUserDetails(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.selectedRoles = [...user.roles];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user details:', error);
        this.error = 'Failed to load user details';
        this.loading = false;

        if (error.status === 404) {
          this.toastr.error('User not found');
          this.router.navigateByUrl('/admin');
        }
      }
    });
  }

  updateRoles(): void {
    if (!this.user) return;

    this.adminService.updateUserRoles(this.user.username, this.selectedRoles).subscribe({
      next: (roles: string[]) => {
        this.user!.roles = roles;
        this.toastr.success('Roles updated successfully');
      },
      error: (error) => {
        console.error('Error updating roles:', error);
        this.toastr.error(error.error || 'Failed to update roles');
        this.selectedRoles = [...this.user!.roles]; // Reset selections
      }
    });
  }

  deleteUser(): void {
    if (!this.user) return;

    if (confirm(`Are you sure you want to delete user ${this.user.username}?`)) {
      this.adminService.deleteUser(this.user.id).subscribe({
        next: () => {
          this.toastr.success(`User ${this.user!.username} has been deleted`);
          this.router.navigateByUrl('/admin');
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.toastr.error(error.error || 'Failed to delete user');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigateByUrl('/admin');
  }

  updateRole(role: string): void {
    if (this.selectedRoles.includes(role)) {
      this.selectedRoles = this.selectedRoles.filter(r => r !== role);
    } else {
      this.selectedRoles.push(role);
    }
  }

  formatDate(date: Date | undefined): string {
    return date ? new Date(date).toLocaleString() : '';
  }
}
