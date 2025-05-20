import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BingoCell {
  id: number;
  content: string;
  selected: boolean;
}

interface BingoBoard {
  cells: BingoCell[];
  size: number;
  title: string;
}

@Component({
  selector: 'app-simple-bingo-creator',
  templateUrl: './simple-bingo-creator.component.html',
  styleUrls: ['./simple-bingo-creator.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SimpleBingoCreatorComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() size: number = 5; // Default 5x5 bingo grid
  @Input() title: string = 'BINGO';

  board: BingoBoard = {
    cells: [],
    size: 5,
    title: 'BINGO'
  };

  editable: boolean = true;
  randomizing: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.initializeBingoBoard();
  }

  ngAfterViewInit(): void {
    this.updateGridSize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['size'] || changes['title']) {
      this.initializeBingoBoard();
      setTimeout(() => this.updateGridSize(), 0);
    }
  }

  // Initialize the bingo board
  initializeBingoBoard(): void {
    this.board = {
      cells: [],
      size: this.size,
      title: this.title
    };

    const totalCells = this.size * this.size;

    for (let i = 0; i < totalCells; i++) {
      this.board.cells.push({
        id: i,
        content: '',
        selected: false
      });
    }
  }

  // Update grid template columns CSS variable based on size
  updateGridSize(): void {
    const gridElement = document.querySelector('.bingo-grid') as HTMLElement;
    if (gridElement) {
      gridElement.style.setProperty('--grid-size', this.size.toString());
      gridElement.classList.add(`grid-${this.size}`);
    }

    const headerElement = document.querySelector('.bingo-header-row') as HTMLElement;
    if (headerElement) {
      headerElement.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
    }
  }

  // Get cells in a specific row
  getRow(rowIndex: number): BingoCell[] {
    const startIndex = rowIndex * this.size;
    return this.board.cells.slice(startIndex, startIndex + this.size);
  }

  // Get all rows
  getRows(): number[] {
    return Array(this.size).fill(0).map((_, i) => i);
  }

  // Toggle cell selection (for preview mode)
  toggleCell(cell: BingoCell): void {
    if (!this.editable) {
      cell.selected = !cell.selected;
    }
  }

  // Toggle edit mode
  toggleEditMode(): void {
    this.editable = !this.editable;

    // Reset selection when entering preview mode
    if (!this.editable) {
      this.board.cells.forEach(cell => {
        cell.selected = false;
      });
    }
  }

  // Fill board with random content
  randomizeBoardContent(): void {
    this.randomizing = true;

    // Create placeholders for generic bingo items
    const placeholders = [
      "Goal achieved", "Team meeting", "Client call", "Coffee break",
      "Email sent", "Document signed", "Task completed", "Deadline met",
      "Bug fixed", "Feature launched", "Meeting scheduled", "Report filed",
      "Project update", "Sales target", "New client", "Design review",
      "Code merged", "Test passed", "Presentation ready", "Feedback received",
      "Invoice paid", "Contract renewed", "Issue resolved", "Milestone reached",
      "New lead", "Website update", "Customer praise", "Social media post",
      "Budget approved", "Team lunch", "Office supplies", "Technical support",
      "System outage", "Product demo", "New hire", "Video conference",
      "Network issue", "Database backup", "UI update", "Security patch",
      "Training session", "Market research", "A/B testing", "Customer feedback",
      "Roadmap planning", "Sprint review", "User interview", "Data migration",
      "Server restart", "API update", "Legal review", "PR merge"
    ];

    // Shuffle the placeholders
    const shuffled = [...placeholders].sort(() => 0.5 - Math.random());

    // Fill each cell with a placeholder
    this.board.cells.forEach((cell, index) => {
      cell.content = shuffled[index % shuffled.length];
    });

    this.randomizing = false;
  }

  // Clear all cell content
  clearBoard(): void {
    if (!confirm('Are you sure you want to clear the entire board?')) return;

    this.board.cells.forEach(cell => {
      cell.content = '';
      cell.selected = false;
    });
  }

  // Get formatted data for exporting/saving
  getFormattedData(): any {
    return {
      title: this.board.title,
      size: this.board.size,
      cells: this.board.cells.map(cell => ({
        id: cell.id,
        content: cell.content
      }))
    };
  }
}
