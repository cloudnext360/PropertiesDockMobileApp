import type { ApiProperty } from "@/types/api";

export interface PropertyMapProps {
  properties: ApiProperty[];
  onSelectProperty?: (property: ApiProperty) => void;
}
