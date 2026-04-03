/**
 * copilot-issue-tracker - GitHub Copilot session database viewer
 * Copyright (C) 2026  Contributors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */

import { GlobalWindow } from 'happy-dom';

/**
 * Bootstrap a full DOM environment for every test file.
 * This file must be loaded FIRST so that global.document is set before
 * any @testing-library/* package is imported (they check document.body
 * at module initialisation time).
 */
const window = new GlobalWindow();

// Expose all standard browser globals so React and Testing Library work.
global.window = window as unknown as Window & typeof globalThis;
global.document = window.document as unknown as Document;
global.navigator = window.navigator as unknown as Navigator;
global.Element = window.Element as unknown as typeof Element;
global.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement;
global.SVGElement = window.SVGElement as unknown as typeof SVGElement;
global.MouseEvent = window.MouseEvent as unknown as typeof MouseEvent;
global.Event = window.Event as unknown as typeof Event;
global.EventTarget = window.EventTarget as unknown as typeof EventTarget;
global.Node = window.Node as unknown as typeof Node;
global.NodeList = window.NodeList as unknown as typeof NodeList;
global.Text = window.Text as unknown as typeof Text;
global.Comment = window.Comment as unknown as typeof Comment;
global.DocumentFragment = window.DocumentFragment as unknown as typeof DocumentFragment;
global.MutationObserver = window.MutationObserver as unknown as typeof MutationObserver;
global.getComputedStyle = window.getComputedStyle.bind(
  window,
) as unknown as typeof getComputedStyle;
