interface LocationProps {
  title: string
  list: string[]
}
export default function Location({ title, list }: LocationProps) {
  return (
    <div className="location">
      <div className="location-tit">{title}</div>
      <ul className="location-list">
        {list.map((item, index) => (
          <li className="location-item" key={index}>
            <div className="location-item-tit">{item}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
