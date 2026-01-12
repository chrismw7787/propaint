
export enum PaintGrade {
  Contractor = 'Contractor',
  Standard = 'Standard',
  Premium = 'Premium',
  HighPerformance = 'High Performance',
}

export enum PaintSheen {
  Flat = 'Flat',
  Matte = 'Matte',
  Eggshell = 'Eggshell',
  Satin = 'Satin',
  SemiGloss = 'Semi-Gloss',
  Gloss = 'Gloss',
}

export enum MeasureType {
  Area = 'area',
  Length = 'length',
  Count = 'count',
  None = 'none',
}

export type CalculationLogic = 'manual' | 'wall_area' | 'ceiling_area' | 'perimeter';

export interface Service {
  id: string;
  name: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export interface AreaName {
  id: string;
  name: string;
  serviceId: string;
}

export interface MaterialLine {
  id: string;
  brand: string;
  line: string;
  grade: PaintGrade;
  // Sheen is no longer defined at the material book level, it is selected per instance
  surfaceCategory: string;
  serviceId: string; // Link to Service (Interior, Exterior, etc.)
  coverageSqft: number;
  pricePerGallon: number;
}

export interface ItemTemplate {
  id: string;
  name: string;
  category: string;
  serviceId: string; // Link to Service (Interior, Exterior, etc.)
  measureType: MeasureType;
  calculationLogic: CalculationLogic; // Determines which room dimension formula to use
  defaultCoats: number;
  defaultWastePct: number;
  productivityMinutesPerUnit: number; // Base rate (1st coat + prep)
  productivityMinutesPerUnitAdditional?: number; // Rate for 2nd+ coats (usually faster)
  defaultGrade: PaintGrade;
  description?: string; // Scope of work description
}

export interface ItemInstance {
  id: string;
  templateId: string;
  name: string; // Copied from template for display
  category: string;
  
  // Quantity Overrides/Calculated
  quantity: number; // The raw measured quantity (sqft, lf, count)
  
  // Spec Overrides
  materialId?: string; // Specific material selection
  grade: PaintGrade;
  sheen: PaintSheen;
  color: string;
  coats: number;
  
  // Financials (Snapshot)
  laborMinutes: number;
  laborCost: number;
  materialCost: number;
  overheadCost?: number;
  profitCost?: number;
  totalPrice: number;
}

export interface Room {
  id: string;
  name: string;
  serviceId: string; // The service this room belongs to (e.g., Interior, Exterior)
  
  // Dimensions
  length: number;
  width: number;
  height: number;
  
  // Openings
  doors: number;
  windows: number;
  
  // Defaults for new items in this room
  defaultWallGrade: PaintGrade;
  defaultTrimGrade: PaintGrade;
  defaultCeilingGrade: PaintGrade;
  
  items: ItemInstance[];
  
  // Meta
  included: boolean;
  notes: string;
  photos?: string[]; // Base64 strings for demo
}

export interface ProjectSettings {
  laborRatePerHour: number;
  overheadPct: number; // 0.0 - 1.0
  profitPct: number;   // 0.0 - 1.0
  taxRate: number;     // 0.0 - 1.0
}

export interface BrandingSettings {
    businessName: string;
    contactInfo: string; // Multi-line support
    squareLogo?: string; // Base64
    horizontalLogo?: string; // Base64
    qrCode?: string; // Base64
    reviewBlurb?: string; // "Check out what neighbors are saying..."
}

export interface Project {
  id: string;
  name: string; // User-defined project name
  clientId: string; // Link to Client
  clientName: string; // Snapshot for quick display
  address: string;
  createdAt: string; // ISO Date
  status: 'draft' | 'sent' | 'approved';
  
  settings: ProjectSettings;
  rooms: Room[];
  
  // Aggregates
  totalCost: number;
  totalPrice: number;
}

// Access Control
export interface UserProfile {
  email: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  subscriptionExpiry?: string;
}
