import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RankingItem {
  id: number;
  name: string;
  rank: number;
}

interface RankingRow {
  id: number;
  items: RankingItem[];
}

@Component({
  selector: 'app-simple-ranking-creator',
  templateUrl: './simple-ranking-creator.component.html',
  styleUrls: ['./simple-ranking-creator.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SimpleRankingCreatorComponent implements OnInit, OnChanges {
  @Input() rows: number = 4;
  @Input() columns: number = 1;
  @Input() editable: boolean = true;

  rankingRows: RankingRow[] = [];

  constructor() { }

  ngOnInit(): void {
    this.initializeRankingGrid();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows'] || changes['columns']) {
      this.initializeRankingGrid();
    }
  }

  // Initialize the ranking grid
  initializeRankingGrid(): void {
    this.rankingRows = [];

    // Create rows
    for (let i = 0; i < this.rows; i++) {
      const rowItems: RankingItem[] = [];

      // Create one item per row initially
      rowItems.push({
        id: i + 1,
        name: '',
        rank: i + 1
      });

      this.rankingRows.push({
        id: i + 1,
        items: rowItems
      });
    }
  }

  // Toggle editing mode
  toggleEditMode(): void {
    this.editable = !this.editable;
  }

  // Add a new row
  addRow(): void {
    const newRowId = this.rankingRows.length + 1;

    this.rankingRows.push({
      id: newRowId,
      items: [{
        id: newRowId,
        name: '',
        rank: newRowId
      }]
    });

    this.rows = this.rankingRows.length;
  }

  // Remove the last row
  removeRow(): void {
    if (this.rankingRows.length > 1) {
      this.rankingRows.pop();
      this.rows = this.rankingRows.length;
    }
  }

  // Add an item to a specific row
  addItemToRow(rowId: number): void {
    const row = this.rankingRows.find(r => r.id === rowId);
    if (row) {
      const newItemId = row.items.length + 1 + (rowId-1) * 10;
      row.items.push({
        id: newItemId,
        name: '',
        rank: rowId
      });
    }
  }

  // Remove an item from a specific row
  removeItemFromRow(rowId: number, itemId: number): void {
    const row = this.rankingRows.find(r => r.id === rowId);
    if (row && row.items.length > 1) {
      row.items = row.items.filter(item => item.id !== itemId);
    }
  }

  // Get data in a format ready for submission
  getFormattedData(): any {
    return {
      ranks: this.rankingRows.map(row => ({
        position: row.id,
        items: row.items.map(item => ({
          id: item.id,
          name: item.name
        }))
      }))
    };
  }

  // Reset the grid to empty state
  resetGrid(): void {
    this.initializeRankingGrid();
  }

  // Handle name change for an item
  onItemNameChange(rowId: number, itemId: number, newName: string): void {
    const row = this.rankingRows.find(r => r.id === rowId);
    if (row) {
      const item = row.items.find(i => i.id === itemId);
      if (item) {
        item.name = newName;
      }
    }
  }

  // Save the ranking (to be implemented based on your API)
  saveRanking(): void {
    const formattedData = this.getFormattedData();
    console.log('Saving ranking data:', formattedData);
    // Here you would call your service to save the data
    alert('Ranking saved successfully!');
  }
}
