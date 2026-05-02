/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BlogIdentity {
  names: string[];
  intro: string;
  tone: string;
}

export interface BlogPost {
  titles: string[];
  intro: string;
  body: string;
  practice: string;
  conclusion: string;
  tags: string[];
  imagePrompts: string[];
  day: number;
}

export interface RoadmapStep {
  dayRange: string;
  goal: string;
  focus: string;
}
