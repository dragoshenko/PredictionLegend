// client/src/app/home/home.component.ts - UPDATED
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { CategoryService } from '../_services/category.service';
import { Category } from '../_models/category';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [
    trigger('cardHover', [
      state('default', style({
        transform: 'translateY(0)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      })),
      state('hovered', style({
        transform: 'translateY(-10px)',
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.15)'
      })),
      transition('default => hovered', animate('200ms ease-out')),
      transition('hovered => default', animate('200ms ease-in'))
    ])
  ]
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private categoryService = inject(CategoryService);

  hoveredCategory: number | null = null;
  categories: Category[] = [];

  steps = [
    { id: 1, title: 'Create', description: 'Make your own prediction or join an existing one', icon: 'fa-lightbulb-o' },
    { id: 2, title: 'Share', description: 'Invite friends and see what others think', icon: 'fa-users' },
    { id: 3, title: 'Track', description: 'See results and compare your accuracy', icon: 'fa-trophy' }
  ];

  constructor() { }

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    // Load categories from the service
    this.categoryService.getCategories();

    // Get the root categories after they're loaded
    setTimeout(() => {
      const rootCategories = this.categoryService.rootCategories();

      // Map categories to display format with proper icons
      this.categories = rootCategories.map(category => ({
        ...category,
        // Map category names to appropriate icons and colors
        displayIcon: this.getCategoryIcon(category.name),
        displayColor: category.colorCode || this.getCategoryColor(category.name)
      }));

      console.log('Loaded categories for home page:', this.categories);
    }, 100);
  }

  private getCategoryIcon(categoryName: string): string {
    const iconMap: { [key: string]: string } = {
      'Sports': '🏆',
      'Entertainment': '🎬',
      'Business': '📈',
      'Technology': '💻',
      'Politics': '🏛️',
      'Science': '🔬',
      'Finance': '📊',
      'Gaming': '🎮',
      'Music': '🎵',
      'Movies': '🎥'
    };
    return iconMap[categoryName] || '📋';
  }

  private getCategoryColor(categoryName: string): string {
    const colorMap: { [key: string]: string } = {
      'Sports': '#e74c3c',
      'Entertainment': '#9b59b6',
      'Business': '#2ecc71',
      'Technology': '#3498db',
      'Politics': '#e67e22',
      'Science': '#1abc9c',
      'Finance': '#27ae60',
      'Gaming': '#8e44ad',
      'Music': '#f39c12',
      'Movies': '#c0392b'
    };
    return colorMap[categoryName] || '#6c757d';
  }

  // Add click handler for category navigation
  onCategoryClick(category: Category): void {
    console.log('Category clicked:', category.name, 'ID:', category.id);

    // Navigate to published posts with the selected category filter
    this.router.navigate(['/published-posts'], {
      queryParams: {
        category: category.id
      }
    });
  }
}
