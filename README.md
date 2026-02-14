# flow-gen

Proyecto base de **Flow Generator** construido con Angular moderno (standalone components + strict mode).

## Stack y decisiones

- Angular standalone con enrutado lazy por componente.
- TypeScript estricto (`strict` + `strictTemplates`).
- Estilos en SCSS.
- ESLint (Angular + TypeScript) + Prettier para consistencia de código.

## Arquitectura

```text
src/app/
├── core/            # servicios transversales, storage, utilidades
├── domain/          # entidades, value objects, contratos/puertos
├── application/     # casos de uso
├── features/
│   └── flow-editor/ # UI y estado del editor
└── shared/          # componentes, pipes y directivas reutilizables
```

### Capas

- **domain**: define el modelo de negocio sin dependencias del framework.
- **application**: orquesta reglas mediante casos de uso.
- **core**: implementaciones concretas de infraestructura compartida.
- **features**: pantalla y estado por capacidad funcional.
- **shared**: building blocks reusables para UI.

## Rutas iniciales

- `/editor`: editor principal.
- `/json`: vista de serialización JSON.
- `/settings`: configuración general.


## UX del editor y flujo inicial

- El editor permite crear nodos desde un selector de tipo (incluye todos los tipos registrados).
- Se añadieron atajos de teclado para eliminar selección (`Del` / `Supr` y `Backspace` fuera de inputs),
  siempre mostrando un diálogo de confirmación.
- La pantalla de Configuración y la vista JSON tienen una interfaz más clara para acciones de import/export y edición manual.
- El flujo inicial de ejemplo incluye todos los tipos de nodo (`start`, `action`, `function-node`, `tool-node`,
  `decision`, `end`) con metadatos y `config` explicativos para entender su uso real.

## Comandos

```bash
npm install
npm start
npm run build
npm run lint
npm run format
```

## Calidad y deuda técnica

Se incluyen reglas para prevenir deuda técnica habitual:

- Sin `any` explícito.
- Sin imports cíclicos.
- Sin exports por defecto.
- Tipado consistente en imports.
- Reglas de accesibilidad de templates Angular.

Además, el formateo está centralizado en Prettier para minimizar diffs de estilo.

## Criterios de aceptación funcionales (MVP)

El MVP del generador de flujos se considera aceptado cuando cumple lo siguiente:

- **Creación y edición del flujo**
  - Permite crear nodos de tipo acción, decisión y final desde la barra del editor.
  - Permite editar nombre del flujo, etiqueta, condición y metadatos JSON de un nodo.
  - Permite mover nodos en el canvas y persistir su posición.
- **Conexiones y reglas del dominio**
  - Permite crear conexiones entre nodos desde el panel de propiedades.
  - Impide conexiones duplicadas o auto-conexiones.
  - Valida reglas de dominio: tipos de conexión, límites de salidas por nodo, ramas true/false en decisiones y detección de ciclos.
- **Persistencia y portabilidad**
  - Guarda automáticamente el flujo en almacenamiento local.
  - Carga el último flujo disponible al inicializar la aplicación.
  - Permite exportar el flujo a JSON con formato legible.
  - Permite importar JSON validando primero esquema y reglas de dominio.
- **Calidad mínima automatizada**
  - Cada cambio ejecuta lint y tests en CI.
  - El pipeline debe pasar para considerar el cambio integrable.
