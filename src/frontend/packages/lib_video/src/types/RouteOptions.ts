interface RouteOptionsActionFieldChoice {
  display_name: string;
  value: string;
}

interface RouteOptionsActionField {
  choices?: RouteOptionsActionFieldChoice[];
  help_text?: string;
  label: string;
  readonly: boolean;
  required: boolean;
  type: string;
}

type RouteOptionAction<Resource> = {
  [key in keyof Resource]: RouteOptionsActionField;
};

export interface RouteOptions<Resource> {
  actions: { POST: RouteOptionAction<Resource> };
  description: string;
  name: string;
  parses: string[];
  renders: string[];
}
