export interface GeoCaptureSubject {
  readonly id: string
  readonly label: string
  readonly url?: string
  readonly anchor: [number, number, number]
  readonly radius: number
  readonly clips: readonly {
    readonly label: string
    readonly duration: number
    readonly index: number
  }[]
}

export interface GeoCaptureSubjects {
  list(): readonly GeoCaptureSubject[]
  ready(): boolean
  acquire(id: string): { sample(clip: string | undefined, seconds: number): void; dispose(): void }
}
