import { describe, it, expect } from "vitest";

// Test the internal URL detection logic (duplicated here since it's a private function)
function isInternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "[::1]" ||
      hostname.endsWith(".local") ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname === "metadata.google.internal"
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

describe("SSRF Protection: isInternalUrl", () => {
  it("should block localhost", () => {
    expect(isInternalUrl("http://localhost/secret")).toBe(true);
    expect(isInternalUrl("http://localhost:8080/admin")).toBe(true);
  });

  it("should block loopback addresses", () => {
    expect(isInternalUrl("http://127.0.0.1/")).toBe(true);
    expect(isInternalUrl("http://127.0.0.5:3000/data")).toBe(true);
  });

  it("should block private network ranges", () => {
    expect(isInternalUrl("http://10.0.0.1/")).toBe(true);
    expect(isInternalUrl("http://10.255.255.255/")).toBe(true);
    expect(isInternalUrl("http://192.168.1.1/")).toBe(true);
    expect(isInternalUrl("http://172.16.0.1/")).toBe(true);
    expect(isInternalUrl("http://172.31.255.255/")).toBe(true);
  });

  it("should block link-local addresses", () => {
    expect(isInternalUrl("http://169.254.169.254/latest/meta-data")).toBe(true);
  });

  it("should block cloud metadata endpoints", () => {
    expect(isInternalUrl("http://metadata.google.internal/computeMetadata/v1/")).toBe(true);
  });

  it("should block .local domains", () => {
    expect(isInternalUrl("http://myservice.local/api")).toBe(true);
  });

  it("should block invalid URLs", () => {
    expect(isInternalUrl("not-a-url")).toBe(true);
    expect(isInternalUrl("")).toBe(true);
  });

  it("should allow public URLs", () => {
    expect(isInternalUrl("https://example.com/image.jpg")).toBe(false);
    expect(isInternalUrl("https://cdn.cloudinary.com/image.png")).toBe(false);
    expect(isInternalUrl("https://s3.amazonaws.com/bucket/file.mp3")).toBe(false);
  });

  it("should allow public IP addresses outside private ranges", () => {
    expect(isInternalUrl("http://8.8.8.8/")).toBe(false);
    expect(isInternalUrl("http://203.0.113.1/")).toBe(false);
  });
});
