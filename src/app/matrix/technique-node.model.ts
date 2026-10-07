import { Technique } from "../classes/technique.model";

export interface TechniqueNode extends Technique {
  children: TechniqueNode[];
}
