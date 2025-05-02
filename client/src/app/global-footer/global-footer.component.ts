import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-global-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-footer.component.html',
  styleUrls: ['./global-footer.component.css']
})
export class GlobalFooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();

  constructor() { }

  ngOnInit(): void {
  }
}
