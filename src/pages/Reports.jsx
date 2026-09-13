function Reports() {
  return (
    <div className="reports__containter">
      <h2>Справочники</h2>
      <ul className="reports__list">
        <li>
          <a href="/departments/">Отделения</a>
        </li>
        <li>
          <a href="/specializations/">Специализации</a>
        </li>
        <li>
          <a href="/rooms/">Кабинеты</a>
        </li>
        <li>
          <a href="/diseases/">Болезни</a>
        </li>
        <li>
          <a href="/drugs/">Медикаменты</a>
        </li>
      </ul>
    </div>
  );
}
export default Reports;
