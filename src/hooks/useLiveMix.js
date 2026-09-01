import { useEffect, useMemo, useState } from 'react';
import { mixFromParts, capPigmentParts, WATER_PIGMENT, isWaterPart } from '../utils/mixing';

export function useLiveMix(solverParts, resetKey) {
  const [ratioOverrides, setRatioOverrides] = useState({});
  const [waterAmount, setWaterAmount] = useState(0);

  useEffect(() => {
    setRatioOverrides({});
    setWaterAmount(0);
  }, [resetKey]);

  const live = useMemo(() => {
    const pigments = capPigmentParts(solverParts || []).filter((p) => !isWaterPart(p));
    const weighted = pigments.map((p) => ({
      ...p,
      key: p.key || p.hex,
      weight: ratioOverrides[p.key || p.hex] ?? Math.max(1, Math.round((p.ratio || 0) * 100))
    }));
    return mixFromParts([...weighted, { ...WATER_PIGMENT, weight: waterAmount }]);
  }, [solverParts, ratioOverrides, waterAmount]);

  const onChangePartWeight = (key, value) => {
    setRatioOverrides((prev) => ({ ...prev, [key]: value }));
  };

  return {
    partsToShow: live.parts,
    adjustedHex: live.hex,
    waterAmount,
    setWaterAmount,
    onChangePartWeight
  };
}
