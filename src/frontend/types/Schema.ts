interface SchemaEndpointActionDescription {
  _type: string;
  action: string;
  description: string;
  url: string;
}

interface SchemaEndpointActionDescriptionWithFields
  extends SchemaEndpointActionDescription {
  fields: SchemaFieldDescription[];
}

interface SchemaFieldDescription {
  location: string;
  name: string;
  schema: {
    _type: string;
    description: string;
    enum?: string[];
    required?: boolean;
    title: string;
  };
}

export interface Schema {
  _type: string;
  _meta: {
    url: string;
    title: string;
  };
  timedtexttracks: {
    create: SchemaEndpointActionDescriptionWithFields & {
      encoding: string;
    };
    list: SchemaEndpointActionDescription;
    partial_update: SchemaEndpointActionDescriptionWithFields;
    read: SchemaEndpointActionDescriptionWithFields;
    update: SchemaEndpointActionDescriptionWithFields;
    upload_policy: SchemaEndpointActionDescriptionWithFields;
  };
  'update-state': {
    create: SchemaEndpointActionDescription;
  };
  videos: {
    read: SchemaEndpointActionDescriptionWithFields;
    partial_update: SchemaEndpointActionDescriptionWithFields;
    update: SchemaEndpointActionDescriptionWithFields;
    upload_policy: SchemaEndpointActionDescriptionWithFields;
  };
}
