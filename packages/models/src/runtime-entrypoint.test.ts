import { describe, expect, it } from 'vitest';

import * as runtimeModels from './index.js';

describe('@candorlens/models runtime entrypoint', () => {
  it('does not expose testing helpers', () => {
    expect(runtimeModels).not.toHaveProperty('runGuidanceProviderContract');
  });
});
