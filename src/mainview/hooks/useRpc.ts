/**
 * copilot-issue-tracker - GitHub Copilot session database viewer
 * Copyright (C) 2026  Contributors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 */

import { Electroview } from 'electrobun/view';
import type { AppRPCType } from '../../shared/types';

/**
 * Singleton Electroview RPC instance. Created once at module level so that
 * all components share the same underlying IPC channel.
 */
const rpc = Electroview.defineRPC<AppRPCType>({
  handlers: {
    requests: {},
    messages: {
      /** Handles scan progress updates pushed from the main process. */
      scanProgress: () => {},
      /** Handles data-changed notifications pushed from the main process. */
      dataChanged: () => {},
    },
  },
});

const electroview = new Electroview({ rpc });

/**
 * Returns the memoized RPC proxy for making requests to the Bun main process.
 * @returns The RPC object with request and message methods.
 */
export const useRpc = (): typeof electroview.rpc => electroview.rpc;
