export type NoteType = "text" | "drawing";

export interface NoteBackground {
  type: "color" | "image";
  value: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // HTML for text node, JSON string of Canvas data for drawing
  groupId: string; // 'none' by default
  type: NoteType;
  inTrash: boolean;
  background?: NoteBackground;
  createdAt: number;
  updatedAt: number;
}

export interface Group {
  id: string;
  name: string;
  createdAt: number;
}
