export interface FlowEntity {
  id: string;
  name: string;
  nodes: ReadonlyArray<{ id: string; label: string }>;
}
