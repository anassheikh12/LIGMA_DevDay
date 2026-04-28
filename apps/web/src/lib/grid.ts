export interface GridSlot {
  top: number; // percentage
  left: number; // percentage
  rotate: number; // degrees
  scale: number;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Deterministic 4x4 grid (16 slots), we pick exactly 14 notes
export function generateDeterministicGrid(seed: number = 42): GridSlot[] {
  const slots: { row: number; col: number }[] = [];
  
  // 4x4 Grid = 16 slots
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      slots.push({ row: r, col: c });
    }
  }

  // Shuffle slots deterministically using the seed
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  // Pick 14 slots
  const selectedSlots = slots.slice(0, 14);

  // Generate the actual coordinates with jitter
  return selectedSlots.map((slot, i) => {
    // Base percentages: a 4x4 grid gives 25% cells.
    // Center of a cell is (row * 25 + 12.5)%, (col * 25 + 12.5)%
    // However, to keep notes from overflowing, we might map to a safer range like 5% to 75%
    // Let's use 0..3 mapping to 5%..75%
    const baseTop = 10 + slot.row * 22; 
    const baseLeft = 5 + slot.col * 25;

    // Jitter: +/- 10%
    const topJitter = (seededRandom(seed * 2 + i) - 0.5) * 20;
    const leftJitter = (seededRandom(seed * 3 + i) - 0.5) * 20;

    // Rotate: +/- 8deg
    const rotate = (seededRandom(seed * 4 + i) - 0.5) * 16;
    
    // Scale slightly
    const scale = 0.8 + seededRandom(seed * 5 + i) * 0.3;

    return {
      top: baseTop + topJitter,
      left: baseLeft + leftJitter,
      rotate,
      scale,
    };
  });
}
