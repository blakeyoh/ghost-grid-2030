import { Vector3 } from 'three'

// Shared mutable ref — Character writes per-frame, CameraRig reads per-frame.
// This avoids the double-lerp jerk of both components lerping toward the same
// Zustand target independently.
export const characterWorldPos = new Vector3()
