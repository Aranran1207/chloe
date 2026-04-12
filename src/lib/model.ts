import { CubismDefaultParameterId } from '../framework/cubismdefaultparameterid';
import { CubismModelSettingJson } from '../framework/cubismmodelsettingjson';
import { BreathParameterData, CubismBreath } from '../framework/effect/cubismbreath';
import { CubismEyeBlink } from '../framework/effect/cubismeyeblink';
import { ICubismModelSetting } from '../framework/icubismmodelsetting';
import { CubismIdHandle } from '../framework/id/cubismid';
import { CubismFramework } from '../framework/live2dcubismframework';
import { CubismMatrix44 } from '../framework/math/cubismmatrix44';
import { CubismUserModel } from '../framework/model/cubismusermodel';
import { ACubismMotion, BeganMotionCallback, FinishedMotionCallback } from '../framework/motion/acubismmotion';
import { CubismMotion } from '../framework/motion/cubismmotion';
import { CubismMotionQueueEntryHandle, InvalidMotionQueueEntryHandleValue } from '../framework/motion/cubismmotionqueuemanager';
import { csmMap } from '../framework/type/csmmap';
import { csmVector } from '../framework/type/csmvector';
import { CSM_ASSERT, CubismLogError, CubismLogInfo } from '../framework/utils/cubismdebug';

import { ChloePal } from './pal';
import { ChloeLive2D } from './chloe';

enum LoadStep {
  LoadAssets,
  LoadModel,
  WaitLoadModel,
  LoadExpression,
  WaitLoadExpression,
  LoadPhysics,
  WaitLoadPhysics,
  LoadPose,
  WaitLoadPose,
  SetupEyeBlink,
  SetupBreath,
  LoadUserData,
  WaitLoadUserData,
  SetupEyeBlinkIds,
  SetupLipSyncIds,
  SetupLayout,
  LoadMotion,
  WaitLoadMotion,
  CompleteInitialize,
  CompleteSetupModel,
  LoadTexture,
  WaitLoadTexture,
  CompleteSetup
}

export class ChloeModel extends CubismUserModel {
  private _chloe: ChloeLive2D;
  private _modelSetting: ICubismModelSetting;
  private _modelHomeDir: string;
  private _userTimeSeconds: number;
  private _eyeBlinkIds: csmVector<CubismIdHandle>;
  private _lipSyncIds: csmVector<CubismIdHandle>;
  private _motions: csmMap<string, ACubismMotion>;
  private _expressions: csmMap<string, ACubismMotion>;
  private _idParamAngleX: CubismIdHandle;
  private _idParamAngleY: CubismIdHandle;
  private _idParamAngleZ: CubismIdHandle;
  private _idParamEyeBallX: CubismIdHandle;
  private _idParamEyeBallY: CubismIdHandle;
  private _idParamBodyAngleX: CubismIdHandle;
  private _state: LoadStep;
  private _expressionCount: number;
  private _textureCount: number;
  private _motionCount: number;
  private _allMotionCount: number;
  private _mocConsistency: boolean;
  private _motionConsistency: boolean;

  public constructor(chloe: ChloeLive2D) {
    super();
    this._chloe = chloe;
    this._modelSetting = null;
    this._modelHomeDir = null;
    this._userTimeSeconds = 0.0;
    this._eyeBlinkIds = new csmVector<CubismIdHandle>();
    this._lipSyncIds = new csmVector<CubismIdHandle>();
    this._motions = new csmMap<string, ACubismMotion>();
    this._expressions = new csmMap<string, ACubismMotion>();
    this._state = LoadStep.LoadAssets;
    this._expressionCount = 0;
    this._textureCount = 0;
    this._motionCount = 0;
    this._allMotionCount = 0;
    this._mocConsistency = true;
    this._motionConsistency = true;

    this._idParamAngleX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleX);
    this._idParamAngleY = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleY);
    this._idParamAngleZ = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleZ);
    this._idParamEyeBallX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamEyeBallX);
    this._idParamEyeBallY = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamEyeBallY);
    this._idParamBodyAngleX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBodyAngleX);
  }

  public loadAssets(dir: string, fileName: string): void {
    this._modelHomeDir = dir;

    fetch(`${this._modelHomeDir}${fileName}`)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const setting: ICubismModelSetting = new CubismModelSettingJson(arrayBuffer, arrayBuffer.byteLength);
        this._state = LoadStep.LoadModel;
        this.setupModel(setting);
      })
      .catch(error => {
        CubismLogError(`Failed to load file ${this._modelHomeDir}${fileName}`);
      });
  }

  private setupModel(setting: ICubismModelSetting): void {
    this._updating = true;
    this._initialized = false;
    this._modelSetting = setting;

    if (this._modelSetting.getModelFileName() != '') {
      const modelFileName = this._modelSetting.getModelFileName();
      fetch(`${this._modelHomeDir}${modelFileName}`)
        .then(response => {
          if (response.ok) return response.arrayBuffer();
          CubismLogError(`Failed to load file ${this._modelHomeDir}${modelFileName}`);
          return new ArrayBuffer(0);
        })
        .then(arrayBuffer => {
          this.loadModel(arrayBuffer, this._mocConsistency);
          this._state = LoadStep.LoadExpression;
          this.loadCubismExpression();
        });
      this._state = LoadStep.WaitLoadModel;
    }
  }

  private loadCubismExpression(): void {
    if (this._modelSetting.getExpressionCount() > 0) {
      const count = this._modelSetting.getExpressionCount();
      for (let i = 0; i < count; i++) {
        const expressionName = this._modelSetting.getExpressionName(i);
        const expressionFileName = this._modelSetting.getExpressionFileName(i);
        fetch(`${this._modelHomeDir}${expressionFileName}`)
          .then(response => {
            if (response.ok) return response.arrayBuffer();
            CubismLogError(`Failed to load file ${this._modelHomeDir}${expressionFileName}`);
            return new ArrayBuffer(0);
          })
          .then(arrayBuffer => {
            const motion: ACubismMotion = this.loadExpression(arrayBuffer, arrayBuffer.byteLength, expressionName);
            if (this._expressions.getValue(expressionName) != null) {
              ACubismMotion.delete(this._expressions.getValue(expressionName));
            }
            this._expressions.setValue(expressionName, motion);
            this._expressionCount++;
            if (this._expressionCount >= count) {
              this._state = LoadStep.LoadPhysics;
              this.loadCubismPhysics();
            }
          });
      }
      this._state = LoadStep.WaitLoadExpression;
    } else {
      this._state = LoadStep.LoadPhysics;
      this.loadCubismPhysics();
    }
  }

  private loadCubismPhysics(): void {
    if (this._modelSetting.getPhysicsFileName() != '') {
      const physicsFileName = this._modelSetting.getPhysicsFileName();
      fetch(`${this._modelHomeDir}${physicsFileName}`)
        .then(response => {
          if (response.ok) return response.arrayBuffer();
          CubismLogError(`Failed to load file ${this._modelHomeDir}${physicsFileName}`);
          return new ArrayBuffer(0);
        })
        .then(arrayBuffer => {
          this.loadPhysics(arrayBuffer, arrayBuffer.byteLength);
          this._state = LoadStep.LoadPose;
          this.loadCubismPose();
        });
      this._state = LoadStep.WaitLoadPhysics;
    } else {
      this._state = LoadStep.LoadPose;
      this.loadCubismPose();
    }
  }

  private loadCubismPose(): void {
    if (this._modelSetting.getPoseFileName() != '') {
      const poseFileName = this._modelSetting.getPoseFileName();
      fetch(`${this._modelHomeDir}${poseFileName}`)
        .then(response => {
          if (response.ok) return response.arrayBuffer();
          CubismLogError(`Failed to load file ${this._modelHomeDir}${poseFileName}`);
          return new ArrayBuffer(0);
        })
        .then(arrayBuffer => {
          this.loadPose(arrayBuffer, arrayBuffer.byteLength);
          this._state = LoadStep.SetupEyeBlink;
          this.setupEyeBlink();
        });
      this._state = LoadStep.WaitLoadPose;
    } else {
      this._state = LoadStep.SetupEyeBlink;
      this.setupEyeBlink();
    }
  }

  private setupEyeBlink(): void {
    if (this._modelSetting.getEyeBlinkParameterCount() > 0) {
      this._eyeBlink = CubismEyeBlink.create(this._modelSetting);
    }
    this._state = LoadStep.SetupBreath;
    this.setupBreath();
  }

  private setupBreath(): void {
    this._breath = CubismBreath.create();
    const breathParameters: csmVector<BreathParameterData> = new csmVector();
    breathParameters.pushBack(new BreathParameterData(this._idParamAngleX, 0.0, 15.0, 6.5345, 0.5));
    breathParameters.pushBack(new BreathParameterData(this._idParamAngleY, 0.0, 8.0, 3.5345, 0.5));
    breathParameters.pushBack(new BreathParameterData(this._idParamAngleZ, 0.0, 10.0, 5.5345, 0.5));
    breathParameters.pushBack(new BreathParameterData(this._idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5));
    breathParameters.pushBack(new BreathParameterData(
      CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBreath),
      0.5, 0.5, 3.2345, 1
    ));
    this._breath.setParameters(breathParameters);
    this._state = LoadStep.SetupLayout;
    this.setupLayout();
  }

  private setupLayout(): void {
    const layout: csmMap<string, number> = new csmMap<string, number>();
    this._modelSetting.getLayoutMap(layout);
    this._modelMatrix.setupFromLayout(layout);
    this._state = LoadStep.LoadMotion;
    this.loadCubismMotion();
  }

  private loadCubismMotion(): void {
    this._state = LoadStep.WaitLoadMotion;
    this._model.saveParameters();
    this._allMotionCount = 0;
    this._motionCount = 0;
    const group: string[] = [];
    const motionGroupCount = this._modelSetting.getMotionGroupCount();

    for (let i = 0; i < motionGroupCount; i++) {
      group[i] = this._modelSetting.getMotionGroupName(i);
      this._allMotionCount += this._modelSetting.getMotionCount(group[i]);
    }

    for (let i = 0; i < motionGroupCount; i++) {
      this.preLoadMotionGroup(group[i]);
    }

    if (motionGroupCount == 0) {
      this._state = LoadStep.LoadTexture;
      this._motionManager.stopAllMotions();
      this._updating = false;
      this._initialized = true;
      this.createRenderer();
      this.setupTextures();
      this.getRenderer().startUp(this._chloe.getGlManager().getGl());
    }
  }

  private setupTextures(): void {
    const usePremultiply = true;
    if (this._state == LoadStep.LoadTexture) {
      const textureCount = this._modelSetting.getTextureCount();
      for (let modelTextureNumber = 0; modelTextureNumber < textureCount; modelTextureNumber++) {
        if (this._modelSetting.getTextureFileName(modelTextureNumber) == '') continue;
        let texturePath = this._modelSetting.getTextureFileName(modelTextureNumber);
        texturePath = this._modelHomeDir + texturePath;

        const onLoad = (textureInfo: any): void => {
          this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id);
          this._textureCount++;
          if (this._textureCount >= textureCount) {
            this._state = LoadStep.CompleteSetup;
          }
        };

        this._chloe.getTextureManager().createTextureFromPngFile(texturePath, usePremultiply, onLoad);
        this.getRenderer().setIsPremultipliedAlpha(usePremultiply);
      }
      this._state = LoadStep.WaitLoadTexture;
    }
  }

  private preLoadMotionGroup(group: string): void {
    for (let i = 0; i < this._modelSetting.getMotionCount(group); i++) {
      const motionFileName = this._modelSetting.getMotionFileName(group, i);
      const name = `${group}_${i}`;
      fetch(`${this._modelHomeDir}${motionFileName}`)
        .then(response => {
          if (response.ok) return response.arrayBuffer();
          CubismLogError(`Failed to load file ${this._modelHomeDir}${motionFileName}`);
          return new ArrayBuffer(0);
        })
        .then(arrayBuffer => {
          const tmpMotion: CubismMotion = this.loadMotion(
            arrayBuffer, arrayBuffer.byteLength, name, null, null,
            this._modelSetting, group, i, this._motionConsistency
          );
          if (tmpMotion != null) {
            tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
            if (this._motions.getValue(name) != null) {
              ACubismMotion.delete(this._motions.getValue(name));
            }
            this._motions.setValue(name, tmpMotion);
            this._motionCount++;
          } else {
            this._allMotionCount--;
          }
          if (this._motionCount >= this._allMotionCount) {
            this._state = LoadStep.LoadTexture;
            this._motionManager.stopAllMotions();
            this._updating = false;
            this._initialized = true;
            this.createRenderer();
            this.setupTextures();
            this.getRenderer().startUp(this._chloe.getGlManager().getGl());
          }
        });
    }
  }

  public update(): void {
    if (this._state != LoadStep.CompleteSetup) return;
    const deltaTimeSeconds = ChloePal.getDeltaTime();
    this._userTimeSeconds += deltaTimeSeconds;

    this._dragManager.update(deltaTimeSeconds);
    this._dragX = this._dragManager.getX();
    this._dragY = this._dragManager.getY();

    let motionUpdated = false;
    this._model.loadParameters();
    
    if (this._motionManager.isFinished()) {
      const hasIdleMotion = this._modelSetting && 
                            this._modelSetting.getMotionCount('Idle') > 0;
      
      if (hasIdleMotion) {
        this.startRandomMotion('Idle', 1);
        motionUpdated = this._motionManager.updateMotion(this._model, deltaTimeSeconds);
      } else {
        this.resetParametersToDefault();
      }
    } else {
      motionUpdated = this._motionManager.updateMotion(this._model, deltaTimeSeconds);
    }
    this._model.saveParameters();

    if (!motionUpdated && this._eyeBlink != null) {
      this._eyeBlink.updateParameters(this._model, deltaTimeSeconds);
    }

    if (this._expressionManager != null) {
      this._expressionManager.updateMotion(this._model, deltaTimeSeconds);
    }

    this._model.addParameterValueById(this._idParamAngleX, this._dragX * 30);
    this._model.addParameterValueById(this._idParamAngleY, this._dragY * 30);
    this._model.addParameterValueById(this._idParamAngleZ, this._dragX * this._dragY * -30);
    this._model.addParameterValueById(this._idParamBodyAngleX, this._dragX * 10);
    this._model.addParameterValueById(this._idParamEyeBallX, this._dragX);
    this._model.addParameterValueById(this._idParamEyeBallY, this._dragY);

    if (this._breath != null) {
      this._breath.updateParameters(this._model, deltaTimeSeconds);
    }

    if (this._physics != null) {
      this._physics.evaluate(this._model, deltaTimeSeconds);
    }

    if (this._pose != null) {
      this._pose.updateParameters(this._model, deltaTimeSeconds);
    }

    this._model.update();
  }

  public startMotion(
    group: string, no: number, priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (priority == 3) {
      this._motionManager.setReservePriority(priority);
    } else if (!this._motionManager.reserveMotion(priority)) {
      return InvalidMotionQueueEntryHandleValue;
    }

    const motionFileName = this._modelSetting.getMotionFileName(group, no);
    const name = `${group}_${no}`;
    let motion: CubismMotion = this._motions.getValue(name) as CubismMotion;
    let autoDelete = false;

    if (motion == null) {
      fetch(`${this._modelHomeDir}${motionFileName}`)
        .then(response => {
          if (response.ok) return response.arrayBuffer();
          CubismLogError(`Failed to load file ${this._modelHomeDir}${motionFileName}`);
          return new ArrayBuffer(0);
        })
        .then(arrayBuffer => {
          motion = this.loadMotion(
            arrayBuffer, arrayBuffer.byteLength, null,
            onFinishedMotionHandler, onBeganMotionHandler,
            this._modelSetting, group, no, this._motionConsistency
          );
          
          if (motion) {
            motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
            autoDelete = true;
            this._motionManager.startMotionPriority(motion, autoDelete, priority);
          } else {
            CubismLogError(`Can't start motion ${motionFileName}.`);
            this._motionManager.setReservePriority(0);
          }
        });
      
      return InvalidMotionQueueEntryHandleValue;
    } else {
      motion.setBeganMotionHandler(onBeganMotionHandler);
      motion.setFinishedMotionHandler(onFinishedMotionHandler);
    }

    return this._motionManager.startMotionPriority(motion, autoDelete, priority);
  }

  public startRandomMotion(
    group: string, priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (this._modelSetting.getMotionCount(group) == 0) {
      return InvalidMotionQueueEntryHandleValue;
    }
    const no = Math.floor(Math.random() * this._modelSetting.getMotionCount(group));
    return this.startMotion(group, no, priority, onFinishedMotionHandler, onBeganMotionHandler);
  }

  public setExpression(expressionId: string): void {
    const motion: ACubismMotion = this._expressions.getValue(expressionId);
    if (motion != null) {
      this._expressionManager.startMotion(motion, false);
    }
  }

  public setRandomExpression(): void {
    if (this._expressions.getSize() == 0) return;
    const no = Math.floor(Math.random() * this._expressions.getSize());
    for (let i = 0; i < this._expressions.getSize(); i++) {
      if (i == no) {
        const name = this._expressions._keyValues[i].first;
        this.setExpression(name);
        return;
      }
    }
  }

  public hitTest(hitArenaName: string, x: number, y: number): boolean {
    if (this._opacity < 1) return false;
    const count = this._modelSetting.getHitAreasCount();
    for (let i = 0; i < count; i++) {
      if (this._modelSetting.getHitAreaName(i) == hitArenaName) {
        const drawId = this._modelSetting.getHitAreaId(i);
        return this.isHit(drawId, x, y);
      }
    }
    return false;
  }

  public getModelSetting(): ICubismModelSetting {
    return this._modelSetting;
  }

  public stopAllMotions(): void {
    if (this._motionManager) {
      this._motionManager.stopAllMotions();
    }
  }

  public resetParametersToDefault(): void {
    if (this._model == null) return;
    
    const parameterCount = this._model.getParameterCount();
    for (let i = 0; i < parameterCount; i++) {
      const defaultValue = this._model.getParameterDefaultValue(i);
      this._model.setParameterValueByIndex(i, defaultValue, 1.0);
    }
  }

  public draw(matrix: CubismMatrix44): void {
    if (this._model == null) return;
    if (this._state == LoadStep.CompleteSetup) {
      matrix.multiplyByMatrix(this._modelMatrix);
      this.getRenderer().setMvpMatrix(matrix);
      this.doDraw();
    }
  }

  private doDraw(): void {
    if (this._model == null) return;
    const canvas = this._chloe.getCanvas();
    const viewport = [0, 0, canvas.width, canvas.height];
    this.getRenderer().setRenderState(this._chloe.getFrameBuffer(), viewport);
    this.getRenderer().drawModel();
  }
}
