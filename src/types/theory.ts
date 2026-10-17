export interface TheoryExample {
  title: string;
  statement: string;
  solution: string;
  explanation?: string;
}

export interface TheoryCallout {
  type: "info" | "warning" | "tip" | "remember";
  title?: string;
  content: string;
}

export interface TheorySection {
  id: string;
  topicId: string;
  title: string;
  content: string;
  examples?: TheoryExample[];
  callouts?: TheoryCallout[];
}

export interface ModuleTheory {
  schemaVersion: number;
  moduleId: string;
  moduleSlug: string;
  title: string;
  sections: TheorySection[];
}
