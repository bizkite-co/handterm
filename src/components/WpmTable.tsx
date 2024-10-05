import React from 'react';
import { CharWPM } from '../types/TerminalTypes';

interface WpmTableProps {
  wpms: CharWPM[];
  name?: string;
}

export const WpmTable: React.FC<WpmTableProps> = ({ wpms, name = "slowest-characters" }) => {
  return (
  <table className="wpm-table">
    <thead>
      <tr><th colSpan={2}>{name}</th></tr>
    </thead>
    <tbody>
      {wpms.map((wpm, index) => (
        <tr key={index} className="wpm-table-row">
          <td>{wpm.character.replace("\r", "\\r").replace(" ", "\\s")}</td>
          <td className="number">{wpm.wpm.toFixed(2)}</td>
        </tr>
      ))}
    </tbody>
  </table>
  );
};

export default WpmTable;
