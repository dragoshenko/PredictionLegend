// _services/creation-flow.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export interface CreationFlow {
  id: number;
  flowToken: string;
  userId: number;
  predictionType: string;
  templateId?: number;
  predictionId?: number;
  selectedTeamIds: number[];
  createdTeamIds: number[];
  isCompleted: boolean;
  isAbandoned: boolean;
  abandonReason?: string;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
  abandonedAt?: Date;
}

export interface CreateCounterPrediction {
  originalPredictionId: number;
  templateId: number;
  predictionType: string;
  postRank?: any;
  postBracket?: any;
  postBingo?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CreationFlowService {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private baseUrl = environment.apiUrl + 'creation-flow';

  // Current flow state
  currentFlow = signal<CreationFlow | null>(null);
  isInFlow = signal<boolean>(false);

  constructor() {
    // Check for existing flow on service initialization
    this.checkExistingFlow();
  }

  private checkExistingFlow(): void {
    const flowToken = localStorage.getItem('currentFlowToken');
    if (flowToken) {
      // Validate if flow is still active
      this.validateFlow(flowToken).subscribe({
        next: (flow) => {
          this.currentFlow.set(flow);
          this.isInFlow.set(true);
        },
        error: () => {
          this.clearFlow();
        }
      });
    }
  }

  startCreationFlow(predictionData: any, userId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/start`, {
      prediction: predictionData,
      userId: userId
    }).pipe(
      catchError(error => {
        console.error('Error starting creation flow:', error);
        this.toastr.error('Failed to start creation flow');
        return throwError(() => error);
      })
    );
  }

  editTemplate(request: any, userId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/edit-template`, {
      ...request,
      userId: userId
    }).pipe(
      catchError(error => {
        console.error('Error editing template:', error);
        this.toastr.error('Failed to load template');
        return throwError(() => error);
      })
    );
  }

  selectTeams(flowToken: string, selectedTeamIds: number[], newTeams: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/select-teams`, {
      flowToken: flowToken,
      selectedTeamIds: selectedTeamIds,
      newTeams: newTeams
    }).pipe(
      catchError(error => {
        console.error('Error selecting teams:', error);
        this.toastr.error('Failed to save team selection');
        return throwError(() => error);
      })
    );
  }

  createPost(request: any, userId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create-post`, {
      ...request,
      userId: userId
    }).pipe(
      catchError(error => {
        console.error('Error creating post:', error);
        this.toastr.error('Failed to create post');
        return throwError(() => error);
      })
    );
  }

  createCounterPrediction(request: CreateCounterPrediction, userId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/counter-prediction`, {
      ...request,
      userId: userId
    }).pipe(
      catchError(error => {
        console.error('Error creating counter prediction:', error);
        this.toastr.error('Failed to create counter prediction');
        return throwError(() => error);
      })
    );
  }

  abandonFlow(flowToken: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/abandon`, {
      flowToken: flowToken,
      reason: reason
    }).pipe(
      catchError(error => {
        console.error('Error abandoning flow:', error);
        return throwError(() => error);
      })
    );
  }

  validateFlow(flowToken: string): Observable<CreationFlow> {
    return this.http.get<CreationFlow>(`${this.baseUrl}/validate/${flowToken}`).pipe(
      catchError(error => {
        console.error('Error validating flow:', error);
        return throwError(() => error);
      })
    );
  }

  // Local state management
  setCurrentFlow(flow: CreationFlow): void {
    this.currentFlow.set(flow);
    this.isInFlow.set(true);
    localStorage.setItem('currentFlowToken', flow.flowToken);
  }

  clearFlow(): void {
    this.currentFlow.set(null);
    this.isInFlow.set(false);
    localStorage.removeItem('currentFlowToken');
  }

  getCurrentFlowToken(): string | null {
    return this.currentFlow()?.flowToken || localStorage.getItem('currentFlowToken');
  }

  // Auto-abandon expired flows (admin only)
  cleanupExpiredFlows(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cleanup-expired`, {}).pipe(
      catchError(error => {
        console.error('Error cleaning up expired flows:', error);
        this.toastr.error('Failed to cleanup expired flows');
        return throwError(() => error);
      })
    );
  }

  // Helper methods for flow validation
  canProceedToTemplate(): boolean {
    const flow = this.currentFlow();
    return flow !== null && !flow.isAbandoned && !flow.isCompleted;
  }

  canProceedToTeams(): boolean {
    const flow = this.currentFlow();
    return flow !== null && flow.templateId !== undefined && !flow.isAbandoned && !flow.isCompleted;
  }

  canProceedToPost(): boolean {
    const flow = this.currentFlow();
    return flow !== null &&
           flow.templateId !== undefined &&
           flow.selectedTeamIds.length > 0 &&
           !flow.isAbandoned &&
           !flow.isCompleted;
  }

  // Flow step tracking
  getCurrentStep(): string {
    const flow = this.currentFlow();
    if (!flow) return 'none';
    if (flow.isCompleted) return 'completed';
    if (flow.isAbandoned) return 'abandoned';
    if (!flow.templateId) return 'template';
    if (flow.selectedTeamIds.length === 0) return 'teams';
    return 'post';
  }

  getFlowProgress(): number {
    const step = this.getCurrentStep();
    switch (step) {
      case 'template': return 25;
      case 'teams': return 50;
      case 'post': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  }
}
