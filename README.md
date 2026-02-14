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
