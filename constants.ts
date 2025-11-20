import { ItemTemplate, MaterialLine, MeasureType, PaintGrade, PaintSheen, SurfaceCategory } from './types';

export const DEFAULT_SETTINGS = {
  laborRatePerHour: 50,
  overheadPct: 0.10,
  profitPct: 0.20,
  taxRate: 0.0,
};

export const DEFAULT_ROOM_NAMES = [
  "Living Room",
  "Kitchen",
  "Master Bedroom",
  "Bedroom 1",
  "Bedroom 2",
  "Dining Room",
  "Hallway",
  "Entryway",
  "Bathroom",
  "Master Bath",
  "Office",
  "Garage"
];

export const DEFAULT_ITEM_TEMPLATES: ItemTemplate[] = [
  {
    id: 'tpl_walls',
    name: 'Walls (Cut & Roll)',
    category: SurfaceCategory.Walls,
    measureType: MeasureType.Area,
    defaultCoats: 2,
    defaultWastePct: 0.10,
    productivityMinutesPerUnit: 0.05, // ~3 secs per sqft
    defaultGrade: PaintGrade.Standard,
    description: "Scrape loose paint, patch minor holes/cracks, sand smooth, spot prime repairs, and apply two coats of finish paint."
  },
  {
    id: 'tpl_ceiling',
    name: 'Ceiling (Flat)',
    category: SurfaceCategory.Ceiling,
    measureType: MeasureType.Area,
    defaultCoats: 2,
    defaultWastePct: 0.10,
    productivityMinutesPerUnit: 0.06,
    defaultGrade: PaintGrade.Contractor,
    description: "Mask walls and floors. Apply two coats of flat ceiling paint to ensure uniform coverage."
  },
  {
    id: 'tpl_baseboard',
    name: 'Baseboard Trim',
    category: SurfaceCategory.Trim,
    measureType: MeasureType.Length,
    defaultCoats: 1,
    defaultWastePct: 0.05,
    productivityMinutesPerUnit: 1.5, // 1.5 mins per LF
    defaultGrade: PaintGrade.Premium,
    description: "Caulk gaps, fill nail holes, sand, and apply finish coat to baseboards."
  },
  {
    id: 'tpl_door_frame',
    name: 'Door Frame',
    category: SurfaceCategory.Doors,
    measureType: MeasureType.Count,
    defaultCoats: 1,
    defaultWastePct: 0.05,
    productivityMinutesPerUnit: 20, // 20 mins per door side
    defaultGrade: PaintGrade.Premium,
    description: "Prepare surface, sand, and apply finish coat to door casing and jambs."
  },
  {
    id: 'tpl_window_frame',
    name: 'Window Frame/Sill',
    category: SurfaceCategory.Windows,
    measureType: MeasureType.Count,
    defaultCoats: 1,
    defaultWastePct: 0.05,
    productivityMinutesPerUnit: 30,
    defaultGrade: PaintGrade.Premium,
    description: "Prepare surface, sand, and paint window sash, sill, and casing."
  }
];

export const DEFAULT_MATERIALS: MaterialLine[] = [
  // Walls
  { id: 'mat_sw_promar200', brand: 'Sherwin-Williams', line: 'ProMar 200', grade: PaintGrade.Contractor, surfaceCategory: SurfaceCategory.Walls, coverageSqft: 350, pricePerGallon: 35 },
  { id: 'mat_sw_superpaint', brand: 'Sherwin-Williams', line: 'SuperPaint', grade: PaintGrade.Standard, surfaceCategory: SurfaceCategory.Walls, coverageSqft: 350, pricePerGallon: 55 },
  { id: 'mat_sw_emerald', brand: 'Sherwin-Williams', line: 'Emerald', grade: PaintGrade.Premium, surfaceCategory: SurfaceCategory.Walls, coverageSqft: 400, pricePerGallon: 85 },
  
  // Trim
  { id: 'mat_bm_advance', brand: 'Benjamin Moore', line: 'Advance', grade: PaintGrade.Premium, surfaceCategory: SurfaceCategory.Trim, coverageSqft: 350, pricePerGallon: 90 },
  { id: 'mat_sw_solo', brand: 'Sherwin-Williams', line: 'Solo', grade: PaintGrade.Standard, surfaceCategory: SurfaceCategory.Trim, coverageSqft: 350, pricePerGallon: 60 },

  // Ceiling
  { id: 'mat_sw_chb', brand: 'Sherwin-Williams', line: 'CHB', grade: PaintGrade.Contractor, surfaceCategory: SurfaceCategory.Ceiling, coverageSqft: 300, pricePerGallon: 25 },
];