// `tsc` ne lit pas les SFC et vue-tsc ne démarre pas avec TypeScript 6 : les composants que les tests montent
// y sont typés comme un composant quelconque.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent
  export default component
}
