# Matemática UNSE - Plataforma de Práctica Ingreso 2027

Aplicación web de práctica y ejercitación para el examen de ingreso de Matemática de la Universidad Nacional de Santiago del Estero (UNSE), desarrollada a partir de la cartilla oficial 2027.

La plataforma funciona 100% en el cliente (sin backend ni base de datos externa). Todo el progreso, historial de intentos y configuración se guardan de forma local en el navegador usando IndexedDB, permitiendo estudiar sin conexión a internet y exportar los datos en JSON para moverlos a otra computadora.

---

## Módulos incluidos

El contenido está dividido en las 7 unidades de la cartilla universitaria:

1. **Lógica proposicional**: proposiciones simples y compuestas, conectivos lógicos ($\neg, \land, \lor, \Rightarrow, \Leftrightarrow$), tablas de verdad, tautologías, contradicciones y contingencias.
2. **Teoría de conjuntos**: pertenencia, inclusión, operaciones entre conjuntos (unión, intersección, diferencia, complemento) y cardinalidad.
3. **Conjuntos numéricos**: operaciones en $\mathbb{N}, \mathbb{Z}, \mathbb{Q}, \mathbb{R}$, propiedades de potencias y raíces, operaciones con radicales e intervalos en la recta real.
4. **Relaciones y funciones**: producto cartesiano, dominio, codominio e imagen, análisis de funciones lineales, cuadráticas y racionales.
5. **Expresiones algebraicas**: polinomios, operaciones algebraicas, casos de factoreo (factor común, diferencia de cuadrados, trinomio cuadrado perfecto) y simplificación.
6. **Geometría plana**: teorema de Pitágoras, perímetros, áreas (triángulos, cuadriláteros, círculos) y razones trigonométricas básicas.
7. **Trigonometría**: razones en el triángulo rectángulo, ángulos en posición normal, identidades fundamentales ($\sin^2 \theta + \cos^2 \theta = 1$) y resolución de problemas.

---

## Características técnicas

- **Aritmética exacta**: Las operaciones racionales se resuelven mediante una clase `Fraction` con `BigInt`, evitando errores de aproximación por coma flotante en fracciones y radicales.
- **Generación determinista y validada**: Cada ejercicio se genera a partir de semillas pseudoaleatorias (PRNG Mulberry32) y pasa por una rutina de verificación matemática independiente antes de mostrarse en pantalla.
- **Sistema antirrepetición**: Evita mostrar el mismo ejercicio en una sesión y prioriza variantes no resueltas.
- **Scoreboard y perfiles locales**: Permite ingresar un nombre de usuario o continuar como anónimo para registrar puntuación (ponderada por dificultad) y tiempo de estudio.
- **Respaldo de datos**: Exportación e importación transaccional en archivos `.json` desde la sección de ajustes.
- **Renderizado matemático**: Fórmulas renderizadas con KaTeX y teclado virtual de símbolos matemáticos.

---

## Tecnologías utilizadas

- **Framework**: Next.js 16 (App Router con `output: 'export'`)
- **UI & Estilos**: React 19, Tailwind CSS v4
- **Lenguaje**: TypeScript en modo estricto
- **Fórmulas**: KaTeX
- **Almacenamiento**: IndexedDB con Dexie.js v4
- **Validación de esquemas**: Zod
- **Testing**: Vitest + Testing Library

---

## Acceso en línea

La aplicación se encuentra desplegada y lista para usar en:

👉 **[https://matematicas-unse.vercel.app/](https://matematicas-unse.vercel.app/)**

No requiere registro previo ni instalación. Al ingresar, todo el progreso y las estadísticas se gestionan directamente en tu navegador.

---

## Autor

Desarrollado por [thxmasdev](https://github.com/thxmasdev).

---

## Licencia

Este proyecto fue desarrollado con fines educativos y de preparación académica para ingresantes a carreras de ingeniería y ciencias exactas de la UNSE.
