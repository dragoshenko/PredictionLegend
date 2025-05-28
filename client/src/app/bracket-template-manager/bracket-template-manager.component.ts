// client/src/app/bracket-template-manager/bracket-template-manager.component.ts

import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BracketTemplate } from '../_models/bracketTemplate';
import { BracketType } from '../_models/bracketType';
import { TemplateService } from '../_services/template.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmService } from '../_services/confirm.service';

@Component({
  selector: 'app-bracket-template-manager',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid mt-4">
      <!-- Header -->
      <div class="card bg-primary border-primary mb-4">
        <div class="card-header bg-primary border-primary">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-light mb-1">
                <i class="fa fa-sitemap me-2"></i>Bracket Template Manager
              </h2>
              <p class="text-light mb-0 opacity-75">
                Create, edit, and manage your custom bracket templates
              </p>
            </div>
            <button class="btn btn-outline-light" (click)="toggleCreateForm()">
              <i class="fa fa-plus me-2"></i>Create New Template
            </button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Form -->
      <div class="card bg-secondary border-secondary mb-4" *ngIf="showForm">
        <div class="card-header bg-secondary border-secondary">
          <h4 class="text-light mb-0">
            <i class="fa fa-plus-circle me-2"></i>
            {{ editingTemplate ? 'Edit' : 'Create' }} Bracket Template
          </h4>
        </div>
        <div class="card-body">
          <form [formGroup]="templateForm" (ngSubmit)="saveTemplate()">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label text-light">Template Name</label>
                <input type="text" class="form-control bg-dark border-dark text-light"
                       formControlName="name" maxlength="50" placeholder="My Custom Bracket">
                <div class="form-text text-muted">Enter a descriptive name (3-50 characters)</div>
                <div *ngIf="isFieldInvalid('name')" class="text-danger small mt-1">
                  {{ getFieldError('name') }}
                </div>
              </div>

              <div class="col-md-4 mb-3">
                <label class="form-label text-light">Number of Rounds</label>
                <input type="number" class="form-control bg-dark border-dark text-light"
                       formControlName="numberOfRounds" min="2" max="10">
                <div class="form-text text-muted">2-10 rounds (affects bracket size)</div>
                <div *ngIf="isFieldInvalid('numberOfRounds')" class="text-danger small mt-1">
                  {{ getFieldError('numberOfRounds') }}
                </div>
              </div>

              <div class="col-md-4 mb-3">
                <label class="form-label text-light">Bracket Type</label>
                <select class="form-select bg-dark border-dark text-light" formControlName="bracketType">
                  <option [value]="BracketType.SingleTeam">Single Team</option>
                  <option [value]="BracketType.Matchup">Matchup</option>
                </select>
                <div class="form-text text-muted">Choose bracket style</div>
              </div>
            </div>

            <!-- Preview -->
            <div class="alert alert-info mb-3" *ngIf="templateForm.get('numberOfRounds')?.value">
              <i class="fa fa-info-circle me-2"></i>
              <strong>Preview:</strong>
              {{ Math.pow(2, templateForm.get('numberOfRounds')?.value) }} participants,
              {{ templateForm.get('numberOfRounds')?.value }} elimination rounds
            </div>

            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-success" [disabled]="templateForm.invalid || isLoading">
                <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                <i class="fa fa-save me-2" *ngIf="!isLoading"></i>
                {{ editingTemplate ? 'Update' : 'Create' }} Template
              </button>

              <button type="button" class="btn btn-outline-secondary" (click)="cancelForm()">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Templates List -->
      <div class="card bg-secondary border-secondary">
        <div class="card-header bg-secondary border-secondary">
          <h4 class="text-light mb-0">
            <i class="fa fa-list me-2"></i>Your Bracket Templates ({{ userTemplates().length }})
          </h4>
        </div>
        <div class="card-body">
          <!-- Empty State -->
          <div *ngIf="userTemplates().length === 0" class="text-center py-5">
            <i class="fa fa-sitemap fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">No Custom Bracket Templates</h5>
            <p class="text-muted">Create your first bracket template to get started</p>
            <button class="btn btn-primary" (click)="showForm = true">
              <i class="fa fa-plus me-2"></i>Create First Template
            </button>
          </div>

          <!-- Templates Grid -->
          <div class="row" *ngIf="userTemplates().length > 0">
            <div class="col-md-6 col-lg-4 mb-3" *ngFor="let template of userTemplates(); trackBy: trackById">
              <div class="card bg-dark border-dark h-100">
                <div class="card-header bg-dark border-dark">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="card-title text-light mb-1">{{ template.name }}</h6>
                      <small class="text-muted">
                        Created: {{ template.createdAt | date:'short' }}
                      </small>
                    </div>
                    <div class="dropdown">
                      <button class="btn btn-sm btn-outline-light dropdown-toggle"
                              type="button" data-bs-toggle="dropdown">
                        <i class="fa fa-ellipsis-v"></i>
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end bg-dark">
                        <li>
                          <button class="dropdown-item text-light" (click)="editTemplate(template)">
                            <i class="fa fa-edit me-2"></i>Edit
                          </button>
                        </li>
                        <li>
                          <button class="dropdown-item text-light" (click)="duplicateTemplate(template)">
                            <i class="fa fa-copy me-2"></i>Duplicate
                          </button>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                          <button class="dropdown-item text-danger" (click)="deleteTemplate(template)">
                            <i class="fa fa-trash me-2"></i>Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div class="card-body">
                  <div class="d-flex align-items-center justify-content-center mb-3">
                    <i class="fa fa-sitemap fa-3x text-primary"></i>
                  </div>

                  <div class="row text-center">
                    <div class="col-6">
                      <div class="border-end border-secondary">
                        <h5 class="text-light mb-0">{{ template.numberOfRounds }}</h5>
                        <small class="text-muted">Rounds</small>
                      </div>
                    </div>
                    <div class="col-6">
                      <h5 class="text-light mb-0">{{ Math.pow(2, template.numberOfRounds) }}</h5>
                      <small class="text-muted">Participants</small>
                    </div>
                  </div>

                  <div class="mt-3 text-center">
                    <span class="badge bg-info">{{ getBracketTypeDisplay(template.bracketType) }}</span>
                    <span class="badge bg-secondary ms-1">
                      <i class="fa fa-users me-1"></i>{{ template.teams?.length || 0 }} Teams
                    </span>
                  </div>
                </div>

                <div class="card-footer bg-transparent border-dark text-center">
                  <button class="btn btn-outline-primary btn-sm me-2" (click)="editTemplate(template)">
                    <i class="fa fa-edit me-1"></i>Edit
                  </button>
                  <button class="btn btn-outline-danger btn-sm" (click)="deleteTemplate(template)">
                    <i class="fa fa-trash me-1"></i>Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dropdown-menu {
      background-color: #343a40 !important;
      border-color: #495057;
    }

    .dropdown-item:hover {
      background-color: #495057 !important;
    }

    .card {
      transition: transform 0.2s ease;
    }

    .card:hover {
      transform: translateY(-2px);
    }
  `]
})
export class BracketTemplateManagerComponent implements OnInit {
  private templateService = inject(TemplateService);
  private toastr = inject(ToastrService);
  private confirmService = inject(ConfirmService);
  private fb = inject(FormBuilder);

  // Computed signal from service
  userTemplates = computed(() => this.templateService.userBracketTemplates());

  // Form and UI state
  templateForm: FormGroup = new FormGroup({});
  showForm = false;
  editingTemplate: BracketTemplate | null = null;
  isLoading = false;

  // Enum reference
  BracketType = BracketType;
  Math = Math;

  ngOnInit(): void {
    this.initializeForm();
    this.loadTemplates();
  }

  initializeForm(): void {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      numberOfRounds: [4, [Validators.required, Validators.min(2), Validators.max(10)]],
      bracketType: [BracketType.SingleTeam, Validators.required]
    });
  }

  async loadTemplates(): Promise<void> {
    try {
      await this.templateService.getUserBracketTemplates();
    } catch (error) {
      console.error('Error loading templates:', error);
      this.toastr.error('Failed to load bracket templates');
    }
  }

  toggleCreateForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.editingTemplate = null;
      this.templateForm.reset({
        name: '',
        numberOfRounds: 4,
        bracketType: BracketType.SingleTeam
      });
    }
  }

  editTemplate(template: BracketTemplate): void {
    this.editingTemplate = template;
    this.showForm = true;
    this.templateForm.patchValue({
      name: template.name,
      numberOfRounds: template.numberOfRounds,
      bracketType: template.bracketType
    });
  }

  async duplicateTemplate(template: BracketTemplate): Promise<void> {
    const newTemplate: BracketTemplate = {
      id: 0,
      name: `${template.name} (Copy)`,
      numberOfRounds: template.numberOfRounds,
      numberOfBrackets: template.numberOfBrackets,
      bracketType: template.bracketType,
      officialTemplate: false,
      teams: []
    };

    try {
      await this.templateService.createBracketTemplate(newTemplate);
      this.toastr.success('Template duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating template:', error);
      this.toastr.error('Failed to duplicate template');
    }
  }

  async deleteTemplate(template: BracketTemplate): Promise<void> {
    const confirmation = await this.confirmService.confirm(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      'Delete',
      'Cancel'
    )?.toPromise();

    if (confirmation) {
      try {
        await this.templateService.deleteBracketTemplate(template.id);
        this.toastr.success('Template deleted successfully!');
      } catch (error) {
        console.error('Error deleting template:', error);
        this.toastr.error('Failed to delete template');
      }
    }
  }

  async saveTemplate(): Promise<void> {
    if (this.templateForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    try {
      const formValue = this.templateForm.value;

      if (this.editingTemplate) {
        // Update existing template
        const updatedTemplate: BracketTemplate = {
          ...this.editingTemplate,
          name: formValue.name,
          numberOfRounds: formValue.numberOfRounds,
          numberOfBrackets: Math.pow(2, formValue.numberOfRounds),
          bracketType: formValue.bracketType
        };

        await this.templateService.updateBracketTemplate(updatedTemplate);
        this.toastr.success('Template updated successfully!');
      } else {
        // Create new template
        const newTemplate: BracketTemplate = {
          id: 0,
          name: formValue.name,
          numberOfRounds: formValue.numberOfRounds,
          numberOfBrackets: Math.pow(2, formValue.numberOfRounds),
          bracketType: formValue.bracketType,
          officialTemplate: false,
          teams: []
        };

        await this.templateService.createBracketTemplate(newTemplate);
        this.toastr.success('Template created successfully!');
      }

      this.cancelForm();
    } catch (error) {
      console.error('Error saving template:', error);
      this.toastr.error('Failed to save template');
    } finally {
      this.isLoading = false;
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingTemplate = null;
    this.templateForm.reset();
  }

  getBracketTypeDisplay(bracketType: BracketType): string {
    switch (bracketType) {
      case BracketType.SingleTeam:
        return 'Single Team';
      case BracketType.Matchup:
        return 'Matchup';
      default:
        return 'Unknown';
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.templateForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.templateForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    }
    return '';
  }

  trackById(index: number, item: BracketTemplate): number {
    return item.id;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.templateForm.controls).forEach(key => {
      const control = this.templateForm.get(key);
      control?.markAsTouched();
    });
  }
}
