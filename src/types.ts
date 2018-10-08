import { types as t, traverse } from '@babel/core';

export type Path<N> = traverse.NodePath<N>;

export type TypePropertyMap = { [key: string]: t.TSPropertySignature[] };

export type PropType = t.MemberExpression | t.CallExpression | t.Identifier;

export type ConvertState = {
  componentTypes: TypePropertyMap;
  filePath: string;
  options: PluginOptions;
  propTypes: {
    count: number;
    defaultImport: string;
    hasImport: boolean;
  };
  reactImportedName: string;
};

export type PluginOptions = {
  customPropTypeSuffixes?: string[];
};
