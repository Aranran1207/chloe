import { csmVector, iterator } from '../framework/type/csmvector';
import { ChloeGlManager } from './glmanager';

export class TextureInfo {
  img: HTMLImageElement;
  id: WebGLTexture = null;
  width = 0;
  height = 0;
  usePremultply: boolean;
  fileName: string;
}

export class ChloeTextureManager {
  private _textures: csmVector<TextureInfo>;
  private _glManager: ChloeGlManager;

  public constructor() {
    this._textures = new csmVector<TextureInfo>();
  }

  public release(): void {
    for (let ite: iterator<TextureInfo> = this._textures.begin(); ite.notEqual(this._textures.end()); ite.preIncrement()) {
      this._glManager.getGl().deleteTexture(ite.ptr().id);
    }
    this._textures = new csmVector<TextureInfo>();
  }

  public createTextureFromPngFile(
    fileName: string,
    usePremultiply: boolean,
    callback: (textureInfo: TextureInfo) => void
  ): void {
    for (let ite: iterator<TextureInfo> = this._textures.begin(); ite.notEqual(this._textures.end()); ite.preIncrement()) {
      if (ite.ptr().fileName == fileName && ite.ptr().usePremultply == usePremultiply) {
        ite.ptr().img = new Image();
        ite.ptr().img.addEventListener('load', (): void => callback(ite.ptr()), { passive: true });
        ite.ptr().img.src = fileName;
        return;
      }
    }

    const img = new Image();
    img.addEventListener('load', (): void => {
      const tex: WebGLTexture = this._glManager.getGl().createTexture();
      this._glManager.getGl().bindTexture(this._glManager.getGl().TEXTURE_2D, tex);
      this._glManager.getGl().texParameteri(
        this._glManager.getGl().TEXTURE_2D,
        this._glManager.getGl().TEXTURE_MIN_FILTER,
        this._glManager.getGl().LINEAR_MIPMAP_LINEAR
      );
      this._glManager.getGl().texParameteri(
        this._glManager.getGl().TEXTURE_2D,
        this._glManager.getGl().TEXTURE_MAG_FILTER,
        this._glManager.getGl().LINEAR
      );

      if (usePremultiply) {
        this._glManager.getGl().pixelStorei(this._glManager.getGl().UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
      }

      this._glManager.getGl().texImage2D(
        this._glManager.getGl().TEXTURE_2D,
        0,
        this._glManager.getGl().RGBA,
        this._glManager.getGl().RGBA,
        this._glManager.getGl().UNSIGNED_BYTE,
        img
      );

      this._glManager.getGl().generateMipmap(this._glManager.getGl().TEXTURE_2D);
      this._glManager.getGl().bindTexture(this._glManager.getGl().TEXTURE_2D, null);

      const textureInfo: TextureInfo = new TextureInfo();
      textureInfo.fileName = fileName;
      textureInfo.width = img.width;
      textureInfo.height = img.height;
      textureInfo.id = tex;
      textureInfo.img = img;
      textureInfo.usePremultply = usePremultiply;
      this._textures.pushBack(textureInfo);

      callback(textureInfo);
    }, { passive: true });
    img.src = fileName;
  }

  public setGlManager(glManager: ChloeGlManager): void {
    this._glManager = glManager;
  }
}
