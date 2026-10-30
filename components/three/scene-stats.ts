/**
 * Triangles each on-screen scene drew in its last frame, for the /lab/3d
 * budget readout (P4 acceptance: under 60k in total). Module state, written from the
 * render loop and polled by the lab, so drawing never re-renders React.
 */
const triangles = new Map<string, number>()

export function reportTriangles(id: string, count: number) {
  triangles.set(id, count)
}

export function clearTriangles(id: string) {
  triangles.delete(id)
}

export function readTriangles() {
  const byScene = [...triangles.entries()]
  return { total: byScene.reduce((sum, [, count]) => sum + count, 0), byScene }
}
