import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerBlobDownload } from '../../lib/download-utils';

describe('triggerBlobDownload', () => {
  let mockAnchor: { click: ReturnType<typeof vi.fn>; download: string; href: string };
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockAnchor = { click: vi.fn(), download: '', href: '' };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
    createObjectURLSpy = vi.fn().mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.fn();
    URL.createObjectURL = createObjectURLSpy;
    URL.revokeObjectURL = revokeObjectURLSpy;
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  it('creates an object URL from the blob', () => {
    const blob = new Blob(['test'], { type: 'application/octet-stream' });

    triggerBlobDownload(blob, 'file.xlsx');

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
  });

  it('sets href and download on the anchor element', () => {
    const blob = new Blob(['test']);

    triggerBlobDownload(blob, 'Rankings_2024_Week5.xlsx');

    expect(mockAnchor.href).toBe('blob:mock-url');
    expect(mockAnchor.download).toBe('Rankings_2024_Week5.xlsx');
  });

  it('appends anchor to body, clicks it, then removes it', () => {
    const blob = new Blob(['test']);
    const callOrder: string[] = [];
    appendChildSpy.mockImplementation((node) => { callOrder.push('append'); return node; });
    mockAnchor.click.mockImplementation(() => callOrder.push('click'));
    removeChildSpy.mockImplementation((node) => { callOrder.push('remove'); return node; });

    triggerBlobDownload(blob, 'file.xlsx');

    expect(callOrder).toEqual(['append', 'click', 'remove']);
  });

  it('revokes the object URL after cleanup', () => {
    const blob = new Blob(['test']);

    triggerBlobDownload(blob, 'file.xlsx');

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });
});
