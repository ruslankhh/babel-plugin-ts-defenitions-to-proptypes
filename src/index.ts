import { declare } from '@babel/helper-plugin-utils';
import { addDefault } from '@babel/helper-module-imports';
import syntaxTypeScript from '@babel/plugin-syntax-typescript';
import { types as t } from '@babel/core';
// import ts from 'typescript';
import addVariable from './addVariable';
import extractTypeProperties from './extractTypeProperties';
import upsertImport from './upsertImport';
import { Path, PluginOptions, ConvertState } from './types';

const BABEL_VERSION = 7;

function isNotTS(name: string): boolean {
  return name.endsWith('.js') || name.endsWith('.jsx');
}

export default declare((api: any, options: PluginOptions) => {
  api.assertVersion(BABEL_VERSION);

  return {
    inherits: syntaxTypeScript,

    manipulateOptions(opts: any, parserOptions: any) {
      // Inheriting the syntax doesn't seem to define these
      parserOptions.plugins.push('jsx');
    },

    post() {
      // Free up any memory we're hogging
      (this as any).state = null;
    },

    pre() {
      // Setup initial state
      (this as any).state = {
        componentTypes: {},
        filePath: '',
        options,
        propTypes: {
          count: 0,
          defaultImport: '',
          hasImport: false,
        },
        reactImportedName: '',
      };
    },

    visitor: {
      Program: {
        enter(programPath: Path<t.Program>, { filename }: any) {
          const state = (this as any).state as ConvertState;

          state.filePath = filename;

          if (isNotTS(filename)) {
            return;
          }

          // Find existing `react` and `prop-types` imports
          programPath.node.body.forEach(node => {
            if (!t.isImportDeclaration(node)) {
              return;
            }

            if (node.source.value === 'prop-types') {
              const response = upsertImport(node, {
                checkForDefault: 'PropTypes',
              });

              state.propTypes.hasImport = true;
              state.propTypes.defaultImport = response.defaultImport;
            }

            if (node.source.value === 'react') {
              const response = upsertImport(node, {
                checkForDefault: 'React',
              });

              state.reactImportedName = response.defaultImport;
            }
          });

          // Add `prop-types` import if it does not exist.
          // We need to do this without a visitor as we need to modify
          // the AST before anything else has can run.
          if (!state.propTypes.hasImport && state.reactImportedName) {
            state.propTypes.defaultImport = addDefault(programPath, 'prop-types', {
              nameHint: 'pt',
            }).name;
          }

          // Abort early if we're definitely not in a file that needs conversion
          if (!state.propTypes.defaultImport && !state.reactImportedName) {
            return;
          }

          programPath.traverse({
            // `class Foo extends React.Component<Props> {}`
            // @ts-ignore
            'ClassDeclaration|ClassExpression': (path: Path<t.ClassDeclaration>) => {
              path.remove();
            },

            // `interface FooProps {}`
            // @ts-ignore
            TSInterfaceDeclaration(path: Path<t.TSInterfaceDeclaration>) {
              const { node } = path;

              state.componentTypes[node.id.name] = extractTypeProperties(
                node,
                state.componentTypes,
              );

              addVariable(path, node.id.name, state);
            },

            // `type FooProps = {}`
            TSTypeAliasDeclaration(path: Path<t.TSTypeAliasDeclaration>) {
              const { node } = path;

              state.componentTypes[node.id.name] = extractTypeProperties(
                node,
                state.componentTypes,
              );

              addVariable(path, node.id.name, state);
            },
          });
        },

        exit(path: Path<t.Program>, { filename }: any) {
          const state = (this as any).state as ConvertState;

          if (isNotTS(filename)) {
            return;
          }

          // Remove the `prop-types` import of no components exist,
          // and be sure not to remove pre-existing imports.
          path.get('body').forEach(bodyPath => {
            if (
              state.propTypes.count === 0 &&
              t.isImportDeclaration(bodyPath.node) &&
              bodyPath.node.source.value === 'prop-types'
            ) {
              bodyPath.remove();
            }
          });
        },
      },
    },
  };
});
