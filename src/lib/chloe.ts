import { CubismFramework, Option } from '../framework/live2dcubismframework';
import { CubismMatrix44 } from '../framework/math/cubismmatrix44';
import { CubismViewMatrix } from '../framework/math/cubismviewmatrix';

import { ChloeLive2DConfig, DefaultConfig } from './define';
import { ChloePal } from './pal';
import { ChloeGlManager } from './glmanager';
import { ChloeTextureManager } from './texturemanager';
import { ChloeModel } from './model';

export class ChloeLive2D {
  private static _instance: ChloeLive2D;

  private _config: ChloeLive2DConfig;
  private _canvas: HTMLCanvasElement;
  private _glManager: ChloeGlManager;
  private _textureManager: ChloeTextureManager;
  private _model: ChloeModel;
  private _viewMatrix: CubismViewMatrix;
  private _deviceToScreen: CubismMatrix44;
  private _frameBuffer: WebGLFramebuffer;
  private _cubismOption: Option;
  private _initialized: boolean;
  private _running: boolean;
  private _animationFrameId: number;

  private constructor() {
    this._config = { ...DefaultConfig };
    this._canvas = null;
    this._glManager = new ChloeGlManager();
    this._textureManager = new ChloeTextureManager();
    this._model = null;
    this._viewMatrix = new CubismViewMatrix();
    this._deviceToScreen = new CubismMatrix44();
    this._cubismOption = new Option();
    this._initialized = false;
    this._running = false;
    this._animationFrameId = null;
  }

  public static getInstance(): ChloeLive2D {
    if (!ChloeLive2D._instance) {
      ChloeLive2D._instance = new ChloeLive2D();
    }
    return ChloeLive2D._instance;
  }

  public configure(config: ChloeLive2DConfig): void {
    this._config = { ...DefaultConfig, ...config };
  }

  public initialize(canvas: HTMLCanvasElement): boolean {
    if (this._initialized) {
      return true;
    }

    this._canvas = canvas;

    if (!this._glManager.initialize(canvas)) {
      return false;
    }

    if (this._config.canvasSize === 'auto') {
      this.resizeCanvas();
    } else {
      canvas.width = this._config.canvasSize.width;
      canvas.height = this._config.canvasSize.height;
    }

    this._textureManager.setGlManager(this._glManager);

    const gl = this._glManager.getGl();
    this._frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.initializeView();

    ChloePal.updateTime();
    this._cubismOption.logFunction = ChloePal.printMessage;
    this._cubismOption.loggingLevel = this._config.loggingLevel;
    CubismFramework.startUp(this._cubismOption);
    CubismFramework.initialize();

    this._initialized = true;
    return true;
  }

  private initializeView(): void {
    const { width, height } = this._canvas;
    const ratio = width / height;
    const left = -ratio;
    const right = ratio;
    const bottom = this._config.viewLogicalBottom;
    const top = this._config.viewLogicalTop;

    this._viewMatrix.setScreenRect(left, right, bottom, top);
    this._viewMatrix.scale(this._config.viewScale, this._config.viewScale);

    this._deviceToScreen.loadIdentity();
    if (width > height) {
      const screenW = Math.abs(right - left);
      this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
    } else {
      const screenH = Math.abs(top - bottom);
      this._deviceToScreen.scaleRelative(screenH / height, -screenH / height);
    }
    this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

    this._viewMatrix.setMaxScale(this._config.viewMaxScale);
    this._viewMatrix.setMinScale(this._config.viewMinScale);
    this._viewMatrix.setMaxScreenRect(
      this._config.viewLogicalLeft * 2,
      this._config.viewLogicalRight * 2,
      this._config.viewLogicalBottom * 2,
      this._config.viewLogicalTop * 2
    );
  }

  private resizeCanvas(): void {
    this._canvas.width = this._canvas.clientWidth * window.devicePixelRatio;
    this._canvas.height = this._canvas.clientHeight * window.devicePixelRatio;
    const gl = this._glManager.getGl();
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  public loadModel(modelPath: string, modelFileName: string): void {
    if (!this._initialized) {
      throw new Error('ChloeLive2D not initialized. Call initialize() first.');
    }

    this._model = new ChloeModel(this);
    this._model.loadAssets(modelPath, modelFileName);
  }

  public start(): void {
    if (this._running) {
      return;
    }

    this._running = true;
    this.animate();
  }

  public stop(): void {
    this._running = false;
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  private animate(): void {
    if (!this._running) {
      return;
    }

    this.update();
    this.render();

    this._animationFrameId = requestAnimationFrame(() => this.animate());
  }

  public update(): void {
    if (!this._initialized) {
      return;
    }

    ChloePal.updateTime();

    if (this._model) {
      this._model.update();
    }
  }

  public render(): void {
    if (!this._initialized || !this._model) {
      return;
    }

    const gl = this._glManager.getGl();

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearDepth(1.0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const { width, height } = this._canvas;
    const projection = new CubismMatrix44();

    if (this._model.getModel()) {
      if (this._model.getModel().getCanvasWidth() > 1.0 && width < height) {
        this._model.getModelMatrix().setWidth(2.0);
        projection.scale(1.0, width / height);
      } else {
        projection.scale(height / width, 1.0);
      }
      projection.multiplyByMatrix(this._viewMatrix);
    }

    this._model.draw(projection);
  }

  public setDragging(x: number, y: number): void {
    if (this._model) {
      this._model.setDragging(x, y);
    }
  }

  public onTap(x: number, y: number): void {
    if (this._model) {
      const viewX = this.transformViewX(x);
      const viewY = this.transformViewY(y);
      
      if (this._model.hitTest('Head', viewX, viewY)) {
        this._model.setRandomExpression();
      } else if (this._model.hitTest('Body', viewX, viewY)) {
        this._model.startRandomMotion('TapBody', 2);
      }
    }
  }

  private transformViewX(deviceX: number): number {
    const screenX = this._deviceToScreen.transformX(deviceX);
    return this._viewMatrix.invertTransformX(screenX);
  }

  private transformViewY(deviceY: number): number {
    const screenY = this._deviceToScreen.transformY(deviceY);
    return this._viewMatrix.invertTransformY(screenY);
  }

  public getCanvas(): HTMLCanvasElement {
    return this._canvas;
  }

  public getGlManager(): ChloeGlManager {
    return this._glManager;
  }

  public getTextureManager(): ChloeTextureManager {
    return this._textureManager;
  }

  public getFrameBuffer(): WebGLFramebuffer {
    return this._frameBuffer;
  }

  public getModel(): ChloeModel {
    return this._model;
  }

  public release(): void {
    this.stop();
    
    if (this._model) {
      this._model = null;
    }

    if (this._textureManager) {
      this._textureManager.release();
    }
  }

  public releaseAll(): void {
    this.release();
    
    CubismFramework.dispose();

    this._initialized = false;
  }
}
