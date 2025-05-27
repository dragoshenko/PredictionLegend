import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {
  activeLink = 'dashboard';

  setActiveLink(link: string): void {
    this.activeLink = link;
  }

  scrollToSection(sectionId: string): void {
    // Wait a brief moment for any route changes, then scroll
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        // Calculate offset to account for fixed header
        const headerOffset = 100; // Adjust this value based on your header height
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Add a subtle highlight effect
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';

        setTimeout(() => {
          element.style.backgroundColor = '';
        }, 1500);
      } else {
        console.warn(`Section with ID '${sectionId}' not found`);
      }
    }, 100);
  }
}
