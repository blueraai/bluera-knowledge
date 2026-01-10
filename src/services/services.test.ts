import { describe, it, expect, vi, beforeEach } from 'vitest';
import { destroyServices, type ServiceContainer } from './index.js';
import type { PythonBridge } from '../crawl/bridge.js';
import type { LanceStore } from '../db/lance.js';

describe('destroyServices', () => {
  let mockPythonBridge: { stop: ReturnType<typeof vi.fn> };
  let mockLance: { closeAsync: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
  let mockServices: ServiceContainer;

  beforeEach(() => {
    mockPythonBridge = {
      stop: vi.fn().mockResolvedValue(undefined),
    };

    mockLance = {
      closeAsync: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    mockServices = {
      pythonBridge: mockPythonBridge as unknown as PythonBridge,
      lance: mockLance as unknown as LanceStore,
    } as unknown as ServiceContainer;
  });

  it('stops the python bridge', async () => {
    await destroyServices(mockServices);

    expect(mockPythonBridge.stop).toHaveBeenCalledTimes(1);
  });

  it('throws on stop errors', async () => {
    mockPythonBridge.stop.mockRejectedValue(new Error('stop failed'));

    await expect(destroyServices(mockServices)).rejects.toThrow(
      'Service shutdown failed: stop failed'
    );
  });

  it('is idempotent - multiple calls work correctly', async () => {
    await destroyServices(mockServices);
    await destroyServices(mockServices);

    expect(mockPythonBridge.stop).toHaveBeenCalledTimes(2);
  });

  it('calls closeAsync on LanceStore for native cleanup', async () => {
    await destroyServices(mockServices);

    expect(mockLance.closeAsync).toHaveBeenCalledTimes(1);
    // Should use async version, not sync
    expect(mockLance.close).not.toHaveBeenCalled();
  });

  it('throws on LanceStore closeAsync errors', async () => {
    mockLance.closeAsync.mockRejectedValue(new Error('closeAsync failed'));

    await expect(destroyServices(mockServices)).rejects.toThrow(
      'Service shutdown failed: closeAsync failed'
    );
  });

  it('attempts all cleanup even if first fails, then throws aggregate', async () => {
    mockLance.closeAsync.mockRejectedValue(new Error('lance failed'));
    mockPythonBridge.stop.mockRejectedValue(new Error('bridge failed'));

    await expect(destroyServices(mockServices)).rejects.toThrow();

    // Both should have been called even though first failed
    expect(mockLance.closeAsync).toHaveBeenCalledTimes(1);
    expect(mockPythonBridge.stop).toHaveBeenCalledTimes(1);
  });

  it('waits for LanceStore async cleanup before returning', async () => {
    let closeCompleted = false;
    mockLance.closeAsync.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      closeCompleted = true;
    });

    await destroyServices(mockServices);

    // Should have waited for closeAsync to complete
    expect(closeCompleted).toBe(true);
  });
});
