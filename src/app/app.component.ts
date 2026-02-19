import { Component, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ExecutionContextSnapshot, FlowConnection, FlowDefinition, FlowNode, MarkdownDocument, NodeType, ScriptSnippet } from './models/flow.model';
import { ContextChange, NodeTemplate } from './models/app-ui.model';
import { FlowEngineService } from './services/flow-engine.service';
import { FlowStorageService } from './services/flow-storage.service';
import { FlowValidationService } from './services/flow-validation.service';
import { AppHeaderComponent } from './components/app-header.component';
import { FlowWorkspaceComponent } from './components/flow-workspace.component';
import { MarkdownStudioModalComponent } from './components/markdown-studio-modal.component';
import { ContentManagerModalComponent } from './components/content-manager-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AppHeaderComponent,
    FlowWorkspaceComponent,
    MarkdownStudioModalComponent,
    ContentManagerModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  encapsulation: ViewEncapsulation.None
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
  failedNodeIds = new Set<string>();
  savedFlows: FlowDefinition[] = [];
  scriptLibrary: ScriptSnippet[] = [];
  markdownLibrary: MarkdownDocument[] = [];
  selectedMarkdownId = '';
  markdownDraftTitle = '';
  markdownDraftContent = '';
  markdownPreviewHtml: SafeHtml = '';
  showMarkdownStudio = false;
  scriptDraftName = '';
  selectedScriptId = '';
  tutorialStep = 0;
  showTutorial = localStorage.getItem('iv-flow-tutorial-hidden') !== 'true';
  darkMode = localStorage.getItem('iv-flow-theme') === 'dark';
  
  zoom = 1;
  panX = 0;
  panY = 0;
  showContentManager = false;
  panelSwapMode = false;
  panelZones: Record<string, "left" | "right" | "bottom"> = {
    palette: "left",
    savedFlows: "left",
    context: "left",
    connections: "left",
    properties: "right",
    validation: "bottom",
    logs: "bottom"
  };

  executionContext: Record<string, unknown> = {};
  contextHistory: ExecutionContextSnapshot[] = [];
  contextChangeLog: ContextChange[] = [];

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
    },
    {
      name: 'Demo mock server (almostnode style)',
      flow: {
        id: 'demo-3',
        name: 'Demo mock server (almostnode style)',
        updatedAt: new Date().toISOString(),
        nodes: [
          this.node('m1', 'start', 70, 180, 'Inicio'),
          this.node('m2', 'script', 290, 80, 'Registrar rutas mock', {
            script: [
              "server.get('/health', () => ({ ok: true, uptime: 'simulada' }));",
              "server.get('/users', () => ({ total: 2, users: ['Ada', 'Linus'] }));",
              "server.post('/users', (payload, ctx) => {",
              "  const body = (payload && typeof payload === 'object') ? payload : {};",
              "  ctx.createdUser = body.name ?? 'sin-nombre';",
              "  return { created: true, user: ctx.createdUser };",
              '});',
              'context.routesReady = server.listRoutes();',
              'return context.routesReady;'
            ].join('\n')
          }),
          this.node('m3', 'api', 520, 80, 'GET mock://health', { apiMethod: 'GET', apiUrl: 'mock://health' }),
          this.node('m4', 'api', 750, 80, 'GET mock://users', { apiMethod: 'GET', apiUrl: 'mock://users' }),
          this.node('m5', 'api', 520, 250, 'POST mock://users', {
            apiMethod: 'POST',
            apiUrl: 'mock://users',
            apiBody: '{"name":"Grace"}'
          }),
          this.node('m6', 'script', 970, 160, 'Consolidar respuestas', {
            script: [
              'context.summary = {',
              '  lastStatus: context.lastApiStatus,',
              '  lastResponse: context.lastApiResponse,',
              '  routes: context.routesReady,',
              '  createdUser: context.createdUser',
              '};',
              'return context.summary;'
            ].join('\n')
          }),
          this.node('m7', 'script', 1190, 160, 'Alert respuestas mock', {
            script: [
              'const summary = context.summary ?? {};',
              "const message = 'Resumen mock:\\n' + JSON.stringify(summary, null, 2);",
              'if (typeof alert === "function") {',
              '  alert(message);',
              '}',
              'return summary;'
            ].join('\n')
          }),
          this.node('m8', 'end', 1410, 160, 'Fin')
        ],
        connections: [
          { id: 'mc1', fromNodeId: 'm1', fromPort: 'default', toNodeId: 'm2' },
          { id: 'mc2', fromNodeId: 'm2', fromPort: 'default', toNodeId: 'm3' },
          { id: 'mc3', fromNodeId: 'm3', fromPort: 'default', toNodeId: 'm4' },
          { id: 'mc4', fromNodeId: 'm4', fromPort: 'default', toNodeId: 'm5' },
          { id: 'mc5', fromNodeId: 'm5', fromPort: 'default', toNodeId: 'm6' },
          { id: 'mc6', fromNodeId: 'm6', fromPort: 'default', toNodeId: 'm7' },
          { id: 'mc7', fromNodeId: 'm7', fromPort: 'default', toNodeId: 'm8' }
        ]
      }
    }
  ];

  constructor(
    private readonly storage: FlowStorageService,
    private readonly validator: FlowValidationService,
    private readonly engine: FlowEngineService,
    private readonly sanitizer: DomSanitizer
  ) {
    this.refreshSavedFlows();
    this.refreshScriptLibrary();
    this.refreshMarkdownLibrary();
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
    this.failedNodeIds.clear();
    this.logs = [];
    this.executionContext = {};
    this.contextHistory = [];
    this.contextChangeLog = [];

    const result = await this.engine.execute(this.currentFlow());
    result.visitedNodeIds.forEach((id) => this.activeNodeIds.add(id));
    result.failedNodeIds.forEach((id) => this.failedNodeIds.add(id));
    this.logs = result.logs.map((entry) => `[${entry.level.toUpperCase()}] ${entry.message}`);
    this.executionContext = result.context;
    this.contextHistory = result.contextHistory;
    this.contextChangeLog = this.contextChanges();
    this.running = false;
  }

  validateFlow(): void {
    this.validationErrors = this.validator.validate(this.currentFlow());
  }

  resetConsole(): void {
    this.logs = [];
  }

  togglePanelSwapMode(): void {
    this.panelSwapMode = !this.panelSwapMode;
  }

  movePanel(panelId: string, zone: "left" | "right" | "bottom"): void {
    this.panelZones = { ...this.panelZones, [panelId]: zone };
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
    this.executionContext = {};
    this.contextHistory = [];
    this.contextChangeLog = [];
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
    this.executionContext = {};
    this.contextHistory = [];
    this.contextChangeLog = [];
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

  exportFlowAsMarkdown(): void {
    const markdown = this.generateFlowMarkdown(this.currentFlow());
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.flowName.replace(/\s+/g, '-').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    this.logs.unshift(`Markdown exportado: ${this.flowName}.md`);
  }

  toggleMarkdownStudio(): void {
    this.showMarkdownStudio = !this.showMarkdownStudio;
    if (this.showMarkdownStudio) {
      this.renderMarkdownPreview();
    }
  }

  openMarkdownStudio(markdownId?: string): void {
    this.showMarkdownStudio = true;
    if (markdownId) {
      this.loadMarkdownForEditing(markdownId);
    } else {
      this.renderMarkdownPreview();
    }
  }

  generateMarkdownFromFlow(): void {
    const flow = this.currentFlow();
    this.markdownDraftTitle = `${flow.name} · Documentación`;
    this.markdownDraftContent = this.generateFlowMarkdown(flow);
    this.selectedMarkdownId = '';
    this.renderMarkdownPreview();
    this.logs.unshift('Borrador Markdown generado a partir del flujo actual.');
  }

  saveMarkdownDraft(): void {
    const title = this.markdownDraftTitle.trim();
    const content = this.markdownDraftContent.trim();
    if (!title || !content) {
      this.logs.unshift('Completa título y contenido antes de guardar el markdown.');
      return;
    }

    const markdown: MarkdownDocument = {
      id: this.selectedMarkdownId || this.id('md'),
      flowId: this.flowId,
      flowName: this.flowName,
      title,
      content,
      updatedAt: new Date().toISOString()
    };

    this.storage.saveMarkdown(markdown);
    this.selectedMarkdownId = markdown.id;
    this.refreshMarkdownLibrary();
    this.logs.unshift(`Markdown guardado en localStorage: ${title}`);
  }

  loadMarkdownForEditing(markdownId: string): void {
    const markdown = this.markdownLibrary.find((item) => item.id === markdownId);
    if (!markdown) {
      return;
    }

    this.selectedMarkdownId = markdown.id;
    this.markdownDraftTitle = markdown.title;
    this.markdownDraftContent = markdown.content;
    this.renderMarkdownPreview();
  }

  deleteMarkdown(markdownId: string): void {
    this.storage.deleteMarkdown(markdownId);
    if (this.selectedMarkdownId === markdownId) {
      this.selectedMarkdownId = '';
      this.markdownDraftTitle = '';
      this.markdownDraftContent = '';
      this.markdownPreviewHtml = '';
    }
    this.refreshMarkdownLibrary();
  }

  exportSelectedMarkdown(): void {
    const title = this.markdownDraftTitle.trim() || this.flowName;
    const content = this.markdownDraftContent.trim();
    if (!content) {
      this.logs.unshift('No hay contenido Markdown para exportar.');
      return;
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  renderMarkdownPreview(): void {
    this.markdownPreviewHtml = this.sanitizer.bypassSecurityTrustHtml(this.markdownToHtml(this.markdownDraftContent));
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
      'Paso 4: abre ejemplos para aprender nodos Script, Decisión y API.',
      'Paso 5: prueba el demo "mock server" para emular endpoints con mock:// y rutas en script.'
    ];
    return steps[this.tutorialStep] ?? 'Tutorial completado.';
  }

  nextTutorialStep(): void {
    this.tutorialStep += 1;
  }

  contextEntries(context?: Record<string, unknown>): { key: string; value: string }[] {
    if (!context) {
      return [];
    }

    return Object.entries(context).map(([key, value]) => ({
      key,
      value: this.serializeContextValue(value)
    }));
  }

  contextChanges(): ContextChange[] {
    const changes: ContextChange[] = [];
    let previousContext: Record<string, unknown> = {};

    for (const snapshot of this.contextHistory) {
      const previousEntries = new Map(Object.entries(previousContext).map(([key, value]) => [key, this.serializeContextValue(value)]));

      for (const [key, value] of Object.entries(snapshot.context)) {
        const serializedValue = this.serializeContextValue(value);
        if (previousEntries.get(key) !== serializedValue) {
          changes.push({
            nodeId: snapshot.nodeId,
            nodeLabel: snapshot.nodeLabel,
            key,
            value: serializedValue
          });
        }
      }

      previousContext = snapshot.context;
    }

    return changes;
  }

  private refreshMarkdownLibrary(): void {
    this.markdownLibrary = this.storage.listMarkdowns().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private generateFlowMarkdown(flow: FlowDefinition): string {
    const date = new Date(flow.updatedAt).toLocaleString('es-ES');
    const nodeTypeSummary = this.templates
      .map((template) => {
        const count = flow.nodes.filter((node) => node.type === template.type).length;
        return count > 0 ? `- **${template.label}**: ${count}` : '';
      })
      .filter(Boolean)
      .join('\n');

    const nodeSections = flow.nodes
      .map((node, index) => {
        const outgoing = flow.connections.filter((connection) => connection.fromNodeId === node.id);
        const incoming = flow.connections.filter((connection) => connection.toNodeId === node.id);
        const outgoingLines = outgoing.length
          ? outgoing
              .map((connection) => {
                const target = flow.nodes.find((item) => item.id === connection.toNodeId);
                const route = connection.fromPort === 'default' ? 'flujo principal' : `rama ${connection.fromPort}`;
                return `  - ${route} → **${target?.data.label ?? connection.toNodeId}**`;
              })
              .join('\n')
          : '  - Sin salidas';

        const technicalDetails = [
          node.type === 'decision' && node.data.condition ? `- Condición: \`${node.data.condition}\`` : '',
          node.type === 'script' && node.data.script ? `- Script:
\n\`\`\`ts\n${node.data.script}\n\`\`\`` : '',
          node.type === 'api' && node.data.apiUrl ? `- API: \`${node.data.apiMethod ?? 'GET'} ${node.data.apiUrl}\`` : ''
        ]
          .filter(Boolean)
          .join('\n');

        return `### ${index + 1}. ${node.data.label} (${node.type})\n\n${node.data.description ? `${node.data.description}\n\n` : ''}- Nodo ID: \`${node.id}\`\n- Entradas: ${incoming.length}\n- Salidas: ${outgoing.length}\n${technicalDetails ? `${technicalDetails}\n` : ''}\n**Transiciones**\n${outgoingLines}`;
      })
      .join('\n\n');

    const connectionMap = flow.connections
      .map((connection, index) => {
        const from = flow.nodes.find((node) => node.id === connection.fromNodeId);
        const to = flow.nodes.find((node) => node.id === connection.toNodeId);
        return `${index + 1}. **${from?.data.label ?? connection.fromNodeId}** (${connection.fromPort}) → **${to?.data.label ?? connection.toNodeId}**`;
      })
      .join('\n');

    return `# ${flow.name}\n\n> Documento generado automáticamente desde iv-flow para facilitar revisión funcional, técnica y de negocio.\n\n## Resumen ejecutivo\n\n- **Última actualización:** ${date}\n- **Nodos totales:** ${flow.nodes.length}\n- **Conexiones totales:** ${flow.connections.length}\n\n## Distribución por tipo de nodo\n\n${nodeTypeSummary || '- Sin nodos definidos.'}\n\n## Diseño detallado del flujo\n\n${nodeSections || 'Sin nodos para documentar.'}\n\n## Matriz de conexiones\n\n${connectionMap || 'No hay conexiones registradas.'}\n\n## Recomendaciones de calidad\n\n- Añade descripciones claras por nodo para mejorar mantenibilidad.\n- Incluye validaciones de errores en scripts y nodos API.\n- Versiona este markdown junto con cambios de negocio para trazabilidad.\n`;
  }

  private markdownToHtml(markdown: string): string {
    const escaped = this.escapeHtml(markdown);
    const blocks = escaped.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

    return blocks
      .map((block) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          const code = block.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
          return `<pre><code>${code}</code></pre>`;
        }

        if (block.startsWith('# ')) return `<h1>${this.inlineMarkdown(block.slice(2))}</h1>`;
        if (block.startsWith('## ')) return `<h2>${this.inlineMarkdown(block.slice(3))}</h2>`;
        if (block.startsWith('### ')) return `<h3>${this.inlineMarkdown(block.slice(4))}</h3>`;
        if (block.startsWith('> ')) return `<blockquote>${this.inlineMarkdown(block.slice(2))}</blockquote>`;

        if (block.split('\n').every((line) => line.trim().startsWith('- '))) {
          const items = block
            .split('\n')
            .map((line) => `<li>${this.inlineMarkdown(line.replace(/^-\s+/, ''))}</li>`)
            .join('');
          return `<ul>${items}</ul>`;
        }

        if (block.split('\n').every((line) => /^\d+\.\s+/.test(line.trim()))) {
          const items = block
            .split('\n')
            .map((line) => `<li>${this.inlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>`)
            .join('');
          return `<ol>${items}</ol>`;
        }

        return `<p>${this.inlineMarkdown(block).replace(/\n/g, '<br/>')}</p>`;
      })
      .join('');
  }

  private inlineMarkdown(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/_(.+?)_/g, '<em>$1</em>');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private serializeContextValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    const serialized = JSON.stringify(value, null, 2);
    return serialized ?? String(value);
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
    this.clearExecutionState();
    this.history.push(this.snapshot());
    if (this.history.length > 100) {
      this.history.shift();
    }
    this.future = [];
  }


  private clearExecutionState(): void {
    this.running = false;
    this.activeNodeIds.clear();
    this.failedNodeIds.clear();
    this.logs = [];
    this.validationErrors = [];
    this.executionContext = {};
    this.contextHistory = [];
    this.contextChangeLog = [];
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
