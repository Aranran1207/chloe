import { LogLevel } from '../framework/live2dcubismframework';

export interface ChloeLive2DConfig {
  canvasSize?: { width: number; height: number } | 'auto';
  viewScale?: number;
  viewMaxScale?: number;
  viewMinScale?: number;
  viewLogicalLeft?: number;
  viewLogicalRight?: number;
  viewLogicalBottom?: number;
  viewLogicalTop?: number;
  mocConsistencyValidation?: boolean;
  motionConsistencyValidation?: boolean;
  debugLogEnable?: boolean;
  loggingLevel?: LogLevel;
}

export const DefaultConfig: ChloeLive2DConfig = {
  canvasSize: 'auto',
  viewScale: 1.0,
  viewMaxScale: 8.0,
  viewMinScale: 0.5,
  viewLogicalLeft: -2.0,
  viewLogicalRight: 2.0,
  viewLogicalBottom: -2.0,
  viewLogicalTop: 2.0,
  mocConsistencyValidation: true,
  motionConsistencyValidation: true,
  debugLogEnable: true,
  loggingLevel: LogLevel.LogLevel_Verbose
};

export const PriorityNone = 0;
export const PriorityIdle = 1;
export const PriorityNormal = 2;
export const PriorityForce = 3;
