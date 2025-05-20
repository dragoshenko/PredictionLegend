import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BracketMatch {
  id: number;
  round: number;
  team1: string;
  team2: string;
  winner: string | null;
}

@Component({
  selector: 'app-simple-bracket-creator',
  templateUrl: './simple-bracket-creator.component.html',
  styleUrls: ['./simple-bracket-creator.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]  // Import CommonModule which includes NgClass, NgIf, etc.
})
export class SimpleBracketCreatorComponent implements OnInit, OnChanges {
  @Input() rounds: number = 3; // Default to 3 rounds (8 participants)

  firstRoundEntries: string[] = [];
  matches: BracketMatch[] = [];

  constructor() { }

  ngOnInit(): void {
    this.initializeBracket(this.rounds);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rounds']) {
      this.initializeBracket(this.rounds);
    }
  }

  // Initialize bracket data structure
  initializeBracket(numRounds: number): void {
    const totalParticipants = Math.pow(2, numRounds);
    this.firstRoundEntries = Array(totalParticipants).fill('');

    const totalMatches = Math.pow(2, numRounds) - 1;
    const newMatches: BracketMatch[] = [];

    let matchCounter = 1;

    // Create matches for each round
    for (let round = 1; round <= numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round);

      for (let i = 0; i < matchesInRound; i++) {
        newMatches.push({
          id: matchCounter++,
          round: round,
          team1: '',
          team2: '',
          winner: null
        });
      }
    }

    this.matches = newMatches;
  }

  // Update first round entries
  handleEntryChange(index: number, value: string): void {
    this.firstRoundEntries[index] = value;

    // Update the corresponding match
    const matchIndex = Math.floor(index / 2);
    const isFirstTeam = index % 2 === 0;

    const matchToUpdate = this.matches.find(m => m.round === 1 && m.id === matchIndex + 1);

    if (matchToUpdate) {
      if (isFirstTeam) {
        matchToUpdate.team1 = value;
      } else {
        matchToUpdate.team2 = value;
      }
    }
  }

  // Select winner and advance to next round
  selectWinner(matchId: number, team: string): void {
    // Find the current match
    const currentMatch = this.matches.find(m => m.id === matchId);
    if (!currentMatch) return;

    // Update the winner
    this.matches = this.matches.map(match => {
      if (match.id === matchId) {
        return { ...match, winner: team };
      }
      return match;
    });

    // Find the next match
    const currentRound = currentMatch.round;
    const nextRound = currentRound + 1;

    if (nextRound <= this.rounds) {
      // Calculate the next match ID and position
      const matchesInCurrentRound = Math.pow(2, this.rounds - currentRound);
      const currentMatchIndexInRound = (matchId - 1) % matchesInCurrentRound;
      const nextMatchIndexInRound = Math.floor(currentMatchIndexInRound / 2);
      const nextMatchId = matchesInCurrentRound / 2 + nextMatchIndexInRound + 1;

      // Find if this is the first or second team in the next match
      const isFirstTeam = currentMatchIndexInRound % 2 === 0;

      // Update the next match with the winner
      this.matches.forEach(match => {
        if (match.round === nextRound && match.id === nextMatchId) {
          if (isFirstTeam) {
            match.team1 = team;
          } else {
            match.team2 = team;
          }
        }
      });
    }
  }

  // Get matches for a specific round
  getMatchesByRound(round: number): BracketMatch[] {
    return this.matches.filter(m => m.round === round);
  }

  // Get final champion
  getFinalMatch() {
    return this.matches.find(m => m.round === this.rounds);
  }

  getFinalChampion(): string {
    const finalMatch = this.getFinalMatch();
    return finalMatch?.winner || '';
  }

  // Get round name
  getRoundName(round: number): string {
    if (round == this.rounds) return 'Final';
    if (round == this.rounds - 1) return 'Semifinals';
    if (round == this.rounds - 2) return 'Quarterfinals';
    return `Round ${round}`;
  }
  ngAfterViewInit() {
    // Add a class to the bracket based on number of rounds
    const bracketEl = document.querySelector('.bracket');
    if (bracketEl) {
      bracketEl.classList.add('rounds-' + this.rounds);
    }
  }

}
