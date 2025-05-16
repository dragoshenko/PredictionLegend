import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'censorEmail',
  standalone: true
})
export class CensorEmailPipe implements PipeTransform {
  transform(email: string | null): string {
    if (!email)
      return '';

    const parts = email.split('@');
    if (parts.length !== 2)
      return email; // not valid email

    const username = parts[0];
    const domain = parts[1];

    //censor the last 8 characters of the username
    let censoredUsername: string;
    if (username.length <= 8) {
      // if username is 8 chars or less, censor all
      censoredUsername = '*'.repeat(username.length);
    } else {
      //keep the beginning, censor the last 8 characters
      const visiblePart = username.substring(0, username.length - 8);
      censoredUsername = visiblePart + '*'.repeat(8);
    }

    return `${censoredUsername}@${domain}`;
  }
}
