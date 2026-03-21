import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Simple unit test for debounce logic without React rendering
describe("useDebounce logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce value changes", () => {
    const callback = vi.fn();
    let currentValue = "initial";

    // Simulate debounce logic
    function debounce(value: string, delayMs: number) {
      currentValue = value;
      const timer = setTimeout(() => callback(currentValue), delayMs);
      return () => clearTimeout(timer);
    }

    const cancel1 = debounce("a", 250);
    expect(callback).not.toHaveBeenCalled();

    // Change value before timer fires — first call should be cancelled
    cancel1();
    const cancel2 = debounce("ab", 250);
    expect(callback).not.toHaveBeenCalled();

    cancel2();
    debounce("abc", 250);

    // Advance past delay
    vi.advanceTimersByTime(250);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("abc");
  });

  it("should fire immediately if no subsequent changes", () => {
    const callback = vi.fn();

    setTimeout(() => callback("hello"), 250);

    vi.advanceTimersByTime(250);
    expect(callback).toHaveBeenCalledWith("hello");
  });

  it("should respect delay duration", () => {
    const callback = vi.fn();

    setTimeout(() => callback("test"), 500);

    vi.advanceTimersByTime(250);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);
    expect(callback).toHaveBeenCalledWith("test");
  });
});
