import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../_services/admin.service';
import { AdminUser } from '../../_models/admin-user';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterModule } from '@angular/router';
import { SystemInfoComponent } from '../system-info/system-info.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SystemInfoComponent, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  loading = false;
  error: string | null = null;

  // Search and filtering
  searchTerm = '';
  filterRole = 'All';
  sortColumn = 'id';
  sortDirection = 'asc';

  // Statistics
  stats = {
    totalUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    admins: 0,
    moderators: 0,
    members: 0,
    recentUsers: 0 // Users created in the last 30 days
  };

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = [...users]; // Initialize filteredUsers
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Failed to load users. Please try again later.';
        this.loading = false;

        if (error.status === 403) {
          this.toastr.error('You do not have permission to access this page');
          this.router.navigateByUrl('/');
        }
      }
    });
  }

  calculateStats(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.stats.totalUsers = this.users.length;
    this.stats.verifiedUsers = this.users.filter(u => u.emailConfirmed).length;
    this.stats.unverifiedUsers = this.users.filter(u => !u.emailConfirmed).length;
    this.stats.admins = this.users.filter(u => u.roles.includes('Admin')).length;
    this.stats.moderators = this.users.filter(u => u.roles.includes('Moderator')).length;
    this.stats.members = this.users.filter(u =>
      !(u.roles.includes('Admin') || u.roles.includes('Moderator'))
    ).length;

    // Count users created in the last 30 days
    this.stats.recentUsers = this.users.filter(u =>
      new Date(u.createdAt) > thirtyDaysAgo
    ).length;
  }

  applyFilters(): void {
    // First filter by search term
    let filtered = this.users;

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchLower) ||
        user.displayName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Then filter by role
    if (this.filterRole !== 'All') {
      filtered = filtered.filter(user => user.roles.includes(this.filterRole));
    }

    // Sort results
    filtered = this.sortUsers(filtered);

    this.filteredUsers = filtered;
  }

  sortUsers(users: AdminUser[]): AdminUser[] {
    return users.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      // Determine which property to sort by
      switch (this.sortColumn) {
        case 'id':
          valueA = a.id;
          valueB = b.id;
          break;
        case 'username':
          valueA = a.username?.toLowerCase() || '';
          valueB = b.username?.toLowerCase() || '';
          break;
        case 'displayName':
          valueA = a.displayName?.toLowerCase() || '';
          valueB = b.displayName?.toLowerCase() || '';
          break;
        case 'email':
          valueA = a.email?.toLowerCase() || '';
          valueB = b.email?.toLowerCase() || '';
          break;
        case 'createdAt':
          valueA = new Date(a.createdAt).getTime();
          valueB = new Date(b.createdAt).getTime();
          break;
        default:
          valueA = a.id;
          valueB = b.id;
          break;
      }

      // Determine sort direction
      const direction = this.sortDirection === 'asc' ? 1 : -1;

      // Compare values
      if (valueA < valueB) {
        return -1 * direction;
      }
      if (valueA > valueB) {
        return 1 * direction;
      }
      return 0;
    });
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  onFilterRole(role: string): void {
    this.filterRole = role;
    this.applyFilters();
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      // Toggle sort direction if clicking the same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Default to ascending when switching columns
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterRole = 'All';
    this.applyFilters();
  }

  viewUserDetails(userId: number): void {
    this.router.navigate(['/admin/users', userId]);
  }

  deleteUser(userId: number, username: string): void {
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          this.toastr.success(`User ${username} has been deleted`);
          this.loadUsers(); // Refresh the list
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.toastr.error(error.error || 'Failed to delete user');
        }
      });
    }
  }

  getRolesBadgeClass(roles: string[]): string {
    if (roles.includes('Admin')) {
      return 'bg-danger';
    } else if (roles.includes('Moderator')) {
      return 'bg-warning text-dark';
    } else {
      return 'bg-info text-dark';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  refreshData(): void {
    this.loadUsers();
    this.toastr.info('Data has been refreshed');
  }
}
