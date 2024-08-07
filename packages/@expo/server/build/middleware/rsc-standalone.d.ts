/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { RenderRscArgs } from './rsc';
type ImportMap = {
    router: () => Promise<typeof import('expo-router/build/rsc/router/expo-definedRouter')>;
};
export declare function renderRscWithImportsAsync(distFolder: string, imports: ImportMap, { body, platform, searchParams, config, method, input, contentType }: RenderRscArgs): Promise<ReadableStream<any>>;
export declare function renderRscAsync(distFolder: string, args: RenderRscArgs): Promise<ReadableStream<any>>;
export {};
