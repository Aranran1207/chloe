export class ChloeGlManager {
  private _gl: WebGLRenderingContext | WebGL2RenderingContext = null;

  public constructor() {}

  public initialize(canvas: HTMLCanvasElement): boolean {
    this._gl = canvas.getContext('webgl2');
    if (!this._gl) {
      this._gl = canvas.getContext('webgl');
    }
    if (!this._gl) {
      alert('Cannot initialize WebGL. This browser does not support.');
      return false;
    }
    return true;
  }

  public release(): void {}

  public getGl(): WebGLRenderingContext | WebGL2RenderingContext {
    return this._gl;
  }
}
