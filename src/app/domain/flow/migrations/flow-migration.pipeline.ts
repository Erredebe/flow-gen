import { Injectable } from '@angular/core';

import { FLOW_SCHEMA_VERSION, Flow } from '../flow.types';
import { FlowMigration } from './flow-migration.interface';

@Injectable({
  providedIn: 'root'
})
export class FlowMigrationPipeline {
  private readonly migrations: ReadonlyArray<FlowMigration> = [new FlowMigration_0_9_0_to_1_0_0()];

  public migrate(flow: unknown): Flow {
    let current = flow;

    while (true) {
      const version = getSchemaVersion(current);
      if (version === FLOW_SCHEMA_VERSION) {
        return current as Flow;
      }

      const nextMigration = this.migrations.find((migration) => migration.from === version);
      if (!nextMigration) {
        return current as Flow;
      }

      current = nextMigration.migrate(current);
    }
  }
}

class FlowMigration_0_9_0_to_1_0_0 implements FlowMigration {
  public readonly from = '0.9.0';
  public readonly to = '1.0.0';

  public migrate(flow: unknown): unknown {
    if (!isRecord(flow)) {
      return flow;
    }

    const migratedNodes = Array.isArray(flow['nodes'])
      ? flow['nodes'].map((node) => this.migrateNode(node))
      : [];

    return {
      ...flow,
      schemaVersion: this.to,
      nodes: migratedNodes
    };
  }

  private migrateNode(node: unknown): unknown {
    if (!isRecord(node)) {
      return node;
    }

    const rawType = typeof node['nodeType'] === 'string' ? node['nodeType'] : node['type'];
    const nodeType = typeof rawType === 'string' ? rawType : 'action';

    const currentVersion = node['version'];
    const nodeVersion =
      typeof currentVersion === 'string' && currentVersion.trim() !== '' ? currentVersion : this.to;

    const config = isRecord(node['config']) ? node['config'] : {};

    const nodeWithoutLegacyType = Object.fromEntries(
      Object.entries(node).filter(([key]) => key !== 'type')
    );

    return {
      ...nodeWithoutLegacyType,
      nodeType,
      version: nodeVersion,
      config
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getSchemaVersion(flow: unknown): string | null {
  if (!isRecord(flow)) {
    return null;
  }

  const schemaVersion = flow['schemaVersion'];
  return typeof schemaVersion === 'string' ? schemaVersion : null;
}
