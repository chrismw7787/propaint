import { ItemInstance, ItemTemplate, MaterialLine, ProjectSettings, Room, MeasureType, Project } from '../types';

/**
 * Calculates the raw quantity based on room dimensions and item type
 */
export const calculateQuantity = (room: Room, template: ItemTemplate): number => {
  const P = 2 * (room.length + room.width);
  const WallArea = (P * room.height) - (room.doors * 21) - (room.windows * 15); // Deduct approx sqft for openings
  const CeilingArea = room.length * room.width;

  switch (template.measureType) {
    case MeasureType.Area:
      if (template.category === 'Walls') return Math.max(0, WallArea);
      if (template.category === 'Ceiling') return CeilingArea;
      // For custom categories, default to 0 or maybe WallArea? For now 0 to be safe, user must enter.
      return 0;
    case MeasureType.Length:
      // Baseboards usually P, Crown usually P
      return P; 
    case MeasureType.Count:
      // This is usually manually set, but we can try to infer default counts
      if (template.category === 'Doors') return room.doors;
      if (template.category === 'Windows') return room.windows;
      return 1;
    default:
      return 1;
  }
};

/**
 * Finds the best matching material from the Provided Material List
 */
export const resolveMaterial = (
    category: string, 
    grade: string, 
    availableMaterials: MaterialLine[]
): MaterialLine | undefined => {
  // Simple matcher: Exact category + grade. 
  const exact = availableMaterials.find(m => m.surfaceCategory === category && m.grade === grade);
  if (exact) return exact;
  
  // Fallback to just matching category if grade missing
  return availableMaterials.find(m => m.surfaceCategory === category);
};

/**
 * Computes financial snapshot for a single item
 */
export const calculateItemCost = (
  item: ItemInstance,
  template: ItemTemplate,
  settings: ProjectSettings,
  availableMaterials: MaterialLine[]
): ItemInstance => {
  
  // 1. Resolve Material Cost
  let material: MaterialLine | undefined;

  // A. Try specific material ID first
  if (item.materialId) {
    material = availableMaterials.find(m => m.id === item.materialId);
  }

  // B. Fallback to generic grade/category logic
  if (!material) {
    material = resolveMaterial(item.category, item.grade, availableMaterials);
  }

  const pricePerGallon = material ? material.pricePerGallon : 50; // Fallback $50
  const coverage = material ? material.coverageSqft : 350;
  
  const wasteMultiplier = 1 + template.defaultWastePct;
  const totalUnitsRequired = (item.quantity * item.coats * wasteMultiplier) / coverage;
  const gallons = Math.ceil(totalUnitsRequired); // Integers only for paint purchase
  
  // If it's a count item, logic might differ (e.g. price per tube of caulk), 
  // but for this MVP we treat everything as paint-consuming or simple unit cost
  const calculatedMaterialCost = gallons * pricePerGallon;

  // 2. Resolve Labor Cost
  // Minutes = Qty * MinsPerUnit
  const totalMinutes = item.quantity * template.productivityMinutesPerUnit * item.coats;
  const totalHours = totalMinutes / 60;
  const calculatedLaborCost = totalHours * settings.laborRatePerHour;

  // 3. Overhead & Profit
  const directCost = calculatedLaborCost + calculatedMaterialCost;
  const overhead = directCost * settings.overheadPct;
  const subtotal = directCost + overhead;
  const profit = subtotal * settings.profitPct;
  const priceBeforeTax = subtotal + profit;
  const tax = priceBeforeTax * settings.taxRate;

  return {
    ...item,
    // If we resolved a specific material, we can optionally update the grade/sheen on the item to match
    // strictly speaking, we just store the snapshot costs here
    laborMinutes: totalMinutes,
    laborCost: calculatedLaborCost,
    materialCost: calculatedMaterialCost,
    overheadCost: overhead,
    profitCost: profit,
    totalPrice: priceBeforeTax + tax,
  };
};

/**
 * Aggregates room totals
 */
export const calculateRoomTotal = (room: Room): number => {
  if (!room.included) return 0;
  return room.items.reduce((sum, item) => sum + item.totalPrice, 0);
};

/**
 * Aggregates project totals
 */
export const calculateProjectTotals = (project: Project): Project => {
  const total = project.rooms.reduce((sum, room) => sum + calculateRoomTotal(room), 0);
  return {
    ...project,
    totalPrice: total,
    totalCost: total // Simplified for MVP, usually separates cost vs price
  };
};