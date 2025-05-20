// client/src/app/admin/system-info/system-info.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../_services/admin.service';
import { SystemInfo } from '../../_models/system-info';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-system-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './system-info.component.html',
  styleUrls: ['./system-info.component.css']
})
export class SystemInfoComponent implements OnInit {
  systemInfo: SystemInfo | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadSystemInfo();
  }

  loadSystemInfo(): void {
    this.loading = true;
    this.adminService.getSystemInfo().subscribe({
      next: (info) => {
        this.systemInfo = info;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading system info:', error);
        this.error = 'Failed to load system information';
        this.loading = false;
        this.toastr.error('Could not load system information');
      }
    });
  }

  refreshSystemInfo(): void {
    this.loadSystemInfo();
    this.toastr.info('System information refreshed');
  }

  formatDate(date: Date | undefined): string {
    return date ? new Date(date).toLocaleString() : 'N/A';
  }
}
