/// <reference types="vite/client" />
/// <reference types="vite-plugin-hmrify/client" />

declare module "*.yml" {
  const content: any;
  export default content;
}
