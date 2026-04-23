export type ChallengeSpecialType = "center" | "corner" | "diagonal" | "cross" | "edge" | "standard"

const BOARD_SIZE = 5
const CENTER_INDEX = Math.floor(BOARD_SIZE / 2)

function getRow(position: number) {
  return Math.floor(position / BOARD_SIZE)
}

function getCol(position: number) {
  return position % BOARD_SIZE
}

export function isCenterPosition(position: number) {
  const row = getRow(position)
  const col = getCol(position)
  return row === CENTER_INDEX && col === CENTER_INDEX
}

export function isCornerPosition(position: number) {
  const row = getRow(position)
  const col = getCol(position)
  return (row === 0 || row === BOARD_SIZE - 1) && (col === 0 || col === BOARD_SIZE - 1)
}

export function isEdgePosition(position: number) {
  const row = getRow(position)
  const col = getCol(position)
  const topOrBottom = row === 0 || row === BOARD_SIZE - 1
  const leftOrRight = col === 0 || col === BOARD_SIZE - 1
  return (topOrBottom || leftOrRight) && !isCornerPosition(position)
}

export function isDiagonalPosition(position: number) {
  const row = getRow(position)
  const col = getCol(position)
  return row === col || row + col === BOARD_SIZE - 1
}

export function isCrossPosition(position: number) {
  const row = getRow(position)
  const col = getCol(position)
  return row === CENTER_INDEX || col === CENTER_INDEX
}

export function getChallengeSpecialType(position: number): ChallengeSpecialType {
  if (isCenterPosition(position)) return "center"
  if (isCornerPosition(position)) return "corner"
  if (isDiagonalPosition(position)) return "diagonal"
  if (isCrossPosition(position)) return "cross"
  if (isEdgePosition(position)) return "edge"
  return "standard"
}

export function getChallengePoints(position: number) {
  const type = getChallengeSpecialType(position)

  switch (type) {
    case "center":
      return 120
    case "corner":
      return 90
    case "diagonal":
      return 80
    case "cross":
      return 70
    case "edge":
      return 65
    default:
      return 55
  }
}
