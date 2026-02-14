import { Injectable, signal } from '@angular/core';

import { FlowEntity } from '../../../domain/entities/flow.entity';

@Injectable({
  providedIn: 'root'
})
export class FlowEditorStateService {
  private readonly draft = signal<FlowEntity>({
    id: 'draft-flow',
    name: 'Untitled flow',
    nodes: []
  });

  public getDraft(): FlowEntity {
    return this.draft();
  }
}
