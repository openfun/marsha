import { Resource, RouteOptions } from '.';

export interface ResourceMetadata<T extends Resource> {
  name: string;
  description: string;
  renders: string[];
  parses: string[];
  actions: RouteOptions<T>['actions'];
}
