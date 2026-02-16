import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlowConnection, FlowDefinition, FlowNode, NodeType, ScriptSnippet } from './models/flow.model';
import { FlowEngineService } from './services/flow-engine.service';
import { FlowStorageService } from './services/flow-storage.service';
import { FlowValidationService } from './services/flow-validation.service';

interface NodeTemplate {
  type: NodeType;
  label: string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'iv-flow';
  flowId = this.id('flow');
  flowName = 'Mi flujo';
  nodes: FlowNode[] = [];
  connections: FlowConnection[] = [];
  selectedNodeId?: string;
  selectedConnectionId?: string;
  connectingFrom?: { nodeId: string; fromPort: FlowConnection['fromPort'] };
  logs: string[] = [];
  validationErrors: string[] = [];
  running = false;
  activeNodeIds = new Set<string>();
  savedFlows: FlowDefinition[] = [];
  scriptLibrary: ScriptSnippet[] = [];
  scriptDraftName = '';
  selectedScriptId = '';
  tutorialStep = 0;
  showTutorial = localStorage.getItem('iv-flow-tutorial-hidden') !== 'true';
  darkMode = localStorage.getItem('iv-flow-theme') === 'dark';
  
  zoom = 1;
  panX = 0;
  panY = 0;
  showContentManager = false;

  private history: { nodes: FlowNode[]; connections: FlowConnection[]; flowName: string }[] = [];
  private future: { nodes: FlowNode[]; connections: FlowConnection[]; flowName: string }[] = [];

  readonly templates: NodeTemplate[] = [
    { type: 'start', label: 'Inicio', color: '#16a34a', icon: '▶' },
    { type: 'task', label: 'Tarea', color: '#2563eb', icon: '⚙' },
    { type: 'decision', label: 'Decisión', color: '#f59e0b', icon: '⎇' },
    { type: 'script', label: 'Script', color: '#7c3aed', icon: '</>' },
    { type: 'api', label: 'API/IA', color: '#0d9488', icon: '☁' },
    { type: 'end', label: 'Fin', color: '#dc2626', icon: '■' }
  ];

  readonly demos: { name: string; flow: FlowDefinition }[] = [
    {
      name: 'Demo secuencial',
      flow: {
        id: 'demo-1',
        name: 'Demo secuencial',
        updatedAt: new Date().toISOString(),
        nodes: [
          this.node('n1', 'start', 120, 120, 'Inicio'),
          this.node('n2', 'task', 360, 120, 'Procesar datos'),
          this.node('n3', 'end', 600, 120, 'Fin')
        ],
        connections: [
          { id: 'c1', fromNodeId: 'n1', fromPort: 'default', toNodeId: 'n2' },
          { id: 'c2', fromNodeId: 'n2', fromPort: 'default', toNodeId: 'n3' }
        ]
      }
    },
    {
      name: 'Demo decisión + script',
      flow: {
        id: 'demo-2',
        name: 'Demo decisión + script',
        updatedAt: new Date().toISOString(),
        nodes: [
          this.node('d1', 'start', 80, 120, 'Inicio'),
          this.node('d2', 'script', 300, 120, 'Calcular score', { script: 'context.score = 8; return context.score;' }),
          this.node('d3', 'decision', 530, 120, '¿score > 5?', { condition: 'context.score > 5' }),
          this.node('d4', 'task', 760, 60, 'Ruta true'),
          this.node('d5', 'task', 760, 190, 'Ruta false'),
          this.node('d6', 'end', 980, 120, 'Fin')
        ],
        connections: [
          { id: 'dc1', fromNodeId: 'd1', fromPort: 'default', toNodeId: 'd2' },
          { id: 'dc2', fromNodeId: 'd2', fromPort: 'default', toNodeId: 'd3' },
          { id: 'dc3', fromNodeId: 'd3', fromPort: 'true', toNodeId: 'd4' },
          { id: 'dc4', fromNodeId: 'd3', fromPort: 'false', toNodeId: 'd5' },
          { id: 'dc5', fromNodeId: 'd4', fromPort: 'default', toNodeId: 'd6' },
          { id: 'dc6', fromNodeId: 'd5', fromPort: 'default', toNodeId: 'd6' }
        ]
      }
    }
  ];

  constructor(
    private readonly storage: FlowStorageService,
    private readonly validator: FlowValidationService,
    private readonly engine: FlowEngineService
  ) {
    this.refreshSavedFlows();
    this.refreshScriptLibrary();
  }

  addNode(type: NodeType): void {
    this.pushHistory();

    if (type === 'start' && this.nodes.some((node) => node.type === 'start')) {
      this.logs.unshift('Solo se permite un nodo Inicio.');
      return;
    }

    const template = this.templates.find((item) => item.type === type);
    const index = this.nodes.length;
    const x = 80 + (index % 5) * 180;
    const y = 80 + Math.floor(index / 5) * 120;
    this.nodes.push(this.node(this.id('node'), type, x, y, template?.label ?? type));
  }

  onNodeClick(nodeId: string): void {
    if (this.connectingFrom) {
      this.completeConnect(nodeId);
      return;
    }

    this.selectNode(nodeId);
  }

  selectNode(nodeId: string): void {
    this.selectedNodeId = nodeId;
    this.selectedConnectionId = undefined;
  }

  deleteSelectedNode(): void {
    if (!this.selectedNodeId) {
      return;
    }
    this.pushHistory();
    this.nodes = this.nodes.filter((node) => node.id !== this.selectedNodeId);
    this.connections = this.connections.filter(
      (connection) => connection.fromNodeId !== this.selectedNodeId && connection.toNodeId !== this.selectedNodeId
    );
    this.selectedNodeId = undefined;
    this.selectedConnectionId = undefined;
  }

  startConnect(nodeId: string, fromPort: FlowConnection['fromPort']): void {
    this.connectingFrom = { nodeId, fromPort };
  }

  completeConnect(targetNodeId: string): void {
    if (!this.connectingFrom || this.connectingFrom.nodeId === targetNodeId) {
      return;
    }

    const duplicate = this.connections.some(
      (connection) =>
        connection.fromNodeId === this.connectingFrom?.nodeId &&
        connection.fromPort === this.connectingFrom?.fromPort &&
        connection.toNodeId === targetNodeId
    );

    if (duplicate) {
      this.logs.unshift('Esta conexión ya existe.');
      this.connectingFrom = undefined;
      return;
    }

    this.pushHistory();
    this.connections.push({
      id: this.id('conn'),
      fromNodeId: this.connectingFrom.nodeId,
      fromPort: this.connectingFrom.fromPort,
      toNodeId: targetNodeId
    });
    this.connectingFrom = undefined;
  }

  removeConnection(connectionId: string): void {
    this.pushHistory();
    this.connections = this.connections.filter((connection) => connection.id !== connectionId);
    if (this.selectedConnectionId === connectionId) {
      this.selectedConnectionId = undefined;
    }
  }

  cancelConnect(): void {
    this.connectingFrom = undefined;
  }

  get selectedNode(): FlowNode | undefined {
    return this.nodes.find((node) => node.id === this.selectedNodeId);
  }


  selectConnection(connectionId: string): void {
    this.selectedConnectionId = connectionId;
    this.selectedNodeId = undefined;
  }

  get selectedConnection(): FlowConnection | undefined {
    return this.connections.find((connection) => connection.id === this.selectedConnectionId);
  }

  nodeLabel(nodeId: string): string {
    return this.nodes.find((node) => node.id === nodeId)?.data.label ?? nodeId;
  }

  get connectingHint(): string {
    if (!this.connectingFrom) {
      return 'Selecciona una salida y luego haz click en el nodo destino.';
    }

    return `Conectando desde ${this.connectingFrom.nodeId} (${this.connectingFrom.fromPort}). Haz click sobre un nodo destino.`;
  }

  getNodeColor(type: NodeType): string {
    return this.templates.find((item) => item.type === type)?.color ?? '#334155';
  }

  updateNode(): void {
    this.pushHistory();
    this.nodes = [...this.nodes];
  }

  updateConnection(): void {
    this.pushHistory();
    this.connections = [...this.connections];
  }

  saveCurrentScript(): void {
    if (!this.selectedNode || this.selectedNode.type !== 'script') {
      return;
    }

    const scriptContent = this.selectedNode.data.script?.trim();
    const name = this.scriptDraftName.trim();
    if (!scriptContent || !name) {
      this.logs.unshift('Debes completar nombre y contenido del script para guardarlo.');
      return;
    }

    this.storage.saveScript({
      id: this.id('script'),
      name,
      content: scriptContent,
      updatedAt: new Date().toISOString()
    });
    this.scriptDraftName = '';
    this.refreshScriptLibrary();
    this.logs.unshift(`Script guardado: ${name}`);
  }

  applySavedScript(scriptId: string): void {
    if (!this.selectedNode || this.selectedNode.type !== 'script') {
      return;
    }

    const script = this.scriptLibrary.find((item) => item.id === scriptId);
    if (!script) {
      return;
    }

    this.pushHistory();
    this.selectedNode.data.script = script.content;
    this.selectedNode.data.label = script.name;
    this.nodes = [...this.nodes];
    this.logs.unshift(`Script aplicado: ${script.name}`);
  }

  deleteSavedScript(scriptId: string): void {
    this.storage.deleteScript(scriptId);
    this.refreshScriptLibrary();
  }

  async runFlow(): Promise<void> {
    this.validationErrors = this.validator.validate(this.currentFlow());
    if (this.validationErrors.length) {
      return;
    }

    this.running = true;
    this.activeNodeIds.clear();
    this.logs = [];

    const result = await this.engine.execute(this.currentFlow());
    result.visitedNodeIds.forEach((id) => this.activeNodeIds.add(id));
    this.logs = result.logs.map((entry) => `[${entry.level.toUpperCase()}] ${entry.message}`);
    this.running = false;
  }

  validateFlow(): void {
    this.validationErrors = this.validator.validate(this.currentFlow());
  }

  saveFlow(): void {
    const flow = this.currentFlow();
    this.storage.saveFlow(flow);
    this.refreshSavedFlows();
    this.logs.unshift(`Flujo guardado: ${flow.name}`);
  }

  saveAsNewFlow(): void {
    this.flowId = this.id('flow');
    this.saveFlow();
  }

  newFlow(): void {
    this.pushHistory();
    this.flowId = this.id('flow');
    this.flowName = 'Nuevo flujo';
    this.nodes = [];
    this.connections = [];
    this.selectedNodeId = undefined;
    this.selectedConnectionId = undefined;
    this.validationErrors = [];
    this.connectingFrom = undefined;
  }

  deleteFlow(flowId: string): void {
    this.storage.deleteFlow(flowId);
    this.refreshSavedFlows();
  }

  loadFlow(flowId: string): void {
    const flow = this.savedFlows.find((item) => item.id === flowId);
    if (!flow) {
      return;
    }
    this.pushHistory();
    this.flowName = flow.name;
    this.flowId = flow.id;
    this.nodes = structuredClone(flow.nodes);
    this.connections = structuredClone(flow.connections);
    this.selectedNodeId = undefined;
    this.selectedConnectionId = undefined;
    this.validationErrors = [];
  }

  loadDemo(index: number): void {
    const demo = this.demos[index];
    this.pushHistory();
    this.flowName = demo.flow.name;
    this.flowId = this.id('flow');
    this.nodes = structuredClone(demo.flow.nodes);
    this.connections = structuredClone(demo.flow.connections);
    this.selectedNodeId = undefined;
    this.selectedConnectionId = undefined;
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('iv-flow-theme', this.darkMode ? 'dark' : 'light');
  }

  exportFlow(): void {
    const payload = JSON.stringify(this.currentFlow(), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.flowName.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importFlow(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    file.text().then((text) => {
      const flow = JSON.parse(text) as FlowDefinition;
      this.pushHistory();
      this.flowName = flow.name;
      this.flowId = flow.id;
      this.nodes = flow.nodes;
      this.connections = flow.connections;
      this.selectedNodeId = undefined;
      this.selectedConnectionId = undefined;
      this.logs.unshift(`Flujo importado: ${flow.name}`);
    });
  }

  zoomIn(): void {
    this.zoom = Math.min(this.zoom + 0.1, 2);
  }

  zoomOut(): void {
    this.zoom = Math.max(this.zoom - 0.1, 0.4);
  }

  resetZoom(): void {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
  }

  onWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    }
  }

  toggleContentManager(): void {
    this.showContentManager = !this.showContentManager;
  }

  closeTutorial(): void {
    this.showTutorial = false;
    localStorage.setItem('iv-flow-tutorial-hidden', 'true');
  }

  undo(): void {
    const snapshot = this.history.pop();
    if (!snapshot) {
      return;
    }

    this.future.push(this.snapshot());
    this.nodes = snapshot.nodes;
    this.connections = snapshot.connections;
    this.flowName = snapshot.flowName;
    this.selectedNodeId = undefined;
    this.selectedConnectionId = undefined;
  }

  redo(): void {
    const snapshot = this.future.pop();
    if (!snapshot) {
      return;
    }

    this.history.push(this.snapshot());
    this.nodes = snapshot.nodes;
    this.connections = snapshot.connections;
    this.flowName = snapshot.flowName;
    this.selectedNodeId = undefined;
    this.selectedConnectionId = undefined;
  }

  onNodeDrag(event: MouseEvent, node: FlowNode): void {
    const startX = event.clientX;
    const startY = event.clientY;
    const originalX = node.x;
    const originalY = node.y;
    this.pushHistory();

    const move = (moveEvent: MouseEvent): void => {
      node.x = originalX + (moveEvent.clientX - startX) / this.zoom;
      node.y = originalY + (moveEvent.clientY - startY) / this.zoom;
      this.nodes = [...this.nodes];
    };

    const up = (): void => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  connectionPath(connection: FlowConnection): string {
    const from = this.nodes.find((node) => node.id === connection.fromNodeId);
    const to = this.nodes.find((node) => node.id === connection.toNodeId);
    if (!from || !to) {
      return '';
    }

    const x1 = from.x + 140;
    const y1 = from.y + 35;
    const x2 = to.x;
    const y2 = to.y + 35;
    const cp1 = x1 + 70;
    const cp2 = x2 - 70;
    return `M ${x1} ${y1} C ${cp1} ${y1}, ${cp2} ${y2}, ${x2} ${y2}`;
  }

  tutorialText(): string {
    const steps = [
      'Paso 1: agrega un nodo Inicio desde la paleta.',
      'Paso 2: agrega un nodo Tarea y conéctalo.',
      'Paso 3: agrega un nodo Fin y ejecuta el flujo.',
      'Paso 4: abre ejemplos para aprender nodos Script, Decisión y API.'
    ];
    return steps[this.tutorialStep] ?? 'Tutorial completado.';
  }

  nextTutorialStep(): void {
    this.tutorialStep += 1;
  }

  private currentFlow(): FlowDefinition {
    return {
      id: this.flowId,
      name: this.flowName,
      nodes: structuredClone(this.nodes),
      connections: structuredClone(this.connections),
      updatedAt: new Date().toISOString()
    };
  }

  private refreshSavedFlows(): void {
    this.savedFlows = this.storage.listFlows();
  }

  private refreshScriptLibrary(): void {
    this.scriptLibrary = this.storage.listScripts();
  }

  private pushHistory(): void {
    this.history.push(this.snapshot());
    if (this.history.length > 100) {
      this.history.shift();
    }
    this.future = [];
  }

  private snapshot(): { nodes: FlowNode[]; connections: FlowConnection[]; flowName: string } {
    return {
      nodes: structuredClone(this.nodes),
      connections: structuredClone(this.connections),
      flowName: this.flowName
    };
  }

  private node(id: string, type: NodeType, x: number, y: number, label: string, data?: Partial<FlowNode['data']>): FlowNode {
    return {
      id,
      type,
      x,
      y,
      data: {
        label,
        description: '',
        condition: type === 'decision' ? 'true' : undefined,
        script: type === 'script' ? 'return context;' : undefined,
        apiMethod: 'GET',
        ...data
      }
    };
  }

  private id(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
