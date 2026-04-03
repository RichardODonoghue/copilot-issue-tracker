/**
 * copilot-issue-tracker - GitHub Copilot session database viewer
 * Copyright (C) 2026  Contributors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */

/**
 * Second preload step: register testing-library matchers and cleanup.
 * This file runs AFTER setup.ts so that global.document already exists
 * when @testing-library/dom initialises its screen object.
 */
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react/pure';
import { afterEach } from 'bun:test';

// Unmount all React trees after every test to prevent DOM accumulation.
afterEach(cleanup);
