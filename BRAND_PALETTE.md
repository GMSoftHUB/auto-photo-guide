# Paleta visual aplicada

La interfaz fue ajustada para usar una identidad oscura y minimalista:

- Negro principal: `#000000`
- Gris fondo/superficie: `#171717`, `#262626`, `#404040`
- Blanco texto: `#FFFFFF`
- Verde limón principal: `#B6FF00`
- Verde limón highlight: `#D9FF3F`
- Verde limón oscuro/estado: `#84CC16`

## Archivos modificados

- `src/App.tsx`: siluetas, estados activos y textos de guía.
- `src/components/ErrorBoundary.tsx`: errores visuales sin rojo, usando verde limón/grises.
- `tailwind.config.js`: colores principales del tema.
- `src/index.css`: tokens base/sidebars alineados al verde limón.
- `src/App.css`: sombras de logos alineadas al verde limón.
- `dist/assets/*`: build preexistente actualizado para que el paquete servido refleje la nueva paleta.
