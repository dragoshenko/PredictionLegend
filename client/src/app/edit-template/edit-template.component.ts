// client/src/app/edit-template/edit-template.component.ts - ENHANCED VERSION

import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PredictionType } from '../_models/predictionType';
import { TemplateService } from '../_services/template.service';
import { RankingTemplate } from '../_models/rankingTemplate';
import { BracketTemplate } from '../_models/bracketTemplate';
import { BingoTemplate } from '../_models/bingoTemplate';
import { BracketType } from '../_models/bracketType';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-template',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-template.component.html',
  styleUrl: './edit-template.component.css'
})
export class EditTemplateComponent implements OnInit {
  predictionId: number = 0;
  predictionType: PredictionType = PredictionType.Ranking;

  // computed signals to get reactive data from service
  officialRankingTemplates = computed(() => this.templateService.officialRankingTemplates());
  officialBracketTemplates = computed(() => this.templateService.officialBracketTemplates());
  officialBingoTemplates = computed(() => this.templateService.officialBingoTemplates());

  userRankingTemplates = computed(() => this.templateService.userRankingTemplates());
  userBracketTemplates = computed(() => this.templateService.userBracketTemplates());
  userBingoTemplates = computed(() => this.templateService.userBingoTemplates());

  // Selected template
  selectedTemplate: any = null;

  // Custom template forms
  customRankingForm: FormGroup = new FormGroup({});
  customBracketForm: FormGroup = new FormGroup({});
  customBingoForm: FormGroup = new FormGroup({});

  // UI state
  showCustomForm = false;
  isLoading = false;
  isCreatingTemplate = false;

  // Enum references for template
  PredictionType = PredictionType;
  BracketType = BracketType;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private templateService = inject(TemplateService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  constructor() {
    // Optional: Add an effect to debug template loading
    effect(() => {
      console.log('Official ranking templates updated:', this.officialRankingTemplates());
      console.log('User ranking templates updated:', this.userRankingTemplates());
      console.log('Official bracket templates updated:', this.officialBracketTemplates());
      console.log('User bracket templates updated:', this.userBracketTemplates());
      console.log('Official bingo templates updated:', this.officialBingoTemplates());
      console.log('User bingo templates updated:', this.userBingoTemplates());
    });
  }

  async ngOnInit(): Promise<void> {
    this.initializeForms();

    this.route.params.subscribe(params => {
      this.predictionId = +params['id'];
      this.predictionType = params['type'] as PredictionType;

      console.log('Prediction ID:', this.predictionId);
      console.log('Prediction Type:', this.predictionType);
    });

    try {
      await this.loadTemplates();
    } catch (error) {
      console.error('Error loading templates:', error);
      this.toastr.error('Failed to load templates');
    }
  }

  pow(base: number, exponent: number): number {
    return Math.pow(base, exponent);
  }

  initializeForms(): void {
    this.customRankingForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      numberOfRows: [10, [Validators.required, Validators.min(3), Validators.max(50)]],
      numberOfColumns: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });

    this.customBracketForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      bracketType: [BracketType.SingleTeam, Validators.required],
      numberOfRounds: [4, [Validators.required, Validators.min(2), Validators.max(10)]]
    });

    this.customBingoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      gridSize: [5, [Validators.required, Validators.min(3), Validators.max(10)]]
    });
  }

  async loadTemplates(): Promise<void> {
    this.isLoading = true;

    try {
      switch (this.predictionType) {
        case 'Ranking':
          await this.templateService.getOfficialAndUserRankingTemplates();
          break;
        case 'Bracket':
          await this.templateService.getOfficialAndUserBracketTemplates();
          break;
        case 'Bingo':
          await this.templateService.getOfficialAndUserBingoTemplates();
          break;
      }
    } finally {
      this.isLoading = false;
    }
  }

  selectTemplate(template: any): void {
    this.selectedTemplate = template;
    console.log('Selected template:', this.selectedTemplate);
    this.showCustomForm = false;
  }

  toggleCustomForm(): void {
    this.showCustomForm = !this.showCustomForm;
    this.selectedTemplate = null;
  }

  async createCustomRankingTemplate(): Promise<void> {
    if (this.customRankingForm.valid) {
      this.isCreatingTemplate = true;
      try {
        const template: RankingTemplate = {
          id: 0,
          officialTemplate: false,
          teams: [],
          ...this.customRankingForm.value
        };

        await this.templateService.createRankingTemplate(template);
        this.toastr.success('Ranking template created successfully!');

        // Wait a moment for the template to be created and signals to update
        setTimeout(() => {
          this.showCustomForm = false;
          this.isCreatingTemplate = false;
        }, 1000);
      } catch (error) {
        console.error('Error creating template:', error);
        this.toastr.error('Failed to create ranking template');
        this.isCreatingTemplate = false;
      }
    }
  }

  async createCustomBracketTemplate(): Promise<void> {
    if (this.customBracketForm.valid) {
      this.isCreatingTemplate = true;
      try {
        const formValue = this.customBracketForm.value;
        const template: BracketTemplate = {
          id: 0,
          name: formValue.name,
          officialTemplate: false,
          numberOfRounds: formValue.numberOfRounds,
          numberOfBrackets: Math.pow(2, formValue.numberOfRounds),
          bracketType: formValue.bracketType,
          teams: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        console.log('Creating bracket template:', template);
        await this.templateService.createBracketTemplate(template);
        this.toastr.success('Bracket template created successfully!');

        // Wait a moment for the template to be created and signals to update
        setTimeout(() => {
          this.showCustomForm = false;
          this.isCreatingTemplate = false;
        }, 1000);
      } catch (error) {
        console.error('Error creating bracket template:', error);
        this.toastr.error('Failed to create bracket template');
        this.isCreatingTemplate = false;
      }
    }
  }

  async createCustomBingoTemplate(): Promise<void> {
    if (this.customBingoForm.valid) {
      this.isCreatingTemplate = true;
      try {
        const template: BingoTemplate = {
          id: 0,
          officialTemplate: false,
          teams: [],
          ...this.customBingoForm.value
        };

        await this.templateService.createBingoTemplate(template);
        this.toastr.success('Bingo template created successfully!');

        setTimeout(() => {
          this.showCustomForm = false;
          this.isCreatingTemplate = false;
        }, 1000);
      } catch (error) {
        console.error('Error creating template:', error);
        this.toastr.error('Failed to create bingo template');
        this.isCreatingTemplate = false;
      }
    }
  }

  proceedWithTemplate(): void {
    if (this.selectedTemplate) {
      console.log('Proceeding with template:', this.selectedTemplate);

      // Navigate to select teams page with the template data
      this.router.navigate(['/select-teams', this.predictionId, this.selectedTemplate.id, this.predictionType], {
        state: {
          template: this.selectedTemplate,
          predictionId: this.predictionId,
          predictionType: this.predictionType
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/create-prediction']);
  }

  trackById(index: number, item: any): number {
    return item.id;
  }

  // Helper method to get bracket type display name
  getBracketTypeDisplayName(bracketType: BracketType): string {
    switch (bracketType) {
      case BracketType.SingleTeam:
        return 'Single Team';
      case BracketType.Matchup:
        return 'Matchup';
      default:
        return 'Unknown';
    }
  }
}
