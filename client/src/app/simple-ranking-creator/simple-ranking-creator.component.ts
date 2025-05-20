import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, CdkDragHandle, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';

interface RankingItem {
  id: number;
  name: string;
  rank: number;
  description?: string;
}

interface RankingRow {
  id: number;
  title: string;
  items: RankingItem[];
}

@Component({
  selector: 'app-simple-ranking-creator',
  templateUrl: './simple-ranking-creator.component.html',
  styleUrls: ['./simple-ranking-creator.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDropList, CdkDrag, CdkDragHandle]
})
export class SimpleRankingCreatorComponent implements OnInit, OnChanges {
  @Input() rows: number = 3;
  @Input() columns: number = 1;
  @Input() editable: boolean = true;

  rankingRows: RankingRow[] = [];
  rankingData: any = {};
  isDragDisabled = false;

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

      // Create items for each column
      for (let j = 0; j < this.columns; j++) {
        rowItems.push({
          id: i * this.columns + j + 1,
          name: '',
          rank: i + 1
        });
      }

      this.rankingRows.push({
        id: i + 1,
        title: this.getRowTitle(i + 1),
        items: rowItems
      });
    }
  }

  // Get row title based on rank
  getRowTitle(rank: number): string {
    // This can be customized based on the type of ranking
    switch (rank) {
      case 1: return 'Top Tier';
      case 2: return 'High Tier';
      case 3: return 'Mid Tier';
      case 4: return 'Low Tier';
      case 5: return 'Bottom Tier';
      default: return `Tier ${rank}`;
    }
  }

  // Handle dropping items within a row
  onItemDrop(event: CdkDragDrop<RankingItem[]>, rowId: number): void {
    if (event.previousContainer === event.container) {
      // Reordering within the same row
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

      // Update item data after reordering
      this.updateItemRanks();
    }
  }

  // Handle row drops (reordering rows)
  onRowDrop(event: CdkDragDrop<RankingRow[]>): void {
    moveItemInArray(this.rankingRows, event.previousIndex, event.currentIndex);

    // Update row ranks after reordering
    this.updateRowRanks();
  }

  // Update item ranks after reordering
  updateItemRanks(): void {
    // If needed, update additional properties after reordering
    // This is where you could update visual indicators or data for submission
  }

  // Update row ranks after reordering
  updateRowRanks(): void {
    this.rankingRows.forEach((row, index) => {
      row.id = index + 1;
      row.title = this.getRowTitle(index + 1);

      // Update all items in this row to have the new rank
      row.items.forEach(item => {
        item.rank = index + 1;
      });
    });
  }

  // Add a new row
  addRow(): void {
    const newRowId = this.rankingRows.length + 1;
    const newItems: RankingItem[] = [];

    for (let j = 0; j < this.columns; j++) {
      newItems.push({
        id: (newRowId-1) * this.columns + j + 1,
        name: '',
        rank: newRowId
      });
    }

    this.rankingRows.push({
      id: newRowId,
      title: this.getRowTitle(newRowId),
      items: newItems
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
      const newItemId = row.items.length + 1 + (rowId-1) * this.columns;
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

  // Toggle editing mode
  toggleEditMode(): void {
    this.editable = !this.editable;
    this.isDragDisabled = !this.editable;
  }

  // Get data in a format ready for submission
  getFormattedData(): any {
    return {
      rows: this.rankingRows.map(row => ({
        id: row.id,
        title: row.title,
        items: row.items.map(item => ({
          id: item.id,
          name: item.name,
          rank: item.rank,
          description: item.description
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

  // Customize row title
  customizeRowTitle(rowId: number, newTitle: string): void {
    const row = this.rankingRows.find(r => r.id === rowId);
    if (row) {
      row.title = newTitle;
    }
  }
}
