interface Result {
  adherent: string;
  competition: string;
  lieu: string;
  distance: string;
  classement: string;
  date: string;
}

interface ResultsTableProps {
  data: Result[];
  className?: string;
}

export default function ResultsTable({ data, className = "" }: ResultsTableProps) {
  return (
    <div className={`rounded-xl bg-white p-4 ${className} border border-rule`}>
      <h3 className="text-lg font-semibold mb-2">Résultats du club</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="p-2">Adhérent</th>
            <th className="p-2">Compétition</th>
            <th className="p-2">Lieu</th>
            <th className="p-2">Distance</th>
            <th className="p-2">Classement</th>
            <th className="p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-b">
              <td className="p-2">{item.adherent}</td>
              <td className="p-2">{item.competition}</td>
              <td className="p-2">{item.lieu}</td>
              <td className="p-2">{item.distance}</td>
              <td className="p-2">{item.classement}</td>
              <td className="p-2">{item.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
