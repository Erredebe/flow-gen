# ADR 0001: Orquestación por casos de uso y DIP en Flow Editor

## Estado
Aceptado

## Contexto
La UI del editor estaba concentrando reglas de negocio (creación/conexión/borrado de nodos) y además persistía cambios de forma acoplada a infraestructura.
Esto dificulta escalar el dominio (nuevos repositorios, validaciones, reglas de grafo) y complica testear reglas sin Angular/UI.

## Decisión
1. Crear casos de uso unitarios en `src/app/application/flow` para operaciones atómicas del flujo:
   - `CreateNodeUseCase`
   - `ConnectNodesUseCase`
   - `DeleteNodeUseCase`
   - `ValidateFlowUseCase`
   - `LoadFlowUseCase`
   - `SaveFlowUseCase`
   - `ExportFlowJsonUseCase`
2. Mantener la UI consumiendo solo servicios de aplicación/estado, sin acceso directo a storage.
3. Inyectar dependencias por puertos (`FlowRepository`, `IdGenerator`) y resolver implementaciones en bootstrap.
4. Extraer reglas de negocio complejas a servicios de dominio puros (`flow-node.service`, `flow-graph.service`, `flow-schema-validator.service`).

## Consecuencias
### Positivas
- Menor acoplamiento entre UI y persistencia.
- Reglas de dominio reutilizables y fáciles de testear sin Angular.
- Preparado para agregar nuevos adaptadores (por ejemplo API REST) sin tocar casos de uso.

### Trade-offs
- Más archivos y capa de aplicación explícita.
- Requiere disciplina para no saltarse casos de uso desde componentes futuros.
