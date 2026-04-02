const STYLES = {
  Pending:   'bg-yellow-100 text-yellow-800',
  Quoted:    'bg-blue-100 text-blue-800',
  Converted: 'bg-green-100 text-green-800',
  Closed:    'bg-gray-100 text-gray-600',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[status] ?? STYLES.Pending}`}>
      {status}
    </span>
  )
}
