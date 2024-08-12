/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';

import { ServerContainer, ServerContainerRef } from '@react-navigation/native';
import * as Font from 'expo-font/build/server';
import React from 'react';
import ReactDOMServer from 'react-dom/server.node';
import { AppRegistry } from 'react-native-web';

import { getRootComponent } from './getRootComponent';
import { ctx } from '../../_ctx';
import { ExpoRoot } from '../ExpoRoot';
import { getReactNavigationConfig } from '../getReactNavigationConfig';
import { getRoutes, Options } from '../getRoutes';
import { Head } from '../head';
import { loadStaticParamsAsync } from '../loadStaticParamsAsync';

const debug = require('debug')('expo:router:renderStaticContent');

/** Get the linking manifest from a Node.js process. */
async function getManifest(options: Options = {}) {
  const routeTree = getRoutes(ctx, {
    preserveApiRoutes: true,
    platform: 'web',
    ...options,
  });

  if (!routeTree) {
    throw new Error('No routes found');
  }

  // Evaluate all static params
  await loadStaticParamsAsync(routeTree);

  return getReactNavigationConfig(routeTree, false);
}

function resetReactNavigationContexts() {
  // https://github.com/expo/router/discussions/588
  // https://github.com/react-navigation/react-navigation/blob/9fe34b445fcb86e5666f61e144007d7540f014fa/packages/elements/src/getNamedContext.tsx#LL3C1-L4C1

  // React Navigation is storing providers in a global, this is fine for the first static render
  // but subsequent static renders of Stack or Tabs will cause React to throw a warning. To prevent this warning, we'll reset the globals before rendering.
  const contexts = '__react_navigation__elements_contexts';
  global[contexts] = new Map<string, React.Context<any>>();
}

export async function getStaticContent(location: URL): Promise<string> {
  const headContext: { helmet?: any } = {};

  const ref = React.createRef<ServerContainerRef>();

  const Root = getRootComponent();

  function Main() {
    return (
      <ExpoRoot
        location={location}
        context={ctx}
        wrapper={({ children }) => (
          <Root>
            <div id="root">{children}</div>
          </Root>
        )}
      />
    );
  }

  // Based on the legacy implementation in `@expo/next-adapter` for parity until we have server components.
  const getInitialProps =
    Root.getInitialProps ||
    (async ({ renderPage }) => {
      // Clear any existing static resources from the global scope to attempt to prevent leaking between pages.
      // This could break if pages are rendered in parallel or if fonts are loaded outside of the React tree
      Font.resetServerContext();

      // This MUST be run before `ReactDOMServer.renderToString` to prevent
      // "Warning: Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
      resetReactNavigationContexts();

      AppRegistry.registerComponent('main', () => Main);
      const { getStyleElement } = AppRegistry.getApplication('main');
      const page = await renderPage();
      const styles = [getStyleElement()];
      return { ...page, styles: React.Children.toArray(styles) };
    });

  const { styles, ...initialProps } = await getInitialProps({
    renderPage() {
      return { children: <Main /> };
    },
  });

  const html = await ReactDOMServer.renderToString(
    <Head.Provider context={headContext}>
      <ServerContainer ref={ref} {...initialProps} />
    </Head.Provider>
  );

  // Eval the CSS after the HTML is rendered so that the CSS is in the same order
  const css = ReactDOMServer.renderToStaticMarkup(styles);

  let output = mixHeadComponentsWithStaticResults(headContext.helmet, html);

  output = output.replace('</head>', `${css}</head>`);

  // TODO: Make this use React JSX in the future to unify with other server-based styling libraries.
  const fonts = Font.getServerResources();
  debug(`Pushing static fonts: (count: ${fonts.length})`, fonts);
  // Inject static fonts loaded with expo-font
  output = output.replace('</head>', `${fonts.join('')}</head>`);

  return '<!DOCTYPE html>' + output;
}

function mixHeadComponentsWithStaticResults(helmet: any, html: string) {
  // Head components
  for (const key of ['title', 'priority', 'meta', 'link', 'script', 'style'].reverse()) {
    const result = helmet?.[key]?.toString();
    if (result) {
      html = html.replace('<head>', `<head>${result}`);
    }
  }

  // attributes
  html = html.replace('<html ', `<html ${helmet?.htmlAttributes.toString()} `);
  html = html.replace('<body ', `<body ${helmet?.bodyAttributes.toString()} `);

  return html;
}

// Re-export for use in server
export { getManifest };
export { getBuildTimeServerManifestAsync } from './getServerManifest';
