import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'censorEmail',
  standalone: true
})
export class CensorEmailPipe implements PipeTransform {
  transform(email: string | null): string {
    if (!email) return '';

    const parts = email.split('@');
    if (parts.length !== 2) return email; // Not a valid email format

    const username = parts[0];
    const domain = parts[1];

    // Censor the username part
    let censoredUsername: string;
    if (username.length <= 5) {
      // If username is 5 chars or less, censor all
      censoredUsername = '*'.repeat(username.length);
    } else {
      // If more than 5 chars, censor first 5 chars
      censoredUsername = '*'.repeat(5) + username.substring(5);
    }

    return `${censoredUsername}@${domain}`;
  }
}
