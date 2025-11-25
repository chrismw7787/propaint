
import { ItemInstance, ItemTemplate, MaterialLine, ProjectSettings, Room, MeasureType, Project } from '../types';

/**
 * Calculates the raw quantity based on room dimensions and item type
 */
export const calculateQuantity = (room: Room, template: ItemTemplate): number => {
  const P = 2 * (room.length + room.width);
  const WallArea = (P * room.height) - (room.doors * 21) - (room.windows * 15); // Deduct approx sqft for openings
  const CeilingArea = room.length * room.width;

  // Use explicit calculation logic if available
  if (template.calculationLogic) {
      switch (template.calculationLogic) {
          case 'wall_area':
              return Math.max(0, WallArea);
          case 'ceiling_area':
              return CeilingArea;
          case 'perimeter':
              return P;
          case 'manual':
          default:
               // Fallback to legacy category checks if logic is somehow missing or manual
               return getDefaultQuantityFromCategory(room, template);
      }
  }

  // Legacy Fallback (for older templates without calculationLogic)
  return getDefaultQuantityFromCategory(room, template);
};

const getDefaultQuantityFromCategory = (room: Room, template: ItemTemplate): number => {
    // Legacy mapping for backward compatibility
    if (template.measureType === MeasureType.Area) {
        if (template.category === 'Walls') {
             const P = 2 * (room.length + room.width);
             const WallArea = (P * room.height) - (room.doors * 21) - (room.windows * 15);
             return Math.max(0, WallArea);
        }
        if (template.category === 'Ceiling') return room.length * room.width;
        return 0;
    }
    if (template.measureType === MeasureType.Length) {
        return 2 * (room.length + room.width); // Assume perimeter for baseboards
    }
    if (template.measureType === MeasureType.Count) {
        if (template.category === 'Doors') return room.doors;
        if (template.category === 'Windows') return room.windows;
        return 1;
    }
    return 1;
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
  const baseRate = template.productivityMinutesPerUnit;
  // If additional rate is not set, use base rate
  const additionalRate = template.productivityMinutesPerUnitAdditional !== undefined 
      ? template.productivityMinutesPerUnitAdditional 
      : baseRate;
  
  let totalMinutes = 0;
  if (item.coats > 0) {
      // First coat covers Prep + Paint
      totalMinutes += item.quantity * baseRate;
      
      // Subsequent coats are usually faster
      if (item.coats > 1) {
          totalMinutes += item.quantity * additionalRate * (item.coats - 1);
      }
  }

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
