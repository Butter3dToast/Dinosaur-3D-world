// The prototype was tuned on three r128, which used hex colours as-is and wrote
// linear output with no sRGB conversion. Modern three converts sRGB -> linear on
// every Color it builds, so this must run before any module creates a Color.
// main.js imports this file first; ES modules evaluate in import order.
import { ColorManagement } from 'three';

ColorManagement.enabled = false;
