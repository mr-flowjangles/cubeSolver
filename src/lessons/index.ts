// All levels in play order, and the solving methods they use.

import { type CubeState, type Face, type Move, applyMoves } from "../cube";
import { STAGES, STAGE_DONE, solveBeginner } from "../solver/beginner";
import { CFOP_DONE, CFOP_STAGES, solveCfop } from "../solver/cfop";
import { BEGINNER_LEVELS, type Level } from "./beginner";
import { CFOP_LEVELS } from "./cfop";

export const ALL_LEVELS: Level[] = [...BEGINNER_LEVELS, ...CFOP_LEVELS];
export const BEGINNER_IDS = BEGINNER_LEVELS.map((l) => l.id);
export const LEVEL_IDS = ALL_LEVELS.map((l) => l.id);

export interface GuideStep {
  stage: string;
  moves: Move[];
  say: string;
  /** A plain-words reason for each move. */
  why?: string[];
  /** Part of the stage, e.g. "Part 1: the daisy". */
  part?: string;
  /** Colors of the piece this step moves, and the slot it ends in. */
  piece?: Face[];
  to?: string;
}

export interface Method {
  name: string;
  stages: string[];
  done: Record<string, (s: CubeState) => boolean>;
  solve(s: CubeState, until?: string): GuideStep[];
  stageTitle: Record<string, string>;
}

export const METHODS: Record<Level["method"], Method> = {
  beginner: {
    name: "Beginner method",
    stages: STAGES,
    done: STAGE_DONE,
    solve: (s, until) => solveBeginner(s, until as never),
    stageTitle: {
      hold: "Get ready",
      ...Object.fromEntries(BEGINNER_LEVELS.filter((l) => l.stage).map((l) => [l.stage!, l.title])),
    },
  },
  cfop: {
    name: "CFOP",
    stages: CFOP_STAGES,
    done: CFOP_DONE,
    solve: (s, until) => solveCfop(s, until as never),
    stageTitle: {
      hold: "Get ready",
      cross: "Cross",
      f2l: "F2L",
      eo: "OLL: yellow cross",
      oll: "OLL: yellow face",
      cp: "PLL: corners",
      ep: "PLL: edges",
    },
  },
};

export function stateAfter(method: Method, s: CubeState, stage: string): CubeState {
  return method.solve(s, stage).reduce<CubeState>((x, st) => applyMoves(x, st.moves), s);
}

export type { Level };
