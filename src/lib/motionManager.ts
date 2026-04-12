import { ChloeLive2D } from './chloe';

export interface MotionInfo {
  group: string;
  index: number;
  name: string;
  file: string;
  description?: string;
}

export class MotionManager {
  private static _instance: MotionManager;
  private _chloe: ChloeLive2D | null = null;
  private _currentMotions: MotionInfo[] = [];
  private _motionDescriptions: Map<string, string> = new Map();

  private constructor() {
    this.initializeMotionDescriptions();
  }

  public static getInstance(): MotionManager {
    if (!MotionManager._instance) {
      MotionManager._instance = new MotionManager();
    }
    return MotionManager._instance;
  }

  public setChloe(chloe: ChloeLive2D): void {
    this._chloe = chloe;
    this.loadMotionsFromModel();
  }

  private initializeMotionDescriptions(): void {
    this._motionDescriptions.set('jingya', '惊讶');
    this._motionDescriptions.set('kaixin', '开心');
    this._motionDescriptions.set('shengqi', '生气');
    this._motionDescriptions.set('shuijiao', '睡觉');
    this._motionDescriptions.set('wink', '眨眼');
    this._motionDescriptions.set('yaotou', '摇头');
    this._motionDescriptions.set('haoqi', '好奇');
    this._motionDescriptions.set('keshui', '瞌睡');
    this._motionDescriptions.set('linghun', '灵魂');
    this._motionDescriptions.set('qizi', '旗子');
    this._motionDescriptions.set('zhentou', '枕头');
    this._motionDescriptions.set('idle', '待机');
    this._motionDescriptions.set('tapbody', '点击身体');
  }

  private loadMotionsFromModel(): void {
    this._currentMotions = [];
    
    if (!this._chloe) return;
    
    const model = this._chloe.getModel();
    if (!model) return;

    const modelSetting = model.getModelSetting();
    if (!modelSetting) return;

    const motionGroupCount = modelSetting.getMotionGroupCount();
    
    for (let i = 0; i < motionGroupCount; i++) {
      const group = modelSetting.getMotionGroupName(i);
      const motionCount = modelSetting.getMotionCount(group);
      
      for (let j = 0; j < motionCount; j++) {
        const motionFileName = modelSetting.getMotionFileName(group, j);
        const motionName = this.extractMotionName(motionFileName);
        const description = this.getMotionDescription(motionName, group);
        
        this._currentMotions.push({
          group: group,
          index: j,
          name: motionName,
          file: motionFileName,
          description: description
        });
      }
    }
    
    console.log('[MotionManager] 已加载动作列表:', this._currentMotions);
  }

  private extractMotionName(fileName: string): string {
    const baseName = fileName.replace(/^.*[\\/]/, '').replace(/\.motion3\.json$/i, '');
    return baseName;
  }

  private getMotionDescription(motionName: string, group: string): string {
    const lowerName = motionName.toLowerCase();
    
    if (this._motionDescriptions.has(lowerName)) {
      return this._motionDescriptions.get(lowerName)!;
    }
    
    const lowerGroup = group.toLowerCase();
    if (this._motionDescriptions.has(lowerGroup)) {
      return `${this._motionDescriptions.get(lowerGroup)} ${motionName}`;
    }
    
    return motionName;
  }

  public getAvailableMotions(): MotionInfo[] {
    return [...this._currentMotions];
  }

  public getMotionListForAI(): string {
    if (this._currentMotions.length === 0) {
      return '当前模型没有可用动作';
    }

    const uniqueMotions = new Map<string, string>();
    this._currentMotions.forEach(motion => {
      const desc = motion.description || motion.name;
      if (!uniqueMotions.has(desc)) {
        uniqueMotions.set(desc, motion.name);
      }
    });

    let result = '当前可用动作：\n';
    const motionList = Array.from(uniqueMotions.entries());
    motionList.forEach(([desc, name]) => {
      result += `- ${desc}`;
      if (desc !== name) {
        result += ` (${name})`;
      }
      result += '\n';
    });

    return result;
  }

  public playMotion(group: string, index: number, priority: number = 3): boolean {
    if (!this._chloe) {
      console.warn('[MotionManager] Chloe 实例未设置');
      return false;
    }

    const model = this._chloe.getModel();
    if (!model) {
      console.warn('[MotionManager] 模型未加载');
      return false;
    }

    const motion = this._currentMotions.find(
      m => m.group === group && m.index === index
    );

    if (!motion) {
      console.warn(`[MotionManager] 未找到动作: 组=${group}, 索引=${index}`);
      return false;
    }

    console.log(`[MotionManager] 播放动作: ${motion.description || motion.name}`);
    
    const handle = model.startMotion(
      group, 
      index, 
      priority,
      () => {
        console.log(`[MotionManager] 动作完成，恢复待机状态`);
        setTimeout(() => {
          this.playIdleMotion();
        }, 500);
      }
    );
    
    return true;
  }

  private playIdleMotion(): boolean {
    if (!this._chloe) return false;
    
    const model = this._chloe.getModel();
    if (!model) return false;

    const idleMotions = this._currentMotions.filter(m => 
      m.group.toLowerCase() === 'idle' || 
      m.name.toLowerCase().includes('idle')
    );

    if (idleMotions.length > 0) {
      const randomIdle = idleMotions[Math.floor(Math.random() * idleMotions.length)];
      console.log(`[MotionManager] 播放待机动作: ${randomIdle.description || randomIdle.name}`);
      model.startMotion(randomIdle.group, randomIdle.index, 1);
      return true;
    }

    return false;
  }

  public playRandomMotion(group?: string, priority: number = 2): boolean {
    if (!this._chloe) {
      console.warn('[MotionManager] Chloe 实例未设置');
      return false;
    }

    const model = this._chloe.getModel();
    if (!model) {
      console.warn('[MotionManager] 模型未加载');
      return false;
    }

    const targetGroup = group || '';
    const motions = this._currentMotions.filter(m => m.group === targetGroup);
    
    if (motions.length === 0) {
      console.log('[MotionManager] 没有可用动作，跳过');
      return false;
    }

    const randomMotion = motions[Math.floor(Math.random() * motions.length)];
    console.log(`[MotionManager] 随机播放动作: ${randomMotion.description || randomMotion.name}`);
    
    model.startMotion(
      randomMotion.group, 
      randomMotion.index, 
      priority,
      () => {
        console.log(`[MotionManager] 动作完成，恢复待机状态`);
        setTimeout(() => {
          this.playIdleMotion();
        }, 500);
      }
    );
    return true;
  }

  public playMotionByName(name: string, priority: number = 3): boolean {
    const lowerName = name.toLowerCase();
    const motion = this._currentMotions.find(
      m => m.name.toLowerCase().includes(lowerName) || 
           (m.description && m.description.includes(name))
    );

    if (!motion) {
      console.warn(`[MotionManager] 未找到名称包含 "${name}" 的动作`);
      return false;
    }

    return this.playMotion(motion.group, motion.index, priority);
  }

  public clearMotions(): void {
    this._currentMotions = [];
  }
}
