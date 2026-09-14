/**
 * Zero-Allocation Circular Ring Buffer for High-Performance ECG Streaming
 * Prevents V8 Garbage Collection pauses and maintains smooth 60-120 FPS rendering.
 */
export class EcgRingBuffer {
  public readonly buffer: Float32Array;
  public readonly capacity: number;
  private writeIndex: number = 0;
  private totalSamplesWritten: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Float32Array(capacity);
  }

  public push(sample: number): void {
    this.buffer[this.writeIndex] = sample;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    this.totalSamplesWritten++;
  }

  public getWriteIndex(): number {
    return this.writeIndex;
  }

  public getTotalSamples(): number {
    return this.totalSamplesWritten;
  }

  public getSample(index: number): number {
    const wrapped = ((index % this.capacity) + this.capacity) % this.capacity;
    return this.buffer[wrapped];
  }

  public getLatest(count: number): number[] {
    const out: number[] = new Array(count);
    for (let i = 0; i < count; i++) {
      out[count - 1 - i] = this.getSample(this.writeIndex - 1 - i);
    }
    return out;
  }

  public clear(): void {
    this.buffer.fill(0);
    this.writeIndex = 0;
    this.totalSamplesWritten = 0;
  }
}
