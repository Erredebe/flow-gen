import { Injectable } from '@angular/core';

import { IdGenerator } from '../../domain/ports/id-generator.port';

@Injectable({
  providedIn: 'root'
})
export class UuidIdGeneratorService extends IdGenerator {
  public next(prefix: string): string {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
}
