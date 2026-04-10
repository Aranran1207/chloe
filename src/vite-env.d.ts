/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI?: {
    startDrag: (x: number, y: number) => void;
    drag: (x: number, y: number) => void;
    endDrag: () => void;
    quitApp: () => void;
  };
}
