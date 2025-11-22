import { ItemTemplate, MaterialLine, MeasureType, PaintGrade, Service, AreaName } from './types';

export const DEFAULT_SETTINGS = {
  laborRatePerHour: 50,
  overheadPct: 0.10,
  profitPct: 0.20,
  taxRate: 0.0,
};

export const DEFAULT_SERVICES: Service[] = [
  { id: 'svc_interior', name: 'Interior' },
  { id: 'svc_exterior', name: 'Exterior' }
];

export const DEFAULT_CATEGORIES: string[] = [
  'Walls',
  'Ceiling',
  'Trim',
  'Doors',
  'Windows',
  'Other'
];

export const DEFAULT_ROOM_NAMES: AreaName[] = [
  { id: 'area_living', name: "Living Room", serviceId: 'svc_interior' },
  { id: 'area_kitchen', name: "Kitchen", serviceId: 'svc_interior' },
  { id: 'area_master', name: "Master Bedroom", serviceId: 'svc_interior' },
  { id: 'area_bed1', name: "Bedroom 1", serviceId: 'svc_interior' },
  { id: 'area_bed2', name: "Bedroom 2", serviceId: 'svc_interior' },
  { id: 'area_dining', name: "Dining Room", serviceId: 'svc_interior' },
  { id: 'area_hall', name: "Hallway", serviceId: 'svc_interior' },
  { id: 'area_entry', name: "Entryway", serviceId: 'svc_interior' },
  { id: 'area_bath', name: "Bathroom", serviceId: 'svc_interior' },
  { id: 'area_mbath', name: "Master Bath", serviceId: 'svc_interior' },
  { id: 'area_office', name: "Office", serviceId: 'svc_interior' },
  { id: 'area_garage', name: "Garage", serviceId: 'svc_interior' },
  { id: 'area_ext_front', name: "Front Elevation", serviceId: 'svc_exterior' },
  { id: 'area_ext_rear', name: "Rear Elevation", serviceId: 'svc_exterior' },
  { id: 'area_ext_left', name: "Left Side", serviceId: 'svc_exterior' },
  { id: 'area_ext_right', name: "Right Side", serviceId: 'svc_exterior' },
  { id: 'area_deck', name: "Deck", serviceId: 'svc_exterior' },
];

export const DEFAULT_ITEM_TEMPLATES: ItemTemplate[] = [
  {
    id: 'tpl_walls',
    name: 'Walls (Cut & Roll)',
    category: 'Walls',
    serviceId: 'svc_interior',
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
    category: 'Ceiling',
    serviceId: 'svc_interior',
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
    category: 'Trim',
    serviceId: 'svc_interior',
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
    category: 'Doors',
    serviceId: 'svc_interior',
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
    category: 'Windows',
    serviceId: 'svc_interior',
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
  { id: 'mat_sw_promar200', brand: 'Sherwin-Williams', line: 'ProMar 200', grade: PaintGrade.Contractor, surfaceCategory: 'Walls', serviceId: 'svc_interior', coverageSqft: 350, pricePerGallon: 35 },
  { id: 'mat_sw_superpaint', brand: 'Sherwin-Williams', line: 'SuperPaint', grade: PaintGrade.Standard, surfaceCategory: 'Walls', serviceId: 'svc_interior', coverageSqft: 350, pricePerGallon: 55 },
  { id: 'mat_sw_emerald', brand: 'Sherwin-Williams', line: 'Emerald', grade: PaintGrade.Premium, surfaceCategory: 'Walls', serviceId: 'svc_interior', coverageSqft: 400, pricePerGallon: 85 },
  
  // Trim
  { id: 'mat_bm_advance', brand: 'Benjamin Moore', line: 'Advance', grade: PaintGrade.Premium, surfaceCategory: 'Trim', serviceId: 'svc_interior', coverageSqft: 350, pricePerGallon: 90 },
  { id: 'mat_sw_solo', brand: 'Sherwin-Williams', line: 'Solo', grade: PaintGrade.Standard, surfaceCategory: 'Trim', serviceId: 'svc_interior', coverageSqft: 350, pricePerGallon: 60 },

  // Ceiling
  { id: 'mat_sw_chb', brand: 'Sherwin-Williams', line: 'CHB', grade: PaintGrade.Contractor, surfaceCategory: 'Ceiling', serviceId: 'svc_interior', coverageSqft: 300, pricePerGallon: 25 },
];