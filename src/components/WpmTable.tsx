// src/components/WpmTable.tsx
import type React from 'react';
import { useMemo } from 'react';

import { type CharWPM } from '../types/TerminalTypes';

interface WpmTableProps {
  wpms: ReadonlyArray<CharWPM>;
  name?: string;
}

export const WpmTable: React.FC<WpmTableProps> = ({ wpms, name = "slowest-characters" }) => {
  const groupedAndSortedWpms = useMemo(() => {
    // Group by character
    const grouped = wpms.reduce((acc, curr) => {
      const char = curr.character.replace("\r", "\\r").replace(" ", "\\s");
      if (!acc[char]) {
        acc[char] = { character: char, wpm: curr.wpm, count: 1 };
      } else {
        (acc[char] ??= { character: char, wpm: 0, count: 0 }).wpm += curr.wpm;
        (acc[char] ??= { character: char, wpm: 0, count: 0 }).count += 1;
      }
      return acc;
    }, {} as Record<string, { character: string, wpm: number, count: number }>);

    // Calculate average WPM for each character
    const averages = Object.values(grouped).map(item => ({
      character: item.character,
      wpm: item.wpm / item.count
    }));

    // Sort by slowest (lowest WPM) first
    averages.sort((a, b) => a.wpm - b.wpm);

    // Take top 5
    return averages.slice(0, 5);
  }, [wpms]);

  return (
    <table className="wpm-table">
      <thead>
        <tr><th colSpan={2}>{name}</th></tr>
        <tr>
          <th>Character</th>
          <th>Avg WPM</th>
        </tr>
      </thead>
      <tbody>
        {groupedAndSortedWpms.map((wpm, index) => (
          <tr key={index} className="wpm-table-row">
            <td>{wpm.character}</td>
            <td className="number">{wpm.wpm.toFixed(0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default WpmTable;