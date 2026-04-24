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
    minimizeApp: () => void;
    getWindowPosition: () => Promise<[number, number]>;
    setWindowPosition: (x: number, y: number) => void;
    getWindowSize: () => Promise<[number, number]>;
    setWindowSize: (width: number, height: number) => void;
    startGlobalMouseTracking: () => void;
    stopGlobalMouseTracking: () => void;
    onGlobalMouseMove: (callback: (data: { x: number; y: number }) => void) => void;
    getConfig: () => Promise<any>;
    setConfig: (config: any) => Promise<void>;
    openFolderDialog: () => Promise<string | undefined>;
    getModelList: () => Promise<Array<{ name: string; path: string; file: string }>>;
    getIgnoreMouseEvents: () => Promise<boolean>;
    setIgnoreMouseEvents: (ignore: boolean) => void;
    onIgnoreMouseEventsChanged: (callback: (ignore: boolean) => void) => void;
    memory: {
      add: (memoryData: any) => Promise<any>;
      getAll: () => Promise<any[]>;
      getByCategory: (category: string) => Promise<any[]>;
      update: (id: string, updates: any) => Promise<any>;
      delete: (id: string) => Promise<boolean>;
      clearAll: () => Promise<boolean>;
      getStats: () => Promise<any>;
      searchByEmbedding: (embedding: number[], topK: number) => Promise<any[]>;
    };
  };
}
