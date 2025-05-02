import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';

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
  hoveredCategory: number | null = null;

  categories = [
    { id: 1, name: 'Sports', icon: '🏆', color: '#e74c3c' },
    { id: 2, name: 'Entertainment', icon: '🎬', color: '#9b59b6' },
    { id: 3, name: 'Finance', icon: '📈', color: '#2ecc71' },
    { id: 4, name: 'Technology', icon: '💻', color: '#3498db' }
  ];

  steps = [
    { id: 1, title: 'Create', description: 'Make your own prediction or join an existing one', icon: 'fa-lightbulb-o' },
    { id: 2, title: 'Share', description: 'Invite friends and see what others think', icon: 'fa-users' },
    { id: 3, title: 'Track', description: 'See results and compare your accuracy', icon: 'fa-trophy' }
  ];

  constructor() { }

  ngOnInit(): void {
    // Animation initialization can go here if needed
  }
}
