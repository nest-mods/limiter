export async function repeat(fn: () => Promise<any>, times: number) {
  for (let i = 0; i < times; i++) {
    await fn();
  }
}
